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

import { API_URL } from "@/src/lib/api/fetcher";

/* ============================================================
   TYPES
   ============================================================ */

interface Assessment {
  id: string;

  title: string;

  code: string;

  totalMarks: number;

  durationMinutes: number;
}

interface LearnerResult {
  attemptId: string;

  learnerId?: string;

  learnerName: string;

  email: string;

  attemptNumber: number;

  status: string;

  score: number;

  totalMarks: number;

  percentage: number;

  startedAt?: string | null;

  submittedAt?: string | null;

  timeTakenSeconds?: number | null;
}

/* ============================================================
   PAGE
   ============================================================ */

export default function AssessmentResultsPage() {
  const params = useParams();

  const router = useRouter();

  const assessmentId =
    String(
      params.assessmentId,
    );

  const [
    assessment,
    setAssessment,
  ] =
    useState<Assessment | null>(
      null,
    );

  const [
    results,
    setResults,
  ] =
    useState<LearnerResult[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("ALL");

  /* ============================================================
     LOAD DATA
     ============================================================ */

  useEffect(() => {
    if (!assessmentId) {
      return;
    }

    loadResults();
  }, [
    assessmentId,
  ]);

  async function loadResults() {
    try {
      setLoading(true);

      setError("");

      /* ========================================================
         LOAD ASSESSMENT
         ======================================================== */

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

      if (
        !assessmentResponse.ok
      ) {
        const text =
          await assessmentResponse.text();

        let message =
          "Unable to load assessment.";

        if (
          text.trim()
        ) {
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
            } else {
              message =
                text;
            }
          } catch {
            message =
              text;
          }
        }

        throw new Error(
          message,
        );
      }

      const assessmentData =
        await assessmentResponse.json();

      setAssessment({
        id: String(
          assessmentData.id ??
            assessmentId,
        ),

        title: String(
          assessmentData.title ??
            "Assessment",
        ),

        code: String(
          assessmentData.code ??
            "-",
        ),

        totalMarks: Number(
          assessmentData.totalMarks ??
            0,
        ),

        durationMinutes:
          Number(
            assessmentData.durationMinutes ??
              0,
          ),
      });

      /* ========================================================
         LOAD ALL RESULTS
         ======================================================== */

      const resultResponse =
        await fetch(
          `${API_URL}/assessment/${assessmentId}/results`,
          {
            method: "GET",

            cache: "no-store",

            headers: {
              "Content-Type":
                "application/json",
            },
          },
        );

      if (
        !resultResponse.ok
      ) {
        const text =
          await resultResponse.text();

        let message =
          "Unable to load assessment results.";

        if (
          text.trim()
        ) {
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
            } else {
              message =
                text;
            }
          } catch {
            message =
              text;
          }
        }

        throw new Error(
          message,
        );
      }

      const resultData =
        await resultResponse.json();

      console.log(
        "Assessment Results:",
        resultData,
      );

      /* ========================================================
         SUPPORT MULTIPLE RESPONSE SHAPES

         []

         OR

         {
           data: []
         }

         OR

         {
           results: []
         }
         ======================================================== */

      const rawResults =
        Array.isArray(
          resultData,
        )
          ? resultData
          : Array.isArray(
              resultData?.data,
            )
          ? resultData.data
          : Array.isArray(
              resultData?.results,
            )
          ? resultData.results
          : [];

      /* ========================================================
         NORMALIZE RESULTS
         ======================================================== */

      const normalizedResults =
        rawResults.map(
          (
            item: any,
            index: number,
          ): LearnerResult => {
            const score =
              Number(
                item?.score ??
                  item?.obtainedMarks ??
                  item?.marksObtained ??
                  item?.totalScore ??
                  0,
              );

            const totalMarks =
              Number(
                item?.totalMarks ??
                  assessmentData.totalMarks ??
                  0,
              );

            let percentage =
              Number(
                item?.percentage ??
                  item?.scorePercentage ??
                  0,
              );

            /*
             * Calculate percentage when
             * backend does not provide it.
             */

            if (
              (!Number.isFinite(
                percentage,
              ) ||
                percentage === 0) &&
              totalMarks > 0 &&
              score >= 0
            ) {
              percentage =
                (score /
                  totalMarks) *
                100;
            }

            return {
              attemptId:
                String(
                  item?.attemptId ??
                    item?.id ??
                    `attempt-${index}`,
                ),

              learnerId:
                item?.learnerId
                  ? String(
                      item.learnerId,
                    )
                  : undefined,

              learnerName:
                String(
                  item?.learnerName ??
                    item?.name ??
                    item?.userName ??
                    item?.studentName ??
                    item?.learner?.name ??
                    "Unknown Learner",
                ),

              email:
                String(
                  item?.email ??
                    item?.learnerEmail ??
                    item?.studentEmail ??
                    item?.learner?.email ??
                    "-",
                ),

              attemptNumber:
                Number(
                  item?.attemptNumber ??
                    item?.attemptNo ??
                    item?.attempt ??
                    index + 1,
                ),

              status:
                String(
                  item?.status ??
                    "UNKNOWN",
                ).toUpperCase(),

              score,

              totalMarks,

              percentage:
                Math.round(
                  percentage *
                    100,
                ) / 100,

              startedAt:
                item?.startedAt ??
                item?.startTime ??
                null,

              submittedAt:
                item?.submittedAt ??
                item?.completedAt ??
                item?.endTime ??
                null,

              timeTakenSeconds:
                item?.timeTakenSeconds ??
                item?.durationSeconds ??
                null,
            };
          },
        );

      setResults(
        normalizedResults,
      );
    } catch (error) {
      console.error(
        "ASSESSMENT RESULTS ERROR:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to load assessment results.";

      if (
        message ===
        "Failed to fetch"
      ) {
        setError(
          `Unable to connect to the assessment API at ${API_URL}.\n\nMake sure the NestJS API is running and CORS is enabled.`,
        );
      } else {
        setError(
          message,
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     FILTER RESULTS
     ============================================================ */

  const filteredResults =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return results.filter(
        (result) => {
          const matchesSearch =
            !searchValue ||
            result.learnerName
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            result.email
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            result.attemptId
              .toLowerCase()
              .includes(
                searchValue,
              );

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            result.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      results,
      search,
      statusFilter,
    ]);

  /* ============================================================
     SUMMARY
     ============================================================ */

  const attendedCount =
    results.filter(
      (result) =>
        result.status ===
          "SUBMITTED" ||
        result.status ===
          "COMPLETED" ||
        result.status ===
          "EVALUATED",
    ).length;

  const submittedCount =
    results.filter(
      (result) =>
        result.status ===
        "SUBMITTED",
    ).length;

  const evaluatedCount =
    results.filter(
      (result) =>
        result.status ===
        "EVALUATED",
    ).length;

  const averagePercentage =
    results.length > 0
      ? results.reduce(
          (
            total,
            result,
          ) =>
            total +
            result.percentage,
          0,
        ) / results.length
      : 0;

  const highestScore =
    results.length > 0
      ? Math.max(
          ...results.map(
            (result) =>
              result.score,
          ),
        )
      : 0;

  /* ============================================================
     FORMAT DATE
     ============================================================ */

  function formatDate(
    value?: string | null,
  ) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "-";
    }

    return date.toLocaleString();
  }

  /* ============================================================
     FORMAT TIME
     ============================================================ */

  function formatTime(
    seconds?: number | null,
  ) {
    if (
      seconds === null ||
      seconds === undefined
    ) {
      return "-";
    }

    const totalSeconds =
      Math.max(
        0,
        Number(seconds),
      );

    if (
      !Number.isFinite(
        totalSeconds,
      )
    ) {
      return "-";
    }

    const hours =
      Math.floor(
        totalSeconds / 3600,
      );

    const minutes =
      Math.floor(
        (totalSeconds %
          3600) /
          60,
      );

    const remainingSeconds =
      Math.floor(
        totalSeconds % 60,
      );

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  }

  /* ============================================================
     RESULT DETAILS
     ============================================================ */

  function openResult(
    attemptId: string,
  ) {
    router.push(
      `/assessments/${assessmentId}/result?attemptId=${encodeURIComponent(
        attemptId,
      )}&mode=admin`,
    );
  }

  /* ============================================================
     STATUS CLASS
     ============================================================ */

  function getStatusClass(
    status: string,
  ) {
    switch (
      status
    ) {
      case "SUBMITTED":
      case "EVALUATED":
      case "COMPLETED":
        return "bg-green-100 text-green-700";

      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700";

      case "FAILED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
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
            p-10
            font-bold
            shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]
          "
        >
          Loading assessment
          results...
        </div>
      </main>
    );
  }

  /* ============================================================
     ERROR
     ============================================================ */

  if (error) {
    return (
      <main
        className="
          min-h-screen
          bg-[#e9eef5]
          p-8
          text-[#25324b]
        "
      >
        <div
          className="
            max-w-5xl
            mx-auto
          "
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                "/assessments",
              )
            }
            className="
              mb-6
              rounded-xl
              bg-[#e9eef5]
              px-5
              py-3
              font-bold
              shadow-[5px_5px_10px_#c7ccd3,-5px_-5px_10px_#ffffff]
            "
          >
            ← Back to
            Assessments
          </button>

          <div
            className="
              rounded-3xl
              bg-[#e9eef5]
              p-8
              text-center
              shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]
            "
          >
            <h1
              className="
                text-2xl
                font-bold
                text-red-600
              "
            >
              Unable to Load
              Results
            </h1>

            <p
              className="
                mt-4
                text-gray-600
                whitespace-pre-line
              "
            >
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadResults
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
              Try Again
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
    <main
      className="
        min-h-screen
        bg-[#e9eef5]
        p-6
        md:p-8
        text-[#25324b]
      "
    >
      <div
        className="
          max-w-[1500px]
          mx-auto
        "
      >

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div
          className="
            rounded-3xl
            bg-[#e9eef5]
            p-7
            shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              md:flex-row
              md:items-center
              md:justify-between
            "
          >
            <div>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/assessments",
                  )
                }
                className="
                  mb-4
                  text-sm
                  font-bold
                  text-[#24579a]
                "
              >
                ← Back to
                Assessments
              </button>

              <h1
                className="
                  text-3xl
                  font-bold
                "
              >
                {assessment?.title ||
                  "Assessment Results"}
              </h1>

              <p
                className="
                  mt-2
                  text-gray-500
                "
              >
                {assessment?.code ||
                  "-"}

                {" • "}

                Learner Results
              </p>
            </div>

            <button
              type="button"
              onClick={
                loadResults
              }
              className="
                rounded-xl
                bg-[#24579a]
                px-6
                py-3
                font-bold
                text-white
                shadow-lg
              "
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ======================================================
            SUMMARY
        ====================================================== */}

        <section
          className="
            mt-7
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-5
          "
        >
          <SummaryCard
            title="Total Attempts"
            value={
              results.length
            }
          />

          <SummaryCard
            title="Attended"
            value={
              attendedCount
            }
          />

          <SummaryCard
            title="Average Score"
            value={`${averagePercentage.toFixed(
              1,
            )}%`}
          />

          <SummaryCard
            title="Highest Score"
            value={`${highestScore} / ${
              assessment?.totalMarks ??
              0
            }`}
          />
        </section>

        {/* ======================================================
            ADDITIONAL SUMMARY
        ====================================================== */}

        <section
          className="
            mt-5
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            gap-5
          "
        >
          <SummaryCard
            title="Submitted"
            value={
              submittedCount
            }
          />

          <SummaryCard
            title="Evaluated"
            value={
              evaluatedCount
            }
          />

          <SummaryCard
            title="Filtered Results"
            value={
              filteredResults.length
            }
          />
        </section>

        {/* ======================================================
            SEARCH / FILTER
        ====================================================== */}

        <section
          className="
            mt-7
            rounded-3xl
            bg-[#e9eef5]
            p-6
            shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
          "
        >
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-[1fr_220px]
              gap-4
            "
          >
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search learner name, email or attempt ID..."
              className="
                rounded-xl
                bg-[#e9eef5]
                px-5
                py-3
                outline-none
                shadow-inner
              "
            />

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className="
                rounded-xl
                bg-[#e9eef5]
                px-5
                py-3
                outline-none
                shadow-inner
              "
            >
              <option value="ALL">
                All Status
              </option>

              <option value="SUBMITTED">
                Submitted
              </option>

              <option value="EVALUATED">
                Evaluated
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="FAILED">
                Failed
              </option>
            </select>
          </div>
        </section>

        {/* ======================================================
            RESULTS TABLE
        ====================================================== */}

        <section
          className="
            mt-7
            overflow-hidden
            rounded-3xl
            bg-[#e9eef5]
            shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
          "
        >
          <div
            className="
              overflow-x-auto
            "
          >
            <table
              className="
                w-full
                min-w-[1250px]
                text-sm
              "
            >
              <thead>
                <tr
                  className="
                    border-b
                    border-gray-300
                  "
                >
                  <th
                    className="
                      px-5
                      py-5
                      text-left
                    "
                  >
                    Learner
                  </th>

                  <th
                    className="
                      px-5
                      py-5
                      text-left
                    "
                  >
                    Email
                  </th>

                  <th
                    className="
                      px-5
                      py-5
                      text-center
                    "
                  >
                    Attempt
                  </th>

                  <th
                    className="
                      px-5
                      py-5
                      text-center
                    "
                  >
                    Status
                  </th>

                  <th
                    className="
                      px-5
                      py-5
                      text-center
                    "
                  >
                    Score
                  </th>

                  <th
                    className="
                      px-5
                      py-5
                      text-center
                    "
                  >
                    Percentage
                  </th>

                  <th
                    className="
                      px-5
                      py-5
                      text-left
                    "
                  >
                    Started
                  </th>

                  <th
                    className="
                      px-5
                      py-5
                      text-left
                    "
                  >
                    Submitted
                  </th>

                  <th
                    className="
                      px-5
                      py-5
                      text-center
                    "
                  >
                    Time Taken
                  </th>

                  <th
                    className="
                      px-5
                      py-5
                      text-center
                    "
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredResults.map(
                  (result) => (
                    <tr
                      key={
                        result.attemptId
                      }
                      className="
                        border-b
                        border-gray-200
                        hover:bg-[#e2e7ee]
                      "
                    >

                      {/* LEARNER */}

                      <td
                        className="
                          px-5
                          py-5
                        "
                      >
                        <div
                          className="
                            font-bold
                          "
                        >
                          {
                            result.learnerName
                          }
                        </div>

                        {result.learnerId && (
                          <div
                            className="
                              mt-1
                              text-xs
                              text-gray-400
                            "
                          >
                            ID:{" "}
                            {
                              result.learnerId
                            }
                          </div>
                        )}
                      </td>

                      {/* EMAIL */}

                      <td
                        className="
                          px-5
                          py-5
                          text-gray-600
                        "
                      >
                        {
                          result.email
                        }
                      </td>

                      {/* ATTEMPT */}

                      <td
                        className="
                          px-5
                          py-5
                          text-center
                          font-bold
                        "
                      >
                        #
                        {
                          result.attemptNumber
                        }
                      </td>

                      {/* STATUS */}

                      <td
                        className="
                          px-5
                          py-5
                          text-center
                        "
                      >
                        <span
                          className={`
                            inline-flex
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-bold
                            ${getStatusClass(
                              result.status,
                            )}
                          `}
                        >
                          {
                            result.status
                          }
                        </span>
                      </td>

                      {/* SCORE */}

                      <td
                        className="
                          px-5
                          py-5
                          text-center
                          font-bold
                        "
                      >
                        {
                          result.score
                        }

                        {" / "}

                        {
                          result.totalMarks
                        }
                      </td>

                      {/* PERCENTAGE */}

                      <td
                        className="
                          px-5
                          py-5
                          text-center
                          font-bold
                        "
                      >
                        {result.percentage.toFixed(
                          1,
                        )}
                        %
                      </td>

                      {/* STARTED */}

                      <td
                        className="
                          px-5
                          py-5
                          text-gray-600
                        "
                      >
                        {
                          formatDate(
                            result.startedAt,
                          )
                        }
                      </td>

                      {/* SUBMITTED */}

                      <td
                        className="
                          px-5
                          py-5
                          text-gray-600
                        "
                      >
                        {
                          formatDate(
                            result.submittedAt,
                          )
                        }
                      </td>

                      {/* TIME */}

                      <td
                        className="
                          px-5
                          py-5
                          text-center
                        "
                      >
                        {
                          formatTime(
                            result.timeTakenSeconds,
                          )
                        }
                      </td>

                      {/* ACTION */}

                      <td
                        className="
                          px-5
                          py-5
                          text-center
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openResult(
                              result.attemptId,
                            )
                          }
                          className="
                            rounded-xl
                            bg-[#24579a]
                            px-4
                            py-2
                            font-bold
                            text-white
                          "
                        >
                          View Result
                        </button>
                      </td>

                    </tr>
                  ),
                )}
              </tbody>
            </table>

            {filteredResults.length ===
              0 && (
              <div
                className="
                  p-12
                  text-center
                  text-gray-500
                "
              >
                {results.length ===
                0
                  ? "No learner results available for this assessment."
                  : "No results match your search or filter."}
              </div>
            )}
          </div>
        </section>

        {/* ======================================================
            FOOTER INFORMATION
        ====================================================== */}

        <div
          className="
            mt-6
            text-sm
            text-gray-500
          "
        >
          Showing{" "}
          <strong>
            {
              filteredResults.length
            }
          </strong>{" "}
          of{" "}
          <strong>
            {results.length}
          </strong>{" "}
          attempts

          {" • "}

          Total Marks:{" "}
          <strong>
            {
              assessment?.totalMarks ??
              0
            }
          </strong>

          {" • "}

          Duration:{" "}
          <strong>
            {
              assessment?.durationMinutes ??
              0
            }{" "}
            minutes
          </strong>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      className="
        rounded-3xl
        bg-[#e9eef5]
        p-6
        shadow-[7px_7px_14px_#c7ccd3,-7px_-7px_14px_#ffffff]
      "
    >
      <p
        className="
          text-sm
          font-bold
          text-gray-500
        "
      >
        {title}
      </p>

      <p
        className="
          mt-3
          text-2xl
          font-bold
        "
      >
        {value}
      </p>
    </div>
  );
}
