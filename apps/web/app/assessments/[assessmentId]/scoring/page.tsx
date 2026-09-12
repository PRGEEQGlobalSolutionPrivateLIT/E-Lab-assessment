"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { API_URL } from "@/lib/api/fetcher";
import "./scoring.css";

/* ============================================================
   TYPES
   ============================================================ */

interface AssessmentDraft {
  id?: string;
  title: string;
  code: string;
  totalMarks: number;
  plannedQuestions: number;
  durationMinutes: number;
}

interface AssessmentQuestion {
  id: string;
  questionId: string;
  assessmentId?: string;
  sectionId: string | null;
  sequence: number;

  title: string;
  type: string;
  technology: string;
  difficulty: string;
  marks: number;

  source:
    | "NEW"
    | "QUESTION_BANK"
    | "IMPORT"
    | "AI";
}

interface ScoringRules {
  passPercentage: number;

  maximumAttempts: number;

  negativeMarking: boolean;
  negativeMarkValue: number;

  partialMarking: boolean;

  allowBackNavigation: boolean;
  allowQuestionSkip: boolean;

  autoSubmitOnTimeout: boolean;
}

/* ============================================================
   DEFAULT RULES
   ============================================================ */

const DEFAULT_RULES: ScoringRules = {
  passPercentage: 50,

  maximumAttempts: 1,

  negativeMarking: false,
  negativeMarkValue: 0,

  partialMarking: true,

  allowBackNavigation: true,
  allowQuestionSkip: true,

  autoSubmitOnTimeout: true,
};

/* ============================================================
   PAGE
   ============================================================ */

export default function ScoringRulesPage() {
  const router = useRouter();
  const params = useParams();

  const assessmentId =
    params.assessmentId as string;

  const [assessment, setAssessment] =
    useState<AssessmentDraft | null>(
      null,
    );

  const [questions, setQuestions] =
    useState<AssessmentQuestion[]>(
      [],
    );

  const [rules, setRules] =
    useState<ScoringRules>(
      DEFAULT_RULES,
    );

  const [errors, setErrors] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /* ============================================================
     LOAD DATA
     ============================================================ */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        console.log(
          "SCORING LOAD:",
          assessmentId,
        );

        console.log(
          "API URL:",
          API_URL,
        );

        /* ======================================================
           LOAD ASSESSMENT
           ====================================================== */

        const assessmentResponse =
          await fetch(
            `${API_URL}/assessment/${assessmentId}`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                "Content-Type":
                  "application/json",
              },
            },
          );

        if (!assessmentResponse.ok) {
          const text =
            await assessmentResponse.text();

          let message =
            "Assessment not found.";

          try {
            const parsed =
              JSON.parse(text);

            if (
              Array.isArray(
                parsed?.message,
              )
            ) {
              message =
                parsed.message.join(
                  "; ",
                );
            } else if (
              parsed?.message
            ) {
              message =
                parsed.message;
            } else if (
              text.trim()
            ) {
              message = text;
            }
          } catch {
            if (text.trim()) {
              message = text;
            }
          }

          throw new Error(
            message,
          );
        }

        const assessmentData =
          await assessmentResponse.json();

        /*
         * Support:
         *
         * {
         *   ...
         * }
         *
         * OR
         *
         * {
         *   data: {...}
         * }
         *
         * OR
         *
         * {
         *   assessment: {...}
         * }
         */

        const normalizedAssessment =
          assessmentData?.assessment ??
          assessmentData?.data ??
          assessmentData;

        setAssessment({
          id:
            normalizedAssessment?.id ??
            assessmentId,

          title:
            normalizedAssessment?.title ??
            "Assessment",

          code:
            normalizedAssessment?.code ??
            "-",

          totalMarks:
            Number(
              normalizedAssessment?.totalMarks ??
                0,
            ),

          plannedQuestions:
            Number(
              normalizedAssessment?.plannedQuestions ??
                0,
            ),

          durationMinutes:
            Number(
              normalizedAssessment?.durationMinutes ??
                0,
            ),
        });

        /* ======================================================
           LOAD QUESTIONS
           ====================================================== */

        const questionResponse =
          await fetch(
            `${API_URL}/questions/assessment/${assessmentId}`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                "Content-Type":
                  "application/json",
              },
            },
          );

        if (questionResponse.ok) {
          const questionData =
            await questionResponse.json();

          /*
           * Support:
           *
           * []
           *
           * {
           *   data: []
           * }
           *
           * {
           *   questions: []
           * }
           */

          const rawQuestions =
            Array.isArray(
              questionData,
            )
              ? questionData
              : Array.isArray(
                  questionData?.data,
                )
              ? questionData.data
              : Array.isArray(
                  questionData?.questions,
                )
              ? questionData.questions
              : [];

          const normalizedQuestions =
            rawQuestions
              .map(
                (
                  question: any,
                  index: number,
                ): AssessmentQuestion => ({
                  id: String(
                    question.id ??
                      question.questionId ??
                      `question-${index}`,
                  ),

                  questionId: String(
                    question.questionId ??
                      question.id ??
                      "",
                  ),

                  assessmentId:
                    question.assessmentId
                      ? String(
                          question.assessmentId,
                        )
                      : undefined,

                  sectionId:
                    question.sectionId ??
                    null,

                  sequence:
                    Number(
                      question.sequence ??
                        index + 1,
                    ),

                  title:
                    String(
                      question.title ??
                        question.question ??
                        "Untitled Question",
                    ),

                  type:
                    String(
                      question.type ??
                        "UNKNOWN",
                    ),

                  technology:
                    String(
                      question.technology ??
                        "-",
                    ),

                  difficulty:
                    String(
                      question.difficulty ??
                        "-",
                    ),

                  marks:
                    Number(
                      question.marks ??
                        0,
                    ),

                  source:
                    question.source ??
                    "NEW",
                }),
              )
              .sort(
                (
                  a: AssessmentQuestion,
                  b: AssessmentQuestion,
                ) =>
                  Number(
                    a.sequence,
                  ) -
                  Number(
                    b.sequence,
                  ),
              );

          setQuestions(
            normalizedQuestions,
          );
        } else {
          console.warn(
            "Unable to load assessment questions.",
          );

          setQuestions([]);
        }

        /* ======================================================
           LOAD SCORING
           ====================================================== */

        const scoringResponse =
          await fetch(
            `${API_URL}/scoring/${assessmentId}`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                "Content-Type":
                  "application/json",
              },
            },
          );

        if (scoringResponse.ok) {
          const scoringText =
            await scoringResponse.text();

          if (scoringText.trim()) {
            const scoringData =
              JSON.parse(
                scoringText,
              );

            /*
             * Support:
             *
             * {
             *   ...
             * }
             *
             * OR
             *
             * {
             *   data: {...}
             * }
             *
             * OR
             *
             * {
             *   scoring: {...}
             * }
             */

            const normalizedScoring =
              scoringData?.scoring ??
              scoringData?.data ??
              scoringData;

            setRules({
              ...DEFAULT_RULES,
              ...normalizedScoring,
            });
          }
        } else {
          /*
           * No scoring record yet.
           * Keep default rules.
           */
          console.log(
            "No existing scoring configuration. Using default rules.",
          );

          setRules(
            DEFAULT_RULES,
          );
        }
      } catch (error) {
        console.error(
          "Unable to load scoring data.",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    if (assessmentId) {
      loadData();
    }
  }, [assessmentId]);

  /* ============================================================
     CALCULATED VALUES
     ============================================================ */

  const calculatedTotalMarks =
    useMemo(
      () =>
        questions.reduce(
          (
            total,
            question,
          ) =>
            total +
            Number(
              question.marks || 0,
            ),
          0,
        ),
      [questions],
    );

  const totalMarks =
    calculatedTotalMarks > 0
      ? calculatedTotalMarks
      : assessment?.totalMarks ??
        0;

  const passMarks =
    useMemo(() => {
      return Number(
        (
          (totalMarks *
            rules.passPercentage) /
          100
        ).toFixed(2),
      );
    }, [
      totalMarks,
      rules.passPercentage,
    ]);

  /* ============================================================
     UPDATE FIELD
     ============================================================ */

  function updateRule<
    K extends keyof ScoringRules,
  >(
    field: K,
    value: ScoringRules[K],
  ) {
    setRules(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    setErrors([]);
  }

  /* ============================================================
     VALIDATION
     ============================================================ */

  function validateRules() {
    const validationErrors: string[] =
      [];

    if (totalMarks <= 0) {
      validationErrors.push(
        "Assessment total marks must be greater than zero.",
      );
    }

    if (
      rules.passPercentage < 0 ||
      rules.passPercentage > 100
    ) {
      validationErrors.push(
        "Pass percentage must be between 0 and 100.",
      );
    }

    if (
      rules.maximumAttempts < 1
    ) {
      validationErrors.push(
        "Maximum attempts must be at least 1.",
      );
    }

    if (
      rules.negativeMarking &&
      rules.negativeMarkValue <= 0
    ) {
      validationErrors.push(
        "Enter a negative mark value greater than zero.",
      );
    }

    setErrors(
      validationErrors,
    );

    return (
      validationErrors.length === 0
    );
  }

  /* ============================================================
     SAVE
     ============================================================ */

  async function saveScoring() {
    const payload = {
      assessmentId,

      passPercentage:
        Number(
          rules.passPercentage,
        ),

      maximumAttempts:
        Number(
          rules.maximumAttempts,
        ),

      negativeMarking:
        rules.negativeMarking,

      negativeMarkValue:
        rules.negativeMarking
          ? Number(
              rules.negativeMarkValue,
            )
          : null,

      partialMarking:
        rules.partialMarking,

      allowBackNavigation:
        rules.allowBackNavigation,

      allowQuestionSkip:
        rules.allowQuestionSkip,

      autoSubmitOnTimeout:
        rules.autoSubmitOnTimeout,
    };

    try {
      setSaving(true);

      console.log(
        "SAVING SCORING:",
        payload,
      );

      const response =
        await fetch(
          `${API_URL}/scoring`,
          {
            method: "POST",

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
        const text =
          await response.text();

        let message =
          "Unable to save scoring rules.";

        try {
          const parsed =
            JSON.parse(text);

          if (
            Array.isArray(
              parsed?.message,
            )
          ) {
            message =
              parsed.message.join(
                "; ",
              );
          } else if (
            parsed?.message
          ) {
            message =
              parsed.message;
          } else if (
            text.trim()
          ) {
            message = text;
          }
        } catch {
          if (text.trim()) {
            message = text;
          }
        }

        throw new Error(
          message,
        );
      }

      console.log(
        "Scoring saved successfully.",
      );

      return true;
    } catch (error) {
      console.error(
        "Save scoring failed:",
        error,
      );

      setErrors([
        error instanceof Error
          ? error.message
          : "Unable to save scoring rules.",
      ]);

      return false;
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     CONTINUE
     ============================================================ */

  async function saveAndContinue() {
    if (!validateRules()) {
      return;
    }

    const saved =
      await saveScoring();

    if (saved) {
      router.push(
        `/assessments/${assessmentId}/delivery`,
      );
    }
  }

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <main className="scoring-page">
        <div className="scoring-container">
          <div className="missing-card">
            <h2>
              Loading scoring configuration...
            </h2>

            <p>
              Loading assessment,
              questions and existing
              scoring rules.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ============================================================
     MISSING DATA
     ============================================================ */

  if (!assessment) {
    return (
      <main className="scoring-page">
        <div className="scoring-container">
          <div className="missing-card">
            <h2>
              Assessment data not found
            </h2>

            <p>
              Complete the assessment
              setup before configuring
              scoring rules.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                router.push(
                  "/assessments",
                )
              }
            >
              Return to Assessments
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <main className="scoring-page">
      <div className="scoring-container">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="scoring-header">
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

            <span className="step-caption">
              STEP 3 OF 6
            </span>

            <h1>
              Scoring & Rules
            </h1>

            <p>
              Define passing criteria,
              marking behavior and learner
              attempt rules.
            </p>
          </div>

          <div className="assessment-chip">
            <span>
              {assessment.code}
            </span>

            <strong>
              {assessment.title}
            </strong>

            <small>
              Draft
            </small>
          </div>
        </header>

        {/* ====================================================
            STEPPER
        ==================================================== */}

        <section className="assessment-stepper">
          <StepperItem
            number="1"
            label="Setup"
            complete
          />

          <StepperItem
            number="2"
            label="Questions"
            complete
          />

          <StepperItem
            number="3"
            label="Scoring & Rules"
            active
          />

          <StepperItem
            number="4"
            label="Delivery"
          />

          <StepperItem
            number="5"
            label="Review"
          />

          <StepperItem
            number="6"
            label="Publish"
          />
        </section>

        {/* ====================================================
            ASSESSMENT SUMMARY
        ==================================================== */}

        <section className="summary-strip">
          <SummaryItem
            label="Questions"
            value={`${questions.length} / ${assessment.plannedQuestions}`}
          />

          <SummaryItem
            label="Total Marks"
            value={`${totalMarks}`}
          />

          <SummaryItem
            label="Duration"
            value={`${assessment.durationMinutes} min`}
          />

          <SummaryItem
            label="Pass Marks"
            value={`${passMarks}`}
            emphasized
          />
        </section>

        {/* ====================================================
            SCORING
        ==================================================== */}

        <section className="rules-card">
          <div className="section-heading">
            <span className="section-number">
              1
            </span>

            <div>
              <h2>
                Scoring
              </h2>

              <p>
                Set the assessment passing
                requirement.
              </p>
            </div>
          </div>

          <div className="form-grid three-columns">

            <label className="form-field">
              <span>
                Total Marks
              </span>

              <input
                type="number"
                value={totalMarks}
                disabled
              />

              <small>
                Calculated from assessment
                questions.
              </small>
            </label>

            <label className="form-field">
              <span>
                Pass Percentage
              </span>

              <div className="unit-field">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={
                    rules.passPercentage
                  }
                  onChange={(event) =>
                    updateRule(
                      "passPercentage",
                      Math.min(
                        100,
                        Math.max(
                          0,
                          Number(
                            event.target.value,
                          ),
                        ),
                      ),
                    )
                  }
                />

                <span>
                  %
                </span>
              </div>
            </label>

            <label className="form-field">
              <span>
                Pass Marks
              </span>

              <input
                type="number"
                value={passMarks}
                disabled
              />

              <small>
                Calculated automatically.
              </small>
            </label>

          </div>
        </section>

        {/* ====================================================
            ATTEMPTS & MARKING
        ==================================================== */}

        <section className="rules-card">
          <div className="section-heading">
            <span className="section-number">
              2
            </span>

            <div>
              <h2>
                Attempts & Marking
              </h2>

              <p>
                Configure retries and how
                marks are awarded.
              </p>
            </div>
          </div>

          <div className="form-grid two-columns">
            <label className="form-field">
              <span>
                Maximum Attempts
              </span>

              <input
                type="number"
                min={1}
                max={20}
                value={
                  rules.maximumAttempts
                }
                onChange={(event) =>
                  updateRule(
                    "maximumAttempts",
                    Math.max(
                      1,
                      Number(
                        event.target.value,
                      ),
                    ),
                  )
                }
              />
            </label>

            <div className="empty-field" />
          </div>

          <div className="toggle-list">

            <RuleToggle
              title="Partial Marking"
              description="Award marks for partially correct answers or passed coding test cases."
              checked={
                rules.partialMarking
              }
              onChange={(checked) =>
                updateRule(
                  "partialMarking",
                  checked,
                )
              }
            />

            <RuleToggle
              title="Negative Marking"
              description="Deduct marks when an answer is incorrect."
              checked={
                rules.negativeMarking
              }
              onChange={(checked) => {
                updateRule(
                  "negativeMarking",
                  checked,
                );

                if (!checked) {
                  updateRule(
                    "negativeMarkValue",
                    0,
                  );
                }
              }}
            />

            {rules.negativeMarking && (
              <div className="nested-rule">
                <label className="form-field compact-field">
                  <span>
                    Marks Deducted per Wrong Answer
                  </span>

                  <input
                    type="number"
                    min={0.25}
                    step={0.25}
                    value={
                      rules.negativeMarkValue
                    }
                    onChange={(event) =>
                      updateRule(
                        "negativeMarkValue",
                        Math.max(
                          0,
                          Number(
                            event.target.value,
                          ),
                        ),
                      )
                    }
                  />
                </label>
              </div>
            )}

          </div>
        </section>

        {/* ====================================================
            ASSESSMENT RULES
        ==================================================== */}

        <section className="rules-card">
          <div className="section-heading">
            <span className="section-number">
              3
            </span>

            <div>
              <h2>
                Assessment Rules
              </h2>

              <p>
                Control learner navigation
                and completion behavior.
              </p>
            </div>
          </div>

          <div className="toggle-list">

            <RuleToggle
              title="Allow Back Navigation"
              description="Learners can return to previously visited questions."
              checked={
                rules.allowBackNavigation
              }
              onChange={(checked) =>
                updateRule(
                  "allowBackNavigation",
                  checked,
                )
              }
            />

            <RuleToggle
              title="Allow Question Skip"
              description="Learners can leave a question unanswered and continue."
              checked={
                rules.allowQuestionSkip
              }
              onChange={(checked) =>
                updateRule(
                  "allowQuestionSkip",
                  checked,
                )
              }
            />

            <RuleToggle
              title="Auto-submit on Timeout"
              description="Automatically submit the current attempt when assessment time expires."
              checked={
                rules.autoSubmitOnTimeout
              }
              onChange={(checked) =>
                updateRule(
                  "autoSubmitOnTimeout",
                  checked,
                )
              }
            />

          </div>
        </section>

        {/* ====================================================
            VALIDATION
        ==================================================== */}

        {errors.length > 0 && (
          <section className="validation-panel">
            <strong>
              Complete the scoring
              configuration before
              continuing.
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
          </section>
        )}

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="scoring-footer">
          <button
            type="button"
            className="secondary-button"
            disabled={saving}
            onClick={() =>
              router.push(
                `/assessments/${assessmentId}/questions`,
              )
            }
          >
            ← Questions
          </button>

          <div className="footer-actions">
            <button
              type="button"
              className="primary-button"
              disabled={saving}
              onClick={
                saveAndContinue
              }
            >
              {saving
                ? "Saving..."
                : "Continue →"}
            </button>
          </div>
        </footer>

      </div>
    </main>
  );
}

/* ============================================================
   STEPPER
   ============================================================ */

interface StepperItemProps {
  number: string;
  label: string;
  active?: boolean;
  complete?: boolean;
}

function StepperItem({
  number,
  label,
  active = false,
  complete = false,
}: StepperItemProps) {
  return (
    <div
      className={`stepper-item ${
        active
          ? "active"
          : ""
      } ${
        complete
          ? "complete"
          : ""
      }`}
    >
      <span className="step-number">
        {complete
          ? "✓"
          : number}
      </span>

      <span>
        {label}
      </span>
    </div>
  );
}

/* ============================================================
   SUMMARY
   ============================================================ */

interface SummaryItemProps {
  label: string;
  value: string;
  emphasized?: boolean;
}

function SummaryItem({
  label,
  value,
  emphasized = false,
}: SummaryItemProps) {
  return (
    <div
      className={`summary-item ${
        emphasized
          ? "emphasized"
          : ""
      }`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/* ============================================================
   RULE TOGGLE
   ============================================================ */

interface RuleToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean,
  ) => void;
}

function RuleToggle({
  title,
  description,
  checked,
  onChange,
}: RuleToggleProps) {
  return (
    <div className="rule-toggle-row">
      <div className="rule-description">
        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>

      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) =>
            onChange(
              event.target.checked,
            )
          }
        />

        <span className="slider" />
      </label>
    </div>
  );
}
