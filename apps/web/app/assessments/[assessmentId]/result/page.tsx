"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { API_URL } from "@/lib/api/fetcher";
/* ============================================================
   TYPES
   ============================================================ */

type ResultData = {
  attemptId: string;
  assessmentId: string;

  assessmentTitle?: string;

  status?: string;

  totalQuestions: number;
  attemptedQuestions: number;

  totalMarks: number;
  obtainedMarks: number;

  percentage: number;

  passed?: boolean;

  startedAt?: string;
  submittedAt?: string;
};

/* ============================================================
   PAGE
   ============================================================ */

export default function AssessmentResultPage() {
  const params = useParams();

  const router = useRouter();

  const searchParams =
    useSearchParams();

  const assessmentId =
    String(
      params.assessmentId,
    );

  const attemptId =
    searchParams.get(
      "attemptId",
    ) || "";

  const mode =
    searchParams.get(
      "mode",
    ) || "learner";

  const [result, setResult] =
    useState<ResultData | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ============================================================
     LOAD RESULT
     ============================================================ */

  useEffect(() => {
    if (!attemptId) {
      setError(
        "Assessment attempt ID is missing.",
      );

      setLoading(false);

      return;
    }

    loadResult();
  }, [
    attemptId,
    assessmentId,
  ]);

  async function loadResult() {
    try {
      setLoading(true);

      setError("");

      const response =
        await fetch(
          `${API_URL}/assessment-attempt/${attemptId}/result`,
          {
            method:
              "GET",

            cache:
              "no-store",

            headers: {
              "Content-Type":
                "application/json",
            },
          },
        );

      if (!response.ok) {
        const text =
          await response.text();

        let message =
          `Unable to load result. HTTP ${response.status}`;

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
            } else if (
              parsed?.error
            ) {
              message =
                parsed.error;
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

      const data =
        await response.json();

      console.log(
        "Assessment Result:",
        data,
      );

      /*
       * Backend may return:
       *
       * {
       *   attemptId,
       *   assessmentId,
       *   ...
       * }
       *
       * OR:
       *
       * {
       *   result: {
       *     ...
       *   }
       * }
       */

      const resultData =
        data?.result ??
        data;

      const totalMarks =
        Number(
          resultData?.totalMarks ??
            0,
        );

      const obtainedMarks =
        Number(
          resultData?.obtainedMarks ??
            resultData?.score ??
            resultData?.totalScore ??
            0,
        );

      let percentage =
        Number(
          resultData?.percentage ??
            0,
        );

      /*
       * If backend does not send percentage,
       * calculate it from marks.
       */

      if (
        !Number.isFinite(
          percentage,
        ) &&
        totalMarks > 0
      ) {
        percentage =
          (obtainedMarks /
            totalMarks) *
          100;
      }

      setResult({
        attemptId:
          resultData?.attemptId ??
          attemptId,

        assessmentId:
          resultData?.assessmentId ??
          assessmentId,

        assessmentTitle:
          resultData?.assessmentTitle ??
          resultData?.title ??
          "Assessment Result",

        status:
          resultData?.status ??
          "SUBMITTED",

        totalQuestions:
          Number(
            resultData?.totalQuestions ??
              resultData?.questionCount ??
              0,
          ),

        attemptedQuestions:
          Number(
            resultData?.attemptedQuestions ??
              resultData?.answeredQuestions ??
              0,
          ),

        totalMarks,

        obtainedMarks,

        percentage,

        passed:
          typeof resultData?.passed ===
          "boolean"
            ? resultData.passed
            : undefined,

        startedAt:
          resultData?.startedAt,

        submittedAt:
          resultData?.submittedAt,
      });
    } catch (err) {
      console.error(
        "RESULT LOAD ERROR:",
        err,
      );

      const message =
        err instanceof Error
          ? err.message
          : "Unable to load assessment result.";

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
     FORMAT DATE
     ============================================================ */

  function formatDate(
    value?: string,
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
      return value;
    }

    return date.toLocaleString();
  }

  /* ============================================================
     SCORE
     ============================================================ */

  function getScorePercentage() {
    if (!result) {
      return 0;
    }

    if (
      Number.isFinite(
        result.percentage,
      )
    ) {
      return Math.max(
        0,
        Math.min(
          100,
          result.percentage,
        ),
      );
    }

    if (
      result.totalMarks > 0
    ) {
      return (
        (result.obtainedMarks /
          result.totalMarks) *
        100
      );
    }

    return 0;
  }

  /* ============================================================
     STATUS
     ============================================================ */

  function getResultStatus() {
    if (!result) {
      return "SUBMITTED";
    }

    if (
      result.passed === true
    ) {
      return "PASSED";
    }

    if (
      result.passed === false
    ) {
      return "FAILED";
    }

    return (
      result.status ||
      "SUBMITTED"
    );
  }

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#e9eef5] flex items-center justify-center text-[#25324b]">
        <div className="rounded-3xl bg-[#e9eef5] px-10 py-8 font-bold shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]">
          Calculating your
          result...
        </div>
      </main>
    );
  }

  /* ============================================================
     ERROR
     ============================================================ */

  if (
    error ||
    !result
  ) {
    return (
      <main className="min-h-screen bg-[#e9eef5] p-8 flex items-center justify-center text-[#25324b]">
        <div className="w-full max-w-xl rounded-3xl bg-[#e9eef5] p-8 shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]">

          <h1 className="text-2xl font-bold">
            Result Unavailable
          </h1>

          <p className="mt-4 text-red-600 whitespace-pre-line">
            {error ||
              "Assessment result could not be loaded."}
          </p>

          <div className="flex gap-3 mt-6">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/assessments/${assessmentId}/test`,
                )
              }
              className="rounded-xl bg-[#24579a] px-6 py-3 font-bold text-white"
            >
              Return to Test
            </button>

            <button
              type="button"
              onClick={
                loadResult
              }
              className="rounded-xl px-6 py-3 font-bold bg-[#e9eef5] shadow-[5px_5px_10px_#c7ccd3,-5px_-5px_10px_#ffffff]"
            >
              Try Again
            </button>

          </div>

        </div>
      </main>
    );
  }

  /* ============================================================
     RESULT VALUES
     ============================================================ */

  const percentage =
    getScorePercentage();

  const status =
    getResultStatus();

  const isPassed =
    result.passed ===
      true ||
    status ===
      "PASSED";

  return (
    <main className="min-h-screen bg-[#e9eef5] p-6 md:p-8 text-[#25324b]">

      <div className="max-w-6xl mx-auto">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="rounded-3xl bg-[#e9eef5] p-7 md:p-9 mb-6 shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>

              <p className="text-sm font-bold text-[#24579a]">
                ASSESSMENT
                COMPLETED
              </p>

              <h1 className="mt-2 text-3xl md:text-4xl font-bold">
                {
                  result.assessmentTitle
                }
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Your assessment
                has been
                successfully
                submitted.
              </p>

            </div>

            <div
              className={`
                rounded-2xl
                px-6
                py-3
                text-center
                font-bold
                shadow-[inset_4px_4px_8px_#c7ccd3,inset_-4px_-4px_8px_#ffffff]

                ${
                  isPassed
                    ? "text-green-700"
                    : "text-[#24579a]"
                }
              `}
            >
              {status}
            </div>

          </div>

        </header>

        {/* ======================================================
            SCORE
        ====================================================== */}

        <section className="rounded-3xl bg-[#e9eef5] p-8 mb-6 shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]">

          <div className="grid md:grid-cols-3 gap-6 items-center">

            {/* SCORE */}

            <div className="md:col-span-1 flex flex-col items-center justify-center">

              <div className="w-44 h-44 rounded-full bg-[#e9eef5] flex flex-col items-center justify-center shadow-[inset_8px_8px_16px_#c7ccd3,inset_-8px_-8px_16px_#ffffff]">

                <span className="text-4xl font-bold">
                  {
                    result.obtainedMarks
                  }
                </span>

                <span className="text-sm text-gray-500 mt-1">
                  /{" "}
                  {
                    result.totalMarks
                  }
                </span>

              </div>

              <p className="mt-5 text-lg font-bold">
                {
                  percentage.toFixed(
                    2,
                  )
                }
                %
              </p>

            </div>

            {/* SUMMARY */}

            <div className="md:col-span-2 grid sm:grid-cols-2 gap-5">

              <ResultCard
                title="Total Questions"
                value={String(
                  result.totalQuestions,
                )}
              />

              <ResultCard
                title="Questions Attempted"
                value={String(
                  result.attemptedQuestions,
                )}
              />

              <ResultCard
                title="Total Marks"
                value={String(
                  result.totalMarks,
                )}
              />

              <ResultCard
                title="Marks Obtained"
                value={String(
                  result.obtainedMarks,
                )}
              />

            </div>

          </div>

        </section>

        {/* ======================================================
            SCORE DETAILS
        ====================================================== */}

        <section className="rounded-3xl bg-[#e9eef5] p-7 mb-6 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]">

          <h2 className="text-xl font-bold">
            Assessment Summary
          </h2>

          <div className="mt-5 space-y-4">

            <SummaryRow
              label="Assessment Status"
              value={
                result.status ||
                "SUBMITTED"
              }
            />

            <SummaryRow
              label="Attempt ID"
              value={
                result.attemptId
              }
            />

            <SummaryRow
              label="Assessment ID"
              value={
                result.assessmentId
              }
            />

            <SummaryRow
              label="Mode"
              value={
                mode
              }
            />

            <SummaryRow
              label="Started At"
              value={formatDate(
                result.startedAt,
              )}
            />

            <SummaryRow
              label="Submitted At"
              value={formatDate(
                result.submittedAt,
              )}
            />

            <SummaryRow
              label="Percentage"
              value={`${percentage.toFixed(
                2,
              )}%`}
            />

          </div>

        </section>

        {/* ======================================================
            RESULT MESSAGE
        ====================================================== */}

        <section className="rounded-3xl bg-[#e9eef5] p-7 mb-6 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]">

          <h2 className="text-xl font-bold">
            Result
          </h2>

          <p className="mt-3 text-gray-600 leading-7">

            {isPassed
              ? "Congratulations! You have successfully completed the assessment."
              : result.passed ===
                  false
                ? "The assessment has been completed. Please review your performance and continue improving your skills."
                : "Your assessment has been submitted successfully. The final score is shown above."}

          </p>

        </section>

        {/* ======================================================
            ACTIONS
        ====================================================== */}

        <div className="flex justify-center gap-4">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/assessments`,
              )
            }
            className="rounded-xl px-7 py-3 font-bold bg-[#e9eef5] shadow-[6px_6px_12px_#c7ccd3,-6px_-6px_12px_#ffffff]"
          >
            Assessments
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/assessments/test`,
              )
            }
            className="rounded-xl bg-[#24579a] px-7 py-3 text-white font-bold"
          >
            Done
          </button>

        </div>

      </div>
    </main>
  );
}

/* ============================================================
   RESULT CARD
   ============================================================ */

function ResultCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#e9eef5] p-5 shadow-[6px_6px_12px_#c7ccd3,-6px_-6px_12px_#ffffff]">

      <p className="text-xs font-bold text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   SUMMARY ROW
   ============================================================ */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl p-4 shadow-inner">

      <span className="text-sm font-bold text-gray-500">
        {label}
      </span>

      <span className="text-sm font-bold break-all">
        {value}
      </span>

    </div>
  );
}
