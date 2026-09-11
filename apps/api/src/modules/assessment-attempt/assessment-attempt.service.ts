import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";

import { db } from "../../prisma/db.js";


/*
=========================================================
TYPES
=========================================================
*/

type AttemptAnswer = {
  questionId: string;

  sourceCode: string;

  language: string;

  score: number;

  status: string;

  passedTestCases?: number;

  totalTestCases?: number;

  executionError?: string | null;
};


type Attempt = {
  id: string;

  assessmentId: string;

  learnerId: string;

  status:
    | "IN_PROGRESS"
    | "COMPLETED";

  startedAt: Date;

  completedAt: Date | null;

  totalMarks: number;

  score: number;

  percentage: number;

  totalQuestions: number;

  attemptedQuestions: number;

  passedQuestions: number;

  failedQuestions: number;

  timeTakenSeconds: number;

  // Captured from the assessment configuration when the attempt starts.
  maxAttempts: number;

  answers: AttemptAnswer[];
};


/*
=========================================================
EXECUTION RESPONSE
=========================================================
*/

type ExecutionResponse = {
  executionId?: string;

  language?: string;

  status?:
    | "SUCCESS"
    | "COMPILE_ERROR"
    | "RUNTIME_ERROR"
    | "TIMEOUT"
    | string;

  stdout?: string;

  stderr?: string;

  exitCode?: number | null;

  executionTimeMs?: number;
};


/*
=========================================================
SERVICE
=========================================================
*/

@Injectable()
export class AssessmentAttemptService {


  /*
  =======================================================
  TEMPORARY IN-MEMORY ATTEMPT STORE

  NOTE:

  This is still temporary because your current DB
  contract does not expose:

    AssessmentAttempt
    AssessmentAnswer

  The attempt-limit check below is enforced against this
  in-memory store in the current implementation. Once the
  AssessmentAttempt model is available, move the same count
  and limit check into the database/transaction layer so the
  rule also survives server restarts and multiple API instances.
  =======================================================
  */

  private attempts =
    new Map<string, Attempt>();


  /*
  =======================================================
  EXECUTION SERVICE URL
  =======================================================
  */

  private readonly executionServiceUrl =
    process.env.EXECUTION_SERVICE_URL ||
    "http://localhost:3001";


  /*
  =======================================================
  GENERATE ATTEMPT ID
  =======================================================
  */

  private generateAttemptId(): string {

    return (
      "attempt-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 10)
    );

  }


  /*
  =======================================================
  GET CONFIGURED ATTEMPT LIMIT
  =======================================================
  */

  private async getConfiguredMaxAttempts(
    assessmentId: string,
  ): Promise<number> {

    /*
    -------------------------------------------------------
    IMPORTANT:
    Attempts Allowed is NOT stored on the Assessment record.

    The scoring page persists it as:

      POST /scoring
      {
        assessmentId,
        maximumAttempts,
        ...
      }

    Therefore the attempt service must read the scoring
    configuration before creating/resuming an attempt.
    -------------------------------------------------------
    */

    const scoringServiceUrl =
      process.env.API_BASE_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001";

    let response: Response;

    try {
      response = await fetch(
        `${scoringServiceUrl}/scoring/${encodeURIComponent(
          assessmentId,
        )}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );
    }
    catch (error: any) {
      console.error(
        "Unable to read scoring configuration:",
        error,
      );

      throw new BadRequestException(
        "Unable to read the assessment scoring configuration. Please make sure scoring rules are configured.",
      );
    }

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.text();

        if (errorBody) {
          errorMessage = errorBody;
        }
      }
      catch {
        // Ignore response parsing errors.
      }

      console.error(
        "Scoring configuration request failed:",
        response.status,
        errorMessage,
      );

      throw new BadRequestException(
        "Assessment scoring configuration could not be loaded. Please configure Attempts Allowed before starting the assessment.",
      );
    }

    let scoringData: any;

    try {
      scoringData = await response.json();
    }
    catch {
      throw new BadRequestException(
        "Assessment scoring configuration returned an invalid response.",
      );
    }

    /*
    -------------------------------------------------------
    SUPPORT THE SCORING API RESPONSE SHAPES:

      {
        maximumAttempts: 2
      }

    or:

      {
        data: {
          maximumAttempts: 2
        }
      }

    or:

      {
        scoring: {
          maximumAttempts: 2
        }
      }
    -------------------------------------------------------
    */

    const scoring =
      scoringData?.data ??
      scoringData?.scoring ??
      scoringData ??
      {};

    const candidateValues = [
      scoring?.maximumAttempts,
      scoring?.maxAttempts,
      scoring?.attemptsAllowed,
      scoring?.attemptLimit,
      scoring?.maximum_attempts,
      scoring?.max_attempts,
      scoring?.attempts_allowed,
    ];

    const configuredValue =
      candidateValues.find((value) => {
        if (
          value === null ||
          value === undefined ||
          value === ""
        ) {
          return false;
        }

        const numericValue = Number(value);

        return (
          Number.isFinite(numericValue) &&
          numericValue > 0
        );
      });

    if (configuredValue === undefined) {
      throw new BadRequestException(
        "Assessment attempt limit is not configured. Please configure Attempts Allowed before publishing the assessment.",
      );
    }

    return Math.floor(
      Number(configuredValue),
    );
  }


  /*
  =======================================================
  GET LEARNER ATTEMPT USAGE
  =======================================================
  */

  private getLearnerAttempts(
    assessmentId: string,
    learnerId: string,
  ): Attempt[] {

    return Array.from(
      this.attempts.values(),
    ).filter(
      (attempt) =>
        attempt.assessmentId === assessmentId &&
        attempt.learnerId === learnerId,
    );
  }


  private getAttemptUsage(
    assessmentId: string,
    learnerId: string,
    maxAttempts: number,
  ): {
    attemptsUsed: number;
    attemptsRemaining: number;
    inProgressAttempt: Attempt | null;
  } {

    const learnerAttempts =
      this.getLearnerAttempts(
        assessmentId,
        learnerId,
      );

    const attemptsUsed =
      learnerAttempts.length;

    const inProgressAttempt =
      learnerAttempts.find(
        (attempt) =>
          attempt.status === "IN_PROGRESS",
      ) ?? null;

    return {
      attemptsUsed,
      attemptsRemaining: Math.max(
        0,
        maxAttempts - attemptsUsed,
      ),
      inProgressAttempt,
    };
  }


  /*
  =======================================================
  NORMALIZE OUTPUT
  =======================================================
  */

  private normalizeOutput(
    value: unknown,
  ): string {

    return String(value ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();

  }


  /*
  =======================================================
  OUTPUT COMPARISON
  =======================================================
  */

  private outputsMatch(
    actual: unknown,
    expected: unknown,
  ): boolean {

    return (
      this.normalizeOutput(actual) ===
      this.normalizeOutput(expected)
    );

  }


  /*
  =======================================================
  START ASSESSMENT
  =======================================================
  */

  async startAssessment(
    assessmentId: string,
    learnerId: string,
  ): Promise<any> {

    /*
    -------------------------------------------------------
    GET ASSESSMENT
    -------------------------------------------------------
    */

    const assessment =
      await db.orm.public.Assessment
        .where({
          id: assessmentId,
        })
        .first();

    if (!assessment) {
      throw new NotFoundException(
        "Assessment not found",
      );
    }

    /*
    -------------------------------------------------------
    ONLY PUBLISHED ASSESSMENTS
    -------------------------------------------------------
    */

    if (
      String(
        assessment.status,
      ).toUpperCase() !==
      "PUBLISHED"
    ) {
      throw new BadRequestException(
        "This assessment is not published",
      );
    }

    /*
    -------------------------------------------------------
    GET CONFIGURED ATTEMPT LIMIT FROM SCORING
    -------------------------------------------------------

    IMPORTANT:

    maximumAttempts is configured by the Scoring page and
    persisted through:

      POST /scoring

    The Assessment table does not own this value.

    Therefore startAssessment() reads:

      GET /scoring/:assessmentId

    before checking the learner's attempt usage.
    -------------------------------------------------------
    */

    const maxAttempts =
      await this.getConfiguredMaxAttempts(
        assessmentId,
      );

    /*
    -------------------------------------------------------
    GET LEARNER ATTEMPT USAGE
    -------------------------------------------------------

    An existing IN_PROGRESS attempt is resumed instead of
    creating another attempt. It still consumes one attempt.
    -------------------------------------------------------
    */

    const usage =
      this.getAttemptUsage(
        assessmentId,
        learnerId,
        maxAttempts,
      );

    if (usage.inProgressAttempt) {
      return {
        id: usage.inProgressAttempt.id,
        assessmentId: usage.inProgressAttempt.assessmentId,
        learnerId: usage.inProgressAttempt.learnerId,
        status: usage.inProgressAttempt.status,
        startedAt: usage.inProgressAttempt.startedAt,
        totalQuestions: usage.inProgressAttempt.totalQuestions,
        totalMarks: usage.inProgressAttempt.totalMarks,
        score: usage.inProgressAttempt.score,
        percentage: usage.inProgressAttempt.percentage,
        maxAttempts,
        attemptsUsed: usage.attemptsUsed,
        attemptsRemaining: usage.attemptsRemaining,
        resumed: true,
      };
    }

    if (usage.attemptsUsed >= maxAttempts) {
      throw new BadRequestException(
        `Attempt limit reached. You have used all ${maxAttempts} allowed attempt${maxAttempts === 1 ? "" : "s"} for this assessment.`,
      );
    }

    /*
    -------------------------------------------------------
    GET QUESTIONS
    -------------------------------------------------------
    */

    const assessmentQuestions =
      await db.orm.public.AssessmentQuestion
        .where({
          assessmentId,
        })
        .all();

    const totalQuestions =
      assessmentQuestions.length;

    /*
    -------------------------------------------------------
    CREATE ATTEMPT
    -------------------------------------------------------
    */

    const attemptId =
      this.generateAttemptId();

    const attempt: Attempt = {
      id: attemptId,
      assessmentId,
      learnerId,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      completedAt: null,
      totalMarks: Number(
        assessment.totalMarks ?? 0,
      ),
      score: 0,
      percentage: 0,
      totalQuestions,
      attemptedQuestions: 0,
      passedQuestions: 0,
      failedQuestions: 0,
      timeTakenSeconds: 0,
      maxAttempts,
      answers: [],
    };

    this.attempts.set(
      attemptId,
      attempt,
    );

    return {
      id: attempt.id,
      assessmentId: attempt.assessmentId,
      learnerId: attempt.learnerId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      totalQuestions: attempt.totalQuestions,
      totalMarks: attempt.totalMarks,
      score: 0,
      percentage: 0,
      maxAttempts,
      attemptsUsed: usage.attemptsUsed + 1,
      attemptsRemaining: Math.max(
        0,
        maxAttempts - (usage.attemptsUsed + 1),
      ),
      resumed: false,
    };
  }


  /*
  =======================================================
  GET ATTEMPT
  =======================================================
  */

  private getAttempt(
    attemptId: string,
  ): Attempt {


    const attempt =
      this.attempts.get(
        attemptId,
      );


    if (!attempt) {

      throw new NotFoundException(
        "Assessment attempt not found",
      );

    }


    return attempt;

  }


  /*
  =======================================================
  SAVE ANSWER
  =======================================================
  */

  async saveAnswer(

    attemptId: string,

    questionId: string,

    sourceCode: string,

    language: string,

  ): Promise<any> {


    const attempt =
      this.getAttempt(
        attemptId,
      );


    /*
    -------------------------------------------------------
    PREVENT ANSWER AFTER SUBMISSION
    -------------------------------------------------------
    */

    if (
      attempt.status !==
      "IN_PROGRESS"
    ) {

      throw new BadRequestException(
        "Assessment has already been submitted",
      );

    }


    /*
    -------------------------------------------------------
    VERIFY QUESTION BELONGS TO ASSESSMENT
    -------------------------------------------------------
    */

    const assessmentQuestion =
      await db.orm.public.AssessmentQuestion
        .where({

          assessmentId:
            attempt.assessmentId,

          questionId,

        })
        .first();


    if (!assessmentQuestion) {

      throw new BadRequestException(
        "Question does not belong to this assessment",
      );

    }


    /*
    -------------------------------------------------------
    FIND EXISTING ANSWER
    -------------------------------------------------------
    */

    const existingIndex =
      attempt.answers.findIndex(
        (answer) =>
          answer.questionId ===
          questionId,
      );


    /*
    -------------------------------------------------------
    CREATE / UPDATE ANSWER
    -------------------------------------------------------
    */

    const answer: AttemptAnswer = {

      questionId,

      sourceCode:
        sourceCode ??
        "",

      language:
        language ??
        "c",

      score:
        0,

      status:
        "NOT_EVALUATED",

      passedTestCases:
        0,

      totalTestCases:
        0,

      executionError:
        null,

    };


    if (
      existingIndex >= 0
    ) {

      /*
      Preserve the previous evaluation data
      only until final submission.
      */

      attempt.answers[
        existingIndex
      ] = answer;

    }

    else {

      attempt.answers.push(
        answer,
      );

    }


    /*
    -------------------------------------------------------
    RETURN
    -------------------------------------------------------
    */

    return {

      success:
        true,

      attemptId,

      questionId,

      status:
        "SAVED",

    };

  }


  /*
  =======================================================
  EXECUTE ONE TEST CASE
  =======================================================
  */

  private async executeTestCase(
    language: string,
    sourceCode: string,
    input: string,
  ): Promise<ExecutionResponse> {


    const response =
      await fetch(
        `${this.executionServiceUrl}/execution/run`,
        {

          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({

              language:
                language
                  ?.toLowerCase()
                  .trim() ||
                "c",

              code:
                sourceCode,

              input:
                input ?? "",

            }),

        },
      );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Execution service returned HTTP ${response.status}: ${errorText}`,
      );

    }


    return (
      await response.json()
    ) as ExecutionResponse;

  }


  /*
  =======================================================
  CALCULATE QUESTION SCORE
  =======================================================
  */

  private async evaluateCodingQuestion(

    questionId: string,

    sourceCode: string,

    language: string,

    questionMarks: number,

  ): Promise<{

    score: number;

    status: string;

    passedTestCases: number;

    totalTestCases: number;

    executionError:
      string | null;

  }> {


    /*
    -------------------------------------------------------
    GET CODING QUESTION
    -------------------------------------------------------
    */

    const codingQuestion =
      await db.orm.public.CodingQuestion
        .where({
          questionId,
        })
        .first();


    if (!codingQuestion) {

      return {

        score: 0,

        status:
          "CODING_QUESTION_NOT_FOUND",

        passedTestCases:
          0,

        totalTestCases:
          0,

        executionError:
          "Coding question configuration not found",

      };

    }


    /*
    -------------------------------------------------------
    GET ACTIVE TEST CASES
    -------------------------------------------------------
    */

    const allTestCases =
      await db.orm.public.CodingTestCase
        .where({
          questionId,
        })
        .all();


    const testCases =
      allTestCases.filter(
        (testCase: any) =>
          testCase.isActive !== false,
      );


    if (
      testCases.length ===
      0
    ) {

      return {

        score: 0,

        status:
          "NO_TEST_CASES",

        passedTestCases:
          0,

        totalTestCases:
          0,

        executionError:
          "No active test cases configured",

      };

    }


    /*
    -------------------------------------------------------
    RUN TEST CASES
    -------------------------------------------------------
    */

    let passedTestCases =
      0;

    let executionError:
      string | null = null;


    /*
    -------------------------------------------------------
    TEST CASE MARKS

    If individual test cases have marks,
    use them.

    If all test-case marks are zero,
    question marks are distributed equally
    across test cases.
    -------------------------------------------------------
    */

    const configuredMarks =
      testCases.reduce(
        (
          total: number,
          testCase: any,
        ) =>
          total +
          Number(
            testCase.marks ?? 0,
          ),
        0,
      );


    const hasConfiguredTestCaseMarks =
      configuredMarks > 0;


    let earnedTestCaseMarks =
      0;


    for (
      const testCase of testCases
    ) {

      try {

        const execution =
          await this.executeTestCase(

            codingQuestion.language ||
              language ||
              "c",

            sourceCode,

            testCase.inputData ??
              "",

          );


        const executionStatus =
          String(
            execution.status ??
              "",
          ).toUpperCase();


        if (
          executionStatus !==
          "SUCCESS"
        ) {

          continue;

        }


        const passed =
          this.outputsMatch(

            execution.stdout ??
              "",

            testCase.expectedOutput ??
              "",

          );


        if (!passed) {

          continue;

        }


        passedTestCases++;


        if (
          hasConfiguredTestCaseMarks
        ) {

          earnedTestCaseMarks +=
            Number(
              testCase.marks ?? 0,
            );

        }

      }

      catch (error: any) {

        executionError =
          error?.message ||
          "Execution service error";

      }

    }


    /*
    -------------------------------------------------------
    CALCULATE SCORE
    -------------------------------------------------------
    */

    let score = 0;


    if (
      hasConfiguredTestCaseMarks
    ) {

      /*
      Do not exceed the question marks.
      */

      score =
        Math.min(
          questionMarks,
          earnedTestCaseMarks,
        );

    }

    else {

      /*
      Test cases don't have individual
      marks.

      Award the question marks
      proportionally based on passed
      test cases.
      */

      score =
        (
          passedTestCases /
          testCases.length
        ) *
        questionMarks;

    }


    score =
      Number(
        score.toFixed(2),
      );


    /*
    -------------------------------------------------------
    QUESTION STATUS
    -------------------------------------------------------
    */

    let status =
      "FAILED";


    if (
      passedTestCases ===
      testCases.length
    ) {

      status =
        "PASSED";

    }

    else if (
      passedTestCases > 0
    ) {

      status =
        "PARTIALLY_PASSED";

    }


    if (
      executionError &&
      passedTestCases === 0
    ) {

      status =
        "EXECUTION_ERROR";

    }


    return {

      score,

      status,

      passedTestCases,

      totalTestCases:
        testCases.length,

      executionError,

    };

  }


  /*
  =======================================================
  FINAL SUBMIT
  =======================================================
  */

  async submitAssessment(
    attemptId: string,
  ): Promise<any> {


    const attempt =
      this.getAttempt(
        attemptId,
      );


    /*
    -------------------------------------------------------
    ALREADY COMPLETED
    -------------------------------------------------------
    */

    if (
      attempt.status ===
      "COMPLETED"
    ) {

      return this.getResult(
        attemptId,
      );

    }


    /*
    -------------------------------------------------------
    GET ASSESSMENT QUESTIONS
    -------------------------------------------------------
    */

    const assessmentQuestions =
      await db.orm.public.AssessmentQuestion
        .where({

          assessmentId:
            attempt.assessmentId,

        })
        .all();


    /*
    -------------------------------------------------------
    TOTAL QUESTIONS
    -------------------------------------------------------
    */

    const totalQuestions =
      assessmentQuestions.length;


    attempt.totalQuestions =
      totalQuestions;


    /*
    -------------------------------------------------------
    RESET SCORE
    -------------------------------------------------------
    */

    let totalScore =
      0;

    let attemptedQuestions =
      0;

    let passedQuestions =
      0;

    let failedQuestions =
      0;


    /*
    =======================================================
    EVALUATE EACH QUESTION
    =======================================================
    */

    for (
      const assessmentQuestion
      of assessmentQuestions
    ) {


      const answer =
        attempt.answers.find(
          (item) =>
            item.questionId ===
            assessmentQuestion.questionId,
        );


      /*
      -----------------------------------------------------
      NOT ANSWERED
      -----------------------------------------------------
      */

      if (
        !answer ||
        !answer.sourceCode ||
        !answer.sourceCode.trim()
      ) {

        failedQuestions++;

        continue;

      }


      attemptedQuestions++;


      /*
      -----------------------------------------------------
      QUESTION MARKS
      -----------------------------------------------------
      */

      const questionMarks =
        Number(
          assessmentQuestion.marks ??
            0,
        );


      /*
      -----------------------------------------------------
      EVALUATE CODING QUESTION
      -----------------------------------------------------
      */

      const evaluation =
        await this.evaluateCodingQuestion(

          assessmentQuestion.questionId,

          answer.sourceCode,

          answer.language,

          questionMarks,

        );


      /*
      -----------------------------------------------------
      SAVE QUESTION RESULT
      -----------------------------------------------------
      */

      answer.score =
        evaluation.score;

      answer.status =
        evaluation.status;

      answer.passedTestCases =
        evaluation.passedTestCases;

      answer.totalTestCases =
        evaluation.totalTestCases;

      answer.executionError =
        evaluation.executionError;


      /*
      -----------------------------------------------------
      ADD TO TOTAL SCORE
      -----------------------------------------------------
      */

      totalScore +=
        evaluation.score;


      /*
      -----------------------------------------------------
      QUESTION PASS / FAIL
      -----------------------------------------------------
      */

      if (
        evaluation.score >=
        questionMarks &&
        evaluation.status ===
        "PASSED"
      ) {

        passedQuestions++;

      }

      else {

        failedQuestions++;

      }

    }


    /*
    -------------------------------------------------------
    CAP TOTAL SCORE
    -------------------------------------------------------
    */

    const assessmentTotalMarks =
      Number(
        attempt.totalMarks ?? 0,
      );


    totalScore =
      Math.min(
        totalScore,
        assessmentTotalMarks,
      );


    totalScore =
      Number(
        totalScore.toFixed(2),
      );


    /*
    -------------------------------------------------------
    COMPLETION TIME
    -------------------------------------------------------
    */

    const completedAt =
      new Date();


    const timeTakenSeconds =
      Math.max(

        0,

        Math.floor(

          (
            completedAt.getTime() -
            attempt.startedAt.getTime()
          ) / 1000,

        ),

      );


    /*
    -------------------------------------------------------
    CALCULATE PERCENTAGE
    -------------------------------------------------------
    */

    const percentage =
      assessmentTotalMarks > 0

        ? Number(

            (
              (
                totalScore /
                assessmentTotalMarks
              ) *
              100
            ).toFixed(2),

          )

        : 0;


    /*
    -------------------------------------------------------
    UPDATE ATTEMPT
    -------------------------------------------------------
    */

    attempt.status =
      "COMPLETED";

    attempt.score =
      totalScore;

    attempt.percentage =
      percentage;

    attempt.totalQuestions =
      totalQuestions;

    attempt.attemptedQuestions =
      attemptedQuestions;

    attempt.passedQuestions =
      passedQuestions;

    attempt.failedQuestions =
      failedQuestions;

    attempt.completedAt =
      completedAt;

    attempt.timeTakenSeconds =
      timeTakenSeconds;


    /*
    -------------------------------------------------------
    SAVE ATTEMPT
    -------------------------------------------------------
    */

    this.attempts.set(
      attemptId,
      attempt,
    );


    /*
    -------------------------------------------------------
    RETURN RESULT
    -------------------------------------------------------
    */

    return {

      attemptId,

      assessmentId:
        attempt.assessmentId,

      learnerId:
        attempt.learnerId,

      status:
        attempt.status,

      score:
        attempt.score,

      obtainedMarks:
        attempt.score,

      totalMarks:
        attempt.totalMarks,

      percentage:
        attempt.percentage,

      totalQuestions:
        attempt.totalQuestions,

      attemptedQuestions:
        attempt.attemptedQuestions,

      passedQuestions:
        attempt.passedQuestions,

      failedQuestions:
        attempt.failedQuestions,

      startedAt:
        attempt.startedAt,

      submittedAt:
        attempt.completedAt,

      completedAt:
        attempt.completedAt,

      timeTakenSeconds:
        attempt.timeTakenSeconds,

      maxAttempts: attempt.maxAttempts,

      attemptsUsed: this.getLearnerAttempts(
        attempt.assessmentId,
        attempt.learnerId,
      ).length,

      attemptsRemaining: Math.max(
        0,
        attempt.maxAttempts -
          this.getLearnerAttempts(
            attempt.assessmentId,
            attempt.learnerId,
          ).length,
      ),

    };

  }


  /*
  =======================================================
  GET RESULT
  =======================================================
  */

  async getResult(
    attemptId: string,
  ): Promise<any> {


    const attempt =
      this.getAttempt(
        attemptId,
      );


    /*
    -------------------------------------------------------
    GET ASSESSMENT
    -------------------------------------------------------
    */

    const assessment =
      await db.orm.public.Assessment
        .where({

          id:
            attempt.assessmentId,

        })
        .first();


    /*
    -------------------------------------------------------
    ENSURE QUESTION COUNT IS CURRENT

    This prevents the result page from showing
    totalQuestions = 0 even if the attempt was
    created before questions were linked.
    -------------------------------------------------------
    */

    const assessmentQuestions =
      await db.orm.public.AssessmentQuestion
        .where({

          assessmentId:
            attempt.assessmentId,

        })
        .all();


    const totalQuestions =
      assessmentQuestions.length;


    /*
    -------------------------------------------------------
    CALCULATE ATTEMPTED QUESTIONS FROM ANSWERS

    This ensures the result is based on actual
    submitted source code rather than a stale
    counter.
    -------------------------------------------------------
    */

    const attemptedQuestions =
      attempt.answers.filter(
        (answer) =>
          Boolean(
            answer.sourceCode &&
            answer.sourceCode.trim(),
          ),
      ).length;


    /*
    -------------------------------------------------------
    KEEP ATTEMPT DATA SYNCHRONIZED
    -------------------------------------------------------
    */

    attempt.totalQuestions =
      totalQuestions;

    attempt.attemptedQuestions =
      attemptedQuestions;


    /*
    -------------------------------------------------------
    PASS STATUS

    Default rule:
    score percentage >= 50 = passed.

    If you later add an assessment-specific
    passing score, replace this with the DB
    configured passing percentage.
    -------------------------------------------------------
    */

    const passed =
      attempt.percentage >= 50;


    /*
    -------------------------------------------------------
    RETURN RESULT
    -------------------------------------------------------
    */

    return {

      attemptId:
        attempt.id,

      assessmentId:
        attempt.assessmentId,

      assessmentTitle:
        assessment?.title ??
        "Assessment",

      learnerId:
        attempt.learnerId,

      status:
        attempt.status,

      /*
      Existing field
      */

      score:
        attempt.score,

      /*
      Result page friendly field
      */

      obtainedMarks:
        attempt.score,

      totalMarks:
        attempt.totalMarks,

      percentage:
        attempt.percentage,

      /*
      IMPORTANT:
      This was missing previously.
      */

      totalQuestions:
        totalQuestions,

      attemptedQuestions:
        attemptedQuestions,

      passedQuestions:
        attempt.passedQuestions,

      failedQuestions:
        attempt.failedQuestions,

      passed,

      startedAt:
        attempt.startedAt,

      submittedAt:
        attempt.completedAt,

      completedAt:
        attempt.completedAt,

      timeTakenSeconds:
        attempt.timeTakenSeconds,

      maxAttempts: attempt.maxAttempts,

      attemptsUsed: this.getLearnerAttempts(
        attempt.assessmentId,
        attempt.learnerId,
      ).length,

      attemptsRemaining: Math.max(
        0,
        attempt.maxAttempts -
          this.getLearnerAttempts(
            attempt.assessmentId,
            attempt.learnerId,
          ).length,
      ),

      answers:
        attempt.answers.map(
          (answer) => ({

            questionId:
              answer.questionId,

            score:
              answer.score,

            status:
              answer.status,

            passedTestCases:
              answer.passedTestCases ??
              0,

            totalTestCases:
              answer.totalTestCases ??
              0,

          }),
        ),

    };

  }


  /*
  =======================================================
  GET CURRENT ATTEMPT
  =======================================================
  */

  async getAttemptDetails(
    attemptId: string,
  ): Promise<any> {


    const attempt =
      this.getAttempt(
        attemptId,
      );


    /*
    -------------------------------------------------------
    GET CURRENT QUESTION COUNT
    -------------------------------------------------------
    */

    const assessmentQuestions =
      await db.orm.public.AssessmentQuestion
        .where({

          assessmentId:
            attempt.assessmentId,

        })
        .all();


    const totalQuestions =
      assessmentQuestions.length;


    return {

      id:
        attempt.id,

      assessmentId:
        attempt.assessmentId,

      learnerId:
        attempt.learnerId,

      status:
        attempt.status,

      startedAt:
        attempt.startedAt,

      completedAt:
        attempt.completedAt,

      totalMarks:
        attempt.totalMarks,

      score:
        attempt.score,

      percentage:
        attempt.percentage,

      totalQuestions:
        totalQuestions,

      attemptedQuestions:
        attempt.answers.filter(
          (answer) =>
            Boolean(
              answer.sourceCode &&
              answer.sourceCode.trim(),
            ),
        ).length,

      passedQuestions:
        attempt.passedQuestions,

      failedQuestions:
        attempt.failedQuestions, 

      timeTakenSeconds:
        attempt.timeTakenSeconds,

      maxAttempts: attempt.maxAttempts,

      attemptsUsed: this.getLearnerAttempts(
        attempt.assessmentId,
        attempt.learnerId,
      ).length,

      attemptsRemaining: Math.max(
        0,
        attempt.maxAttempts -
          this.getLearnerAttempts(
            attempt.assessmentId,
            attempt.learnerId,
          ).length,
      ),

      answers:
        attempt.answers,

    };

  }

    /*
  =========================================================
  GET ALL RESULTS FOR AN ASSESSMENT

  Used by:

  GET
  /assessment/:assessmentId/results

  This is for the assessment creator/faculty.

  Returns every attempt belonging to the
  selected assessment.
  =========================================================
  */

  async getAssessmentResults(
    assessmentId: string,
  ): Promise<any[]> {

    /*
    -------------------------------------------------------
    VERIFY ASSESSMENT
    -------------------------------------------------------
    */

    const assessment =
      await db.orm.public.Assessment
        .where({
          id: assessmentId,
        })
        .first();


    if (!assessment) {

      throw new NotFoundException(
        "Assessment not found",
      );

    }


    /*
    -------------------------------------------------------
    GET ASSESSMENT QUESTIONS

    Used to make sure total question count
    comes from the actual assessment.
    -------------------------------------------------------
    */

    const assessmentQuestions =
      await db.orm.public.AssessmentQuestion
        .where({
          assessmentId,
        })
        .all();


    const totalQuestions =
      assessmentQuestions.length;


    /*
    -------------------------------------------------------
    GET ATTEMPTS FOR THIS ASSESSMENT

    Your current implementation stores attempts
    in the service Map.
    -------------------------------------------------------
    */

    const assessmentAttempts =
      Array.from(
        this.attempts.values(),
      ).filter(
        (attempt) =>
          attempt.assessmentId ===
          assessmentId,
      );


    /*
    -------------------------------------------------------
    SORT

    Latest attempt first.
    -------------------------------------------------------
    */

    assessmentAttempts.sort(
      (a, b) =>
        b.startedAt.getTime() -
        a.startedAt.getTime(),
    );


    /*
    -------------------------------------------------------
    BUILD RESULT LIST
    -------------------------------------------------------
    */

    return assessmentAttempts.map(
      (
        attempt,
        index,
      ) => {

        const attemptedQuestions =
          attempt.answers.filter(
            (answer) =>
              Boolean(
                answer.sourceCode &&
                answer.sourceCode.trim(),
              ),
          ).length;


        /*
        Attempt number is calculated
        per learner.

        We cannot simply use index + 1 because
        multiple learners can have attempts.
        */

        const learnerAttempts =
          assessmentAttempts
            .filter(
              (item) =>
                item.learnerId ===
                attempt.learnerId,
            )
            .sort(
              (a, b) =>
                a.startedAt.getTime() -
                b.startedAt.getTime(),
            );


        const attemptNumber =
          Math.max(
            1,
            learnerAttempts.findIndex(
              (item) =>
                item.id ===
                attempt.id,
            ) + 1,
          );


        /*
        ---------------------------------------------------
        STATUS

        Your current service uses:

          IN_PROGRESS
          COMPLETED

        ---------------------------------------------------
        */

        const status =
          String(
            attempt.status,
          ).toUpperCase();


        /*
        ---------------------------------------------------
        PERCENTAGE
        ---------------------------------------------------
        */

        let percentage =
          Number(
            attempt.percentage ?? 0,
          );


        if (
          percentage === 0 &&
          Number(
            attempt.totalMarks,
          ) > 0
        ) {

          percentage =
            (
              Number(
                attempt.score ?? 0,
              ) /
              Number(
                attempt.totalMarks,
              )
            ) *
            100;

        }


        /*
        ---------------------------------------------------
        PASSED

        Current assessment result logic uses
        50% as the default passing threshold.
        ---------------------------------------------------
        */

        const passed =
          percentage >= 50;


        /*
        ---------------------------------------------------
        ATTENDANCE

        If an attempt exists, learner attended.
        ---------------------------------------------------
        */

        const attended =
          true;


        /*
        ---------------------------------------------------
        EMAIL

        The current Attempt object contains only:

          learnerId

        It does NOT contain learner email.

        Therefore do not invent an email address.

        Return null until the learner/profile table
        is connected.
        ---------------------------------------------------
        */

        const email =
          null;


        return {

          attemptId:
            attempt.id,

          assessmentId:
            attempt.assessmentId,

          assessmentTitle:
            assessment?.title ??
            "Assessment",

          learnerId:
            attempt.learnerId,

          learnerName:
            attempt.learnerId,

          email,

          attended,

          attemptNumber,

          status,

          score:
            Number(
              attempt.score ?? 0,
            ),

          obtainedMarks:
            Number(
              attempt.score ?? 0,
            ),

          totalMarks:
            Number(
              attempt.totalMarks ?? 0,
            ),

          percentage:
            Math.round(
              percentage * 100,
            ) / 100,

          totalQuestions,

          attemptedQuestions,

          passedQuestions:
            Number(
              attempt.passedQuestions ??
              0,
            ),

          failedQuestions:
            Number(
              attempt.failedQuestions ??
              0,
            ),

          passed,

          startedAt:
            attempt.startedAt,

          submittedAt:
            attempt.completedAt,

          completedAt:
            attempt.completedAt,

          timeTakenSeconds:
            Number(
              attempt.timeTakenSeconds ??
              0,
            ),

          maxAttempts:
            attempt.maxAttempts,

        };

      },
    );

  }

}

