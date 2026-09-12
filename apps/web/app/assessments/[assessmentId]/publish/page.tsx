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
import "./publish.css";

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

  /* AI Policy */

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

interface PublicationRecord {
  assessmentId: string;

  status:
    | "DRAFT"
    | "PUBLISHED";

  publishedAt?: string;

  updatedAt: string;
}

/* ============================================================
   PAGE
   ============================================================ */

export default function PublishPage() {
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

  const [publication, setPublication] =
    useState<PublicationRecord | null>(
      null,
    );

  const [confirmed, setConfirmed] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [publishing, setPublishing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /* ============================================================
     LOAD DATA
     ============================================================ */

  useEffect(() => {
    async function loadPublishData() {
      try {
        const [
          assessmentResponse,
          questionsResponse,
          scoringResponse,
          deliveryResponse,
          publicationResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/assessment/${assessmentId}`,
          ),

          fetch(
            `${API_URL}/questions/assessment/${assessmentId}`,
          ),

          fetch(
            `${API_URL}/scoring/${assessmentId}`,
          ),

          fetch(
            `${API_URL}/delivery/${assessmentId}`,
          ),

          fetch(
            `${API_URL}/assessment/${assessmentId}/publication`,
          ),
        ]);

        if (assessmentResponse.ok) {
          setAssessment(
            await assessmentResponse.json(),
          );
        }

        if (questionsResponse.ok) {
          const questionData =
            await questionsResponse.json();

          setQuestions(
            Array.isArray(questionData)
              ? questionData
              : [],
          );
        }

        if (scoringResponse.ok) {
          setScoring(
            await scoringResponse.json(),
          );
        }

        if (deliveryResponse.ok) {
          const deliveryData =
            await deliveryResponse.json();

          setDelivery({
            ...(deliveryData.delivery ?? {}),

            ...(deliveryData.security ?? {}),

            startDate:
              deliveryData.delivery?.startsAt
                ? deliveryData.delivery.startsAt.substring(
                    0,
                    10,
                  )
                : "",

            startTime:
              deliveryData.delivery?.startsAt
                ? deliveryData.delivery.startsAt.substring(
                    11,
                    16,
                  )
                : "",

            endDate:
              deliveryData.delivery?.endsAt
                ? deliveryData.delivery.endsAt.substring(
                    0,
                    10,
                  )
                : "",

            endTime:
              deliveryData.delivery?.endsAt
                ? deliveryData.delivery.endsAt.substring(
                    11,
                    16,
                  )
                : "",
          });
        }

        if (publicationResponse.ok) {
          setPublication(
            await publicationResponse.json(),
          );
        }
      } catch (error) {
        console.error(
          "PUBLISH LOAD ERROR:",
          error,
        );
      } finally {
        setLoaded(true);
      }
    }

    if (assessmentId) {
      loadPublishData();
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

  const readiness =
    useMemo(() => {
      const checks = {
        assessment:
          Boolean(
            assessment &&
              assessment.title?.trim() &&
              assessment.code?.trim(),
          ),

        questions:
          Boolean(
            assessment &&
              questions.length > 0 &&
              questions.length ===
                Number(
                  assessment.plannedQuestions,
                ),
          ),

        marks:
          Boolean(
            assessment &&
              totalQuestionMarks ===
                Number(
                  assessment.totalMarks,
                ),
          ),

        scoring:
          Boolean(
            scoring &&
              scoring.passPercentage >=
                0 &&
              scoring.passPercentage <=
                100 &&
              scoring.maximumAttempts >=
                1,
          ),

        delivery:
          Boolean(
            delivery &&
              delivery.startDate &&
              delivery.startTime &&
              delivery.endDate &&
              delivery.endTime,
          ),

        assignment:
          Boolean(
            delivery &&
              (
                delivery.audienceType ===
                  "ALL_LEARNERS" ||
                (
                  delivery.audienceType ===
                    "SELECTED_LEARNERS" &&
                  delivery.selectedLearners?.trim()
                ) ||
                (
                  (
                    delivery.audienceType ===
                      "BATCH" ||
                    delivery.audienceType ===
                      "GROUP"
                  ) &&
                  delivery.batchOrGroup?.trim()
                )
              ),
          ),
      };

      const allReady =
        Object.values(
          checks,
        ).every(Boolean);

      return {
        ...checks,
        allReady,
      };
    }, [
      assessment,
      questions,
      scoring,
      delivery,
      totalQuestionMarks,
    ]);

  /* ============================================================
     HELPERS
     ============================================================ */

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

  function formatAudienceType() {
    if (!delivery) {
      return "Not configured";
    }

    switch (
      delivery.audienceType
    ) {
      case "ALL_LEARNERS":
        return "All Learners";

      case "SELECTED_LEARNERS":
        return "Selected Learners";

      case "BATCH":
        return "Batch";

      case "GROUP":
        return "Group";

      default:
        return "Not configured";
    }
  }

  function formatAiPolicy() {
    if (!delivery) {
      return "Not configured";
    }

    switch (
      delivery.aiPolicy
    ) {
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

  function formatDateTime(
    date?: string,
    time?: string,
  ) {
    if (
      !date ||
      !time
    ) {
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
     SAVE AS DRAFT
     ============================================================ */

  function keepAsDraft() {
    const payload:
      PublicationRecord = {
      assessmentId,

      status: "DRAFT",

      updatedAt:
        new Date().toISOString(),
    };

    sessionStorage.setItem(
      `assessmentPublication:${assessmentId}`,
      JSON.stringify(
        payload,
      ),
    );

    setPublication(
      payload,
    );

    setConfirmed(false);

    setMessage(
      "Assessment kept as draft.",
    );
  }

  /* ============================================================
     PUBLISH
     ============================================================ */

  async function publishAssessment() {
    if (
      !readiness.allReady ||
      !confirmed ||
      publishing
    ) {
      return;
    }

    setPublishing(true);

    setMessage("");

    try {
      const now =
        new Date().toISOString();

      const payload:
        PublicationRecord = {
        assessmentId,

        status:
          "PUBLISHED",

        publishedAt:
          now,

        updatedAt:
          now,
      };

      const response =
        await fetch(
          `${API_URL}/assessment/${assessmentId}/publish`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(payload),
          },
        );

      if (!response.ok) {
        throw new Error(
          await response.text(),
        );
      }

      const publishedData =
        await response.json();

      setPublication(
        publishedData,
      );

      setMessage(
        "Assessment published successfully.",
      );

      window.setTimeout(
        () => {
          router.push(
            "/assessments",
          );
        },
        800,
      );
    } catch (error) {
      console.error(
        "Unable to publish assessment.",
        error,
      );

      setMessage(
        "Unable to publish assessment.",
      );

      setPublishing(false);
    }
  }

  /* ============================================================
     LOADING
     ============================================================ */

  if (!loaded) {
    return (
      <main className="publish-page">
        <div className="publish-container">
          <div className="publish-loading-card">
            <strong>
              Loading publication details...
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
      <main className="publish-page">
        <div className="publish-container">
          <div className="missing-card">
            <h2>
              Assessment data not found
            </h2>

            <p>
              Complete the assessment
              before attempting to publish.
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
    <main className="publish-page">
      <div className="publish-container">
        <header className="publish-header">
          <div>
            <button
              type="button"
              className="back-link"
              onClick={() =>
                router.push(
                  `/assessments/${assessmentId}/review`,
                )
              }
            >
              ← Review
            </button>

            <span className="step-caption">
              STEP 6 OF 6
            </span>

            <h1>
              Publish Assessment
            </h1>

            <p>
              Confirm the final assessment
              configuration before making
              it available for delivery.
            </p>
          </div>

          <div className="assessment-chip">
            <span>
              {assessment.code}
            </span>

            <strong>
              {assessment.title}
            </strong>

            <small
              className={
                publication?.status ===
                "PUBLISHED"
                  ? "published-status"
                  : ""
              }
            >
              {publication?.status ===
              "PUBLISHED"
                ? "Published"
                : "Draft"}
            </small>
          </div>
        </header>

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
            complete
          />

          <StepperItem
            number="6"
            label="Publish"
            active
          />
        </section>

        <section
          className={`publish-readiness ${
            readiness.allReady
              ? "ready"
              : "not-ready"
          }`}
        >
          <div className="readiness-heading">
            <span className="readiness-icon">
              {readiness.allReady
                ? "✓"
                : "!"}
            </span>

            <div>
              <strong>
                {readiness.allReady
                  ? "Ready to publish"
                  : "Publication blocked"}
              </strong>

              <p>
                {readiness.allReady
                  ? "All required configuration checks have passed."
                  : "Return to the appropriate assessment step and resolve the remaining issues."}
              </p>
            </div>
          </div>

          <div className="readiness-check-grid">
            <ReadinessItem
              label="Assessment Setup"
              ready={
                readiness.assessment
              }
            />

            <ReadinessItem
              label="Questions"
              ready={
                readiness.questions
              }
            />

            <ReadinessItem
              label="Marks"
              ready={
                readiness.marks
              }
            />

            <ReadinessItem
              label="Scoring & Rules"
              ready={
                readiness.scoring
              }
            />

            <ReadinessItem
              label="Delivery"
              ready={
                readiness.delivery
              }
            />

            <ReadinessItem
              label="Assignment"
              ready={
                readiness.assignment
              }
            />
          </div>
        </section>

        <section className="publish-card">
          <div className="section-heading">
            <span className="section-number">
              1
            </span>

            <div>
              <h2>
                Assessment Summary
              </h2>

              <p>
                Final assessment
                configuration.
              </p>
            </div>
          </div>

          <div className="publish-detail-grid">
            <PublishField
              label="Assessment Title"
              value={
                assessment.title
              }
            />

            <PublishField
              label="Assessment Code"
              value={
                assessment.code
              }
            />

            <PublishField
              label="Questions"
              value={`${questions.length} / ${assessment.plannedQuestions}`}
            />

            <PublishField
              label="Total Marks"
              value={`${totalQuestionMarks} / ${assessment.totalMarks}`}
            />

            <PublishField
              label="Duration"
              value={`${assessment.durationMinutes} minutes`}
            />

            <PublishField
              label="Pass Score"
              value={
                scoring
                  ? `${scoring.passPercentage}% (${scoring.passMarks} marks)`
                  : "Not configured"
              }
            />

            <PublishField
              label="Maximum Attempts"
              value={
                scoring
                  ? String(
                      scoring.maximumAttempts,
                    )
                  : "Not configured"
              }
            />

            <PublishField
              label="Partial Marking"
              value={
                scoring
                  ? (
                      scoring.partialMarking
                        ? "Enabled"
                        : "Disabled"
                    )
                  : "Not configured"
              }
            />
          </div>
        </section>

        <section className="publish-card">
          <div className="section-heading">
            <span className="section-number">
              2
            </span>

            <div>
              <h2>
                Assignment & Delivery
              </h2>

              <p>
                Verify when and to whom
                the assessment will be
                delivered.
              </p>
            </div>
          </div>

          <div className="publish-detail-grid">
            <PublishField
              label="Audience Type"
              value={
                formatAudienceType()
              }
            />

            <PublishField
              label="Assigned Audience"
              value={
                formatAudience()
              }
            />

            <PublishField
              label="Available From"
              value={
                delivery
                  ? formatDateTime(
                      delivery.startDate,
                      delivery.startTime,
                    )
                  : "Not configured"
              }
            />

            <PublishField
              label="Available Until"
              value={
                delivery
                  ? formatDateTime(
                      delivery.endDate,
                      delivery.endTime,
                    )
                  : "Not configured"
              }
            />

            <PublishField
              label="AI Policy"
              value={
                formatAiPolicy()
              }
            />

            <PublishField
              label="Security Violations"
              value={
                delivery
                  ? `${delivery.violationLimit ?? 0} violation limit`
                  : "Not configured"
              }
            />
          </div>
        </section>

        <section className="publish-card">
          <div className="section-heading">
            <span className="section-number">
              3
            </span>

            <div>
              <h2>
                Publication Behavior
              </h2>

              <p>
                Understand what happens
                when this assessment is
                published.
              </p>
            </div>
          </div>

          <div className="publication-info">
            <div className="publication-info-item">
              <span className="info-icon">
                1
              </span>

              <div>
                <strong>
                  Assessment becomes published
                </strong>

                <p>
                  The assessment moves from
                  Draft to Published status.
                </p>
              </div>
            </div>

            <div className="publication-info-item">
              <span className="info-icon">
                2
              </span>

              <div>
                <strong>
                  Assignment rules remain applicable
                </strong>

                <p>
                  Only learners included in the
                  configured audience should be
                  eligible to access it.
                </p>
              </div>
            </div>

            <div className="publication-info-item">
              <span className="info-icon">
                3
              </span>

              <div>
                <strong>
                  Availability controls access
                </strong>

                <p>
                  Learners should only launch
                  attempts within the configured
                  availability window.
                </p>
              </div>
            </div>

            <div className="publication-info-item">
              <span className="info-icon">
                4
              </span>

              <div>
                <strong>
                  Publishing does not bypass permissions
                </strong>

                <p>
                  User status, organization
                  entitlement and assignment checks
                  still apply.
                </p>
              </div>
            </div>
          </div>

          <div className="access-formula">
            <span>
              Published
            </span>

            <strong>
              +
            </strong>

            <span>
              Assigned
            </span>

            <strong>
              +
            </strong>

            <span>
              Availability
            </span>

            <strong>
              +
            </strong>

            <span>
              Active User
            </span>

            <strong>
              +
            </strong>

            <span>
              Entitlement
            </span>

            <strong>
              =
            </strong>

            <span className="accessible">
              Accessible
            </span>
          </div>
        </section>

        <section className="publish-card final-confirmation-card">
          <div className="section-heading">
            <span className="section-number">
              4
            </span>

            <div>
              <h2>
                Final Confirmation
              </h2>

              <p>
                Confirm the assessment is
                ready for publication.
              </p>
            </div>
          </div>

          <label
            className={`confirmation-box ${
              confirmed
                ? "selected"
                : ""
            }`}
          >
            <input
              type="checkbox"
              checked={
                confirmed
              }
              onChange={(event) => {
                setConfirmed(
                  event.target.checked,
                );

                setMessage("");
              }}
            />

            <span className="confirmation-check" />

            <div>
              <strong>
                I confirm this assessment is ready to publish.
              </strong>

              <p>
                I have reviewed the questions,
                scoring, assignment, availability,
                AI policy and security configuration.
              </p>
            </div>
          </label>

          {!readiness.allReady && (
            <div className="publish-blocked-message">
              <strong>
                Publishing is currently blocked.
              </strong>

              <p>
                Resolve all readiness checks on
                the Review or corresponding
                configuration screens first.
              </p>
            </div>
          )}

          {message && (
            <div
              className={`publish-message ${
                publication?.status ===
                  "PUBLISHED"
                  ? "success"
                  : ""
              }`}
            >
              {message}
            </div>
          )}
        </section>

        <footer className="publish-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              router.push(
                `/assessments/${assessmentId}/review`,
              )
            }
          >
            ← Review
          </button>

          <div className="footer-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={
                keepAsDraft
              }
              disabled={
                publishing
              }
            >
              Keep as Draft
            </button>

            <button
              type="button"
              className="publish-button"
              disabled={
                !readiness.allReady ||
                !confirmed ||
                publishing
              }
              onClick={
                publishAssessment
              }
            >
              {publishing
                ? "Publishing..."
                : "Publish Assessment"}
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
   READINESS ITEM
   ============================================================ */

interface ReadinessItemProps {
  label: string;

  ready: boolean;
}

function ReadinessItem({
  label,
  ready,
}: ReadinessItemProps) {
  return (
    <div
      className={`readiness-item ${
        ready
          ? "ready"
          : "not-ready"
      }`}
    >
      <span className="readiness-item-icon">
        {ready
          ? "✓"
          : "×"}
      </span>

      <span>
        {label}
      </span>
    </div>
  );
}

/* ============================================================
   PUBLISH FIELD
   ============================================================ */

interface PublishFieldProps {
  label: string;

  value:
    | string
    | number;
}

function PublishField({
  label,
  value,
}: PublishFieldProps) {
  return (
    <div className="publish-field">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}
