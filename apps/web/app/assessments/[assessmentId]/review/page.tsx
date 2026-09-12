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
import "./review.css";

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
  assessmentId?: string;
  totalMarks?: number;
  passPercentage: number;
  passMarks: number;
  maximumAttempts: number;
  negativeMarking: boolean;
  negativeMarkValue: number;
  partialMarking: boolean;
  allowBackNavigation: boolean;
  allowQuestionSkip: boolean;
  autoSubmitOnTimeout: boolean;
  updatedAt?: string;
}

type AudienceType =
  | "ALL_LEARNERS"
  | "SELECTED_LEARNERS"
  | "BATCH"
  | "GROUP";

type AiPolicy =
  | "DISABLED"
  | "HINTS_ONLY"
  | "DEBUG_SUPPORT"
  | "FULL";

type DevicePolicy =
  | "ANY"
  | "DESKTOP_ONLY"
  | "REGISTERED_DEVICE";

interface DeliverySettings {
  assessmentId?: string;

  /* Availability */
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;

  /* Assignment */
  audienceType: AudienceType;
  batchOrGroup: string;
  selectedLearners: string;

  /* AI */
  aiPolicy: AiPolicy;

  /* Basic Security */
  fullscreenMode: boolean;
  tabSwitchDetection: boolean;
  copyPasteDetection: boolean;
  copyPasteRestriction: boolean;
  textSelectionDetection: boolean;
  textSelectionRestriction: boolean;
  autoSubmitOnViolation: boolean;

  /* Advanced Security */
  maximumTabSwitches: number;
  violationLimit: number;
  allowedIpAddresses: string;
  devicePolicy: DevicePolicy;
  cameraProctoring: boolean;
  microphoneMonitoring: boolean;
  identityVerification: boolean;
  blockBrowserExtensions: boolean;
  disableRightClick: boolean;
  preventPrinting: boolean;
  preventScreenshots: boolean;

  updatedAt?: string;
}

interface ValidationItem {
  id: string;
  label: string;
  status:
    | "PASS"
    | "ERROR"
    | "WARNING";
  message: string;
}

/* ============================================================
   PAGE
   ============================================================ */

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();

  const assessmentId =
    params.assessmentId as string;

  const [assessment, setAssessment] =
    useState<AssessmentDraft | null>(
      null,
    );

  const [questions, setQuestions] =
    useState<AssessmentQuestion[]>([]);

  const [scoring, setScoring] =
    useState<ScoringRules | null>(
      null,
    );

  const [delivery, setDelivery] =
    useState<DeliverySettings | null>(
      null,
    );

  const [loaded, setLoaded] =
    useState(false);

  /* ============================================================
     LOAD REVIEW DATA FROM BACKEND
     ============================================================ */

  useEffect(() => {
    async function loadReviewData() {
      try {
        console.log(
          "REVIEW LOAD:",
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

        setAssessment(
          normalizedAssessment,
        );

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

          const sortedQuestions =
            rawQuestions.sort(
              (
                a: AssessmentQuestion,
                b: AssessmentQuestion,
              ) =>
                Number(
                  a.sequence ?? 0,
                ) -
                Number(
                  b.sequence ?? 0,
                ),
            );

          setQuestions(
            sortedQuestions,
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
          const scoringData =
            await scoringResponse.json();

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
           *   scoring: {...}
           * }
           *
           * OR
           *
           * {
           *   data: {...}
           * }
           */

          const normalizedScoring =
            scoringData?.scoring ??
            scoringData?.data ??
            scoringData;

          setScoring(
            normalizedScoring,
          );
        } else {
          console.warn(
            "Scoring configuration not found.",
          );

          setScoring(null);
        }

        /* ======================================================
           LOAD DELIVERY + SECURITY
           ====================================================== */

        const deliveryResponse =
          await fetch(
            `${API_URL}/delivery/${assessmentId}`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                "Content-Type":
                  "application/json",
              },
            },
          );

        if (deliveryResponse.ok) {
          const deliveryData =
            await deliveryResponse.json();

          const deliveryConfig =
            deliveryData?.delivery ??
            {};

          const securityConfig =
            deliveryData?.security ??
            {};

          const startsAt =
            deliveryConfig?.startsAt;

          const endsAt =
            deliveryConfig?.endsAt;

          setDelivery({
            ...deliveryConfig,
            ...securityConfig,

            startDate:
              startsAt
                ? startsAt.substring(
                    0,
                    10,
                  )
                : "",

            startTime:
              startsAt
                ? startsAt.substring(
                    11,
                    16,
                  )
                : "",

            endDate:
              endsAt
                ? endsAt.substring(
                    0,
                    10,
                  )
                : "",

            endTime:
              endsAt
                ? endsAt.substring(
                    11,
                    16,
                  )
                : "",
          });
        } else {
          console.warn(
            "Delivery configuration not found.",
          );

          setDelivery(null);
        }
      } catch (error) {
        console.error(
          "REVIEW LOAD ERROR:",
          error,
        );
      } finally {
        setLoaded(true);
      }
    }

    if (assessmentId) {
      loadReviewData();
    }
  }, [assessmentId]);

  /* ============================================================
     CALCULATED VALUES
     ============================================================ */

  const totalQuestionMarks =
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

  /* ============================================================
     VALIDATION
     ============================================================ */

  const validationItems =
    useMemo<ValidationItem[]>(
      () => {
        const items: ValidationItem[] =
          [];

        /* ----------------------------------------------
           Assessment
        ---------------------------------------------- */

        if (!assessment) {
          items.push({
            id: "assessment",
            label:
              "Assessment Setup",
            status: "ERROR",
            message:
              "Assessment setup information is missing.",
          });

          return items;
        }

        if (
          assessment.title?.trim() &&
          assessment.code?.trim()
        ) {
          items.push({
            id: "setup",
            label:
              "Assessment Setup",
            status: "PASS",
            message:
              "Assessment title and code are configured.",
          });
        } else {
          items.push({
            id: "setup",
            label:
              "Assessment Setup",
            status: "ERROR",
            message:
              "Assessment title or code is missing.",
          });
        }

        /* ----------------------------------------------
           Question Count
        ---------------------------------------------- */

        if (
          questions.length === 0
        ) {
          items.push({
            id: "questions",
            label: "Questions",
            status: "ERROR",
            message:
              "No questions have been added.",
          });
        } else if (
          questions.length ===
          Number(
            assessment.plannedQuestions,
          )
        ) {
          items.push({
            id: "questions",
            label:
              "Question Count",
            status: "PASS",
            message:
              `${questions.length} of ${assessment.plannedQuestions} questions configured.`,
          });
        } else {
          items.push({
            id: "questions",
            label:
              "Question Count",
            status: "ERROR",
            message:
              `${questions.length} questions configured, but ${assessment.plannedQuestions} were planned.`,
          });
        }

        /* ----------------------------------------------
           Marks
        ---------------------------------------------- */

        if (
          totalQuestionMarks ===
          Number(
            assessment.totalMarks,
          )
        ) {
          items.push({
            id: "marks",
            label:
              "Question Marks",
            status: "PASS",
            message:
              `${totalQuestionMarks} of ${assessment.totalMarks} marks configured.`,
          });
        } else {
          items.push({
            id: "marks",
            label:
              "Question Marks",
            status: "ERROR",
            message:
              `Question marks total ${totalQuestionMarks}, but assessment total is ${assessment.totalMarks}.`,
          });
        }

        /* ----------------------------------------------
           Scoring
        ---------------------------------------------- */

        if (!scoring) {
          items.push({
            id: "scoring",
            label:
              "Scoring & Rules",
            status: "ERROR",
            message:
              "Scoring and assessment rules are not configured.",
          });
        } else {
          if (
            scoring.passPercentage <
              0 ||
            scoring.passPercentage >
              100
          ) {
            items.push({
              id: "pass-score",
              label:
                "Pass Score",
              status: "ERROR",
              message:
                "Pass percentage must be between 0 and 100.",
            });
          } else {
            items.push({
              id: "pass-score",
              label:
                "Pass Score",
              status: "PASS",
              message:
                `${scoring.passPercentage}% (${scoring.passMarks} marks) configured.`,
            });
          }

          items.push({
            id: "scoring-marks",
            label:
              "Scoring Total",
            status: "PASS",
            message:
              `Scoring is aligned with ${totalQuestionMarks} configured question marks.`,
          });

          if (
            scoring.maximumAttempts <
            1
          ) {
            items.push({
              id: "attempts",
              label:
                "Maximum Attempts",
              status: "ERROR",
              message:
                "At least one assessment attempt must be allowed.",
            });
          }
        }

        /* ----------------------------------------------
           Delivery
        ---------------------------------------------- */

        if (!delivery) {
          items.push({
            id: "delivery",
            label: "Delivery",
            status: "ERROR",
            message:
              "Delivery settings are not configured.",
          });

          return items;
        }

        /* Availability */

        if (
          !delivery.startDate ||
          !delivery.startTime ||
          !delivery.endDate ||
          !delivery.endTime
        ) {
          items.push({
            id: "availability",
            label:
              "Availability",
            status: "ERROR",
            message:
              "Assessment start and end date/time must be configured.",
          });
        } else {
          const start =
            new Date(
              `${delivery.startDate}T${delivery.startTime}`,
            );

          const end =
            new Date(
              `${delivery.endDate}T${delivery.endTime}`,
            );

          if (
            Number.isNaN(
              start.getTime(),
            ) ||
            Number.isNaN(
              end.getTime(),
            ) ||
            end <= start
          ) {
            items.push({
              id: "availability",
              label:
                "Availability",
              status: "ERROR",
              message:
                "Assessment availability window is invalid.",
            });
          } else {
            items.push({
              id: "availability",
              label:
                "Availability",
              status: "PASS",
              message:
                "Assessment availability window is valid.",
            });
          }
        }

        /* Audience */

        if (
          delivery.audienceType ===
          "SELECTED_LEARNERS"
        ) {
          if (
            delivery.selectedLearners?.trim()
          ) {
            items.push({
              id: "audience",
              label:
                "Assignment",
              status: "PASS",
              message:
                "Selected learners are configured.",
            });
          } else {
            items.push({
              id: "audience",
              label:
                "Assignment",
              status: "ERROR",
              message:
                "At least one learner must be selected.",
            });
          }
        } else if (
          delivery.audienceType ===
            "BATCH" ||
          delivery.audienceType ===
            "GROUP"
        ) {
          if (
            delivery.batchOrGroup?.trim()
          ) {
            items.push({
              id: "audience",
              label:
                "Assignment",
              status: "PASS",
              message:
                "Assessment audience is configured.",
            });
          } else {
            items.push({
              id: "audience",
              label:
                "Assignment",
              status: "ERROR",
              message:
                "Select a batch or group.",
            });
          }
        } else {
          items.push({
            id: "audience",
            label:
              "Assignment",
            status: "PASS",
            message:
              "Assessment is assigned to all learners.",
          });
        }

        /* Security */

        if (
          delivery.autoSubmitOnViolation &&
          Number(
            delivery.violationLimit,
          ) < 1
        ) {
          items.push({
            id: "security",
            label:
              "Security Rules",
            status: "ERROR",
            message:
              "Configure a valid violation limit for automatic submission.",
          });
        } else {
          items.push({
            id: "security",
            label:
              "Security Rules",
            status: "PASS",
            message:
              "Assessment security configuration is valid.",
          });
        }

        return items;
      },
      [
        assessment,
        questions,
        scoring,
        delivery,
        totalQuestionMarks,
      ],
    );

  /* ============================================================
     BLOCKING ERRORS
     ============================================================ */

  const blockingErrors =
    validationItems.filter(
      (item) =>
        item.status === "ERROR",
    );

  const warnings =
    validationItems.filter(
      (item) =>
        item.status === "WARNING",
    );

  const isReady =
    loaded &&
    Boolean(assessment) &&
    blockingErrors.length === 0;

  /* ============================================================
     HELPERS
     ============================================================ */

  function yesNo(
    value:
      | boolean
      | undefined,
  ) {
    return value
      ? "Yes"
      : "No";
  }

  function formatAiPolicy(
    policy:
      | AiPolicy
      | undefined,
  ) {
    switch (policy) {
      case "HINTS_ONLY":
        return "Hints Only";

      case "DEBUG_SUPPORT":
        return "Debug Support";

      case "FULL":
        return "Full Assistance";

      default:
        return "Disabled";
    }
  }

  function formatDevicePolicy(
    policy:
      | DevicePolicy
      | undefined,
  ) {
    switch (policy) {
      case "DESKTOP_ONLY":
        return "Desktop / Laptop Only";

      case "REGISTERED_DEVICE":
        return "Registered Device Only";

      default:
        return "Any Device";
    }
  }

  function formatAudience() {
    if (!delivery) {
      return "Not configured";
    }

    switch (
      delivery.audienceType
    ) {
      case "ALL_LEARNERS":
        return "All Learners";

      case "SELECTED_LEARNERS":
        return (
          delivery.selectedLearners ||
          "No learners selected"
        );

      case "BATCH":
        return (
          delivery.batchOrGroup ||
          "No batch selected"
        );

      case "GROUP":
        return (
          delivery.batchOrGroup ||
          "No group selected"
        );

      default:
        return "Not configured";
    }
  }

  function formatDateTime(
    date?: string,
    time?: string,
  ) {
    if (!date || !time) {
      return "Not configured";
    }

    const value =
      new Date(
        `${date}T${time}`,
      );

    if (
      Number.isNaN(
        value.getTime(),
      )
    ) {
      return `${date} ${time}`;
    }

    return value.toLocaleString();
  }

  /* ============================================================
     CONTINUE
     ============================================================ */

  function continueToPublish() {
    if (!isReady) {
      return;
    }

    router.push(
      `/assessments/${assessmentId}/publish`,
    );
  }

  /* ============================================================
     LOADING
     ============================================================ */

  if (!loaded) {
    return (
      <main className="review-page">
        <div className="review-container">
          <div className="review-loading-card">
            <strong>
              Loading assessment review...
            </strong>
          </div>
        </div>
      </main>
    );
  }

  /* ============================================================
     MISSING ASSESSMENT
     ============================================================ */

  if (!assessment) {
    return (
      <main className="review-page">
        <div className="review-container">
          <div className="missing-card">
            <h2>
              Assessment data not found
            </h2>

            <p>
              Complete assessment setup
              before reviewing the
              assessment.
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
    <main className="review-page">
      <div className="review-container">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="review-header">
          <div>
            <button
              type="button"
              className="back-link"
              onClick={() =>
                router.push(
                  `/assessments/${assessmentId}/delivery`,
                )
              }
            >
              ← Delivery
            </button>

            <span className="step-caption">
              STEP 5 OF 6
            </span>

            <h1>
              Review Assessment
            </h1>

            <p>
              Verify questions,
              scoring, delivery and
              security before
              publishing.
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
            complete
          />

          <StepperItem
            number="4"
            label="Delivery"
            complete
          />

          <StepperItem
            number="5"
            label="Review"
            active
          />

          <StepperItem
            number="6"
            label="Publish"
          />
        </section>

        {/* ====================================================
            READINESS
        ==================================================== */}

        <section
          className={`readiness-card ${
            isReady
              ? "ready"
              : "not-ready"
          }`}
        >
          <div className="readiness-icon">
            {isReady
              ? "✓"
              : "!"}
          </div>

          <div>
            <strong>
              {isReady
                ? "Ready for publishing"
                : "Action required"}
            </strong>

            <p>
              {isReady
                ? "All required assessment configuration checks have passed."
                : `${blockingErrors.length} blocking issue${
                    blockingErrors.length ===
                    1
                      ? ""
                      : "s"
                  } must be resolved before publishing.`}
            </p>
          </div>
        </section>

        {/* ====================================================
            QUICK SUMMARY
        ==================================================== */}

        <section className="review-summary-strip">
          <SummaryItem
            label="Questions"
            value={`${questions.length} / ${assessment.plannedQuestions}`}
          />

          <SummaryItem
            label="Marks"
            value={`${totalQuestionMarks} / ${assessment.totalMarks}`}
          />

          <SummaryItem
            label="Pass Score"
            value={
              scoring
                ? `${scoring.passPercentage}% (${scoring.passMarks})`
                : "Not configured"
            }
          />

          <SummaryItem
            label="Duration"
            value={`${assessment.durationMinutes} min`}
          />

          <SummaryItem
            label="Delivery"
            value={
              delivery
                ? "Configured"
                : "Not configured"
            }
          />
        </section>

        {/* ====================================================
            1. ASSESSMENT SETUP
        ==================================================== */}

        <section className="review-card">
          <ReviewSectionHeader
            number="1"
            title="Assessment Setup"
            description="Core assessment information."
            onEdit={() =>
              router.push(
                `/assessments/create`,
              )
            }
          />

          <div className="review-detail-grid">
            <ReviewField
              label="Assessment Title"
              value={
                assessment.title
              }
            />

            <ReviewField
              label="Assessment Code"
              value={
                assessment.code
              }
            />

            <ReviewField
              label="Planned Questions"
              value={String(
                assessment.plannedQuestions,
              )}
            />

            <ReviewField
              label="Total Marks"
              value={String(
                assessment.totalMarks,
              )}
            />

            <ReviewField
              label="Duration"
              value={`${assessment.durationMinutes} minutes`}
            />
          </div>
        </section>

        {/* ====================================================
            2. QUESTIONS
        ==================================================== */}

        <section className="review-card">
          <ReviewSectionHeader
            number="2"
            title="Questions"
            description="Verify question order and marks."
            onEdit={() =>
              router.push(
                `/assessments/${assessmentId}/questions`,
              )
            }
          />

          {questions.length > 0 ? (
            <div className="review-table-wrapper">
              <table className="review-table">
                <thead>
                  <tr>
                    <th>#</th>

                    <th>
                      Question
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Technology
                    </th>

                    <th>
                      Difficulty
                    </th>

                    <th className="numeric-column">
                      Marks
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {questions.map(
                    (
                      question,
                      index,
                    ) => (
                      <tr
                        key={
                          question.id
                        }
                      >
                        <td>
                          {question.sequence ||
                            index + 1}
                        </td>

                        <td>
                          <strong className="question-title">
                            {
                              question.title
                            }
                          </strong>
                        </td>

                        <td>
                          {question.type}
                        </td>

                        <td>
                          {
                            question.technology
                          }
                        </td>

                        <td>
                          {
                            question.difficulty
                          }
                        </td>

                        <td className="numeric-column">
                          {
                            question.marks
                          }
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <td
                      colSpan={5}
                    >
                      Total
                    </td>

                    <td className="numeric-column">
                      {
                        totalQuestionMarks
                      }
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty-review-state">
              No questions configured.
            </div>
          )}
        </section>

        {/* ====================================================
            3. SCORING & RULES
        ==================================================== */}

        <section className="review-card">
          <ReviewSectionHeader
            number="3"
            title="Scoring & Rules"
            description="Verify pass score, attempts and assessment behavior."
            onEdit={() =>
              router.push(
                `/assessments/${assessmentId}/scoring`,
              )
            }
          />

          {scoring ? (
            <div className="review-detail-grid">
              <ReviewField
                label="Pass Percentage"
                value={`${scoring.passPercentage}%`}
              />

              <ReviewField
                label="Pass Marks"
                value={`${scoring.passMarks}`}
              />

              <ReviewField
                label="Maximum Attempts"
                value={`${scoring.maximumAttempts}`}
              />

              <ReviewField
                label="Negative Marking"
                value={
                  scoring.negativeMarking
                    ? `Yes (${scoring.negativeMarkValue})`
                    : "No"
                }
              />

              <ReviewField
                label="Partial Marking"
                value={yesNo(
                  scoring.partialMarking,
                )}
              />

              <ReviewField
                label="Back Navigation"
                value={yesNo(
                  scoring.allowBackNavigation,
                )}
              />

              <ReviewField
                label="Question Skip"
                value={yesNo(
                  scoring.allowQuestionSkip,
                )}
              />

              <ReviewField
                label="Auto-submit on Timeout"
                value={yesNo(
                  scoring.autoSubmitOnTimeout,
                )}
              />
            </div>
          ) : (
            <div className="empty-review-state">
              Scoring and rules are not configured.
            </div>
          )}
        </section>

        {/* ====================================================
            4. DELIVERY
        ==================================================== */}

        <section className="review-card">
          <ReviewSectionHeader
            number="4"
            title="Delivery"
            description="Verify availability, audience and AI policy."
            onEdit={() =>
              router.push(
                `/assessments/${assessmentId}/delivery`,
              )
            }
          />

          {delivery ? (
            <div className="review-detail-grid">
              <ReviewField
                label="Available From"
                value={formatDateTime(
                  delivery.startDate,
                  delivery.startTime,
                )}
              />

              <ReviewField
                label="Available Until"
                value={formatDateTime(
                  delivery.endDate,
                  delivery.endTime,
                )}
              />

              <ReviewField
                label="Audience Type"
                value={
                  delivery.audienceType
                    ? delivery.audienceType.replaceAll(
                        "_",
                        " ",
                      )
                    : "Not configured"
                }
              />

              <ReviewField
                label="Assigned Audience"
                value={formatAudience()}
              />

              <ReviewField
                label="AI Policy"
                value={formatAiPolicy(
                  delivery.aiPolicy,
                )}
              />

              <ReviewField
                label="Device Policy"
                value={formatDevicePolicy(
                  delivery.devicePolicy,
                )}
              />
            </div>
          ) : (
            <div className="empty-review-state">
              Delivery settings are not configured.
            </div>
          )}
        </section>

        {/* ====================================================
            5. SECURITY
        ==================================================== */}

        <section className="review-card">
          <ReviewSectionHeader
            number="5"
            title="Security"
            description="Review assessment integrity and monitoring controls."
            onEdit={() =>
              router.push(
                `/assessments/${assessmentId}/delivery`,
              )
            }
          />

          {delivery ? (
            <>
              <div className="security-review-grid">
                <SecurityReviewItem
                  label="Fullscreen Mode"
                  enabled={
                    delivery.fullscreenMode
                  }
                />

                <SecurityReviewItem
                  label="Tab Switch Detection"
                  enabled={
                    delivery.tabSwitchDetection
                  }
                />

                <SecurityReviewItem
                  label="Copy / Paste Detection"
                  enabled={
                    delivery.copyPasteDetection
                  }
                />

                <SecurityReviewItem
                  label="Copy / Paste Restriction"
                  enabled={
                    delivery.copyPasteRestriction
                  }
                />

                <SecurityReviewItem
                  label="Text Selection Detection"
                  enabled={
                    delivery.textSelectionDetection
                  }
                />

                <SecurityReviewItem
                  label="Text Selection Restriction"
                  enabled={
                    delivery.textSelectionRestriction
                  }
                />

                <SecurityReviewItem
                  label="Camera Proctoring"
                  enabled={
                    delivery.cameraProctoring
                  }
                />

                <SecurityReviewItem
                  label="Microphone Monitoring"
                  enabled={
                    delivery.microphoneMonitoring
                  }
                />

                <SecurityReviewItem
                  label="Identity Verification"
                  enabled={
                    delivery.identityVerification
                  }
                />

                <SecurityReviewItem
                  label="Block Browser Extensions"
                  enabled={
                    delivery.blockBrowserExtensions
                  }
                />

                <SecurityReviewItem
                  label="Disable Right Click"
                  enabled={
                    delivery.disableRightClick
                  }
                />

                <SecurityReviewItem
                  label="Prevent Printing"
                  enabled={
                    delivery.preventPrinting
                  }
                />

                <SecurityReviewItem
                  label="Screenshot Protection"
                  enabled={
                    delivery.preventScreenshots
                  }
                />

                <SecurityReviewItem
                  label="Auto-submit on Violation"
                  enabled={
                    delivery.autoSubmitOnViolation
                  }
                />
              </div>

              <div className="security-rule-summary">
                <ReviewField
                  label="Maximum Tab Switches"
                  value={
                    delivery.tabSwitchDetection
                      ? String(
                          delivery.maximumTabSwitches ??
                            0,
                        )
                      : "Not applicable"
                  }
                />

                <ReviewField
                  label="Violation Limit"
                  value={String(
                    delivery.violationLimit ??
                      0,
                  )}
                />

                <ReviewField
                  label="Allowed IP Addresses"
                  value={
                    delivery.allowedIpAddresses?.trim() ||
                    "Any network"
                  }
                />
              </div>
            </>
          ) : (
            <div className="empty-review-state">
              Security settings are not configured.
            </div>
          )}
        </section>

        {/* ====================================================
            6. VALIDATION
        ==================================================== */}

        <section className="review-card">
          <div className="section-heading">
            <span className="section-number">
              6
            </span>

            <div>
              <h2>
                Validation
              </h2>

              <p>
                Resolve blocking issues
                before continuing to
                publish.
              </p>
            </div>
          </div>

          <div className="validation-list">
            {validationItems.map(
              (item) => (
                <div
                  key={item.id}
                  className={`validation-item ${
                    item.status.toLowerCase()
                  }`}
                >
                  <span className="validation-status-icon">
                    {item.status ===
                    "PASS"
                      ? "✓"
                      : item.status ===
                          "WARNING"
                        ? "!"
                        : "×"}
                  </span>

                  <div>
                    <strong>
                      {item.label}
                    </strong>

                    <p>
                      {item.message}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>

          {warnings.length > 0 && (
            <div className="review-warning-note">
              {warnings.length}{" "}
              warning
              {warnings.length === 1
                ? ""
                : "s"}{" "}
              found. Warnings do not
              prevent publishing.
            </div>
          )}
        </section>

        {/* ====================================================
            PREVIEW
        ==================================================== */}

        <section className="preview-card">
          <div>
            <span className="preview-label">
              LEARNER EXPERIENCE
            </span>

            <h2>
              Assessment Preview
            </h2>

            <p>
              Learner preview will open
              the assessment using the
              current questions, rules
              and security configuration.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            disabled
            title="Learner assessment preview will be enabled when the learner attempt interface is implemented."
          >
            Preview Assessment
          </button>
        </section>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="review-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              router.push(
                `/assessments/${assessmentId}/delivery`,
              )
            }
          >
            ← Delivery
          </button>

          <div className="footer-actions">
            {!isReady && (
              <span className="footer-error-message">
                Resolve{" "}
                {
                  blockingErrors.length
                }{" "}
                blocking issue
                {blockingErrors.length ===
                1
                  ? ""
                  : "s"}
              </span>
            )}

            <button
              type="button"
              className="primary-button"
              disabled={!isReady}
              onClick={
                continueToPublish
              }
            >
              Continue to Publish →
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
        active ? "active" : ""
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
   SUMMARY ITEM
   ============================================================ */

interface SummaryItemProps {
  label: string;
  value: string;
}

function SummaryItem({
  label,
  value,
}: SummaryItemProps) {
  return (
    <div className="summary-item">
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
   REVIEW SECTION HEADER
   ============================================================ */

interface ReviewSectionHeaderProps {
  number: string;
  title: string;
  description: string;
  onEdit: () => void;
}

function ReviewSectionHeader({
  number,
  title,
  description,
  onEdit,
}: ReviewSectionHeaderProps) {
  return (
    <div className="review-section-header">
      <div className="section-heading">
        <span className="section-number">
          {number}
        </span>

        <div>
          <h2>
            {title}
          </h2>

          <p>
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="edit-section-button"
        onClick={onEdit}
      >
        Edit
      </button>
    </div>
  );
}

/* ============================================================
   REVIEW FIELD
   ============================================================ */

interface ReviewFieldProps {
  label: string;
  value:
    | string
    | number;
}

function ReviewField({
  label,
  value,
}: ReviewFieldProps) {
  return (
    <div className="review-field">
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
   SECURITY REVIEW
   ============================================================ */

interface SecurityReviewItemProps {
  label: string;
  enabled:
    | boolean
    | undefined;
}

function SecurityReviewItem({
  label,
  enabled,
}: SecurityReviewItemProps) {
  return (
    <div className="security-review-item">
      <span
        className={`security-state ${
          enabled
            ? "enabled"
            : "disabled"
        }`}
      >
        {enabled
          ? "✓"
          : "—"}
      </span>

      <span>
        {label}
      </span>
    </div>
  );
}
