"use client";

import {
  useRouter,
  useParams,
} from "next/navigation";

import {
  useState,
} from "react";

import {
  API_URL,
} from "@/src/lib/api/fetcher";

import "./structure.css";

/* ============================================================
   TYPES
   ============================================================ */

interface AssessmentSection {
  name: string;
  description: string;
  marks: number;
  timeLimitMinutes: number;
}

/* ============================================================
   PAGE
   ============================================================ */

export default function AssessmentStructurePage() {
  const router = useRouter();
  const params = useParams();

  const assessmentId =
    params.assessmentId as string;

  /* ============================================================
     STATE
     ============================================================ */

  const [section, setSection] =
    useState<AssessmentSection>({
      name: "",
      description: "",
      marks: 0,
      timeLimitMinutes: 0,
    });

  const [errors, setErrors] =
    useState<string[]>([]);

  const [saving, setSaving] =
    useState(false);

  /* ============================================================
     UPDATE FIELD
     ============================================================ */

  function updateSection<
    K extends keyof AssessmentSection,
  >(
    field: K,
    value: AssessmentSection[K],
  ) {
    setSection(
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

  function validateSection() {
    const validationErrors: string[] =
      [];

    if (!assessmentId) {
      validationErrors.push(
        "Assessment ID is missing.",
      );
    }

    if (!section.name.trim()) {
      validationErrors.push(
        "Section name is required.",
      );
    }

    if (
      section.marks <= 0
    ) {
      validationErrors.push(
        "Total marks must be greater than zero.",
      );
    }

    if (
      section.timeLimitMinutes <=
      0
    ) {
      validationErrors.push(
        "Duration must be greater than zero minutes.",
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
     SAVE SECTION
     ============================================================ */

  async function saveSection() {
    /*
     * Backend payload intentionally remains:
     *
     * assessmentId
     * title
     * description
     * totalMarks
     * durationMinutes
     * sequence
     */

    const payload = {
      assessmentId,

      title:
        section.name.trim(),

      description:
        section.description.trim(),

      totalMarks:
        Number(section.marks),

      durationMinutes:
        Number(
          section.timeLimitMinutes,
        ),

      sequence: 1,
    };

    try {
      setSaving(true);

      console.log(
        "SAVING ASSESSMENT SECTION:",
        payload,
      );

      const response =
        await fetch(
          `${API_URL}/assessment-sections`,
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
          "Section save failed.";

        /*
         * Handle NestJS-style:
         *
         * {
         *   "message": "..."
         * }
         *
         * or:
         *
         * {
         *   "message": ["...", "..."]
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
              errorData.message;
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

      console.log(
        "Assessment section saved successfully.",
      );

      return true;
    } catch (error) {
      console.error(
        "Assessment section save failed:",
        error,
      );

      setErrors([
        error instanceof Error
          ? error.message
          : "Unable to save assessment section.",
      ]);

      return false;
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     SAVE & CONTINUE
     ============================================================ */

  async function saveAndContinue() {
    if (!validateSection()) {
      return;
    }

    const saved =
      await saveSection();

    if (!saved) {
      return;
    }

    router.push(
      `/assessments/${assessmentId}/questions`,
    );
  }

  /* ============================================================
     BACK TO SETUP
     ============================================================ */

  function goBackToSetup() {
    if (saving) {
      return;
    }

    router.push(
      `/assessments/${assessmentId}/edit`,
    );
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <main className="structure-page">
      <div className="structure-card">

        {/* ====================================================
            BACK LINK
        ==================================================== */}

        <button
          type="button"
          className="back-link"
          disabled={saving}
          onClick={
            goBackToSetup
          }
        >
          ← Back to Assessment Setup
        </button>

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="structure-header">
          <span className="step-caption">
            STEP 2 OF 6
          </span>

          <h1>
            Assessment Structure
          </h1>

          <p>
            Configure the assessment
            section before adding
            questions.
          </p>
        </div>

        {/* ====================================================
            FORM
        ==================================================== */}

        <div className="form-section">

          {/* ==================================================
              SECTION NAME
          ================================================== */}

          <label
            htmlFor="section-name"
          >
            Section Name
          </label>

          <input
            id="section-name"
            type="text"
            value={
              section.name
            }
            placeholder="e.g. Programming Fundamentals"
            disabled={saving}
            onChange={(event) =>
              updateSection(
                "name",
                event.target.value,
              )
            }
          />

          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <label
            htmlFor="section-description"
          >
            Description
          </label>

          <textarea
            id="section-description"
            value={
              section.description
            }
            placeholder="Describe what this section covers..."
            rows={4}
            disabled={saving}
            onChange={(event) =>
              updateSection(
                "description",
                event.target.value,
              )
            }
          />

          {/* ==================================================
              TOTAL MARKS
          ================================================== */}

          <label
            htmlFor="section-marks"
          >
            Total Marks
          </label>

          <input
            id="section-marks"
            type="number"
            min={1}
            step={1}
            value={
              section.marks
            }
            disabled={saving}
            onChange={(event) =>
              updateSection(
                "marks",
                Math.max(
                  0,
                  Number(
                    event.target.value,
                  ),
                ),
              )
            }
          />

          {/* ==================================================
              DURATION
          ================================================== */}

          <label
            htmlFor="section-duration"
          >
            Duration Minutes
          </label>

          <input
            id="section-duration"
            type="number"
            min={1}
            step={1}
            value={
              section.timeLimitMinutes
            }
            disabled={saving}
            onChange={(event) =>
              updateSection(
                "timeLimitMinutes",
                Math.max(
                  0,
                  Number(
                    event.target.value,
                  ),
                ),
              )
            }
          />

        </div>

        {/* ====================================================
            VALIDATION
        ==================================================== */}

        {errors.length > 0 && (
          <section className="validation-panel">

            <strong>
              Complete the section
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

        <div className="footer-actions">

          <button
            type="button"
            className="secondary-button"
            disabled={saving}
            onClick={
              goBackToSetup
            }
          >
            ← Back
          </button>

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
              : "Save & Continue →"}
          </button>

        </div>

      </div>
    </main>
  );
}
