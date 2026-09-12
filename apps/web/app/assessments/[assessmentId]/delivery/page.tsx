"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/src/lib/api/fetcher";

import "./delivery.css";

/* ============================================================
   TYPES
   ============================================================ */

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

interface AssessmentDraft {
  id?: string;
  title: string;
  code: string;
  totalMarks: number;
  plannedQuestions: number;
  durationMinutes: number;
}

interface DeliverySettings {
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
}

/* ============================================================
   DEFAULT SETTINGS
   ============================================================ */

const DEFAULT_DELIVERY: DeliverySettings = {
  /* Availability */

  startDate: "",
  startTime: "",

  endDate: "",
  endTime: "",

  /* Assignment */

  audienceType: "SELECTED_LEARNERS",

  batchOrGroup: "",

  selectedLearners: "",

  /* AI */

  aiPolicy: "DISABLED",

  /* Basic Security */

  fullscreenMode: true,

  tabSwitchDetection: true,

  copyPasteDetection: true,

  copyPasteRestriction: true,

  textSelectionDetection: true,

  textSelectionRestriction: false,

  autoSubmitOnViolation: false,

  /* Advanced Security */

  maximumTabSwitches: 3,

  violationLimit: 3,

  allowedIpAddresses: "",

  devicePolicy: "ANY",

  cameraProctoring: false,

  microphoneMonitoring: false,

  identityVerification: false,

  blockBrowserExtensions: false,

  disableRightClick: true,

  preventPrinting: true,

  preventScreenshots: false,
};

/* ============================================================
   PAGE
   ============================================================ */

export default function DeliveryPage() {
  const router = useRouter();

  const params = useParams();

  const assessmentId = params.assessmentId as string;

  const [assessment, setAssessment] =
    useState<AssessmentDraft | null>(null);

  const [delivery, setDelivery] =
    useState<DeliverySettings>(DEFAULT_DELIVERY);

  const [errors, setErrors] = useState<string[]>([]);

  /* ============================================================
     LOAD
     ============================================================ */

  useEffect(() => {
    async function loadAssessment() {
      try {
        const response = await fetch(
          `${API_URL}/assessment/${assessmentId}`,
        );

        if (response.ok) {
          const data = await response.json();

          setAssessment({
            id: data.id,

            title: data.title,

            code: data.code,

            totalMarks: data.totalMarks ?? 0,

            plannedQuestions: data.plannedQuestions ?? 0,

            durationMinutes: data.durationMinutes ?? 0,
          });
        }
      } catch (error) {
        console.error(
          "Unable to load assessment:",
          error,
        );
      }
    }

    loadAssessment();

    async function loadDelivery() {
      try {
        const response = await fetch(
          `${API_URL}/delivery/${assessmentId}`,
        );

        if (response.ok) {
          const data = await response.json();

          if (data) {
            setDelivery({
              ...DEFAULT_DELIVERY,

              ...(data.delivery ?? {}),

              ...(data.security ?? {}),

              startDate: data.delivery?.startsAt
                ? new Date(data.delivery.startsAt)
                    .toISOString()
                    .split("T")[0]
                : "",

              startTime: data.delivery?.startsAt
                ? new Date(data.delivery.startsAt)
                    .toISOString()
                    .substring(11, 16)
                : "",

              endDate: data.delivery?.endsAt
                ? new Date(data.delivery.endsAt)
                    .toISOString()
                    .split("T")[0]
                : "",

              endTime: data.delivery?.endsAt
                ? new Date(data.delivery.endsAt)
                    .toISOString()
                    .substring(11, 16)
                : "",
            });

            return;
          }
        }
      } catch (error) {
        console.error(
          "Unable to load delivery from backend:",
          error,
        );
      }
    }

    loadDelivery();
  }, [assessmentId]);

  /* ============================================================
     UPDATE FIELD
     ============================================================ */

  function updateField<K extends keyof DeliverySettings>(
    field: K,
    value: DeliverySettings[K],
  ) {
    setDelivery((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors([]);
  }

  /* ============================================================
     VALIDATION
     ============================================================ */

  function validateDelivery() {
    const validationErrors: string[] = [];

    /* Availability */

    if (!(delivery.startDate ?? "")) {
      validationErrors.push(
        "Start date is required.",
      );
    }

    if (!(delivery.startTime ?? "")) {
      validationErrors.push(
        "Start time is required.",
      );
    }

    if (!(delivery.endDate ?? "")) {
      validationErrors.push(
        "End date is required.",
      );
    }

    if (!(delivery.endTime ?? "")) {
      validationErrors.push(
        "End time is required.",
      );
    }

    if (
      (delivery.startDate ?? "") &&
      (delivery.startTime ?? "") &&
      (delivery.endDate ?? "") &&
      (delivery.endTime ?? "")
    ) {
      const start = new Date(
        `${delivery.startDate ?? ""}T${
          delivery.startTime ?? ""
        }`,
      );

      const end = new Date(
        `${delivery.endDate ?? ""}T${
          delivery.endTime ?? ""
        }`,
      );

      if (end <= start) {
        validationErrors.push(
          "End date and time must be after the start date and time.",
        );
      }
    }

    /* Assignment */

    if (
      (delivery.audienceType === "BATCH" ||
        delivery.audienceType === "GROUP") &&
      !(delivery.batchOrGroup ?? "").trim()
    ) {
      validationErrors.push(
        "Select or enter a batch/group.",
      );
    }

    if (
      delivery.audienceType ===
        "SELECTED_LEARNERS" &&
      !(delivery.selectedLearners ?? "").trim()
    ) {
      validationErrors.push(
        "Enter at least one learner.",
      );
    }

    /* Advanced Security */

    if (delivery.maximumTabSwitches < 0) {
      validationErrors.push(
        "Maximum tab switches cannot be negative.",
      );
    }

    if (delivery.violationLimit < 1) {
      validationErrors.push(
        "Security violation limit must be at least 1.",
      );
    }

    if (
      delivery.autoSubmitOnViolation &&
      delivery.violationLimit < 1
    ) {
      validationErrors.push(
        "Set a valid violation limit when auto-submit on violation is enabled.",
      );
    }

    setErrors(validationErrors);

    return validationErrors.length === 0;
  }

  /* ============================================================
     SAVE
     ============================================================ */

  async function saveDelivery(): Promise<boolean> {
    const payload = {
      assessmentId,

      // Availability

      startDate: delivery.startDate ?? "",

      startTime: delivery.startTime ?? "",

      endDate: delivery.endDate ?? "",

      endTime: delivery.endTime ?? "",

      // Assignment

      audienceType: delivery.audienceType,

      batchOrGroup:
        delivery.batchOrGroup ?? "",

      selectedLearners:
        delivery.selectedLearners ?? "",

      // AI Policy

      aiPolicy: delivery.aiPolicy,

      // Security

      fullscreenMode:
        Boolean(delivery.fullscreenMode),

      tabSwitchDetection:
        Boolean(delivery.tabSwitchDetection),

      copyPasteDetection:
        Boolean(delivery.copyPasteDetection),

      copyPasteRestriction:
        Boolean(delivery.copyPasteRestriction),

      textSelectionDetection:
        Boolean(delivery.textSelectionDetection),

      textSelectionRestriction:
        Boolean(
          delivery.textSelectionRestriction,
        ),

      autoSubmitOnViolation:
        Boolean(
          delivery.autoSubmitOnViolation,
        ),

      // Advanced Security

      maximumTabSwitches: Number(
        delivery.maximumTabSwitches ?? 0,
      ),

      violationLimit: Number(
        delivery.violationLimit ?? 1,
      ),

      allowedIpAddresses:
        delivery.allowedIpAddresses ?? "",

      devicePolicy: delivery.devicePolicy,

      cameraProctoring:
        Boolean(delivery.cameraProctoring),

      microphoneMonitoring:
        Boolean(
          delivery.microphoneMonitoring,
        ),

      identityVerification:
        Boolean(
          delivery.identityVerification,
        ),

      blockBrowserExtensions:
        Boolean(
          delivery.blockBrowserExtensions,
        ),

      disableRightClick:
        Boolean(delivery.disableRightClick),

      preventPrinting:
        Boolean(delivery.preventPrinting),

      preventScreenshots:
        Boolean(delivery.preventScreenshots),
    };

    try {
      console.log(
        "DELIVERY API URL:",
        API_URL,
      );

      console.log(
        "DELIVERY REQUEST PAYLOAD:",
        JSON.stringify(
          payload,
          null,
          2,
        ),
      );

      const response = await fetch(
        `${API_URL}/delivery`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
        },
      );

      console.log(
        "DELIVERY STATUS:",
        response.status,
      );

      console.log(
        "DELIVERY HEADERS:",
        [
          ...response.headers.entries(),
        ],
      );

      let responseText = "";

      try {
        responseText =
          await response.text();
      } catch (error) {
        console.error(
          "RESPONSE READ ERROR:",
          error,
        );
      }

      console.log(
        "DELIVERY RESPONSE BODY:",
        responseText,
      );

      if (!response.ok) {
        alert(
          `Unable to save delivery

Status: ${response.status}

${responseText}`,
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "DELIVERY SAVE ERROR:",
        error,
      );

      alert(
        "Delivery API connection failed",
      );

      return false;
    }
  }

  /* ============================================================
     SAVE & CONTINUE
     ============================================================ */

  async function saveAndContinue() {
    if (!validateDelivery()) {
      return;
    }

    const saved = await saveDelivery();

    if (saved) {
      router.push(
        `/assessments/${assessmentId}/review`,
      );
    }
  }

  /* ============================================================
     MISSING ASSESSMENT
     ============================================================ */

  if (!assessment) {
    return (
      <main className="delivery-page">
        <div className="delivery-container">
          <div className="missing-card">
            <h2>
              Assessment data not found
            </h2>

            <p>
              Complete the assessment
              setup before configuring
              delivery.
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
    <main className="delivery-page">
      <div className="delivery-container">
        {/* HEADER */}

        <header className="delivery-header">
          <div>
            <button
              type="button"
              className="back-link"
              onClick={() =>
                router.push(
                  `/assessments/${assessmentId}/scoring`,
                )
              }
            >
              ← Scoring & Rules
            </button>

            <span className="step-caption">
              STEP 4 OF 6
            </span>

            <h1>Delivery</h1>

            <p>
              Define availability,
              assignment, AI access and
              assessment security.
            </p>
          </div>

          <div className="assessment-chip">
            <span>
              {assessment.code}
            </span>

            <strong>
              {assessment.title}
            </strong>

            <small>Draft</small>
          </div>
        </header>

        {/* STEPPER */}

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
            active
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

        {/* AVAILABILITY */}

        <section className="delivery-card">
          <div className="section-heading">
            <span className="section-number">
              1
            </span>

            <div>
              <h2>Availability</h2>

              <p>
                Define when learners can
                access the assessment.
              </p>
            </div>
          </div>

          <div className="form-grid four-columns">
            <label className="form-field">
              <span>Start Date *</span>

              <input
                type="date"
                value={
                  delivery.startDate ?? ""
                }
                onChange={(event) =>
                  updateField(
                    "startDate",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-field">
              <span>Start Time *</span>

              <input
                type="time"
                value={
                  delivery.startTime ?? ""
                }
                onChange={(event) =>
                  updateField(
                    "startTime",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-field">
              <span>End Date *</span>

              <input
                type="date"
                value={
                  delivery.endDate ?? ""
                }
                onChange={(event) =>
                  updateField(
                    "endDate",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="form-field">
              <span>End Time *</span>

              <input
                type="time"
                value={
                  delivery.endTime ?? ""
                }
                onChange={(event) =>
                  updateField(
                    "endTime",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <div className="availability-note">
            <strong>
              Assessment Duration:
            </strong>

            <span>
              {assessment.durationMinutes}{" "}
              minutes per attempt
            </span>
          </div>
        </section>

        {/* ASSIGNMENT */}

        <section className="delivery-card">
          <div className="section-heading">
            <span className="section-number">
              2
            </span>

            <div>
              <h2>Assignment</h2>

              <p>
                Define who should receive
                this assessment.
              </p>
            </div>
          </div>

          <div className="form-grid two-columns">
            <label className="form-field">
              <span>Audience Type</span>

              <select
                value={
                  delivery.audienceType
                }
                onChange={(event) =>
                  updateField(
                    "audienceType",
                    event.target
                      .value as AudienceType,
                  )
                }
              >
                <option value="ALL_LEARNERS">
                  All Learners
                </option>

                <option value="SELECTED_LEARNERS">
                  Selected Learners
                </option>

                <option value="BATCH">
                  Batch
                </option>

                <option value="GROUP">
                  Group
                </option>
              </select>
            </label>

            {(delivery.audienceType ===
              "BATCH" ||
              delivery.audienceType ===
                "GROUP") && (
              <label className="form-field">
                <span>
                  {delivery.audienceType ===
                  "BATCH"
                    ? "Batch"
                    : "Group"}
                </span>

                <input
                  type="text"
                  value={
                    delivery.batchOrGroup ??
                    ""
                  }
                  onChange={(event) =>
                    updateField(
                      "batchOrGroup",
                      event.target.value,
                    )
                  }
                  placeholder={
                    delivery.audienceType ===
                    "BATCH"
                      ? "Example: C Basics - Batch 1"
                      : "Example: Graduate Trainees"
                  }
                />
              </label>
            )}

            {delivery.audienceType ===
              "SELECTED_LEARNERS" && (
              <label className="form-field full-width">
                <span>
                  Selected Learners *
                </span>

                <textarea
                  rows={4}
                  value={
                    delivery.selectedLearners ??
                    ""
                  }
                  onChange={(event) =>
                    updateField(
                      "selectedLearners",
                      event.target.value,
                    )
                  }
                  placeholder="Enter learner names, IDs or emails separated by commas."
                />

                <small>
                  This is temporary
                  frontend storage.
                  Later this will be
                  replaced by learner
                  search and multi-select.
                </small>
              </label>
            )}
          </div>
        </section>

        {/* AI POLICY */}

        <section className="delivery-card">
          <div className="section-heading">
            <span className="section-number">
              3
            </span>

            <div>
              <h2>AI Policy</h2>

              <p>
                Decide whether learners
                may use platform-provided
                AI assistance.
              </p>
            </div>
          </div>

          <div className="form-grid two-columns">
            <label className="form-field">
              <span>AI Assistance</span>

              <select
                value={
                  delivery.aiPolicy
                }
                onChange={(event) =>
                  updateField(
                    "aiPolicy",
                    event.target
                      .value as AiPolicy,
                  )
                }
              >
                <option value="DISABLED">
                  Disabled
                </option>

                <option value="HINTS_ONLY">
                  Hints Only
                </option>

                <option value="DEBUG_SUPPORT">
                  Debug Support
                </option>

                <option value="FULL">
                  Full Assistance
                </option>
              </select>
            </label>

            <div className="ai-policy-info">
              {delivery.aiPolicy ===
                "DISABLED" && (
                <p>
                  Learners complete the
                  assessment independently
                  without AI assistance.
                </p>
              )}

              {delivery.aiPolicy ===
                "HINTS_ONLY" && (
                <p>
                  AI may provide hints but
                  should not provide the
                  final solution.
                </p>
              )}

              {delivery.aiPolicy ===
                "DEBUG_SUPPORT" && (
                <p>
                  AI may help learners
                  diagnose and debug their
                  submitted code.
                </p>
              )}

              {delivery.aiPolicy ===
                "FULL" && (
                <p>
                  Full platform AI
                  assistance is permitted
                  during the assessment.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SECURITY */}

        <section className="delivery-card">
          <div className="section-heading">
            <span className="section-number">
              4
            </span>

            <div>
              <h2>Security</h2>

              <p>
                Apply assessment integrity
                controls and violation
                monitoring.
              </p>
            </div>
          </div>

          <div className="toggle-list">
            <DeliveryToggle
              title="Fullscreen Mode"
              description="Request learners to keep the assessment workspace in fullscreen mode."
              checked={
                delivery.fullscreenMode
              }
              onChange={(checked) =>
                updateField(
                  "fullscreenMode",
                  checked,
                )
              }
            />

            <DeliveryToggle
              title="Tab Switch Detection"
              description="Detect and record when the learner leaves the assessment browser tab."
              checked={
                delivery.tabSwitchDetection
              }
              onChange={(checked) =>
                updateField(
                  "tabSwitchDetection",
                  checked,
                )
              }
            />

            <DeliveryToggle
              title="Copy / Paste Detection"
              description="Detect and record copy or paste activity inside protected assessment areas."
              checked={
                delivery.copyPasteDetection
              }
              onChange={(checked) =>
                updateField(
                  "copyPasteDetection",
                  checked,
                )
              }
            />

            <DeliveryToggle
              title="Copy / Paste Restriction"
              description="Prevent copy and paste actions inside protected assessment areas."
              checked={
                delivery.copyPasteRestriction
              }
              onChange={(checked) =>
                updateField(
                  "copyPasteRestriction",
                  checked,
                )
              }
            />

            <DeliveryToggle
              title="Text Selection Detection"
              description="Detect and record when learners select protected assessment text or content."
              checked={
                delivery.textSelectionDetection
              }
              onChange={(checked) =>
                updateField(
                  "textSelectionDetection",
                  checked,
                )
              }
            />

            <DeliveryToggle
              title="Text Selection Restriction"
              description="Prevent learners from selecting protected assessment text where supported."
              checked={
                delivery.textSelectionRestriction
              }
              onChange={(checked) =>
                updateField(
                  "textSelectionRestriction",
                  checked,
                )
              }
            />

            <DeliveryToggle
              title="Auto-submit on Security Violation"
              description="Automatically submit the assessment when configured violation conditions are reached."
              checked={
                delivery.autoSubmitOnViolation
              }
              onChange={(checked) =>
                updateField(
                  "autoSubmitOnViolation",
                  checked,
                )
              }
            />
          </div>

          {/* ADVANCED SECURITY */}

          <details className="advanced-security">
            <summary>
              Advanced Security
            </summary>

            <div className="advanced-security-content">
              <div className="advanced-security-intro">
                <strong>
                  Advanced assessment
                  controls
                </strong>

                <p>
                  Configure proctoring,
                  device, network and
                  violation policies when
                  stronger assessment
                  integrity is required.
                </p>
              </div>

              {/* LIMITS + DEVICE + NETWORK */}

              <div className="form-grid two-columns">
                <label className="form-field">
                  <span>
                    Maximum Tab Switches
                  </span>

                  <input
                    type="number"
                    min={0}
                    value={
                      delivery.maximumTabSwitches
                    }
                    disabled={
                      !delivery.tabSwitchDetection
                    }
                    onChange={(event) =>
                      updateField(
                        "maximumTabSwitches",
                        Math.max(
                          0,
                          Number(
                            event.target.value,
                          ),
                        ),
                      )
                    }
                  />

                  <small>
                    Maximum detected tab
                    switches permitted.
                    Use 0 for unlimited.
                  </small>
                </label>

                <label className="form-field">
                  <span>
                    Security Violation
                    Limit
                  </span>

                  <input
                    type="number"
                    min={1}
                    value={
                      delivery.violationLimit
                    }
                    onChange={(event) =>
                      updateField(
                        "violationLimit",
                        Math.max(
                          1,
                          Number(
                            event.target.value,
                          ),
                        ),
                      )
                    }
                  />

                  <small>
                    Maximum number of
                    security violations
                    permitted before the
                    configured action.
                  </small>
                </label>

                <label className="form-field">
                  <span>
                    Device Policy
                  </span>

                  <select
                    value={
                      delivery.devicePolicy
                    }
                    onChange={(event) =>
                      updateField(
                        "devicePolicy",
                        event.target
                          .value as DevicePolicy,
                      )
                    }
                  >
                    <option value="ANY">
                      Any Device
                    </option>

                    <option value="DESKTOP_ONLY">
                      Desktop / Laptop Only
                    </option>

                    <option value="REGISTERED_DEVICE">
                      Registered Device Only
                    </option>
                  </select>

                  <small>
                    Restrict the type of
                    device allowed to launch
                    this assessment.
                  </small>
                </label>

                <label className="form-field">
                  <span>
                    Allowed IP Addresses
                  </span>

                  <textarea
                    rows={4}
                    value={
                      delivery.allowedIpAddresses ??
                      ""
                    }
                    onChange={(event) =>
                      updateField(
                        "allowedIpAddresses",
                        event.target.value,
                      )
                    }
                    placeholder="Example: 192.168.1.10, 192.168.1.20"
                  />

                  <small>
                    Leave blank to allow
                    access from any network.
                    Later this can support
                    IP ranges and CIDR.
                  </small>
                </label>
              </div>

              {/* PROCTORING */}

              <div className="advanced-group">
                <div className="advanced-group-heading">
                  <h3>
                    Proctoring
                  </h3>

                  <p>
                    Controls used for
                    identity and remote
                    supervision.
                  </p>
                </div>

                <div className="advanced-toggle-list">
                  <DeliveryToggle
                    title="Camera Proctoring"
                    description="Require camera access and maintain camera availability during the assessment."
                    checked={
                      delivery.cameraProctoring
                    }
                    onChange={(checked) =>
                      updateField(
                        "cameraProctoring",
                        checked,
                      )
                    }
                  />

                  <DeliveryToggle
                    title="Microphone Monitoring"
                    description="Require microphone access for supported proctored assessment sessions."
                    checked={
                      delivery.microphoneMonitoring
                    }
                    onChange={(checked) =>
                      updateField(
                        "microphoneMonitoring",
                        checked,
                      )
                    }
                  />

                  <DeliveryToggle
                    title="Identity Verification"
                    description="Verify the learner identity before allowing the assessment attempt to begin."
                    checked={
                      delivery.identityVerification
                    }
                    onChange={(checked) =>
                      updateField(
                        "identityVerification",
                        checked,
                      )
                    }
                  />
                </div>
              </div>

              {/* BROWSER / CONTENT PROTECTION */}

              <div className="advanced-group">
                <div className="advanced-group-heading">
                  <h3>
                    Browser & Content
                    Protection
                  </h3>

                  <p>
                    Reduce common ways
                    assessment content may
                    be copied or accessed
                    outside the workspace.
                  </p>
                </div>

                <div className="advanced-toggle-list">
                  <DeliveryToggle
                    title="Block Browser Extensions"
                    description="Detect or restrict unsupported browser extensions where technically supported."
                    checked={
                      delivery.blockBrowserExtensions
                    }
                    onChange={(checked) =>
                      updateField(
                        "blockBrowserExtensions",
                        checked,
                      )
                    }
                  />

                  <DeliveryToggle
                    title="Disable Right Click"
                    description="Disable the browser context menu inside protected assessment screens."
                    checked={
                      delivery.disableRightClick
                    }
                    onChange={(checked) =>
                      updateField(
                        "disableRightClick",
                        checked,
                      )
                    }
                  />

                  <DeliveryToggle
                    title="Prevent Printing"
                    description="Block standard print actions from the assessment workspace where supported."
                    checked={
                      delivery.preventPrinting
                    }
                    onChange={(checked) =>
                      updateField(
                        "preventPrinting",
                        checked,
                      )
                    }
                  />

                  <DeliveryToggle
                    title="Screenshot Protection"
                    description="Enable screenshot deterrence or detection where supported by the learner environment."
                    checked={
                      delivery.preventScreenshots
                    }
                    onChange={(checked) =>
                      updateField(
                        "preventScreenshots",
                        checked,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </details>
        </section>

        {/* VALIDATION */}

        {errors.length > 0 && (
          <section className="validation-panel">
            <strong>
              Complete the delivery
              configuration before
              continuing.
            </strong>

            <ul>
              {errors.map(
                (error, index) => (
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

        {/* FOOTER */}

        <footer className="delivery-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              router.push(
                `/assessments/${assessmentId}/scoring`,
              )
            }
          >
            ← Scoring & Rules
          </button>

          <div className="footer-actions">
            <button
              type="button"
              className="primary-button"
              onClick={
                saveAndContinue
              }
            >
              Continue →
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
        complete ? "complete" : ""
      }`}
    >
      <span className="step-number">
        {complete ? "✓" : number}
      </span>

      <span>{label}</span>
    </div>
  );
}

/* ============================================================
   DELIVERY TOGGLE
   ============================================================ */

interface DeliveryToggleProps {
  title: string;

  description: string;

  checked: boolean;

  onChange: (
    checked: boolean,
  ) => void;
}

function DeliveryToggle({
  title,
  description,
  checked,
  onChange,
}: DeliveryToggleProps) {
  return (
    <div className="delivery-toggle-row">
      <div className="toggle-description">
        <strong>{title}</strong>

        <p>{description}</p>
      </div>

      <label className="switch">
        <input
          type="checkbox"
          checked={Boolean(checked)}
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
