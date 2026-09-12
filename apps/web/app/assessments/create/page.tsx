"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import "./create-assessment.css";

import { API_URL } from "@/lib/api/fetcher";
/* ============================================================
   TYPES
   ============================================================ */

type AssessmentType =
  | "CODING_ASSESSMENT"
  | "SKILL_ASSESSMENT"
  | "SCREENING"
  | "PRACTICE_ASSESSMENT"
  | "CERTIFICATION";

type AssessmentPurpose =
  | "PRACTICE"
  | "SKILL_VALIDATION"
  | "SCREENING"
  | "CERTIFICATION"
  | "TRAINING_EVALUATION";

type Difficulty =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "MIXED";

interface AssessmentForm {
  title: string;
  code: string;

  description: string;
  instructions: string;

  type: AssessmentType;
  purpose: AssessmentPurpose;

  technology: string;
  difficulty: Difficulty;

  plannedQuestions: number;
  totalMarks: number;
  durationMinutes: number;

  version: string;

  tags: string;
}

interface CreatedAssessment {
  id: string;
  title?: string;
  code?: string;
}

/* ============================================================
   INITIAL FORM
   ============================================================ */

const INITIAL_FORM: AssessmentForm = {
  title: "",
  code: "",

  description: "",
  instructions: "",

  type: "CODING_ASSESSMENT",
  purpose: "SKILL_VALIDATION",

  technology: "C",
  difficulty: "BEGINNER",

  plannedQuestions: 10,
  totalMarks: 100,
  durationMinutes: 60,

  version: "1.0",

  tags: "",
};

/* ============================================================
   PAGE
   ============================================================ */

export default function CreateAssessmentPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<AssessmentForm>(
      INITIAL_FORM,
    );

  const [errors, setErrors] =
    useState<string[]>([]);

  const [saving, setSaving] =
    useState(false);

  /* ============================================================
     UPDATE FIELD
     ============================================================ */

  function updateField<
    K extends keyof AssessmentForm,
  >(
    field: K,
    value: AssessmentForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors([]);
  }

  /* ============================================================
     VALIDATION
     ============================================================ */

  function validateForm() {
    const validationErrors: string[] =
      [];

    if (!form.title.trim()) {
      validationErrors.push(
        "Assessment title is required.",
      );
    }

    if (
      form.title.trim() &&
      form.title.trim().length < 5
    ) {
      validationErrors.push(
        "Assessment title must contain minimum 5 characters.",
      );
    }

    if (!form.code.trim()) {
      validationErrors.push(
        "Assessment code is required.",
      );
    }

    if (
      form.code.trim() &&
      !/^[A-Z0-9_-]+$/i.test(
        form.code.trim(),
      )
    ) {
      validationErrors.push(
        "Assessment code can contain only letters, numbers, hyphens and underscores.",
      );
    }

    if (!form.technology.trim()) {
      validationErrors.push(
        "Technology selection is required.",
      );
    }

    if (!form.description.trim()) {
      validationErrors.push(
        "Assessment description is required.",
      );
    }

    if (!form.instructions.trim()) {
      validationErrors.push(
        "Learner instructions are required.",
      );
    }

    if (
      form.plannedQuestions <= 0
    ) {
      validationErrors.push(
        "Planned questions must be greater than zero.",
      );
    }

    if (
      form.totalMarks <= 0
    ) {
      validationErrors.push(
        "Total marks must be greater than zero.",
      );
    }

    if (
      form.durationMinutes <= 0
    ) {
      validationErrors.push(
        "Duration must be greater than zero.",
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
     CREATE ASSESSMENT
     ============================================================ */

  async function createAssessment() {
    /*
     * Keep backend payload compatible
     * with the existing Assessment API.
     */

    const payload = {
      organizationId:
        "ORG001",

      title:
        form.title.trim(),

      code:
        form.code.trim(),

      assessmentType:
        form.type,

      description:
        form.description.trim(),

      instructions:
        form.instructions.trim(),

      technology:
        form.technology,

      difficulty:
        form.difficulty,

      plannedQuestions:
        Number(
          form.plannedQuestions,
        ),

      totalMarks:
        Number(
          form.totalMarks,
        ),

      durationMinutes:
        Number(
          form.durationMinutes,
        ),

      createdByUserId:
        "ADMIN001",
    };

    try {
      setSaving(true);

      console.log(
        "CREATE ASSESSMENT REQUEST:",
        payload,
      );

      const response =
        await fetch(
          `${API_URL}/assessment`,
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
        const responseText =
          await response.text();

        let errorMessage =
          "Unable to save assessment.";

        /*
         * Supports NestJS-style responses:
         *
         * {
         *   message: "..."
         * }
         *
         * OR
         *
         * {
         *   message: ["...", "..."]
         * }
         */

        try {
          const errorData =
            responseText
              ? JSON.parse(
                  responseText,
                )
              : null;

          if (
            Array.isArray(
              errorData?.message,
            )
          ) {
            errorMessage =
              errorData.message.join(
                "; ",
              );
          } else if (
            errorData?.message
          ) {
            errorMessage =
              String(
                errorData.message,
              );
          } else if (
            responseText.trim()
          ) {
            errorMessage =
              responseText;
          }
        } catch {
          if (
            responseText.trim()
          ) {
            errorMessage =
              responseText;
          }
        }

        throw new Error(
          errorMessage,
        );
      }

      const assessment =
        (await response.json()) as CreatedAssessment;

      console.log(
        "Created Assessment:",
        assessment,
      );

      if (!assessment?.id) {
        throw new Error(
          "Assessment was created, but the backend did not return an assessment ID.",
        );
      }

      /*
       * Keep the current assessment ID
       * available for the authoring flow.
       */

      sessionStorage.setItem(
        "currentAssessmentId",
        assessment.id,
      );

      /*
       * Continue to Step 2.
       */

      router.push(
        `/assessments/${assessment.id}/structure`,
      );
    } catch (error) {
      console.error(
        "CREATE ASSESSMENT ERROR:",
        error,
      );

      setErrors([
        error instanceof Error
          ? error.message
          : "Unable to save assessment. Please try again.",
      ]);
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     SAVE & CONTINUE
     ============================================================ */

  async function saveAndContinue() {
    if (saving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    await createAssessment();
  }

  /* ============================================================
     CANCEL
     ============================================================ */

  function cancelAssessment() {
    if (saving) {
      return;
    }

    router.push(
      "/assessments",
    );
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <main className="create-assessment-page">

      <div className="create-assessment-container">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="create-assessment-header">

          <div>

            <button
              type="button"
              className="back-link"
              disabled={saving}
              onClick={() =>
                router.push(
                  "/assessments",
                )
              }
            >
              ← Assessments
            </button>

            <h1>
              Create Assessment
            </h1>

            <p>
              Define the basic
              information and planned
              structure for this
              assessment.
            </p>

          </div>

          <div className="draft-badge">
            Draft
          </div>

        </header>

        {/* ====================================================
            AUTHORING LAYOUT
        ==================================================== */}

        <div className="assessment-authoring-layout">

          {/* ==================================================
              STEPPER
          ================================================== */}

          <aside className="assessment-stepper">

            <Step
              number={1}
              title="Assessment Setup"
              active
            />

            <Step
              number={2}
              title="Structure"
            />

            <Step
              number={3}
              title="Questions"
            />

            <Step
              number={4}
              title="Scoring"
            />

            <Step
              number={5}
              title="Rules"
            />

            <Step
              number={6}
              title="Security & AI"
            />

            <Step
              number={7}
              title="Schedule"
            />

            <Step
              number={8}
              title="Assignment"
            />

            <Step
              number={9}
              title="Preview"
            />

            <Step
              number={10}
              title="Review & Publish"
            />

          </aside>

          {/* ==================================================
              FORM
          ================================================== */}

          <section className="assessment-form-card">

            <div className="section-header">

              <div>

                <span className="step-label">
                  STEP 1 OF 10
                </span>

                <h2>
                  Assessment Setup
                </h2>

                <p>
                  Define the identity,
                  purpose and high-level
                  plan for this
                  assessment.
                </p>

              </div>

            </div>

            {/* =================================================
                ERRORS
            ================================================= */}

            {errors.length > 0 && (
              <div className="error-box">

                <strong>
                  Please correct:
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

            {/* =================================================
                BASIC INFORMATION
            ================================================= */}

            <section className="form-section">

              <h3>
                Basic Information
              </h3>

              <div className="form-grid">

                <div className="field full-width">

                  <label htmlFor="title">
                    Assessment Title

                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    id="title"
                    type="text"
                    maxLength={180}
                    placeholder="Example: C Programming Fundamentals - Level 1"
                    value={form.title}
                    disabled={saving}
                    onChange={(event) =>
                      updateField(
                        "title",
                        event.target
                          .value,
                      )
                    }
                  />

                  <div className="field-help-row">

                    <small>
                      Use a clear title
                      learners and
                      administrators can
                      understand.
                    </small>

                    <small>
                      {
                        form.title
                          .length
                      }
                      /180
                    </small>

                  </div>

                </div>

                <div className="field">

                  <label htmlFor="code">
                    Assessment Code

                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    id="code"
                    type="text"
                    maxLength={100}
                    placeholder="C-FUND-L1-001"
                    value={form.code}
                    disabled={saving}
                    onChange={(event) =>
                      updateField(
                        "code",
                        event.target.value
                          .toUpperCase(),
                      )
                    }
                  />

                </div>

                <div className="field">

                  <label htmlFor="version">
                    Version
                  </label>

                  <input
                    id="version"
                    type="text"
                    value={
                      form.version
                    }
                    disabled={saving}
                    onChange={(event) =>
                      updateField(
                        "version",
                        event.target.value,
                      )
                    }
                  />

                </div>

              </div>

            </section>

            {/* =================================================
                PURPOSE & CLASSIFICATION
            ================================================= */}

            <section className="form-section">

              <h3>
                Purpose &
                Classification
              </h3>

              <div className="form-grid">

                <div className="field">

                  <label htmlFor="type">
                    Assessment Type
                  </label>

                  <select
                    id="type"
                    value={
                      form.type
                    }
                    disabled={saving}
                    onChange={(event) =>
                      updateField(
                        "type",
                        event.target
                          .value as AssessmentType,
                      )
                    }
                  >

                    <option value="CODING_ASSESSMENT">
                      Coding Assessment
                    </option>

                    <option value="SKILL_ASSESSMENT">
                      Skill Assessment
                    </option>

                    <option value="SCREENING">
                      Screening
                    </option>

                    <option value="PRACTICE_ASSESSMENT">
                      Practice Assessment
                    </option>

                    <option value="CERTIFICATION">
                      Certification
                    </option>

                  </select>

                </div>

                <div className="field">

                  <label htmlFor="purpose">
                    Purpose
                  </label>

                  <select
                    id="purpose"
                    value={
                      form.purpose
                    }
                    disabled={saving}
                    onChange={(event) =>
                      updateField(
                        "purpose",
                        event.target
                          .value as AssessmentPurpose,
                      )
                    }
                  >

                    <option value="PRACTICE">
                      Practice
                    </option>

                    <option value="SKILL_VALIDATION">
                      Skill Validation
                    </option>

                    <option value="SCREENING">
                      Screening
                    </option>

                    <option value="CERTIFICATION">
                      Certification
                    </option>

                    <option value="TRAINING_EVALUATION">
                      Training Evaluation
                    </option>

                  </select>

                </div>

                <div className="field">

                  <label htmlFor="technology">
                    Primary Technology
                  </label>

                  <select
                    id="technology"
                    value={
                      form.technology
                    }
                    disabled={saving}
                    onChange={(event) =>
                      updateField(
                        "technology",
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

                    <option value="JAVA">
                      Java
                    </option>

                    <option value="PYTHON">
                      Python
                    </option>

                    <option value="JAVASCRIPT">
                      JavaScript
                    </option>

                    <option value="TYPESCRIPT">
                      TypeScript
                    </option>

                    <option value="CSHARP">
                      C#
                    </option>

                    <option value="GO">
                      Go
                    </option>

                    <option value="MULTI">
                      Multi Technology
                    </option>

                  </select>

                </div>

                <div className="field">

                  <label htmlFor="difficulty">
                    Overall Difficulty
                  </label>

                  <select
                    id="difficulty"
                    value={
                      form.difficulty
                    }
                    disabled={saving}
                    onChange={(event) =>
                      updateField(
                        "difficulty",
                        event.target
                          .value as Difficulty,
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

                    <option value="MIXED">
                      Mixed
                    </option>

                  </select>

                </div>

              </div>

            </section>

            {/* =================================================
                ASSESSMENT PLAN
            ================================================= */}

            <section className="form-section">

              <h3>
                Assessment Plan
              </h3>

              <div className="plan-grid">

                <NumberCard
                  label="Planned Questions"
                  value={
                    form.plannedQuestions
                  }
                  min={1}
                  suffix="questions"
                  disabled={saving}
                  onChange={(value) =>
                    updateField(
                      "plannedQuestions",
                      value,
                    )
                  }
                />

                <NumberCard
                  label="Total Marks"
                  value={
                    form.totalMarks
                  }
                  min={1}
                  suffix="marks"
                  disabled={saving}
                  onChange={(value) =>
                    updateField(
                      "totalMarks",
                      value,
                    )
                  }
                />

                <NumberCard
                  label="Duration"
                  value={
                    form.durationMinutes
                  }
                  min={1}
                  suffix="minutes"
                  disabled={saving}
                  onChange={(value) =>
                    updateField(
                      "durationMinutes",
                      value,
                    )
                  }
                />

              </div>

              <div className="plan-note">

                These values represent
                the assessment plan.

                The system will later
                compare them against the
                actual questions, marks
                and sections configured
                in the assessment.

              </div>

            </section>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <section className="form-section">

              <h3>
                Description
              </h3>

              <div className="field">

                <label htmlFor="description">
                  Assessment Description

                  <span className="required">
                    *
                  </span>
                </label>

                <textarea
                  id="description"
                  rows={5}
                  maxLength={1500}
                  placeholder="Describe the purpose, coverage and expected learner capability..."
                  value={
                    form.description
                  }
                  disabled={saving}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target
                        .value,
                    )
                  }
                />

                <div className="field-help-row">

                  <small>
                    Visible to relevant
                    assessment managers.
                  </small>

                  <small>
                    {
                      form.description
                        .length
                    }
                    /1500
                  </small>

                </div>

              </div>

            </section>

            {/* =================================================
                LEARNER INSTRUCTIONS
            ================================================= */}

            <section className="form-section">

              <h3>
                Learner Instructions
              </h3>

              <div className="field">

                <label htmlFor="instructions">
                  Instructions

                  <span className="required">
                    *
                  </span>
                </label>

                <textarea
                  id="instructions"
                  rows={6}
                  maxLength={3000}
                  placeholder="Example: Read each question carefully. You may run code before submitting..."
                  value={
                    form.instructions
                  }
                  disabled={saving}
                  onChange={(event) =>
                    updateField(
                      "instructions",
                      event.target
                        .value,
                    )
                  }
                />

                <div className="field-help-row">

                  <small>
                    These instructions
                    can later appear on
                    the learner
                    assessment
                    instruction screen.
                  </small>

                  <small>
                    {
                      form.instructions
                        .length
                    }
                    /3000
                  </small>

                </div>

              </div>

            </section>

            {/* =================================================
                TAGS
            ================================================= */}

            <section className="form-section">

              <h3>
                Tags
              </h3>

              <div className="field">

                <label htmlFor="tags">
                  Assessment Tags
                </label>

                <input
                  id="tags"
                  type="text"
                  placeholder="C, fundamentals, screening, beginner"
                  value={
                    form.tags
                  }
                  disabled={saving}
                  onChange={(event) =>
                    updateField(
                      "tags",
                      event.target
                        .value,
                    )
                  }
                />

                <small>
                  Separate tags using
                  commas.
                </small>

              </div>

            </section>

            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="assessment-form-footer">

              <button
                type="button"
                className="cancel-button"
                disabled={saving}
                onClick={
                  cancelAssessment
                }
              >
                Cancel
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
                    ? "Creating Assessment..."
                    : "Save & Continue →"}
                </button>

              </div>

            </footer>

          </section>

        </div>

      </div>

    </main>
  );
}

/* ============================================================
   STEPPER
   ============================================================ */

interface StepProps {
  number: number;
  title: string;
  active?: boolean;
}

function Step({
  number,
  title,
  active = false,
}: StepProps) {
  return (
    <div
      className={`step-item ${
        active
          ? "step-item-active"
          : ""
      }`}
    >

      <span className="step-number">
        {number}
      </span>

      <span className="step-title">
        {title}
      </span>

    </div>
  );
}

/* ============================================================
   NUMBER CARD
   ============================================================ */

interface NumberCardProps {
  label: string;
  value: number;
  min: number;
  suffix: string;
  disabled?: boolean;
  onChange: (
    value: number,
  ) => void;
}

function NumberCard({
  label,
  value,
  min,
  suffix,
  disabled = false,
  onChange,
}: NumberCardProps) {
  return (
    <div className="number-card">

      <label>
        {label}
      </label>

      <input
        type="number"
        min={min}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            Math.max(
              0,
              Number(
                event.target.value,
              ),
            ),
          )
        }
      />

      <span>
        {suffix}
      </span>

    </div>
  );
}
