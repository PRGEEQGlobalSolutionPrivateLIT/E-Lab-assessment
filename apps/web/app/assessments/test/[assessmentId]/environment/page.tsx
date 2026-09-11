"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import Editor from "@monaco-editor/react";


/*
========================================================
TYPES
========================================================
*/

type TestCase = {
  id?: string;
  name?: string;

  type?: string;
  testType?: string;

  input?: string;
  inputData?: string;

  expectedOutput?: string;

  marks?: number;

  sequence?: number;

  active?: boolean;
  isActive?: boolean;
};


type Question = {
  id: string;

  questionId?: string;

  sequence: number;

  title: string;

  marks: number;

  language: string;

  difficulty?: string;

  problemStatement: string;

  inputFormat: string;

  outputFormat: string;

  constraints: string;

  exampleInput: string;

  exampleOutput: string;

  starterCode: string;

  compiler?: string;

  languageStandard?: string;

  timeLimitSeconds?: number;

  memoryLimitMb?: number;

  testCases: TestCase[];
};


type Assessment = {
  id: string;

  title: string;

  code?: string;

  description?: string;

  instructions?: string;

  durationMinutes: number;

  totalMarks: number;

  plannedQuestions: number;

  technology?: string;

  maximumAttempts: number;
};


type Attempt = {
  id: string;

  assessmentId?: string;

  learnerId?: string;

  status?: string;

  startedAt?: string;

  expiresAt?: string;

  totalMarks?: number;

  score?: number;

  percentage?: number;
};


type RunResponse = {
  executionId?: string;

  status?: string;

  stdout?: string;

  stderr?: string;

  exitCode?: number | null;

  executionTimeMs?: number;
};


/*
========================================================
HELPERS
========================================================
*/

function str(
  value: unknown,
): string {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);

}


function num(
  value: unknown,
  fallback = 0,
): number {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;

}

/*
========================================================
SCORING ATTEMPT LIMIT NORMALIZATION
========================================================
*/

function getMaximumAttempts(
  value: any,
): number {

  const scoring =
    value?.data ??
    value?.scoring ??
    value ??
    {};

  return num(
    scoring?.maximumAttempts ??
    scoring?.maxAttempts ??
    scoring?.attemptsAllowed ??
    scoring?.attemptLimit ??
    value?.data?.maximumAttempts ??
    value?.data?.maxAttempts ??
    value?.data?.attemptsAllowed ??
    value?.data?.attemptLimit ??
    value?.scoring?.maximumAttempts ??
    value?.scoring?.maxAttempts ??
    value?.scoring?.attemptsAllowed ??
    value?.scoring?.attemptLimit,
    0,
  );

}



/*
========================================================
LANGUAGE NORMALIZATION
========================================================
*/

function normalizeLanguage(
  value: unknown,
): string {

  const v =
    str(value)
      .trim()
      .toLowerCase();


  if (
    v === "c++" ||
    v === "cpp"
  ) {
    return "cpp";
  }


  if (
    v === "c#"
  ) {
    return "csharp";
  }


  if (
    v === "javascript" ||
    v === "js"
  ) {
    return "javascript";
  }


  if (
    v === "typescript" ||
    v === "ts"
  ) {
    return "typescript";
  }


  if (
    v === "python" ||
    v === "python3"
  ) {
    return "python";
  }


  if (
    v === "java"
  ) {
    return "java";
  }


  if (
    v === "go"
  ) {
    return "go";
  }


  return v || "c";

}


/*
========================================================
ARRAY RESPONSE NORMALIZATION
========================================================
*/

function listOf(
  value: any,
): any[] {

  if (
    Array.isArray(value)
  ) {
    return value;
  }


  if (
    Array.isArray(
      value?.data,
    )
  ) {
    return value.data;
  }


  if (
    Array.isArray(
      value?.questions,
    )
  ) {
    return value.questions;
  }


  if (
    Array.isArray(
      value?.items,
    )
  ) {
    return value.items;
  }


  return [];

}


/*
========================================================
TEST CASE NORMALIZATION

DB:

inputData
expectedOutput
testType
isActive
sequence

Frontend:

input
expectedOutput
type
active
========================================================
*/

function normalizeTestCases(
  value: any,
): TestCase[] {

  let list: any[] = [];


  if (
    Array.isArray(value)
  ) {

    list = value;

  }
  else if (
    Array.isArray(
      value?.testCases,
    )
  ) {

    list =
      value.testCases;

  }


  return list

    .filter(
      (
        item: any,
      ) =>
        item?.isActive !== false &&
        item?.active !== false,
    )

    .sort(
      (
        a: any,
        b: any,
      ) =>
        num(a?.sequence) -
        num(b?.sequence),
    )

    .map(
      (
        item: any,
      ) => ({

        id:
          item?.id
            ? str(item.id)
            : undefined,

        name:
          item?.name
            ? str(item.name)
            : undefined,

        type:
          str(
            item?.type ??
            item?.testType ??
            "PUBLIC",
          ),

        testType:
          str(
            item?.testType ??
            item?.type ??
            "PUBLIC",
          ),

        input:
          str(
            item?.input ??
            item?.inputData ??
            "",
          ),

        inputData:
          str(
            item?.inputData ??
            item?.input ??
            "",
          ),

        expectedOutput:
          str(
            item?.expectedOutput ??
            item?.expected ??
            "",
          ),

        marks:
          item?.marks == null
            ? undefined
            : num(item.marks),

        sequence:
          item?.sequence == null
            ? undefined
            : num(item.sequence),

        active:
          item?.active !== false &&
          item?.isActive !== false,

        isActive:
          item?.isActive !== false &&
          item?.active !== false,

      }),
    );

}


/*
========================================================
QUESTION NORMALIZATION
========================================================
*/

function normalizeQuestion(
  raw: any,
  index: number,
): Question | null {

  /*
  ------------------------------------------------------
  Support all likely backend structures:

  raw
  raw.question
  raw.codingQuestion
  raw.form
  raw.question.form
  raw.question.codingQuestion
  ------------------------------------------------------
  */

  const questionObject =
    raw?.question ??
    raw;


  const codingQuestion =
    raw?.codingQuestion ??
    questionObject?.codingQuestion ??
    raw?.question?.codingQuestion ??
    null;


  const form =
    raw?.form ??
    questionObject?.form ??
    codingQuestion?.form ??
    {};


  /*
  ------------------------------------------------------
  QUESTION ID
  ------------------------------------------------------
  */

  const id =
    str(
      raw?.questionId ??
      questionObject?.id ??
      raw?.id ??
      form?.id,
    );


  if (!id) {

    return null;

  }


  /*
  ------------------------------------------------------
  TEST CASE SOURCE
  ------------------------------------------------------
  */

  const testCaseSource =
    raw?.testCases ??
    questionObject?.testCases ??
    codingQuestion?.testCases ??
    form?.testCases ??
    [];


  /*
  ------------------------------------------------------
  NORMALIZED QUESTION
  ------------------------------------------------------
  */

  return {

    id,

    questionId:
      id,

    sequence:
      num(
        raw?.sequence ??
        questionObject?.sequence,
        index + 1,
      ),

    title:
      str(
        form?.title ??
        questionObject?.title ??
        raw?.title ??
        `Question ${index + 1}`,
      ),

    marks:
      num(
        raw?.marks ??
        form?.marks ??
        questionObject?.marks ??
        0,
      ),

    language:
      normalizeLanguage(
        codingQuestion?.language ??
        form?.language ??
        questionObject?.language ??
        raw?.language ??
        raw?.technology ??
        "c",
      ),

    difficulty:
      str(
        form?.difficulty ??
        codingQuestion?.difficulty ??
        questionObject?.difficulty ??
        raw?.difficulty ??
        "",
      ),

    problemStatement:
      str(
        codingQuestion?.problemStatement ??
        form?.problemStatement ??
        questionObject?.problemStatement ??
        raw?.problemStatement ??
        questionObject?.description ??
        raw?.description ??
        "",
      ),

    inputFormat:
      str(
        codingQuestion?.inputFormat ??
        form?.inputFormat ??
        questionObject?.inputFormat ??
        raw?.inputFormat ??
        "",
      ),

    outputFormat:
      str(
        codingQuestion?.outputFormat ??
        form?.outputFormat ??
        questionObject?.outputFormat ??
        raw?.outputFormat ??
        "",
      ),

    constraints:
      str(
        codingQuestion?.constraintsText ??
        codingQuestion?.constraints ??
        form?.constraints ??
        questionObject?.constraintsText ??
        questionObject?.constraints ??
        raw?.constraints ??
        "",
      ),

    exampleInput:
      str(
        codingQuestion?.exampleInput ??
        form?.exampleInput ??
        questionObject?.exampleInput ??
        raw?.exampleInput ??
        "",
      ),

    exampleOutput:
      str(
        codingQuestion?.exampleOutput ??
        form?.exampleOutput ??
        questionObject?.exampleOutput ??
        raw?.exampleOutput ??
        "",
      ),

    starterCode:
      str(
        codingQuestion?.starterCode ??
        form?.starterCode ??
        questionObject?.starterCode ??
        raw?.starterCode ??
        "",
      ),

    compiler:
      str(
        codingQuestion?.compiler ??
        form?.compiler ??
        questionObject?.compiler ??
        raw?.compiler ??
        "",
      ),

    languageStandard:
      str(
        codingQuestion?.languageStandard ??
        form?.languageStandard ??
        questionObject?.languageStandard ??
        raw?.languageStandard ??
        "",
      ),

    timeLimitSeconds:
      num(
        codingQuestion?.timeLimitSeconds ??
        form?.timeLimitSeconds ??
        questionObject?.timeLimitSeconds ??
        raw?.timeLimitSeconds ??
        0,
      ),

    memoryLimitMb:
      num(
        codingQuestion?.memoryLimitMb ??
        form?.memoryLimitMb ??
        questionObject?.memoryLimitMb ??
        raw?.memoryLimitMb ??
        0,
      ),

    testCases:
      normalizeTestCases(
        testCaseSource,
      ),

  };

}


/*
========================================================
PAGE
========================================================
*/

export default function EnvironmentPage() {

  const params =
    useParams();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();


  /*
  ------------------------------------------------------
  ASSESSMENT ID
  ------------------------------------------------------
  */

  const assessmentId =
    String(
      params.assessmentId,
    );


  const mode =
    searchParams.get(
      "mode",
    ) || "learner";


  /*
   * The overview page creates the attempt and passes
   * the attempt ID to this page.
   *
   * Example:
   * /environment?mode=learner&attemptId=xxxx
   *
   * Do NOT create another attempt here.
   */
  const attemptId =
    searchParams.get(
      "attemptId",
    );


  /*
  ------------------------------------------------------
  API
  ------------------------------------------------------
  */

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";


  /*
  ------------------------------------------------------
  STATE
  ------------------------------------------------------
  */

  const [
    assessment,
    setAssessment,
  ] =
    useState<
      Assessment | null
    >(null);


  const [
    questions,
    setQuestions,
  ] =
    useState<
      Question[]
    >([]);


  const [
    current,
    setCurrent,
  ] =
    useState(0);


  /*
  Answers are stored by question ID.
  */

  const [
    answers,
    setAnswers,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});


  const [
    code,
    setCode,
  ] =
    useState("");


  const [
    input,
    setInput,
  ] =
    useState("");


  const [
    output,
    setOutput,
  ] =
    useState("");


  const [
    status,
    setStatus,
  ] =
    useState("");


  const [
    executionTime,
    setExecutionTime,
  ] =
    useState<
      number | null
    >(null);


  const [
    time,
    setTime,
  ] =
    useState(0);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    running,
    setRunning,
  ] =
    useState(false);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    confirmSubmit,
    setConfirmSubmit,
  ] =
    useState(false);


  /*
  ------------------------------------------------------
  ATTEMPT
  ------------------------------------------------------
  */

  const [
    attempt,
    setAttempt,
  ] =
    useState<
      Attempt | null
    >(null);


  /*
  ------------------------------------------------------
  CURRENT QUESTION
  ------------------------------------------------------
  */

  const question =
    questions[current];


  /*
  ------------------------------------------------------
  ANSWER COUNT
  ------------------------------------------------------
  */

  const answeredCount =
    useMemo(
      () =>
        questions.filter(
          (
            item,
          ) =>
            Boolean(
              answers[
                item.id
              ]?.trim(),
            ),
        ).length,

      [
        answers,
        questions,
      ],
    );


  /*
  ======================================================
  LOAD ENVIRONMENT
  ======================================================
  */

  useEffect(
    () => {

      loadEnvironment();

    },
    [
      assessmentId,
      attemptId,
    ],
  );


  /*
  ======================================================
  QUESTION CHANGE
  ======================================================
  */

  useEffect(
    () => {

      if (!question) {

        return;

      }


      /*
      Load previously typed answer.
      */

      setCode(
        answers[
          question.id
        ] ??
        question.starterCode ??
        "",
      );


      /*
      Reset execution output.
      */

      setOutput("");

      setStatus("");

      setExecutionTime(null);


      /*
      Use sample test input.
      */

      const sample =
        question.testCases?.find(
          (
            test,
          ) =>
            (
              test.type ??
              test.testType
            )?.toUpperCase() ===
            "SAMPLE",
        );


      setInput(
        sample?.input ??
        sample?.inputData ??
        question.exampleInput ??
        "",
      );

    },
    [
      current,
      question?.id,
    ],
  );


  /*
  ======================================================
  TIMER
  ======================================================
  */

  useEffect(
    () => {

      if (
        loading ||
        time <= 0 ||
        submitting
      ) {

        return;

      }


      const timer =
        window.setInterval(
          () => {

            setTime(
              previous =>
                Math.max(
                  previous - 1,
                  0,
                ),
            );

          },
          1000,
        );


      return () =>
        window.clearInterval(
          timer,
        );

    },
    [
      loading,
      time,
      submitting,
    ],
  );


  /*
  ======================================================
  AUTO SUBMIT WHEN TIME EXPIRES
  ======================================================
  */

  useEffect(
    () => {

      if (
        time !== 0 ||
        loading ||
        submitting ||
        !attempt ||
        !questions.length
      ) {

        return;

      }


      submitAssessment();

    },
    [
      time,
      loading,
      submitting,
      attempt,
      questions.length,
    ],
  );


  /*
  ======================================================
  GET JSON
  ======================================================
  */

  async function getJson(
    url: string,
  ): Promise<
    any | null
  > {

    try {

      const response =
        await fetch(
          url,
          {
            cache:
              "no-store",
          },
        );


      if (
        !response.ok
      ) {

        return null;

      }


      return await response.json();

    }
    catch {

      return null;

    }

  }


  /*
  ======================================================
  LOAD ENVIRONMENT
  ======================================================
  */

  async function loadEnvironment() {

    try {

      setLoading(true);

      setError("");


      /*
      --------------------------------------------------
      1. ASSESSMENT
      --------------------------------------------------
      */

      const assessmentData =
        await getJson(
          `${API_URL}/assessment/${assessmentId}`,
        );


      if (
        !assessmentData
      ) {

        throw new Error(
          "Assessment could not be loaded.",
        );

      }


      /*
      --------------------------------------------------
      1A. SCORING / ATTEMPT RULES
      --------------------------------------------------

      Attempts Allowed is configured on the Scoring page
      and persisted by the scoring endpoint as:

        maximumAttempts

      Do NOT read it from /assessment/:id.
      --------------------------------------------------
      */

      const scoringDataRaw =
        await getJson(
          `${API_URL}/scoring/${assessmentId}`,
        );

      const maximumAttempts =
        getMaximumAttempts(
          scoringDataRaw,
        );

      const normalizedAssessment:
        Assessment = {

        id:
          str(
            assessmentData.id ??
            assessmentId,
          ),

        title:
          str(
            assessmentData.title ??
            "Assessment",
          ),

        code:
          str(
            assessmentData.code,
          ),

        description:
          str(
            assessmentData.description,
          ),

        instructions:
          str(
            assessmentData.instructions,
          ),

        durationMinutes:
          num(
            assessmentData.durationMinutes,
          ),

        totalMarks:
          num(
            assessmentData.totalMarks,
          ),

        plannedQuestions:
          num(
            assessmentData.plannedQuestions,
          ),

        technology:
          str(
            assessmentData.technology,
          ),

        maximumAttempts,

      };


      setAssessment(
        normalizedAssessment,
      );


      /*
      --------------------------------------------------
      ATTEMPT LIMIT DIAGNOSTIC
      --------------------------------------------------

      The attempt itself is already created by Overview.
      Environment never calls /assessment-attempt/start.

      If this value is zero, the scoring configuration is
      not available to the frontend. We stop here with a
      clear message rather than letting the environment
      fail later.
      --------------------------------------------------
      */

      if (
        maximumAttempts <= 0
      ) {

        throw new Error(
          "Attempts Allowed is not configured in the scoring configuration. Please configure Attempts Allowed before starting the assessment.",
        );

      }


      /*
      --------------------------------------------------
      2. ASSESSMENT QUESTION MAPPINGS
      --------------------------------------------------

      IMPORTANT:

      This is your existing endpoint:

      GET
      /questions/assessment/:assessmentId

      Do NOT use:

      /questions/assessment/:assessmentId/test

      --------------------------------------------------
      */

      const mappingData =
        await getJson(
          `${API_URL}/questions/assessment/${assessmentId}`,
        );


      const mappings =
        listOf(
          mappingData,
        );


      let loadedQuestions:
        Question[] =
        mappings

          .map(
            (
              item,
              index,
            ) =>
              normalizeQuestion(
                item,
                index,
              ),
          )

          .filter(
            (
              item,
            ): item is Question =>
              Boolean(item),
          );


      /*
      --------------------------------------------------
      3. ENRICH QUESTIONS
      --------------------------------------------------

      If the assessment endpoint returns only:

      questionId
      sequence
      marks

      try the individual question endpoint.

      --------------------------------------------------
      */

      for (
        let index = 0;
        index < mappings.length;
        index++
      ) {

        const mapping =
          mappings[index];


        const questionId =
          mapping?.questionId;


        if (
          !questionId
        ) {

          continue;

        }


        /*
        Check whether we already have full
        coding-question information.
        */

        const currentQuestion =
          loadedQuestions[index];


        const hasCodingData =
          Boolean(
            currentQuestion?.problemStatement ||
            currentQuestion?.starterCode ||
            currentQuestion?.testCases?.length,
          );


        if (
          hasCodingData
        ) {

          continue;

        }


        /*
        Try:

        GET /questions/:questionId
        */

        const details =
          await getJson(
            `${API_URL}/questions/${encodeURIComponent(
              String(
                questionId,
              ),
            )}`,
          );


        if (
          details
        ) {

          const enriched =
            normalizeQuestion(
              {
                ...mapping,

                ...details,

                questionId,
              },
              index,
            );


          if (
            enriched
          ) {

            loadedQuestions[
              index
            ] =
              enriched;

          }

        }

      }


      /*
      --------------------------------------------------
      4. SORT BY SEQUENCE
      --------------------------------------------------
      */

      loadedQuestions =
        loadedQuestions
          .filter(Boolean)
          .sort(
            (
              a,
              b,
            ) =>
              a.sequence -
              b.sequence,
          );


      setQuestions(
        loadedQuestions,
      );


      /*
      --------------------------------------------------
      5. NO QUESTIONS
      --------------------------------------------------
      */

      if (
        loadedQuestions.length === 0
      ) {

        setError(
          "No questions are configured for this assessment. Please make sure the coding question is created and mapped to this assessment.",
        );

      }


      /*
      --------------------------------------------------
      6. TIMER
      --------------------------------------------------
      */

      setTime(
        normalizedAssessment
          .durationMinutes *
          60,
      );


      /*
      --------------------------------------------------
      7. USE THE ATTEMPT CREATED BY OVERVIEW
      --------------------------------------------------

      The overview page is responsible for creating
      the attempt and enforcing the configured attempt
      limit.

      This page MUST NOT call /start again because doing
      so can consume another attempt or fail with:

      "Assessment attempt limit is not configured..."

      --------------------------------------------------
      */

      if (!attemptId) {

        throw new Error(
          "No assessment attempt was provided. Please start the test from the assessment overview page.",
        );

      }

      /*
      --------------------------------------------------
      ATTEMPT CREATED BY OVERVIEW
      --------------------------------------------------

      The Overview page is responsible for calling:

        POST /assessment-attempt/start

      That endpoint validates the assessment's configured
      Attempts Allowed value and creates the attempt.

      This environment page MUST NOT call /start again.

      We only attach the already-created attempt ID to
      local state so that Save Answer and Final Submit
      can use:

        /assessment-attempt/:attemptId/answer
        /assessment-attempt/:attemptId/submit
      --------------------------------------------------
      */

      setAttempt({
        id: attemptId,
        assessmentId,
      });

    }
    catch (
      loadError: any
    ) {

      console.error(
        "TEST ENVIRONMENT LOAD ERROR:",
        loadError,
      );


      setError(
        loadError?.message ||
        "Unable to load assessment.",
      );

    }
    finally {

      setLoading(false);

    }

  }


  /*
  ======================================================
  START ATTEMPT
  ======================================================
  */

  /*
  ======================================================
  ATTEMPT
  ======================================================

  IMPORTANT:
  The attempt is created by the overview page.

  This environment page intentionally does not call:

    POST /assessment-attempt/start

  again.

  The attempt ID comes from:

    ?attemptId=...

  and is used for saving answers and final submission.
  */




  /*
  ======================================================
  FORMAT TIME
  ======================================================
  */

  function formatTime() {

    const hours =
      Math.floor(
        time / 3600,
      );


    const minutes =
      Math.floor(
        (
          time %
          3600
        ) / 60,
      );


    const seconds =
      time %
      60;


    if (
      hours > 0
    ) {

      return (

        `${hours
          .toString()
          .padStart(2, "0")}:` +

        `${minutes
          .toString()
          .padStart(2, "0")}:` +

        `${seconds
          .toString()
          .padStart(2, "0")}`

      );

    }


    return (

      `${minutes
        .toString()
        .padStart(2, "0")}:` +

      `${seconds
        .toString()
        .padStart(2, "0")}`

    );

  }


  /*
  ======================================================
  UPDATE CODE
  ======================================================
  */

  function updateCode(
    value: string,
  ) {

    setCode(
      value,
    );


    if (
      !question
    ) {

      return;

    }


    setAnswers(
      previous => ({

        ...previous,

        [question.id]:
          value,

      }),
    );

  }


  /*
  ======================================================
  SAVE ANSWER
  ======================================================
  */

  async function saveAnswer(
    questionToSave?: Question,
    codeToSave?: string,
  ) {

    const targetQuestion =
      questionToSave ??
      question;


    const sourceCode =
      codeToSave ??
      code;


    if (
      !targetQuestion ||
      !attempt?.id
    ) {

      return false;

    }


    try {

      setSaving(true);


      const questionId =
        targetQuestion.questionId ??
        targetQuestion.id;


      const response =
        await fetch(
          `${API_URL}/assessment-attempt/${attempt.id}/answer`,
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                questionId,

                sourceCode,

                code:
                  sourceCode,

                language:
                  normalizeLanguage(
                    targetQuestion.language,
                  ),

              }),

          },
        );


      if (
        !response.ok
      ) {

        const text =
          await response.text();


        throw new Error(
          text ||
          "Unable to save answer.",
        );

      }


      return true;

    }
    catch (
      saveError: any
    ) {

      console.error(
        "SAVE ANSWER ERROR:",
        saveError,
      );


      setError(
        saveError?.message ||
        "Unable to save answer.",
      );


      return false;

    }
    finally {

      setSaving(false);

    }

  }


  /*
  ======================================================
  RUN CODE
  ======================================================
  */

  async function runCode() {

    if (
      !question ||
      running
    ) {

      return;

    }


    try {

      setRunning(true);

      setStatus(
        "RUNNING",
      );

      setOutput("");

      setExecutionTime(
        null,
      );


      const response =
        await fetch(
          `${API_URL}/execution/run`,
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
                  normalizeLanguage(
                    question.language,
                  ),

                code,

                input,

              }),

          },
        );


      if (
        !response.ok
      ) {

        throw new Error(
          `Execution HTTP ${response.status}`,
        );

      }


      const result:
        RunResponse =
        await response.json();


      setStatus(
        result.status ||
        "SUCCESS",
      );


      setExecutionTime(
        result.executionTimeMs ??
        null,
      );


      if (
        result.status ===
        "SUCCESS"
      ) {

        setOutput(
          result.stdout ||
          "Program completed with no output.",
        );

      }
      else {

        setOutput(
          result.stderr ||
          result.stdout ||
          result.status ||
          "Execution failed.",
        );

      }

    }
    catch (
      runError
    ) {

      console.error(
        "RUN CODE ERROR:",
        runError,
      );


      setStatus(
        "ERROR",
      );


      setOutput(
        "Unable to connect to the execution service.",
      );

    }
    finally {

      setRunning(false);

    }

  }


  /*
  ======================================================
  RUN DB TEST CASES
  ======================================================
  */

  async function runTestCases() {

    if (
      !question ||
      running
    ) {

      return;

    }


    const tests =
      question.testCases
        .filter(
          test =>
            test.active !== false &&
            test.isActive !== false,
        );


    if (
      tests.length === 0
    ) {

      setStatus(
        "NO TEST CASES",
      );


      setOutput(
        "No active test cases are configured for this question.",
      );


      return;

    }


    try {

      setRunning(true);

      setStatus(
        "RUNNING TESTS",
      );

      setOutput("");


      const results:
        string[] = [];


      let passed =
        0;


      for (
        let index = 0;
        index < tests.length;
        index++
      ) {

        const test =
          tests[index];


        const testInput =
          str(
            test.input ??
            test.inputData ??
            "",
          );


        const expected =
          str(
            test.expectedOutput ??
            "",
          ).trim();


        const response =
          await fetch(
            `${API_URL}/execution/run`,
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
                    normalizeLanguage(
                      question.language,
                    ),

                  code,

                  input:
                    testInput,

                }),

            },
          );


        if (
          !response.ok
        ) {

          results.push(
            `Test ${index + 1}: ERROR\nExecution HTTP ${response.status}`,
          );

          continue;

        }


        const result:
          RunResponse =
          await response.json();


        const actual =
          str(
            result.stdout ??
            result.stderr ??
            "",
          ).trim();


        const passedCase =
          result.status ===
            "SUCCESS" &&
          actual ===
            expected;


        if (
          passedCase
        ) {

          passed++;

        }


        results.push(

          `Test ${
            index + 1
          }: ${
            passedCase
              ? "PASS"
              : "FAIL"
          }\n` +

          `Expected: ${
            expected ||
            "(empty)"
          }\n` +

          `Actual: ${
            actual ||
            "(empty)"
          }`

        );

      }


      setStatus(
        `${passed}/${tests.length} TESTS PASSED`,
      );


      setOutput(
        results.join(
          "\n\n",
        ),
      );

    }
    catch (
      testError
    ) {

      console.error(
        "RUN TEST CASES ERROR:",
        testError,
      );


      setStatus(
        "ERROR",
      );


      setOutput(
        "Unable to execute the configured test cases.",
      );

    }
    finally {

      setRunning(false);

    }

  }


  /*
  ======================================================
  RESET
  ======================================================
  */

  function resetCode() {

    if (
      !question
    ) {

      return;

    }


    const starter =
      question.starterCode ||
      "";


    setCode(
      starter,
    );


    setAnswers(
      previous => ({

        ...previous,

        [question.id]:
          starter,

      }),
    );


    const sample =
      question.testCases?.find(
        test =>
          (
            test.type ??
            test.testType
          )?.toUpperCase() ===
          "SAMPLE",
      );


    setInput(
      sample?.input ??
      sample?.inputData ??
      question.exampleInput ??
      "",
    );


    setOutput("");

    setStatus("");

    setExecutionTime(
      null,
    );

  }


  /*
  ======================================================
  CHANGE QUESTION
  ======================================================
  */

  async function changeQuestion(
    index: number,
  ) {

    if (
      index < 0 ||
      index >= questions.length ||
      index === current
    ) {

      return;

    }


    /*
    Save the current question first.
    */

    const saved =
      await saveAnswer(
        question,
        code,
      );


    if (
      !saved
    ) {

      return;

    }


    setCurrent(
      index,
    );

  }


  /*
  ======================================================
  PREVIOUS
  ======================================================
  */

  async function previous() {

    if (
      current <= 0
    ) {

      return;

    }


    await changeQuestion(
      current - 1,
    );

  }


  /*
  ======================================================
  NEXT
  ======================================================
  */

  async function next() {

    if (
      current <
      questions.length - 1
    ) {

      await changeQuestion(
        current + 1,
      );

      return;

    }


    setConfirmSubmit(
      true,
    );

  }


  /*
  ======================================================
  FINAL SUBMIT
  ======================================================
  */

  async function submitAssessment() {

    if (
      !attempt?.id ||
      submitting
    ) {

      return;

    }


    try {

      setSubmitting(
        true,
      );


      setError("");


      /*
      -----------------------------------------------
      SAVE LAST QUESTION
      -----------------------------------------------
      */

      const saved =
        await saveAnswer(
          question,
          code,
        );


      if (
        !saved
      ) {

        setSubmitting(
          false,
        );

        return;

      }


      /*
      -----------------------------------------------
      SUBMIT ATTEMPT
      -----------------------------------------------
      */

      const response =
        await fetch(
          `${API_URL}/assessment-attempt/${attempt.id}/submit`,
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

          },
        );


      if (
        !response.ok
      ) {

        const text =
          await response.text();


        throw new Error(
          text ||
          "Unable to submit assessment.",
        );

      }


      /*
      Backend result is intentionally not
      calculated in this page.

      The result page gets the attempt ID
      and reads the calculated result
      from the backend.
      */

      router.push(
        `/assessments/${assessmentId}/result?mode=${encodeURIComponent(
          mode,
        )}&attemptId=${encodeURIComponent(
          attempt.id,
        )}`,
      );

    }
    catch (
      submitError: any
    ) {

      console.error(
        "FINAL SUBMIT ERROR:",
        submitError,
      );


      setError(
        submitError?.message ||
        "Unable to submit assessment.",
      );


      setSubmitting(
        false,
      );

    }

  }


  /*
  ======================================================
  EDITOR LANGUAGE
  ======================================================
  */

  const editorLanguage =
    useMemo(
      () =>
        normalizeLanguage(
          question?.language,
        ),
      [
        question?.language,
      ],
    );


  /*
  ======================================================
  LOADING UI
  ======================================================
  */

  if (
    loading
  ) {

    return (

      <main
        className="
          min-h-screen
          bg-[#e9eef5]
          flex
          items-center
          justify-center
          text-[#25324b]
        "
      >

        <div
          className="
            rounded-3xl
            bg-[#e9eef5]
            px-10
            py-8
            font-bold
            shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]
          "
        >

          Loading assessment...

        </div>

      </main>

    );

  }


  /*
  ======================================================
  ERROR / NO QUESTIONS
  ======================================================
  */

  if (
    error ||
    !question
  ) {

    return (

      <main
        className="
          min-h-screen
          bg-[#e9eef5]
          p-8
          text-[#25324b]
          flex
          items-center
          justify-center
        "
      >

        <div
          className="
            max-w-2xl
            w-full
            rounded-3xl
            bg-[#e9eef5]
            p-8
            shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]
          "
        >

          <h1
            className="
              text-2xl
              font-bold
            "
          >

            Test Environment

          </h1>


          <p
            className="
              mt-4
              text-red-600
              whitespace-pre-line
            "
          >

            {error ||
              "No questions available."}

          </p>


          <p
            className="
              mt-4
              text-sm
              text-gray-500
            "
          >

            Make sure the coding question is created
            and linked to this assessment.

          </p>


          <button
            type="button"

            onClick={() =>
              router.push(
                `/assessments/${assessmentId}/overview?mode=${encodeURIComponent(
                  mode,
                )}`,
              )
            }

            className="
              mt-6
              rounded-xl
              bg-[#24579a]
              px-6
              py-3
              font-bold
              text-white
            "
          >

            Back to Overview

          </button>

        </div>

      </main>

    );

  }


  /*
  ======================================================
  MAIN UI
  ======================================================
  */

  return (

    <main
      className="
        min-h-screen
        bg-[#e9eef5]
        p-5
        text-[#25324b]
      "
    >

      <div
        className="
          max-w-[1600px]
          mx-auto
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <header
          className="
            rounded-3xl
            bg-[#e9eef5]
            p-6
            mb-5
            shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]
          "
        >

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-5
            "
          >

            <div>

              <h1
                className="
                  text-2xl
                  font-bold
                "
              >

                {assessment?.title}

              </h1>


              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >

                {assessment?.code}

                {" • "}

                Question{" "}

                {current + 1}

                {" of "}

                {questions.length}

                {" • "}

                {question.marks}

                {" Marks"}

              </p>

            </div>


            <div
              className="
                flex
                flex-wrap
                gap-4
              "
            >

              <div
                className={`
                  rounded-2xl
                  px-5
                  py-3
                  font-bold
                  shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff]

                  ${
                    time <= 60
                      ? "text-red-600"
                      : "text-[#24579a]"
                  }
                `}
              >

                ⏱ {formatTime()}

              </div>


              <div
                className="
                  rounded-2xl
                  px-5
                  py-3
                  font-bold
                  shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff]
                "
              >

                {answeredCount}

                /

                {questions.length}

                {" "}Answered

              </div>


              <div
                className="
                  rounded-2xl
                  px-5
                  py-3
                  font-bold
                  shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff]
                "
              >

                Attempts Allowed: {
                  assessment?.maximumAttempts > 0
                    ? assessment.maximumAttempts
                    : "-"
                }

              </div>

            </div>

          </div>

        </header>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            className="
              mb-5
              rounded-2xl
              bg-red-50
              border
              border-red-200
              p-4
              text-red-700
            "
          >

            {error}

          </div>

        )}


        {/* =================================================
            QUESTION NAVIGATION
        ================================================= */}

        <div
          className="
            rounded-3xl
            bg-[#e9eef5]
            p-5
            mb-5
            shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
          "
        >

          <div
            className="
              flex
              flex-wrap
              gap-3
            "
          >

            {questions.map(
              (
                item,
                index,
              ) => {

                const answered =
                  Boolean(
                    answers[
                      item.id
                    ]?.trim(),
                  );


                return (

                  <button
                    key={
                      item.id
                    }

                    type="button"

                    onClick={() =>
                      changeQuestion(
                        index,
                      )
                    }

                    disabled={
                      saving ||
                      submitting
                    }

                    className={`
                      w-11
                      h-11
                      rounded-xl
                      font-bold

                      ${
                        index === current
                          ? "bg-[#24579a] text-white"
                          : answered
                          ? "bg-green-100 text-green-700"
                          : "bg-[#e9eef5] shadow-[4px_4px_8px_#c7ccd3,-4px_-4px_8px_#ffffff]"
                      }

                      disabled:opacity-50
                    `}
                  >

                    {index + 1}

                  </button>

                );

              },
            )}

          </div>

        </div>


        {/* =================================================
            WORKSPACE
        ================================================= */}

        <div
          className="
            grid
            grid-cols-12
            gap-5
          "
        >

          {/* =================================================
              QUESTION
          ================================================= */}

          <aside
            className="
              col-span-12
              lg:col-span-4
            "
          >

            <div
              className="
                rounded-3xl
                bg-[#e9eef5]
                p-6
                shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
                lg:sticky
                lg:top-5
              "
            >

              <div
                className="
                  flex
                  justify-between
                  gap-4
                "
              >

                <div>

                  <span
                    className="
                      text-xs
                      font-bold
                      text-blue-700
                    "
                  >

                    QUESTION{" "}
                    {current + 1}

                  </span>


                  <h2
                    className="
                      mt-2
                      text-xl
                      font-bold
                    "
                  >

                    {question.title}

                  </h2>

                </div>


                <span
                  className="
                    text-sm
                    font-bold
                  "
                >

                  {question.marks}

                  {" "}Marks

                </span>

              </div>


              <InfoBlock
                title="Problem Statement"
                value={
                  question.problemStatement
                }
              />


              <InfoBlock
                title="Input Format"
                value={
                  question.inputFormat
                }
              />


              <InfoBlock
                title="Output Format"
                value={
                  question.outputFormat
                }
              />


              <InfoBlock
                title="Constraints"
                value={
                  question.constraints
                }
              />


              {/* EXAMPLE */}

              {(
                question.exampleInput ||
                question.exampleOutput
              ) && (

                <div
                  className="
                    mt-6
                  "
                >

                  <h3
                    className="
                      font-bold
                    "
                  >

                    Example

                  </h3>


                  <div
                    className="
                      grid
                      gap-3
                      mt-3
                    "
                  >

                    <div
                      className="
                        rounded-xl
                        p-3
                        shadow-inner
                      "
                    >

                      <span
                        className="
                          text-xs
                          font-bold
                          text-gray-500
                        "
                      >

                        Input

                      </span>


                      <pre
                        className="
                          mt-2
                          whitespace-pre-wrap
                          text-sm
                        "
                      >

                        {question.exampleInput ||
                          question.testCases?.[0]?.input ||
                          question.testCases?.[0]?.inputData ||
                          ""}

                      </pre>

                    </div>


                    <div
                      className="
                        rounded-xl
                        p-3
                        shadow-inner
                      "
                    >

                      <span
                        className="
                          text-xs
                          font-bold
                          text-gray-500
                        "
                      >

                        Output

                      </span>


                      <pre
                        className="
                          mt-2
                          whitespace-pre-wrap
                          text-sm
                        "
                      >

                        {question.exampleOutput ||
                          question.testCases?.[0]?.expectedOutput ||
                          ""}

                      </pre>

                    </div>

                  </div>

                </div>

              )}


              {/* QUESTION CONFIGURATION */}

              <div
                className="
                  mt-6
                  grid
                  grid-cols-2
                  gap-3
                  text-xs
                "
              >

                <Mini
                  label="Language"
                  value={
                    question.language.toUpperCase()
                  }
                />


                <Mini
                  label="Compiler"
                  value={
                    question.compiler ||
                    "-"
                  }
                />


                <Mini
                  label="Time Limit"
                  value={
                    question.timeLimitSeconds
                      ? `${question.timeLimitSeconds}s`
                      : "-"
                  }
                />


                <Mini
                  label="Memory"
                  value={
                    question.memoryLimitMb
                      ? `${question.memoryLimitMb} MB`
                      : "-"
                  }
                />

              </div>


              {/* TEST CASE COUNT */}

              <div
                className="
                  mt-5
                  rounded-xl
                  p-4
                  shadow-inner
                  text-sm
                "
              >

                <div
                  className="
                    flex
                    justify-between
                  "
                >

                  <span>
                    Configured Test Cases
                  </span>


                  <strong>
                    {
                      question.testCases.length
                    }
                  </strong>

                </div>

              </div>

            </div>

          </aside>


          {/* =================================================
              EDITOR
          ================================================= */}

          <section
            className="
              col-span-12
              lg:col-span-8
            "
          >

            <div
              className="
                rounded-3xl
                overflow-hidden
                shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
              "
            >

              <div
                className="
                  bg-[#1e1e1e]
                  px-4
                  py-3
                  flex
                  justify-between
                  text-white
                "
              >

                <span
                  className="
                    font-bold
                  "
                >

                  Code Editor

                </span>


                <span
                  className="
                    text-sm
                    text-gray-300
                  "
                >

                  {question.language.toUpperCase()}

                  {" • "}

                  {question.compiler ||
                    "Compiler"}

                </span>

              </div>


              <Editor

                height="520px"

                language={
                  editorLanguage
                }

                theme="vs-dark"

                value={
                  code
                }

                onChange={
                  value =>
                    updateCode(
                      value ??
                      "",
                    )
                }

                options={{
                  minimap: {
                    enabled:
                      false,
                  },

                  fontSize:
                    15,

                  lineNumbers:
                    "on",

                  automaticLayout:
                    true,

                  scrollBeyondLastLine:
                    false,

                  tabSize:
                    4,

                  wordWrap:
                    "on",

                  readOnly:
                    submitting,

                }}

              />

            </div>


            {/* =================================================
                INPUT
            ================================================= */}

            <div
              className="
                mt-5
                rounded-3xl
                bg-[#e9eef5]
                p-5
                shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
              "
            >

              <label
                className="
                  block
                  text-sm
                  font-bold
                  mb-2
                "
              >

                Custom Input

              </label>


              <textarea

                value={
                  input
                }

                onChange={
                  event =>
                    setInput(
                      event.target.value,
                    )
                }

                disabled={
                  running ||
                  submitting
                }

                className="
                  w-full
                  min-h-[110px]
                  rounded-2xl
                  p-4
                  bg-[#e9eef5]
                  outline-none
                  font-mono
                  shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff]
                "

                placeholder="
                  Enter program input...
                "

              />


              <div
                className="
                  flex
                  flex-wrap
                  gap-3
                  mt-4
                "
              >

                <button
                  type="button"

                  onClick={
                    runCode
                  }

                  disabled={
                    running ||
                    submitting
                  }

                  className="
                    rounded-xl
                    bg-green-600
                    px-6
                    py-3
                    text-white
                    font-bold
                    disabled:opacity-50
                  "
                >

                  {
                    running
                      ? "Running..."
                      : "▶ Run Code"
                  }

                </button>


                <button
                  type="button"

                  onClick={
                    runTestCases
                  }

                  disabled={
                    running ||
                    submitting
                  }

                  className="
                    rounded-xl
                    bg-[#24579a]
                    px-6
                    py-3
                    text-white
                    font-bold
                    disabled:opacity-50
                  "
                >

                  ✓ Run Test Cases

                </button>


                <button
                  type="button"

                  onClick={
                    resetCode
                  }

                  disabled={
                    running ||
                    submitting
                  }

                  className="
                    rounded-xl
                    px-6
                    py-3
                    font-bold
                    shadow-[5px_5px_10px_#c7ccd3,-5px_-5px_10px_#ffffff]
                    disabled:opacity-50
                  "
                >

                  ↻ Reset

                </button>

              </div>

            </div>


            {/* =================================================
                OUTPUT
            ================================================= */}

            <div
              className="
                mt-5
                rounded-3xl
                bg-[#e9eef5]
                p-5
                shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
              "
            >

              <div
                className="
                  flex
                  justify-between
                  items-center
                "
              >

                <h3
                  className="
                    font-bold
                  "
                >

                  Output Console

                </h3>


                {status && (

                  <span
                    className="
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-bold
                      shadow-inner
                    "
                  >

                    {status}

                  </span>

                )}

              </div>


              <pre
                className="
                  mt-4
                  min-h-[150px]
                  rounded-2xl
                  bg-black
                  text-green-400
                  p-5
                  whitespace-pre-wrap
                  overflow-auto
                  font-mono
                  text-sm
                "
              >

                {
                  output ||
                  "Run your program to see output here."
                }

              </pre>


              {executionTime !==
                null && (

                <p
                  className="
                    mt-3
                    text-sm
                    text-gray-500
                  "
                >

                  Execution time:{" "}

                  {executionTime}

                  {" "}ms

                </p>

              )}

            </div>


            {/* =================================================
                NAVIGATION
            ================================================= */}

            <div
              className="
                mt-5
                flex
                justify-between
                gap-4
              "
            >

              <button
                type="button"

                onClick={
                  previous
                }

                disabled={
                  current === 0 ||
                  saving ||
                  submitting
                }

                className="
                  rounded-xl
                  px-6
                  py-3
                  font-bold
                  shadow-[5px_5px_10px_#c7ccd3,-5px_-5px_10px_#ffffff]
                  disabled:opacity-40
                "
              >

                ← Previous

              </button>


              {current <
              questions.length - 1 ? (

                <button
                  type="button"

                  onClick={
                    next
                  }

                  disabled={
                    saving ||
                    submitting
                  }

                  className="
                    rounded-xl
                    bg-[#24579a]
                    px-7
                    py-3
                    text-white
                    font-bold
                    disabled:opacity-50
                  "
                >

                  Save & Next →

                </button>

              ) : (

                <button
                  type="button"

                  onClick={() =>
                    setConfirmSubmit(
                      true,
                    )
                  }

                  disabled={
                    saving ||
                    submitting
                  }

                  className="
                    rounded-xl
                    bg-green-600
                    px-7
                    py-3
                    text-white
                    font-bold
                    disabled:opacity-50
                  "
                >

                  Final Submit

                </button>

              )}

            </div>

          </section>

        </div>


        {/* =================================================
            SUBMISSION MODAL
        ================================================= */}

        {confirmSubmit && (

          <div
            className="
              fixed
              inset-0
              z-50
              bg-black/40
              flex
              items-center
              justify-center
              p-5
            "
          >

            <div
              className="
                w-full
                max-w-lg
                rounded-3xl
                bg-[#e9eef5]
                p-7
                shadow-[12px_12px_24px_#c7ccd3,-12px_-12px_24px_#ffffff]
              "
            >

              <h2
                className="
                  text-2xl
                  font-bold
                "
              >

                Final Submission

              </h2>


              <p
                className="
                  mt-3
                  text-gray-600
                "
              >

                You have reached the end of the
                assessment. Please review your answers
                before submitting.

              </p>


              <div
                className="
                  mt-5
                  rounded-2xl
                  p-4
                  shadow-inner
                "
              >

                <div
                  className="
                    flex
                    justify-between
                  "
                >

                  <span>
                    Questions
                  </span>


                  <strong>
                    {questions.length}
                  </strong>

                </div>


                <div
                  className="
                    flex
                    justify-between
                    mt-2
                  "
                >

                  <span>
                    Answered
                  </span>


                  <strong>
                    {answeredCount}
                  </strong>

                </div>


                <div
                  className="
                    flex
                    justify-between
                    mt-2
                  "
                >

                  <span>
                    Time Remaining
                  </span>


                  <strong>
                    {formatTime()}
                  </strong>

                </div>

              </div>


              <div
                className="
                  flex
                  justify-end
                  gap-3
                  mt-6
                "
              >

                <button
                  type="button"

                  onClick={() =>
                    setConfirmSubmit(
                      false,
                    )
                  }

                  disabled={
                    submitting
                  }

                  className="
                    rounded-xl
                    px-5
                    py-3
                    font-bold
                  "
                >

                  Review

                </button>


                <button
                  type="button"

                  onClick={
                    submitAssessment
                  }

                  disabled={
                    submitting
                  }

                  className="
                    rounded-xl
                    bg-green-600
                    px-6
                    py-3
                    text-white
                    font-bold
                    disabled:opacity-50
                  "
                >

                  {
                    submitting
                      ? "Submitting..."
                      : "Confirm Submit"
                  }

                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>

  );

}


/*
========================================================
INFO BLOCK
========================================================
*/

function InfoBlock(
  {
    title,
    value,
  }: {
    title: string;
    value: string;
  },
) {

  return (

    <section
      className="
        mt-6
      "
    >

      <h3
        className="
          font-bold
        "
      >

        {title}

      </h3>


      <p
        className="
          mt-2
          whitespace-pre-line
          text-gray-600
          leading-7
        "
      >

        {value ||
          "Not specified."}

      </p>

    </section>

  );

}


/*
========================================================
MINI
========================================================
*/

function Mini(
  {
    label,
    value,
  }: {
    label: string;
    value: string;
  },
) {

  return (

    <div
      className="
        rounded-xl
        p-3
        shadow-inner
      "
    >

      <span
        className="
          text-gray-500
        "
      >

        {label}

      </span>


      <strong
        className="
          block
          mt-1
        "
      >

        {value}

      </strong>

    </div>

  );

}