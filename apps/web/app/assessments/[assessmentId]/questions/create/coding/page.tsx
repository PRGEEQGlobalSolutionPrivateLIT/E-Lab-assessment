"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { API_URL } from "@/lib/api/fetcher";
import "./coding-question.css";

/* ============================================================
   TYPES
   ============================================================ */

type TestCaseType =
  | "SAMPLE"
  | "PUBLIC"
  | "HIDDEN";

interface TestCase {
  id: string;
  name: string;
  type: TestCaseType;
  input: string;
  expectedOutput: string;
  marks: number;
  active: boolean;
}

interface CodingQuestionForm {
  title: string;
  code: string;
  difficulty: string;
  marks: number;

  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  exampleInput: string;
  exampleOutput: string;

  language: string;
  starterCode: string;
  referenceSolution: string;

  bloomsLevel: string;
  skill: string;
  subskill: string;

  compiler: string;
  languageStandard: string;
  timeLimitSeconds: number;
  memoryLimitMb: number;

  aiPolicy: string;
}

interface AssessmentQuestion {
  id: string;
  questionId: string;
  assessmentId: string;
  sectionId: string | null;
  sequence: number;

  title: string;
  type: "CODING";
  technology: string;
  difficulty: string;
  marks: number;
  source: "NEW";
}

interface StoredQuestion {
  id: string;
  assessmentId: string;
  sectionId: string | null;
  type: "CODING";
  status: "DRAFT";
  form: CodingQuestionForm;
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
}

/* ============================================================
   DEFAULTS
   ============================================================ */

const DEFAULT_STARTER_CODE = `#include <stdio.h>

int main() {

    // Write your code here

    return 0;
}
`;

const DEFAULT_FORM: CodingQuestionForm = {
  title: "",
  code: "",
  difficulty: "BEGINNER",
  marks: 10,

  problemStatement: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  exampleInput: "",
  exampleOutput: "",

  language: "C",
  starterCode: DEFAULT_STARTER_CODE,
  referenceSolution: "",

  bloomsLevel: "APPLY",
  skill: "",
  subskill: "",

  compiler: "GCC",
  languageStandard: "C17",
  timeLimitSeconds: 2,
  memoryLimitMb: 256,

  aiPolicy: "DISABLED",
};

/* ============================================================
   PAGE
   ============================================================ */

export default function CodingQuestionPage() {
  const router = useRouter();

  const params = useParams();

  const searchParams =
    useSearchParams();

  const assessmentId =
    params.assessmentId as string;

  const sectionId =
    searchParams.get("sectionId") || null;

  const mode =
    searchParams.get("mode") || "create";

  const editingQuestionId =
    searchParams.get("questionId");

  const [form, setForm] =
    useState<CodingQuestionForm>(
      DEFAULT_FORM,
    );

  const [testCases, setTestCases] =
    useState<TestCase[]>([
      {
        id:
          crypto.randomUUID(),

        name:
          "Sample Test",

        type:
          "SAMPLE",

        input: "",

        expectedOutput: "",

        marks: 10,

        active: true,
      },
    ]);

  const [errors, setErrors] =
    useState<string[]>([]);

  const [advancedOpen, setAdvancedOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  /* ============================================================
     EDIT MODE LOAD
     
     IMPORTANT:
     Load the actual question from the backend.
     Do not depend on sessionStorage.
     ============================================================ */

  useEffect(() => {
    if (
      mode !== "edit" ||
      !editingQuestionId
    ) {
      return;
    }

    async function loadQuestion() {
      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_URL}/questions/${editingQuestionId}`,
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load question.",
          );
        }

        const data =
          await response.json();

        console.log(
          "Loaded coding question:",
          data,
        );

        /*
         * Support both:
         *
         * {
         *   form: {...},
         *   testCases: [...]
         * }
         *
         * and a response where the fields
         * are returned directly.
         */

        const loadedForm =
          data.form ?? data;

        setForm({
          ...DEFAULT_FORM,
          ...loadedForm,
        });

        if (
          Array.isArray(
            data.testCases,
          )
        ) {
          setTestCases(
            data.testCases,
          );
        }

        if (
          data.sectionId &&
          !sectionId
        ) {
          console.log(
            "Question section:",
            data.sectionId,
          );
        }
      } catch (error) {
        console.error(
          "Unable to load coding question:",
          error,
        );

        setErrors([
          "Unable to load the coding question.",
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadQuestion();
  }, [
    mode,
    editingQuestionId,
    sectionId,
  ]);

  /* ============================================================
     CALCULATIONS
     ============================================================ */

  const testCaseMarks =
    useMemo(
      () =>
        testCases.reduce(
          (
            total,
            test,
          ) =>
            total +
            Number(
              test.marks || 0,
            ),
          0,
        ),
      [testCases],
    );

  const activeTestCount =
    testCases.filter(
      (test) =>
        test.active,
    ).length;

  /* ============================================================
     FIELD UPDATE
     ============================================================ */

  function updateField<
    K extends keyof CodingQuestionForm,
  >(
    field: K,
    value: CodingQuestionForm[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    setErrors([]);
  }

  /* ============================================================
     TEST CASE ACTIONS
     ============================================================ */

  function addTestCase() {
    setTestCases(
      (current) => [
        ...current,

        {
          id:
            crypto.randomUUID(),

          name:
            `Test ${current.length + 1}`,

          type:
            "HIDDEN",

          input: "",

          expectedOutput: "",

          marks: 0,

          active: true,
        },
      ],
    );
  }

  function updateTestCase<
    K extends keyof TestCase,
  >(
    id: string,
    field: K,
    value: TestCase[K],
  ) {
    setTestCases(
      (current) =>
        current.map(
          (test) =>
            test.id === id
              ? {
                  ...test,
                  [field]:
                    value,
                }
              : test,
        ),
    );

    setErrors([]);
  }

  function removeTestCase(
    id: string,
  ) {
    setTestCases(
      (current) =>
        current.filter(
          (test) =>
            test.id !== id,
        ),
    );

    setErrors([]);
  }

  function duplicateTestCase(
    id: string,
  ) {
    const original =
      testCases.find(
        (test) =>
          test.id === id,
      );

    if (!original) {
      return;
    }

    setTestCases(
      (current) => [
        ...current,

        {
          ...original,

          id:
            crypto.randomUUID(),

          name:
            `${original.name} Copy`,
        },
      ],
    );

    setErrors([]);
  }

  /* ============================================================
     VALIDATION
     ============================================================ */

  function validateQuestion() {
    const validationErrors:
      string[] = [];

    if (
      !form.title.trim()
    ) {
      validationErrors.push(
        "Question title is required.",
      );
    }

    if (
      !form.problemStatement.trim()
    ) {
      validationErrors.push(
        "Problem statement is required.",
      );
    }

    if (
      !form.inputFormat.trim()
    ) {
      validationErrors.push(
        "Input format is required.",
      );
    }

    if (
      !form.outputFormat.trim()
    ) {
      validationErrors.push(
        "Output format is required.",
      );
    }

    if (
      form.marks <= 0
    ) {
      validationErrors.push(
        "Question marks must be greater than zero.",
      );
    }

    if (
      testCases.length === 0
    ) {
      validationErrors.push(
        "At least one test case is required.",
      );
    }

    testCases.forEach(
      (
        test,
        index,
      ) => {
        if (
          !test.expectedOutput.trim()
        ) {
          validationErrors.push(
            `Test ${
              index + 1
            }: Expected output is required.`,
          );
        }

        if (
          Number(test.marks) <
          0
        ) {
          validationErrors.push(
            `Test ${
              index + 1
            }: Marks cannot be negative.`,
          );
        }
      },
    );

    if (
      testCaseMarks !==
      form.marks
    ) {
      validationErrors.push(
        `Test case marks total ${testCaseMarks}. Question marks are ${form.marks}. Both must match.`,
      );
    }

    setErrors(
      validationErrors,
    );

    return (
      validationErrors.length ===
      0
    );
  }

  /* ============================================================
     BUILD PAYLOAD
     ============================================================ */

  function buildPayload() {
    return {
      assessmentId,

      sectionId,

      /*
       * Keep these values for now because they are part of
       * your current backend contract.
       *
       * Replace them later with authenticated user/context.
       */
      organizationId:
        "DEFAULT_ORGANIZATION",

      createdByUserId:
        "DEFAULT_USER",

      form: {
        title:
          form.title,

        code:
          form.code,

        difficulty:
          form.difficulty,

        marks:
          form.marks,

        problemStatement:
          form.problemStatement,

        inputFormat:
          form.inputFormat,

        outputFormat:
          form.outputFormat,

        constraints:
          form.constraints,

        exampleInput:
          form.exampleInput,

        exampleOutput:
          form.exampleOutput,

        language:
          form.language,

        starterCode:
          form.starterCode,

        referenceSolution:
          form.referenceSolution,

        bloomsLevel:
          form.bloomsLevel,

        skill:
          form.skill,

        subskill:
          form.subskill,

        compiler:
          form.compiler,

        languageStandard:
          form.languageStandard,

        timeLimitSeconds:
          form.timeLimitSeconds,

        memoryLimitMb:
          form.memoryLimitMb,

        aiPolicy:
          form.aiPolicy,
      },

      testCases:
        testCases.map(
          (
            test,
            index,
          ) => ({
            id:
              test.id,

            name:
              test.name,

            type:
              test.type,

            input:
              test.input,

            expectedOutput:
              test.expectedOutput,

            marks:
              Number(
                test.marks,
              ),

            sequence:
              index + 1,

            active:
              test.active,
          }),
        ),
    };
  }

  /* ============================================================
     PARSE BACKEND ERROR
     ============================================================ */

  async function getBackendError(
    response: Response,
  ) {
    const errorText =
      await response.text();

    console.error(
      "Question API Error:",
      errorText,
    );

    let backendMessage =
      "Question operation failed.";

    if (
      errorText.trim()
    ) {
      try {
        const parsed =
          JSON.parse(
            errorText,
          );

        if (
          Array.isArray(
            parsed?.message,
          )
        ) {
          backendMessage =
            parsed.message.join(
              "; ",
            );
        } else if (
          parsed?.message
        ) {
          backendMessage =
            parsed.message;
        } else if (
          parsed?.error
        ) {
          backendMessage =
            parsed.error;
        }
      } catch {
        backendMessage =
          errorText;
      }
    }

    return backendMessage;
  }

  /* ============================================================
     SAVE / UPDATE QUESTION
     ============================================================ */

  async function saveQuestion() {
    if (
      !validateQuestion()
    ) {
      return;
    }

    const payload =
      buildPayload();

    try {
      setLoading(true);

      /*
       * CREATE
       */

      if (
        mode !== "edit" ||
        !editingQuestionId
      ) {
        const response =
          await fetch(
            `${API_URL}/questions/coding`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload,
                ),
            },
          );

        if (!response.ok) {
          const message =
            await getBackendError(
              response,
            );

          throw new Error(
            message,
          );
        }

        const result =
          await response.json();

        console.log(
          "Coding Question Created:",
          result,
        );

        router.push(
          `/assessments/${assessmentId}/questions`,
        );

        return;
      }

      /*
       * UPDATE
       *
       * If your NestJS controller uses PATCH instead
       * of PUT, change only the method below.
       */

      const response =
        await fetch(
          `${API_URL}/questions/coding/${editingQuestionId}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      if (!response.ok) {
        const message =
          await getBackendError(
            response,
          );

        throw new Error(
          message,
        );
      }

      const result =
        await response.json();

      console.log(
        "Coding Question Updated:",
        result,
      );

      router.push(
        `/assessments/${assessmentId}/questions`,
      );
    } catch (error) {
      console.error(
        "SAVE QUESTION ERROR:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to connect to the assessment API.";

      if (
        message ===
        "Failed to fetch"
      ) {
        alert(
          `Unable to connect to the API server at ${API_URL}.\n\n` +
            "Make sure the NestJS API is running and CORS is enabled.",
        );
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <main className="coding-question-page">
      <div className="coding-question-container">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="coding-header">
          <div>
            <button
              type="button"
              className="back-link"
              onClick={() =>
                router.push(
                  `/assessments/${assessmentId}/questions`,
                )
              }
            >
              ← Questions
            </button>

            <span className="step-label">
              STEP 2 OF 6 • QUESTIONS
            </span>

            <h1>
              {mode ===
              "edit"
                ? "Edit Coding Question"
                : "Create Coding Question"}
            </h1>

            <p>
              Define the problem,
              code configuration
              and test cases.
            </p>
          </div>

          <span className="question-status">
            {mode ===
            "edit"
              ? "EDITING"
              : "DRAFT"}
          </span>
        </header>

        {/* ======================================================
            1. QUESTION
        ====================================================== */}

        <section className="authoring-card">
          <div className="section-heading">
            <span className="section-number">
              1
            </span>

            <div>
              <h2>
                Question
              </h2>

              <p>
                Core question
                details and
                problem statement.
              </p>
            </div>
          </div>

          <div className="form-grid two-columns">

            <label className="form-field full-width">
              <span>
                Question Title *
              </span>

              <input
                type="text"
                value={
                  form.title
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "title",
                    event.target
                      .value,
                  )
                }
                placeholder="Example: Find Maximum in an Array"
              />
            </label>

            <label className="form-field">
              <span>
                Question Code
              </span>

              <input
                type="text"
                value={
                  form.code
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "code",
                    event.target
                      .value,
                  )
                }
                placeholder="Auto or manual"
              />
            </label>

            <label className="form-field">
              <span>
                Difficulty
              </span>

              <select
                value={
                  form.difficulty
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "difficulty",
                    event.target
                      .value,
                  )
                }
              >
                <option value="BEGINNER">
                  Beginner
                </option>

                <option value="INTERMEDIATE">
                  Intermediate
                </option>

                <option value="ADVANCED">
                  Advanced
                </option>
              </select>
            </label>

            <label className="form-field">
              <span>
                Marks *
              </span>

              <input
                type="number"
                min={1}
                value={
                  form.marks
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "marks",
                    Math.max(
                      1,
                      Number(
                        event.target
                          .value,
                      ),
                    ),
                  )
                }
              />
            </label>

            <label className="form-field full-width">
              <span>
                Problem Statement *
              </span>

              <textarea
                rows={6}
                value={
                  form.problemStatement
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "problemStatement",
                    event.target
                      .value,
                  )
                }
                placeholder="Describe the programming problem clearly."
              />
            </label>

          </div>
        </section>

        {/* ======================================================
            2. INPUT / OUTPUT
        ====================================================== */}

        <section className="authoring-card">
          <div className="section-heading">
            <span className="section-number">
              2
            </span>

            <div>
              <h2>
                Input / Output
              </h2>

              <p>
                Define how the
                learner should
                read input and
                produce output.
              </p>
            </div>
          </div>

          <div className="form-grid two-columns">

            <label className="form-field">
              <span>
                Input Format *
              </span>

              <textarea
                rows={4}
                value={
                  form.inputFormat
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "inputFormat",
                    event.target
                      .value,
                  )
                }
                placeholder="Example: First line contains integer N..."
              />
            </label>

            <label className="form-field">
              <span>
                Output Format *
              </span>

              <textarea
                rows={4}
                value={
                  form.outputFormat
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "outputFormat",
                    event.target
                      .value,
                  )
                }
                placeholder="Example: Print the maximum value."
              />
            </label>

            <label className="form-field full-width">
              <span>
                Constraints
              </span>

              <textarea
                rows={3}
                value={
                  form.constraints
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "constraints",
                    event.target
                      .value,
                  )
                }
                placeholder="Example: 1 ≤ N ≤ 1000"
              />
            </label>

            <label className="form-field">
              <span>
                Example Input
              </span>

              <textarea
                rows={4}
                className="mono-field"
                value={
                  form.exampleInput
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "exampleInput",
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <label className="form-field">
              <span>
                Example Output
              </span>

              <textarea
                rows={4}
                className="mono-field"
                value={
                  form.exampleOutput
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "exampleOutput",
                    event.target
                      .value,
                  )
                }
              />
            </label>

          </div>
        </section>

        {/* ======================================================
            3. CODE & TEST CASES
        ====================================================== */}

        <section className="authoring-card">
          <div className="section-heading">
            <span className="section-number">
              3
            </span>

            <div>
              <h2>
                Code & Test Cases
              </h2>

              <p>
                Configure language,
                starter code and
                automated
                validation.
              </p>
            </div>
          </div>

          <div className="form-grid two-columns compact-grid">

            <label className="form-field">
              <span>
                Language
              </span>

              <select
                value={
                  form.language
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "language",
                    event.target
                      .value,
                  )
                }
              >
                <option value="C">
                  C
                </option>

                <option value="C++">
                  C++
                </option>

                <option value="Java">
                  Java
                </option>

                <option value="Python">
                  Python
                </option>

                <option value="JavaScript">
                  JavaScript
                </option>

                <option value="C#">
                  C#
                </option>

                <option value="Go">
                  Go
                </option>
              </select>
            </label>

            <label className="form-field">
              <span>
                Compiler
              </span>

              <input
                value={
                  form.compiler
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "compiler",
                    event.target
                      .value,
                  )
                }
              />
            </label>

          </div>

          <div className="code-grid">

            <label className="form-field">
              <span>
                Starter Code
              </span>

              <textarea
                rows={12}
                className="code-textarea"
                value={
                  form.starterCode
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "starterCode",
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <label className="form-field">
              <span>
                Reference Solution
              </span>

              <textarea
                rows={12}
                className="code-textarea"
                value={
                  form.referenceSolution
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "referenceSolution",
                    event.target
                      .value,
                  )
                }
                placeholder="Add the verified reference solution."
              />
            </label>

          </div>

          {/* TEST SUMMARY */}

          <div className="test-case-section-header">
            <div>
              <h3>
                Test Cases
              </h3>

              <p>
                {activeTestCount}{" "}
                active •{" "}
                {testCaseMarks} /{" "}
                {form.marks} marks
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={
                addTestCase
              }
            >
              + Add Test Case
            </button>
          </div>

          <div className="test-case-list">

            {testCases.map(
              (
                test,
                index,
              ) => (

                <div
                  key={
                    test.id
                  }
                  className="test-case-card"
                >

                  <div className="test-card-header">

                    <div>
                      <span className="test-number">
                        TC
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <input
                        className="test-name-input"
                        value={
                          test.name
                        }
                        onChange={(
                          event,
                        ) =>
                          updateTestCase(
                            test.id,
                            "name",
                            event.target
                              .value,
                          )
                        }
                      />
                    </div>

                    <div className="test-actions">

                      <button
                        type="button"
                        onClick={() =>
                          duplicateTestCase(
                            test.id,
                          )
                        }
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        disabled={
                          testCases.length ===
                          1
                        }
                        onClick={() =>
                          removeTestCase(
                            test.id,
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>
                  </div>

                  <div className="form-grid test-grid">

                    <label className="form-field">
                      <span>
                        Type
                      </span>

                      <select
                        value={
                          test.type
                        }
                        onChange={(
                          event,
                        ) =>
                          updateTestCase(
                            test.id,
                            "type",
                            event.target
                              .value as TestCaseType,
                          )
                        }
                      >
                        <option value="SAMPLE">
                          Sample
                        </option>

                        <option value="PUBLIC">
                          Public
                        </option>

                        <option value="HIDDEN">
                          Hidden
                        </option>
                      </select>
                    </label>

                    <label className="form-field">
                      <span>
                        Marks
                      </span>

                      <input
                        type="number"
                        min={0}
                        value={
                          test.marks
                        }
                        onChange={(
                          event,
                        ) =>
                          updateTestCase(
                            test.id,
                            "marks",
                            Math.max(
                              0,
                              Number(
                                event.target
                                  .value,
                              ),
                            ),
                          )
                        }
                      />
                    </label>

                    <label className="form-field toggle-field">
                      <span>
                        Active
                      </span>

                      <input
                        type="checkbox"
                        checked={
                          test.active
                        }
                        onChange={(
                          event,
                        ) =>
                          updateTestCase(
                            test.id,
                            "active",
                            event.target
                              .checked,
                          )
                        }
                      />
                    </label>

                    <label className="form-field full-width">
                      <span>
                        Input
                      </span>

                      <textarea
                        rows={4}
                        className="mono-field"
                        value={
                          test.input
                        }
                        onChange={(
                          event,
                        ) =>
                          updateTestCase(
                            test.id,
                            "input",
                            event.target
                              .value,
                          )
                        }
                      />
                    </label>

                    <label className="form-field full-width">
                      <span>
                        Expected Output *
                      </span>

                      <textarea
                        rows={4}
                        className="mono-field"
                        value={
                          test.expectedOutput
                        }
                        onChange={(
                          event,
                        ) =>
                          updateTestCase(
                            test.id,
                            "expectedOutput",
                            event.target
                              .value,
                          )
                        }
                      />
                    </label>

                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        {/* ======================================================
            4. ADVANCED SETTINGS
        ====================================================== */}

        <section className="authoring-card advanced-card">

          <button
            type="button"
            className="advanced-toggle"
            onClick={() =>
              setAdvancedOpen(
                (current) =>
                  !current,
              )
            }
          >
            <div>
              <span className="section-number">
                4
              </span>

              <div>
                <strong>
                  Advanced Settings
                </strong>

                <small>
                  Skills, Bloom's level,
                  runtime limits and
                  AI policy
                </small>
              </div>
            </div>

            <span>
              {advancedOpen
                ? "−"
                : "+"}
            </span>
          </button>

          {advancedOpen && (
            <div className="advanced-content">

              <div className="form-grid two-columns">

                <label className="form-field">
                  <span>
                    Bloom's Level
                  </span>

                  <select
                    value={
                      form.bloomsLevel
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "bloomsLevel",
                        event.target
                          .value,
                      )
                    }
                  >
                    <option value="REMEMBER">
                      Remember
                    </option>

                    <option value="UNDERSTAND">
                      Understand
                    </option>

                    <option value="APPLY">
                      Apply
                    </option>

                    <option value="ANALYZE">
                      Analyze
                    </option>

                    <option value="EVALUATE">
                      Evaluate
                    </option>

                    <option value="CREATE">
                      Create
                    </option>
                  </select>
                </label>

                <label className="form-field">
                  <span>
                    Primary Skill
                  </span>

                  <input
                    value={
                      form.skill
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "skill",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Example: C Programming"
                  />
                </label>

                <label className="form-field">
                  <span>
                    Subskill
                  </span>

                  <input
                    value={
                      form.subskill
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "subskill",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Example: Arrays"
                  />
                </label>

                <label className="form-field">
                  <span>
                    C Standard
                  </span>

                  <select
                    value={
                      form.languageStandard
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "languageStandard",
                        event.target
                          .value,
                      )
                    }
                  >
                    <option value="C17">
                      C17
                    </option>

                    <option value="C11">
                      C11
                    </option>

                    <option value="C99">
                      C99
                    </option>

                    <option value="C23">
                      C23
                    </option>
                  </select>
                </label>

                <label className="form-field">
                  <span>
                    Time Limit
                  </span>

                  <div className="inline-unit-field">
                    <input
                      type="number"
                      min={1}
                      value={
                        form.timeLimitSeconds
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "timeLimitSeconds",
                          Math.max(
                            1,
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                      }
                    />

                    <span>
                      sec
                    </span>
                  </div>
                </label>

                <label className="form-field">
                  <span>
                    Memory Limit
                  </span>

                  <div className="inline-unit-field">
                    <input
                      type="number"
                      min={64}
                      value={
                        form.memoryLimitMb
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "memoryLimitMb",
                          Math.max(
                            64,
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                      }
                    />

                    <span>
                      MB
                    </span>
                  </div>
                </label>

                <label className="form-field">
                  <span>
                    AI Assistance
                  </span>

                  <select
                    value={
                      form.aiPolicy
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "aiPolicy",
                        event.target
                          .value,
                      )
                    }
                  >
                    <option value="DISABLED">
                      Disabled
                    </option>

                    <option value="HINTS_ONLY">
                      Hints Only
                    </option>

                    <option value="DEBUG_ASSISTANCE">
                      Debug Support
                    </option>

                    <option value="FULL">
                      Full Assistance
                    </option>
                  </select>
                </label>

              </div>
            </div>
          )}
        </section>

        {/* ======================================================
            ERRORS
        ====================================================== */}

        {errors.length >
          0 && (
          <div className="error-panel">

            <strong>
              Please correct the
              following:
            </strong>

            <ul>
              {errors.map(
                (
                  error,
                  index,
                ) => (
                  <li
                    key={`${error}-${index}`}
                  >
                    {error}
                  </li>
                ),
              )}
            </ul>

          </div>
        )}

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="coding-footer">

          <button
            type="button"
            className="secondary-button"
            disabled={
              loading
            }
            onClick={() =>
              router.push(
                `/assessments/${assessmentId}/questions`,
              )
            }
          >
            Cancel
          </button>

          <div className="footer-actions">

            <button
              type="button"
              className="primary-button"
              disabled={
                loading
              }
              onClick={
                saveQuestion
              }
            >
              {loading
                ? "Saving..."
                : mode ===
                    "edit"
                  ? "Update Question"
                  : "Save Question"}
            </button>

          </div>

        </footer>

      </div>
    </main>
  );
}
