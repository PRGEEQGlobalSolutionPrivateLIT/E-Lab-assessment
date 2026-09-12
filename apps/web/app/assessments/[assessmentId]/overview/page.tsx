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

import { API_URL } from "@/src/lib/api/fetcher";

type Assessment = {
  id: string;

  title: string;

  code: string;

  description: string | null;

  instructions: string | null;

  technology: string | null;

  difficulty: string | null;

  plannedQuestions: number;

  totalMarks: number;

  durationMinutes: number;

  /*
   * Maximum attempts configured
   * while creating the assessment.
   */
  attemptsAllowed: number;
};

type SecurityPolicy = {
  fullscreenMode: boolean;

  tabSwitchDetection: boolean;

  copyPasteDetection: boolean;

  cameraProctoring: boolean;

  microphoneMonitoring: boolean;
};

type StartAttemptResponse = {
  id?: string;

  attemptId?: string;

  assessmentId?: string;

  status?: string;

  totalQuestions?: number;

  totalMarks?: number;

  maxAttempts?: number;

  attemptsAllowed?: number;

  attemptsUsed?: number;

  attemptsRemaining?: number;

  resumed?: boolean;

  message?: string;

  error?: string;
};

/*
=========================================================
SCORING RESPONSE
=========================================================
*/

type ScoringResponse = {
  maximumAttempts?: number;
  maxAttempts?: number;
  attemptsAllowed?: number;
  attemptLimit?: number;

  scoring?: {
    maximumAttempts?: number;
    maxAttempts?: number;
    attemptsAllowed?: number;
    attemptLimit?: number;
  };

  data?: {
    maximumAttempts?: number;
    maxAttempts?: number;
    attemptsAllowed?: number;
    attemptLimit?: number;
  };
};

export default function AssessmentOverviewPage() {
  const router = useRouter();

  const params = useParams();

  const searchParams = useSearchParams();

  const assessmentId = String(
    params.assessmentId,
  );

  const mode =
    searchParams.get("mode") || "learner";

  const [
    assessment,
    setAssessment,
  ] = useState<Assessment | null>(
    null,
  );

  const [
    security,
    setSecurity,
  ] = useState<SecurityPolicy | null>(
    null,
  );

  const [
    agree,
    setAgree,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    starting,
    setStarting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * Attempt information returned
   * by backend.
   */

  const [
    attemptsUsed,
    setAttemptsUsed,
  ] = useState<number | null>(
    null,
  );

  const [
    attemptsRemaining,
    setAttemptsRemaining,
  ] = useState<number | null>(
    null,
  );

  const [
    maxAttempts,
    setMaxAttempts,
  ] = useState<number | null>(
    null,
  );

  /*
   * =====================================================
   * LOAD OVERVIEW
   * =====================================================
   */

  useEffect(() => {
    if (!assessmentId) {
      return;
    }

    loadOverview();
  }, [assessmentId]);

  async function loadOverview() {
    try {
      setLoading(true);

      setError("");

      /*
       * ---------------------------------------------------
       * LOAD ASSESSMENT
       * ---------------------------------------------------
       */

      const assessmentResponse =
        await fetch(
          `${API_URL}/assessment/${assessmentId}`,
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",
            },

            cache: "no-store",
          },
        );

      if (!assessmentResponse.ok) {
        throw new Error(
          "Assessment not found",
        );
      }

      const assessmentData =
        await assessmentResponse.json();

      /*
       * ---------------------------------------------------
       * RESOLVE ATTEMPTS ALLOWED
       * ---------------------------------------------------
       */

      let configuredAttempts =
        Number(
          assessmentData.attemptsAllowed ??
            assessmentData.maxAttempts ??
            assessmentData.maximumAttempts ??
            assessmentData.attemptLimit ??
            0,
        );

      /*
       * Read the authoritative scoring configuration.
       */

      try {
        const scoringResponse =
          await fetch(
            `${API_URL}/scoring/${assessmentId}`,
            {
              method: "GET",

              headers: {
                "Content-Type":
                  "application/json",
              },

              cache: "no-store",
            },
          );

        if (scoringResponse.ok) {
          const scoringData: ScoringResponse =
            await scoringResponse.json();

          const scoringAttempts =
            Number(
              scoringData.maximumAttempts ??
                scoringData.maxAttempts ??
                scoringData.attemptsAllowed ??
                scoringData.attemptLimit ??
                scoringData.scoring
                  ?.maximumAttempts ??
                scoringData.scoring
                  ?.maxAttempts ??
                scoringData.scoring
                  ?.attemptsAllowed ??
                scoringData.scoring
                  ?.attemptLimit ??
                scoringData.data
                  ?.maximumAttempts ??
                scoringData.data
                  ?.maxAttempts ??
                scoringData.data
                  ?.attemptsAllowed ??
                scoringData.data
                  ?.attemptLimit ??
                0,
            );

          if (scoringAttempts > 0) {
            configuredAttempts =
              scoringAttempts;
          }
        }
      } catch (scoringError) {
        console.warn(
          "Unable to load scoring configuration:",
          scoringError,
        );
      }

      setMaxAttempts(
        configuredAttempts > 0
          ? configuredAttempts
          : null,
      );

      setAssessment({
        id: assessmentData.id,

        title: assessmentData.title,

        code: assessmentData.code,

        description:
          assessmentData.description ??
          null,

        instructions:
          assessmentData.instructions ??
          null,

        technology:
          assessmentData.technology ??
          null,

        difficulty:
          assessmentData.difficulty ??
          null,

        plannedQuestions: Number(
          assessmentData.plannedQuestions ??
            0,
        ),

        totalMarks: Number(
          assessmentData.totalMarks ??
            0,
        ),

        durationMinutes: Number(
          assessmentData.durationMinutes ??
            0,
        ),

        attemptsAllowed:
          configuredAttempts,
      });

      /*
       * ---------------------------------------------------
       * LOAD DELIVERY / SECURITY
       * ---------------------------------------------------
       */

      const securityResponse =
        await fetch(
          `${API_URL}/delivery/${assessmentId}`,
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",
            },

            cache: "no-store",
          },
        );

      if (securityResponse.ok) {
        const securityData =
          await securityResponse.json();

        setSecurity(
          securityData.security ??
            null,
        );
      }
    } catch (error: any) {
      console.error(
        "OVERVIEW ERROR",
        error,
      );

      setError(
        error?.message ||
          "Unable to load assessment",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * START ASSESSMENT
   * =====================================================
   */

  async function startAssessment() {
    if (!agree) {
      return;
    }

    if (!assessment) {
      return;
    }

    try {
      setStarting(true);

      setError("");

      /*
       * ---------------------------------------------------
       * START ATTEMPT
       * ---------------------------------------------------
       */

      const response =
        await fetch(
          `${API_URL}/assessment-attempt/start`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              assessmentId:
                assessment.id,

              learnerId:
                "LEARNER001",

              attemptsAllowed:
                maxAttempts ??
                assessment.attemptsAllowed,

              maximumAttempts:
                maxAttempts ??
                assessment.attemptsAllowed,
            }),
          },
        );

      /*
       * ---------------------------------------------------
       * HANDLE ATTEMPT LIMIT / BACKEND ERROR
       * ---------------------------------------------------
       */

      if (!response.ok) {
        let errorData:
          | StartAttemptResponse
          | null = null;

        try {
          errorData =
            await response.json();
        } catch {
          errorData = null;
        }

        const backendMessage =
          errorData?.message ||
          errorData?.error ||
          `Unable to start assessment. HTTP ${response.status}`;

        const normalizedBackendMessage =
          backendMessage.toLowerCase();

        const attemptLimitReached =
          normalizedBackendMessage.includes(
            "attempt limit reached",
          ) ||
          normalizedBackendMessage.includes(
            "used all",
          ) ||
          normalizedBackendMessage.includes(
            "maximum number of attempts",
          ) ||
          normalizedBackendMessage.includes(
            "maximum attempts reached",
          ) ||
          normalizedBackendMessage.includes(
            "all allowed attempts",
          );

        if (
          typeof errorData?.attemptsUsed ===
          "number"
        ) {
          setAttemptsUsed(
            errorData.attemptsUsed,
          );
        }

        if (
          typeof errorData?.attemptsRemaining ===
          "number"
        ) {
          setAttemptsRemaining(
            errorData.attemptsRemaining,
          );
        }

        if (
          typeof errorData?.maxAttempts ===
          "number"
        ) {
          setMaxAttempts(
            errorData.maxAttempts,
          );
        }

        if (attemptLimitReached) {
          setError(backendMessage);

          setAgree(false);

          return;
        }

        setError(backendMessage);

        return;
      }

      const data: StartAttemptResponse =
        await response.json();

      /*
       * ---------------------------------------------------
       * UPDATE ATTEMPT INFORMATION
       * ---------------------------------------------------
       */

      if (
        typeof data.attemptsUsed ===
        "number"
      ) {
        setAttemptsUsed(
          data.attemptsUsed,
        );
      }

      if (
        typeof data.attemptsRemaining ===
        "number"
      ) {
        setAttemptsRemaining(
          data.attemptsRemaining,
        );
      }

      if (
        typeof data.maxAttempts ===
        "number"
      ) {
        setMaxAttempts(
          data.maxAttempts,
        );
      }

      /*
       * ---------------------------------------------------
       * GET ATTEMPT ID
       * ---------------------------------------------------
       */

      const attemptId =
        data.attemptId ||
        data.id;

      if (!attemptId) {
        throw new Error(
          "Assessment started but no attempt ID was returned by the server.",
        );
      }

      /*
       * ---------------------------------------------------
       * NAVIGATE TO ENVIRONMENT
       * ---------------------------------------------------
       */

      router.push(
        `/assessments/test/${assessmentId}/environment?mode=${encodeURIComponent(
          mode,
        )}&attemptId=${encodeURIComponent(
          attemptId,
        )}`,
      );
    } catch (error: any) {
      const message =
        error?.message ||
        "Unable to start assessment.";

      setError(message);
    } finally {
      setStarting(false);
    }
  }

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <div
        className="
          min-h-screen
          bg-[#e9eef5]
          flex
          items-center
          justify-center
          font-bold
          text-[#25324b]
        "
      >
        Loading assessment...
      </div>
    );
  }

  /*
   * =====================================================
   * ERROR / NO ASSESSMENT
   * =====================================================
   */

  if (error && !assessment) {
    return (
      <div
        className="
          min-h-screen
          bg-[#e9eef5]
          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            rounded-3xl
            p-8
            bg-[#e9eef5]
            shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
          "
        >
          <h1
            className="
              text-xl
              font-bold
            "
          >
            Assessment unavailable
          </h1>

          <p
            className="
              mt-3
              text-gray-500
            "
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div
        className="
          min-h-screen
          bg-[#e9eef5]
          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            rounded-3xl
            p-8
            bg-[#e9eef5]
            shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
          "
        >
          Assessment unavailable
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * ATTEMPT STATUS
   * =====================================================
   */

  const limit =
    maxAttempts ??
    assessment.attemptsAllowed;

  const attemptsExhausted =
    limit !== null &&
    limit !== undefined &&
    limit > 0 &&
    attemptsRemaining !== null &&
    attemptsRemaining <= 0;

  /*
   * =====================================================
   * PAGE
   * =====================================================
   */

  return (
    <div
      className="
        min-h-screen
        bg-[#e9eef5]
        p-8
        text-[#25324b]
      "
    >
      <div
        className="
          max-w-7xl
          mx-auto
        "
      >
        <div
          className="
            rounded-3xl
            bg-[#e9eef5]
            p-8
            mb-8
            shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]
          "
        >
          <h1
            className="
              text-3xl
              font-bold
            "
          >
            {assessment.title}
          </h1>

          <p
            className="
              mt-2
              text-gray-500
            "
          >
            {assessment.code}
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-2
            md:grid-cols-5
            gap-5
            mb-8
          "
        >
          <InfoCard
            title="Technology"
            value={
              assessment.technology ||
              "-"
            }
          />

          <InfoCard
            title="Difficulty"
            value={
              assessment.difficulty ||
              "-"
            }
          />

          <InfoCard
            title="Questions"
            value={String(
              assessment.plannedQuestions,
            )}
          />

          <InfoCard
            title="Marks"
            value={String(
              assessment.totalMarks,
            )}
          />

          <InfoCard
            title="Duration"
            value={`${assessment.durationMinutes} Minutes`}
          />
        </div>

        <div
          className="
            grid
            lg:grid-cols-3
            gap-6
          "
        >
          <div
            className="
              lg:col-span-2
              space-y-6
            "
          >
            <section
              className="
                rounded-3xl
                bg-[#e9eef5]
                p-6
                shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
              "
            >
              <h2
                className="
                  text-xl
                  font-bold
                  mb-4
                "
              >
                Assessment Overview
              </h2>

              <p
                className="
                  text-gray-600
                  leading-7
                "
              >
                {assessment.description
                  ? assessment.description
                  : "No description provided."}
              </p>
            </section>

            <section
              className="
                rounded-3xl
                bg-[#e9eef5]
                p-6
                shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
              "
            >
              <h2
                className="
                  text-xl
                  font-bold
                  mb-5
                "
              >
                Assessment Flow
              </h2>

              <div
                className="
                  space-y-3
                "
              >
                <TocItem
                  number="01"
                  text="Read assessment instructions"
                />

                <TocItem
                  number="02"
                  text="Start the assessment"
                />

                <TocItem
                  number="03"
                  text="Attempt all questions"
                />

                <TocItem
                  number="04"
                  text="Run and validate solution"
                />

                <TocItem
                  number="05"
                  text="Submit final answers"
                />

                <TocItem
                  number="06"
                  text="View assessment result"
                />
              </div>
            </section>

            <section
              className="
                rounded-3xl
                bg-[#e9eef5]
                p-6
                shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
              "
            >
              <h2
                className="
                  text-xl
                  font-bold
                  mb-4
                "
              >
                Instructions
              </h2>

              {assessment.instructions ? (
                <p
                  className="
                    whitespace-pre-line
                    text-gray-600
                    leading-7
                  "
                >
                  {assessment.instructions}
                </p>
              ) : (
                <p
                  className="
                    text-gray-500
                  "
                >
                  No instructions provided.
                </p>
              )}
            </section>
          </div>

          <div>
            <div
              className="
                sticky
                top-6
                rounded-3xl
                bg-[#e9eef5]
                p-6
                shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]
              "
            >
              <h2
                className="
                  text-xl
                  font-bold
                  mb-5
                "
              >
                Assessment Rules
              </h2>

              <ul
                className="
                  space-y-3
                  text-gray-600
                "
              >
                {security?.fullscreenMode && (
                  <li>
                    ✓ Fullscreen mode enabled
                  </li>
                )}

                {security?.tabSwitchDetection && (
                  <li>
                    ✓ Tab switching detection enabled
                  </li>
                )}

                {security?.copyPasteDetection && (
                  <li>
                    ✓ Copy paste monitoring enabled
                  </li>
                )}

                {security?.cameraProctoring && (
                  <li>
                    ✓ Camera proctoring enabled
                  </li>
                )}

                {security?.microphoneMonitoring && (
                  <li>
                    ✓ Microphone monitoring enabled
                  </li>
                )}

                {!security && (
                  <li>
                    ✓ Complete assessment within time
                  </li>
                )}
              </ul>

              <div
                className="
                  mt-7
                  rounded-2xl
                  bg-[#e1e7ef]
                  p-5
                  shadow-inner
                "
              >
                <h3
                  className="
                    font-bold
                  "
                >
                  Attempt Limit
                </h3>

                <div
                  className="
                    mt-4
                    space-y-3
                    text-sm
                  "
                >
                  <div
                    className="
                      flex
                      justify-between
                      gap-4
                    "
                  >
                    <span>
                      Attempts Allowed
                    </span>

                    <strong>
                      {limit &&
                      limit > 0
                        ? limit
                        : "-"}
                    </strong>
                  </div>

                  {attemptsUsed !== null && (
                    <div
                      className="
                        flex
                        justify-between
                        gap-4
                      "
                    >
                      <span>
                        Attempts Used
                      </span>

                      <strong>
                        {attemptsUsed}
                      </strong>
                    </div>
                  )}

                  {attemptsRemaining !== null && (
                    <div
                      className="
                        flex
                        justify-between
                        gap-4
                      "
                    >
                      <span>
                        Attempts Remaining
                      </span>

                      <strong
                        className={
                          attemptsRemaining <= 0
                            ? "text-red-600"
                            : "text-[#24579a]"
                        }
                      >
                        {attemptsRemaining}
                      </strong>
                    </div>
                  )}
                </div>

                {attemptsExhausted && (
                  <p
                    className="
                      mt-4
                      rounded-xl
                      bg-red-100
                      p-3
                      text-sm
                      font-semibold
                      text-red-700
                    "
                  >
                    You have reached the maximum
                    number of attempts allowed for
                    this assessment.
                  </p>
                )}
              </div>

              <div
                className="
                  mt-8
                  flex
                  gap-3
                "
              >
                <input
                  type="checkbox"
                  checked={agree}
                  disabled={
                    starting ||
                    attemptsExhausted
                  }
                  onChange={(event) =>
                    setAgree(
                      event.target.checked,
                    )
                  }
                  className="
                    w-5
                    h-5
                    mt-1
                  "
                />

                <label
                  className="
                    text-sm
                    text-gray-600
                  "
                >
                  I have read and agree to the
                  assessment instructions and
                  rules.
                </label>
              </div>

              {error && (
                <div
                  className="
                    mt-5
                    rounded-xl
                    bg-red-100
                    p-4
                    text-sm
                    font-semibold
                    text-red-700
                  "
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/assessments/test",
                  )
                }
                disabled={starting}
                className="
                  mt-8
                  w-full
                  rounded-xl
                  bg-[#e9eef5]
                  py-3
                  font-bold
                  text-[#24579a]
                  shadow-[5px_5px_10px_#c7ccd3,-5px_-5px_10px_#ffffff]
                  transition
                  hover:bg-[#dde4ed]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                BACK
              </button>

              <button
                disabled={
                  !agree ||
                  starting ||
                  attemptsExhausted
                }
                onClick={
                  startAssessment
                }
                className={`
                  mt-8
                  w-full
                  rounded-xl
                  py-4
                  font-bold
                  text-white
                  transition

                  ${
                    agree &&
                    !starting &&
                    !attemptsExhausted
                      ? "bg-[#24579a] hover:bg-[#1d477d]"
                      : "bg-gray-400 cursor-not-allowed"
                  }
                `}
              >
                {starting
                  ? "STARTING TEST..."
                  : attemptsExhausted
                    ? "ATTEMPTS EXHAUSTED"
                    : "START TEST"}
              </button>

              {!attemptsExhausted &&
                limit &&
                limit > 0 && (
                  <p
                    className="
                      mt-3
                      text-center
                      text-xs
                      text-gray-500
                    "
                  >
                    Maximum{" "}
                    <strong>
                      {limit}
                    </strong>{" "}
                    attempt
                    {limit === 1
                      ? ""
                      : "s"}{" "}
                    allowed.
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
=========================================================
INFO CARD
=========================================================
*/

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        bg-[#e9eef5]
        p-5
        shadow-[6px_6px_12px_#c7ccd3,-6px_-6px_12px_#ffffff]
      "
    >
      <p
        className="
          text-xs
          font-bold
          text-gray-500
        "
      >
        {title}
      </p>

      <p
        className="
          mt-2
          font-bold
        "
      >
        {value}
      </p>
    </div>
  );
}

/*
=========================================================
TOC ITEM
=========================================================
*/

function TocItem({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div
      className="
        flex
        gap-4
        items-center
        rounded-xl
        p-4
        shadow-inner
      "
    >
      <div
        className="
          font-bold
          text-blue-700
        "
      >
        {number}
      </div>

      <div
        className="
          text-gray-700
        "
      >
        {text}
      </div>
    </div>
  );
}
