"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { API_URL } from "@/src/lib/api/fetcher";

import "./create-question.css";

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

  language: string;

  difficulty: string;

  marks: number;

  estimatedTime: number;

  bloomsLevel: string;

  problemStatement: string;

  objective: string;

  inputFormat: string;

  outputFormat: string;

  constraints: string;

  exampleInput: string;

  exampleOutput: string;

  explanation: string;

  hints: string;

  starterCode: string;

  referenceSolution: string;

  compiler: string;

  languageStandard: string;

  timeLimitSeconds: number;

  memoryLimitMb: number;

  networkAccess: boolean;

  skill: string;

  subskill: string;

  topic: string;

  tags: string;

  aiPolicy: string;
}

/* ============================================================
   DEFAULT FORM
   ============================================================ */

const DEFAULT_FORM: CodingQuestionForm = {
  title: "",

  code: "",

  language: "C",

  difficulty: "BEGINNER",

  marks: 10,

  estimatedTime: 10,

  bloomsLevel: "APPLY",

  problemStatement: "",

  objective: "",

  inputFormat: "",

  outputFormat: "",

  constraints: "",

  exampleInput: "",

  exampleOutput: "",

  explanation: "",

  hints: "",

  starterCode: `#include <stdio.h>

int main() {

    // Write your code here

    return 0;
}
`,

  referenceSolution: "",

  compiler: "GCC",

  languageStandard: "C17",

  timeLimitSeconds: 2,

  memoryLimitMb: 256,

  networkAccess: false,

  skill: "",

  subskill: "",

  topic: "",

  tags: "",

  aiPolicy: "DISABLED",
};

/* ============================================================
   PAGE
   ============================================================ */

export default function CreateQuestionPage() {
  const router =
    useRouter();

  const params =
    useParams();

  const searchParams =
    useSearchParams();

  const assessmentId =
    params.assessmentId as string;

  const sectionId =
    searchParams.get(
      "sectionId",
    );

  const [
    form,
    setForm,
  ] =
    useState<CodingQuestionForm>(
      DEFAULT_FORM,
    );

  const [
    testCases,
    setTestCases,
  ] =
    useState<TestCase[]>([
      createEmptyTestCase(
        "SAMPLE",
        1,
      ),
    ]);

  const [
    errors,
    setErrors,
  ] =
    useState<string[]>([]);

  /* ============================================================
     CALCULATIONS
     ============================================================ */

  const totalTestCaseMarks =
    useMemo(() => {
      return testCases.reduce(
        (
          total,
          testCase,
        ) =>
          total +
          Number(
            testCase.marks,
          ),
        0,
      );
    }, [testCases]);

  /* ============================================================
     FORM UPDATE
     ============================================================ */

  function updateForm<
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
  }

  /* ============================================================
     TEST CASES
     ============================================================ */

  function addTestCase() {
    setTestCases(
      (current) => [
        ...current,

        createEmptyTestCase(
          "HIDDEN",
          current.length + 1,
        ),
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
          (testCase) =>
            testCase.id === id
              ? {
                  ...testCase,
                  [field]: value,
                }
              : testCase,
        ),
    );
  }

  function duplicateTestCase(
    id: string,
  ) {
    const existing =
      testCases.find(
        (testCase) =>
          testCase.id === id,
      );

    if (!existing) {
      return;
    }

    const duplicate: TestCase = {
      ...existing,

      id:
        crypto.randomUUID(),

      name:
        `${existing.name} Copy`,
    };

    setTestCases(
      (current) => [
        ...current,
        duplicate,
      ],
    );
  }

  function removeTestCase(
    id: string,
  ) {
    setTestCases(
      (current) =>
        current.filter(
          (testCase) =>
            testCase.id !== id,
        ),
    );
  }

  /* ============================================================
     VALIDATION
     ============================================================ */

  function validateQuestion() {
    const validationErrors:
      string[] = [];

    if (!form.title.trim()) {
      validationErrors.push(
        "Question title is required.",
      );
    }

    if (!form.code.trim()) {
      validationErrors.push(
        "Question code is required.",
      );
    }

    if (
      !form.problemStatement.trim()
    ) {
      validationErrors.push(
        "Problem statement is required.",
      );
    }

    if (!form.inputFormat.trim()) {
      validationErrors.push(
        "Input format is required.",
      );
    }

    if (!form.outputFormat.trim()) {
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
        testCase,
        index,
      ) => {
        if (
          !testCase.expectedOutput.trim()
        ) {
          validationErrors.push(
            `Test Case ${index + 1}: expected output is required.`,
          );
        }
      },
    );

    if (
      totalTestCaseMarks !==
      form.marks
    ) {
      validationErrors.push(
        `Test case marks total ${totalTestCaseMarks}, but question marks are ${form.marks}.`,
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
     SAVE QUESTION
     ============================================================ */

  async function saveQuestion() {
    if (!validateQuestion()) {
      return;
    }

    try {
      const payload = {
        assessmentId,

        sectionId,

        organizationId:
          "DEFAULT_ORGANIZATION",

        createdByUserId:
          "DEFAULT_USER",

        form: {
          title:
            form.title,

          code:
            form.code,

          language:
            form.language,

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

          starterCode:
            form.starterCode,

          referenceSolution:
            form.referenceSolution,

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
              testCase,
              index,
            ) => ({
              name:
                testCase.name,

              type:
                testCase.type,

              input:
                testCase.input,

              expectedOutput:
                testCase.expectedOutput,

              marks:
                testCase.marks,

              sequence:
                index + 1,

              active:
                testCase.active,
            }),
          ),
      };

      /* ========================================================
         IMPORTANT:
         USE SHARED API_URL
         ======================================================== */

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
          await response.text();

        console.error(
          "Question creation API error:",
          message,
        );

        throw new Error(
          "Question creation failed",
        );
      }

      const result =
        await response.json();

      console.log(
        "Question saved:",
        result,
      );

      router.push(
        `/assessments/${assessmentId}/questions`,
      );
    } catch (error) {
      console.error(
        "Unable to save question:",
        error,
      );

      alert(
        "Unable to save question",
      );
    }
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <main className="create-question-page">
      <div className="create-question-container">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="create-question-header">
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
              ← Assessment Questions
            </button>

            <div className="step-label">
              STEP 3 — QUESTION AUTHORING
            </div>

            <h1>
              Create Coding Question
            </h1>

            <p>
              Configure the complete
              coding question including
              problem definition,
              starter code, test cases,
              evaluation and runtime.
            </p>
          </div>

          <div className="question-status">
            DRAFT
          </div>
        </header>

        {/* ======================================================
            AUTHORING NAV
        ====================================================== */}

        <nav className="authoring-nav">
          <a href="#details">
            1. Details
          </a>

          <a href="#problem">
            2. Problem
          </a>

          <a href="#code">
            3. Code
          </a>

          <a href="#tests">
            4. Test Cases
          </a>

          <a href="#evaluation">
            5. Evaluation
          </a>

          <a href="#runtime">
            6. Runtime
          </a>

          <a href="#skills">
            7. Skills
          </a>

          <a href="#ai">
            8. AI Policy
          </a>
        </nav>

        {/* ======================================================
            01 — QUESTION DETAILS
        ====================================================== */}

        <section
          className="authoring-card"
          id="details"
        >
          <SectionHeading
            number="01"
            title="Question Details"
            description="Define the identity, difficulty and scoring of the question."
          />

          <div className="form-grid">
            <FormField
              label="Question Title"
              required
            >
              <input
                value={
                  form.title
                }
                onChange={(event) =>
                  updateForm(
                    "title",
                    event.target.value,
                  )
                }
                placeholder="Example: Find Maximum Number in an Array"
              />
            </FormField>

            <FormField
              label="Question Code"
              required
            >
              <input
                value={
                  form.code
                }
                onChange={(event) =>
                  updateForm(
                    "code",
                    event.target.value,
                  )
                }
                placeholder="C-ARRAY-001"
              />
            </FormField>

            <FormField label="Language">
              <select
                value={
                  form.language
                }
                onChange={(event) =>
                  updateForm(
                    "language",
                    event.target.value,
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
            </FormField>

            <FormField label="Difficulty">
              <select
                value={
                  form.difficulty
                }
                onChange={(event) =>
                  updateForm(
                    "difficulty",
                    event.target.value,
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
            </FormField>

            <FormField label="Marks">
              <input
                type="number"
                min={1}
                value={
                  form.marks
                }
                onChange={(event) =>
                  updateForm(
                    "marks",
                    Number(
                      event.target.value,
                    ),
                  )
                }
              />
            </FormField>

            <FormField label="Estimated Time (minutes)">
              <input
                type="number"
                min={1}
                value={
                  form.estimatedTime
                }
                onChange={(event) =>
                  updateForm(
                    "estimatedTime",
                    Number(
                      event.target.value,
                    ),
                  )
                }
              />
            </FormField>

            <FormField label="Bloom's Level">
              <select
                value={
                  form.bloomsLevel
                }
                onChange={(event) =>
                  updateForm(
                    "bloomsLevel",
                    event.target.value,
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
            </FormField>
          </div>
        </section>

        {/* ======================================================
            02 — PROBLEM
        ====================================================== */}

        <section
          className="authoring-card"
          id="problem"
        >
          <SectionHeading
            number="02"
            title="Problem Authoring"
            description="Write the actual problem the learner will solve."
          />

          <FormField
            label="Problem Statement"
            required
          >
            <textarea
              rows={8}
              value={
                form.problemStatement
              }
              onChange={(event) =>
                updateForm(
                  "problemStatement",
                  event.target.value,
                )
              }
              placeholder="Describe the programming problem clearly..."
            />
          </FormField>

          <FormField label="Objective">
            <textarea
              rows={3}
              value={
                form.objective
              }
              onChange={(event) =>
                updateForm(
                  "objective",
                  event.target.value,
                )
              }
              placeholder="What should the learner demonstrate?"
            />
          </FormField>

          <div className="form-grid">
            <FormField
              label="Input Format"
              required
            >
              <textarea
                rows={5}
                value={
                  form.inputFormat
                }
                onChange={(event) =>
                  updateForm(
                    "inputFormat",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField
              label="Output Format"
              required
            >
              <textarea
                rows={5}
                value={
                  form.outputFormat
                }
                onChange={(event) =>
                  updateForm(
                    "outputFormat",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField label="Constraints">
              <textarea
                rows={5}
                value={
                  form.constraints
                }
                onChange={(event) =>
                  updateForm(
                    "constraints",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField label="Hints">
              <textarea
                rows={5}
                value={
                  form.hints
                }
                onChange={(event) =>
                  updateForm(
                    "hints",
                    event.target.value,
                  )
                }
              />
            </FormField>
          </div>

          <div className="form-grid">
            <FormField label="Example Input">
              <textarea
                rows={5}
                className="code-textarea"
                value={
                  form.exampleInput
                }
                onChange={(event) =>
                  updateForm(
                    "exampleInput",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField label="Example Output">
              <textarea
                rows={5}
                className="code-textarea"
                value={
                  form.exampleOutput
                }
                onChange={(event) =>
                  updateForm(
                    "exampleOutput",
                    event.target.value,
                  )
                }
              />
            </FormField>
          </div>

          <FormField label="Example Explanation">
            <textarea
              rows={4}
              value={
                form.explanation
              }
              onChange={(event) =>
                updateForm(
                  "explanation",
                  event.target.value,
                )
              }
            />
          </FormField>
        </section>

        {/* ======================================================
            03 — CODE
        ====================================================== */}

        <section
          className="authoring-card"
          id="code"
        >
          <SectionHeading
            number="03"
            title="Code Configuration"
            description="Configure learner starter code and the authorized reference solution."
          />

          <div className="code-grid">
            <FormField label="Starter Code">
              <textarea
                rows={16}
                className="code-editor"
                value={
                  form.starterCode
                }
                onChange={(event) =>
                  updateForm(
                    "starterCode",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField label="Reference Solution">
              <textarea
                rows={16}
                className="code-editor"
                value={
                  form.referenceSolution
                }
                onChange={(event) =>
                  updateForm(
                    "referenceSolution",
                    event.target.value,
                  )
                }
                placeholder="Enter the verified reference solution..."
              />
            </FormField>
          </div>
        </section>

        {/* ======================================================
            04 — TEST CASES
        ====================================================== */}

        <section
          className="authoring-card"
          id="tests"
        >
          <div className="test-case-section-header">
            <SectionHeading
              number="04"
              title="Test Case Builder"
              description="Define sample, public and hidden validation cases."
            />

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

          <div className="test-summary">
            <div>
              <span>
                Question Marks
              </span>

              <strong>
                {form.marks}
              </strong>
            </div>

            <div>
              <span>
                Test Case Marks
              </span>

              <strong>
                {
                  totalTestCaseMarks
                }
              </strong>
            </div>

            <div>
              <span>
                Test Cases
              </span>

              <strong>
                {
                  testCases.length
                }
              </strong>
            </div>
          </div>

          <div className="test-case-list">
            {testCases.map(
              (
                testCase,
                index,
              ) => (
                <article
                  className="test-case-card"
                  key={
                    testCase.id
                  }
                >
                  <header className="test-card-header">
                    <div>
                      <span className="test-number">
                        TEST CASE{" "}
                        {index + 1}
                      </span>

                      <h3>
                        {
                          testCase.name
                        }
                      </h3>
                    </div>

                    <div className="test-actions">
                      <button
                        type="button"
                        onClick={() =>
                          duplicateTestCase(
                            testCase.id,
                          )
                        }
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        disabled={
                          testCases.length ===
                          1
                        }
                        onClick={() =>
                          removeTestCase(
                            testCase.id,
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </header>

                  <div className="form-grid">
                    <FormField label="Test Case Name">
                      <input
                        value={
                          testCase.name
                        }
                        onChange={(event) =>
                          updateTestCase(
                            testCase.id,
                            "name",
                            event.target.value,
                          )
                        }
                      />
                    </FormField>

                    <FormField label="Type">
                      <select
                        value={
                          testCase.type
                        }
                        onChange={(event) =>
                          updateTestCase(
                            testCase.id,
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
                    </FormField>

                    <FormField label="Marks">
                      <input
                        type="number"
                        min={0}
                        value={
                          testCase.marks
                        }
                        onChange={(event) =>
                          updateTestCase(
                            testCase.id,
                            "marks",
                            Number(
                              event.target
                                .value,
                            ),
                          )
                        }
                      />
                    </FormField>

                    <FormField label="Status">
                      <select
                        value={
                          testCase.active
                            ? "ACTIVE"
                            : "INACTIVE"
                        }
                        onChange={(event) =>
                          updateTestCase(
                            testCase.id,
                            "active",
                            event.target
                              .value ===
                              "ACTIVE",
                          )
                        }
                      >
                        <option value="ACTIVE">
                          Active
                        </option>

                        <option value="INACTIVE">
                          Inactive
                        </option>
                      </select>
                    </FormField>
                  </div>

                  <div className="form-grid">
                    <FormField label="Input">
                      <textarea
                        rows={8}
                        className="code-textarea"
                        value={
                          testCase.input
                        }
                        onChange={(event) =>
                          updateTestCase(
                            testCase.id,
                            "input",
                            event.target.value,
                          )
                        }
                      />
                    </FormField>

                    <FormField
                      label="Expected Output"
                      required
                    >
                      <textarea
                        rows={8}
                        className="code-textarea"
                        value={
                          testCase.expectedOutput
                        }
                        onChange={(event) =>
                          updateTestCase(
                            testCase.id,
                            "expectedOutput",
                            event.target.value,
                          )
                        }
                      />
                    </FormField>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>

        {/* ======================================================
            05 — EVALUATION
        ====================================================== */}

        <section
          className="authoring-card"
          id="evaluation"
        >
          <SectionHeading
            number="05"
            title="Evaluation"
            description="Review how question marks are distributed across the test cases."
          />

          <div className="evaluation-grid">
            <div className="evaluation-card">
              <span>
                Question Marks
              </span>

              <strong>
                {form.marks}
              </strong>
            </div>

            <div className="evaluation-card">
              <span>
                Allocated Test Marks
              </span>

              <strong>
                {
                  totalTestCaseMarks
                }
              </strong>
            </div>

            <div
              className={`evaluation-card ${
                totalTestCaseMarks ===
                form.marks
                  ? "evaluation-valid"
                  : "evaluation-warning"
              }`}
            >
              <span>
                Marks Validation
              </span>

              <strong>
                {totalTestCaseMarks ===
                form.marks
                  ? "Valid"
                  : "Mismatch"}
              </strong>
            </div>
          </div>
        </section>

        {/* ======================================================
            06 — RUNTIME
        ====================================================== */}

        <section
          className="authoring-card"
          id="runtime"
        >
          <SectionHeading
            number="06"
            title="Runtime & Security"
            description="Configure safe execution limits for this coding problem."
          />

          <div className="form-grid">
            <FormField label="Compiler">
              <select
                value={
                  form.compiler
                }
                onChange={(event) =>
                  updateForm(
                    "compiler",
                    event.target.value,
                  )
                }
              >
                <option value="GCC">
                  GCC
                </option>

                <option value="CLANG">
                  Clang
                </option>
              </select>
            </FormField>

            <FormField label="Language Standard">
              <select
                value={
                  form.languageStandard
                }
                onChange={(event) =>
                  updateForm(
                    "languageStandard",
                    event.target.value,
                  )
                }
              >
                <option value="C11">
                  C11
                </option>

                <option value="C17">
                  C17
                </option>

                <option value="C23">
                  C23
                </option>
              </select>
            </FormField>

            <FormField label="Time Limit (seconds)">
              <input
                type="number"
                min={1}
                value={
                  form.timeLimitSeconds
                }
                onChange={(event) =>
                  updateForm(
                    "timeLimitSeconds",
                    Number(
                      event.target.value,
                    ),
                  )
                }
              />
            </FormField>

            <FormField label="Memory Limit (MB)">
              <input
                type="number"
                min={64}
                value={
                  form.memoryLimitMb
                }
                onChange={(event) =>
                  updateForm(
                    "memoryLimitMb",
                    Number(
                      event.target.value,
                    ),
                  )
                }
              />
            </FormField>
          </div>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={
                form.networkAccess
              }
              onChange={(event) =>
                updateForm(
                  "networkAccess",
                  event.target.checked,
                )
              }
            />

            <div>
              <strong>
                Allow Network Access
              </strong>

              <span>
                Keep this disabled for
                standard coding
                assessments.
              </span>
            </div>
          </label>
        </section>

        {/* ======================================================
            07 — SKILLS
        ====================================================== */}

        <section
          className="authoring-card"
          id="skills"
        >
          <SectionHeading
            number="07"
            title="Skills & Metadata"
            description="Map this question to measurable skills and assessment metadata."
          />

          <div className="form-grid">
            <FormField label="Primary Skill">
              <input
                value={
                  form.skill
                }
                onChange={(event) =>
                  updateForm(
                    "skill",
                    event.target.value,
                  )
                }
                placeholder="Example: C Programming"
              />
            </FormField>

            <FormField label="Subskill">
              <input
                value={
                  form.subskill
                }
                onChange={(event) =>
                  updateForm(
                    "subskill",
                    event.target.value,
                  )
                }
                placeholder="Example: Arrays"
              />
            </FormField>

            <FormField label="Topic">
              <input
                value={
                  form.topic
                }
                onChange={(event) =>
                  updateForm(
                    "topic",
                    event.target.value,
                  )
                }
                placeholder="Example: Array Traversal"
              />
            </FormField>

            <FormField label="Tags">
              <input
                value={
                  form.tags
                }
                onChange={(event) =>
                  updateForm(
                    "tags",
                    event.target.value,
                  )
                }
                placeholder="arrays, loops, beginner"
              />
            </FormField>
          </div>
        </section>

        {/* ======================================================
            08 — AI
        ====================================================== */}

        <section
          className="authoring-card"
          id="ai"
        >
          <SectionHeading
            number="08"
            title="AI Assistance Policy"
            description="Control whether AI help can be used when this question is delivered."
          />

          <div className="form-grid">
            <FormField label="AI Assistance">
              <select
                value={
                  form.aiPolicy
                }
                onChange={(event) =>
                  updateForm(
                    "aiPolicy",
                    event.target.value,
                  )
                }
              >
                <option value="DISABLED">
                  Disabled
                </option>

                <option value="HINTS_ONLY">
                  Hints Only
                </option>

                <option value="EXPLANATION">
                  Explanation
                </option>

                <option value="DEBUG_ASSISTANCE">
                  Debug Assistance
                </option>

                <option value="FULL">
                  Full AI Assistance
                </option>
              </select>
            </FormField>
          </div>
        </section>

        {/* ======================================================
            ERRORS
        ====================================================== */}

        {errors.length >
          0 && (
          <section className="error-panel">
            <strong>
              Please correct the
              following:
            </strong>

            <ul>
              {errors.map(
                (error) => (
                  <li
                    key={error}
                  >
                    {error}
                  </li>
                ),
              )}
            </ul>
          </section>
        )}

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="create-question-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              router.push(
                `/assessments/${assessmentId}/questions`,
              )
            }
          >
            Cancel
          </button>

          <div>
            <button
              type="button"
              className="primary-button"
              onClick={
                saveQuestion
              }
            >
              Save Question
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* ============================================================
   CREATE EMPTY TEST CASE
   ============================================================ */

function createEmptyTestCase(
  type: TestCaseType,
  number: number,
): TestCase {
  return {
    id:
      crypto.randomUUID(),

    name:
      `Test Case ${number}`,

    type,

    input: "",

    expectedOutput: "",

    marks:
      number === 1
        ? 10
        : 0,

    active: true,
  };
}

/* ============================================================
   SECTION HEADING
   ============================================================ */

interface SectionHeadingProps {
  number: string;

  title: string;

  description: string;
}

function SectionHeading({
  number,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div className="section-number">
        {number}
      </div>

      <div>
        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   FORM FIELD
   ============================================================ */

interface FormFieldProps {
  label: string;

  required?: boolean;

  children: React.ReactNode;
}

function FormField({
  label,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <label className="form-field">
      <span>
        {label}

        {required && (
          <b> *</b>
        )}
      </span>

      {children}
    </label>
  );
}
