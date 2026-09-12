"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import "./assessments.css";

type AssessmentStatus =
  | "DRAFT"
  | "COMPLETED"
  | "PUBLISHED";

interface Assessment {
  id: string;
  code: string;
  title: string;

  type: string;
  technology: string;
  difficulty: string;

  questions: number;
  marks: number;
  duration: number;

  status: AssessmentStatus;

  updatedAt: string;

  builderStep?: string;
}

export default function AssessmentsPage() {
  const router = useRouter();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [type, setType] =
    useState("ALL");

  const [technology, setTechnology] =
    useState("ALL");

  const [difficulty, setDifficulty] =
    useState("ALL");

  /* ============================================================
     LOAD ASSESSMENTS
     ============================================================ */

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/assessment`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load assessments (${response.status})`,
        );
      }

      const responseData =
        await response.json();

      const data =
        Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.data)
            ? responseData.data
            : [];

      /* ========================================================
         STATUS NORMALIZATION
         ======================================================== */

      const normalizedStatus = (
        value: string,
      ): AssessmentStatus => {
        const currentStatus =
          String(value ?? "")
            .toUpperCase()
            .trim();

        if (
          currentStatus ===
          "PUBLISHED"
        ) {
          return "PUBLISHED";
        }

        if (
          currentStatus ===
            "COMPLETED" ||
          currentStatus ===
            "APPROVED" ||
          currentStatus ===
            "IN_REVIEW"
        ) {
          return "COMPLETED";
        }

        return "DRAFT";
      };

      /* ========================================================
         TEXT FORMATTER
         ======================================================== */

      const formatText = (
        value:
          | string
          | null
          | undefined,
      ) => {
        if (!value) {
          return "-";
        }

        return String(value)
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(
            /\b\w/g,
            (char) =>
              char.toUpperCase(),
          );
      };

      /* ========================================================
         NORMALIZE ASSESSMENTS
         ======================================================== */

      setAssessments(
        data.map((item: any) => ({
          id: String(
            item.id ?? "",
          ),

          code: String(
            item.code ?? "-",
          ),

          title: String(
            item.title ??
              "Untitled Assessment",
          ),

          type: formatText(
            item.assessmentType,
          ),

          technology: item.technology
            ? String(
                item.technology,
              )
            : "-",

          difficulty: formatText(
            item.difficulty,
          ),

          questions: Number(
            item.plannedQuestions ??
              0,
          ),

          marks: Number(
            item.totalMarks ?? 0,
          ),

          duration: Number(
            item.durationMinutes ??
              0,
          ),

          status:
            normalizedStatus(
              item.status,
            ),

          /*
           * Keep the backend builderStep.
           *
           * Navigation is normalized later so that
           * legacy "assessment-sections" values can
           * never create an old route.
           */
          builderStep:
            item.builderStep
              ? String(
                  item.builderStep,
                )
              : "SETUP",

          updatedAt:
            item.updatedAt
              ? new Date(
                  item.updatedAt,
                ).toLocaleDateString()
              : "-",
        })),
      );
    } catch (error) {
      console.error(
        "ASSESSMENT LOAD ERROR",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     NORMALIZE BUILDER STEP
     
     IMPORTANT:
     Assessment Sections has been removed from the flow.
     
     Therefore:
     
     assessment-sections
             ↓
     structure
     
     There is NO navigation to:
     
     /assessment-sections
     ============================================================ */

  function getBuilderRoute(
    builderStep?: string,
  ): string {
    const step =
      String(
        builderStep ?? "",
      )
        .trim()
        .toLowerCase()
        .replaceAll("_", "-")
        .replaceAll(" ", "-");

    switch (step) {
      /* --------------------------------------------------------
         STEP 1
         -------------------------------------------------------- */

      case "":
      case "setup":
      case "assessment-setup":
      case "create":
      case "edit":
      case "assessment":
        return "edit";

      /* --------------------------------------------------------
         STEP 2
         
         Current flow:
         Assessment Structure
         
         Legacy assessment-sections values are deliberately
         mapped to structure.
         -------------------------------------------------------- */

      case "structure":
      case "assessment-structure":
      case "assessment-section":
      case "assessment-sections":
      case "sections":
        return "structure";

      /* --------------------------------------------------------
         STEP 3
         -------------------------------------------------------- */

      case "question":
      case "questions":
      case "assessment-questions":
        return "questions";

      /* --------------------------------------------------------
         STEP 4
         -------------------------------------------------------- */

      case "scoring":
      case "scoring-rules":
      case "rules":
        return "scoring";

      /* --------------------------------------------------------
         STEP 5
         -------------------------------------------------------- */

      case "delivery":
      case "security":
      case "schedule":
      case "assignment":
        return "delivery";

      /* --------------------------------------------------------
         STEP 6
         -------------------------------------------------------- */

      case "review":
      case "preview":
      case "review-publish":
        return "review";

      /* --------------------------------------------------------
         PUBLISH
         -------------------------------------------------------- */

      case "publish":
        return "publish";

      /* --------------------------------------------------------
         FALLBACK
         -------------------------------------------------------- */

      default:
        return "edit";
    }
  }

  /* ============================================================
     OPEN ASSESSMENT
     ============================================================ */

  function openAssessment(
    assessment: Assessment,
  ) {
    /*
     * Published assessments always open in
     * read-only review mode.
     */
    if (
      assessment.status ===
      "PUBLISHED"
    ) {
      router.push(
        `/assessments/${assessment.id}/review?mode=view`,
      );

      return;
    }

    /*
     * Draft assessments continue from their
     * current authoring step.
     */
    if (
      assessment.status ===
      "DRAFT"
    ) {
      const step =
        getBuilderRoute(
          assessment.builderStep,
        );

      router.push(
        `/assessments/${assessment.id}/${step}`,
      );

      return;
    }

    /*
     * Completed / other states.
     */
    router.push(
      `/assessments/${assessment.id}/review`,
    );
  }

  /* ============================================================
     OPEN RESULTS
     ============================================================ */

  function openResults(
    assessment: Assessment,
  ) {
    router.push(
      `/assessments/${assessment.id}/results`,
    );
  }

  /* ============================================================
     DELETE
     ============================================================ */

  async function deleteAssessment(
    id: string,
  ) {
    try {
      const response =
        await fetch(
          `${API_URL}/assessment/${id}`,
          {
            method: "DELETE",
          },
        );

      if (!response.ok) {
        throw new Error(
          "Unable to delete assessment.",
        );
      }

      await loadAssessments();
    } catch (error) {
      console.error(
        "ASSESSMENT DELETE ERROR",
        error,
      );
    }
  }

  /* ============================================================
     CLONE
     ============================================================ */

  function cloneAssessment(
    id: string,
  ) {
    router.push(
      `/assessments/create?clone=${id}`,
    );
  }

  /* ============================================================
     UNPUBLISH
     ============================================================ */

  async function unpublishAssessment(
    id: string,
  ) {
    try {
      const response =
        await fetch(
          `${API_URL}/assessment/${id}/unpublish`,
          {
            method: "PATCH",
          },
        );

      if (!response.ok) {
        throw new Error(
          "Unable to unpublish assessment.",
        );
      }

      await loadAssessments();
    } catch (error) {
      console.error(
        "ASSESSMENT UNPUBLISH ERROR",
        error,
      );
    }
  }

  /* ============================================================
     FILTER OPTIONS
     ============================================================ */

  const assessmentTypes =
    useMemo(
      () =>
        Array.from(
          new Set(
            assessments
              .map(
                (item) =>
                  item.type,
              )
              .filter(
                (value) =>
                  Boolean(value) &&
                  value !== "-",
              ),
          ),
        ).sort(),
      [assessments],
    );

  const technologies =
    useMemo(
      () =>
        Array.from(
          new Set(
            assessments
              .map(
                (item) =>
                  item.technology,
              )
              .filter(
                (value) =>
                  Boolean(value) &&
                  value !== "-",
              ),
          ),
        ).sort(),
      [assessments],
    );

  const difficulties =
    useMemo(
      () =>
        Array.from(
          new Set(
            assessments
              .map(
                (item) =>
                  item.difficulty,
              )
              .filter(
                (value) =>
                  Boolean(value) &&
                  value !== "-",
              ),
          ),
        ).sort(),
      [assessments],
    );

  /* ============================================================
     FILTER ASSESSMENTS
     ============================================================ */

  const filteredAssessments =
    useMemo(() => {
      return assessments.filter(
        (assessment) => {
          const searchValue =
            search
              .trim()
              .toLowerCase();

          const matchesSearch =
            !searchValue ||
            assessment.title
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            assessment.code
              .toLowerCase()
              .includes(
                searchValue,
              );

          const matchesStatus =
            status === "ALL" ||
            assessment.status ===
              status;

          const matchesType =
            type === "ALL" ||
            assessment.type ===
              type;

          const matchesTechnology =
            technology === "ALL" ||
            assessment.technology ===
              technology;

          const matchesDifficulty =
            difficulty === "ALL" ||
            assessment.difficulty ===
              difficulty;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesType &&
            matchesTechnology &&
            matchesDifficulty
          );
        },
      );
    }, [
      assessments,
      search,
      status,
      type,
      technology,
      difficulty,
    ]);

  /* ============================================================
     SUMMARY COUNTS
     ============================================================ */

  const totalAssessments =
    assessments.length;

  const draftCount =
    assessments.filter(
      (assessment) =>
        assessment.status ===
        "DRAFT",
    ).length;

  const completedCount =
    assessments.filter(
      (assessment) =>
        assessment.status ===
        "COMPLETED",
    ).length;

  const publishedCount =
    assessments.filter(
      (assessment) =>
        assessment.status ===
        "PUBLISHED",
    ).length;

  /* ============================================================
     CREATE ASSESSMENT
     ============================================================ */

  function createAssessment() {
    router.push(
      "/assessments/create",
    );
  }

  /* ============================================================
     STATUS CLASS
     ============================================================ */

  function getStatusClass(
    assessmentStatus:
      AssessmentStatus,
  ) {
    switch (
      assessmentStatus
    ) {
      case "DRAFT":
        return "status-draft";

      case "COMPLETED":
        return "status-approved";

      case "PUBLISHED":
        return "status-published";

      default:
        return "";
    }
  }

  /* ============================================================
     STATUS FORMAT
     ============================================================ */

  function formatStatus(
    assessmentStatus:
      AssessmentStatus,
  ) {
    return assessmentStatus
      .replaceAll("_", " ");
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <main className="assessment-page">
      <div className="assessment-container">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="assessment-header">

          <div>
            <h1>
              Assessments
            </h1>

            <p>
              Create, manage,
              review and publish
              assessments for
              learners.
            </p>
          </div>

          <button
            type="button"
            className="create-assessment-button"
            onClick={
              createAssessment
            }
          >
            + Create Assessment
          </button>

        </header>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section className="summary-grid">

          <SummaryCard
            label="Total Assessments"
            value={
              totalAssessments
            }
          />

          <SummaryCard
            label="Draft"
            value={
              draftCount
            }
          />

          <SummaryCard
            label="Completed"
            value={
              completedCount
            }
          />

          <SummaryCard
            label="Published"
            value={
              publishedCount
            }
          />

        </section>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <section className="assessment-filter-card">

          <div className="assessment-filter-grid">

            <input
              className="assessment-input"
              type="text"
              placeholder="Search assessment name or code..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />

            <select
              className="assessment-select"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value,
                )
              }
            >
              <option value="ALL">
                All Status
              </option>

              <option value="DRAFT">
                Draft
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="PUBLISHED">
                Published
              </option>
            </select>

            <select
              className="assessment-select"
              value={type}
              onChange={(event) =>
                setType(
                  event.target.value,
                )
              }
            >
              <option value="ALL">
                All Types
              </option>

              {assessmentTypes.map(
                (typeValue) => (
                  <option
                    key={typeValue}
                    value={typeValue}
                  >
                    {typeValue}
                  </option>
                ),
              )}
            </select>

            <select
              className="assessment-select"
              value={technology}
              onChange={(event) =>
                setTechnology(
                  event.target.value,
                )
              }
            >
              <option value="ALL">
                All Technologies
              </option>

              {technologies.map(
                (technologyValue) => (
                  <option
                    key={
                      technologyValue
                    }
                    value={
                      technologyValue
                    }
                  >
                    {
                      technologyValue
                    }
                  </option>
                ),
              )}
            </select>

            <select
              className="assessment-select"
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value,
                )
              }
            >
              <option value="ALL">
                All Difficulty
              </option>

              {difficulties.map(
                (difficultyValue) => (
                  <option
                    key={
                      difficultyValue
                    }
                    value={
                      difficultyValue
                    }
                  >
                    {
                      difficultyValue
                    }
                  </option>
                ),
              )}
            </select>

          </div>

        </section>

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <div className="empty-state">
            Loading assessments...
          </div>
        )}

        {/* ==================================================
            TABLE
        ================================================== */}

        <section className="assessment-table-card">

          <table className="assessment-table">

            <thead>
              <tr>
                <th>
                  Assessment
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

                <th>
                  Questions
                </th>

                <th>
                  Marks
                </th>

                <th>
                  Duration
                </th>

                <th>
                  Status
                </th>

                <th>
                  Updated
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>

              {filteredAssessments.map(
                (assessment) => (
                  <tr
                    key={
                      assessment.id
                    }
                  >

                    <td>

                      <span className="assessment-name">
                        {
                          assessment.title
                        }
                      </span>

                      <span className="assessment-code">
                        {
                          assessment.code
                        }
                      </span>

                    </td>

                    <td>
                      {
                        assessment.type
                      }
                    </td>

                    <td>
                      {
                        assessment.technology
                      }
                    </td>

                    <td>
                      {
                        assessment.difficulty
                      }
                    </td>

                    <td>
                      {
                        assessment.questions
                      }
                    </td>

                    <td>
                      {
                        assessment.marks
                      }
                    </td>

                    <td>
                      {
                        assessment.duration
                      }{" "}
                      min
                    </td>

                    <td>

                      <span
                        className={`status-badge ${getStatusClass(
                          assessment.status,
                        )}`}
                      >
                        {
                          formatStatus(
                            assessment.status,
                          )
                        }
                      </span>

                    </td>

                    <td>
                      {
                        assessment.updatedAt
                      }
                    </td>

                    <td>

                      {/* VIEW */}

                      <button
                        type="button"
                        className="assessment-action"
                        onClick={() =>
                          openAssessment(
                            assessment,
                          )
                        }
                      >
                        View
                      </button>

                      {/* RESULTS */}

                      <button
                        type="button"
                        className="assessment-action"
                        onClick={() =>
                          openResults(
                            assessment,
                          )
                        }
                      >
                        Results
                      </button>

                      {/* CLONE */}

                      <button
                        type="button"
                        className="assessment-action"
                        onClick={() =>
                          cloneAssessment(
                            assessment.id,
                          )
                        }
                      >
                        Clone / Create New
                      </button>

                      {/* DELETE */}

                      {assessment.status !==
                        "PUBLISHED" && (
                        <button
                          type="button"
                          className="assessment-action"
                          onClick={() =>
                            deleteAssessment(
                              assessment.id,
                            )
                          }
                        >
                          Delete
                        </button>
                      )}

                      {/* UNPUBLISH */}

                      {assessment.status ===
                        "PUBLISHED" && (
                        <button
                          type="button"
                          className="assessment-action"
                          onClick={() =>
                            unpublishAssessment(
                              assessment.id,
                            )
                          }
                        >
                          Unpublish
                        </button>
                      )}

                    </td>

                  </tr>
                ),
              )}

            </tbody>

          </table>

          {!loading &&
            filteredAssessments.length ===
              0 && (
              <div className="empty-state">
                No assessments
                match the selected
                filters.
              </div>
            )}

        </section>

      </div>
    </main>
  );
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

interface SummaryCardProps {
  label: string;
  value: number;
}

function SummaryCard({
  label,
  value,
}: SummaryCardProps) {
  return (
    <div className="summary-card">

      <span className="summary-label">
        {label}
      </span>

      <span className="summary-value">
        {value}
      </span>

    </div>
  );
}
