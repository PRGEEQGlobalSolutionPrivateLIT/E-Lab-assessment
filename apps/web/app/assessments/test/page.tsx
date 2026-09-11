"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


type Assessment = {
  id: string;

  title: string;

  code: string;

  description?: string;

  technology?: string;

  difficulty?: string;

  durationMinutes?: number;

  plannedQuestions?: number;

  totalMarks?: number;

  status: string;

  /*
   * Attempt limit configured while
   * creating the assessment.
   */
  attemptsAllowed?: number;

  /*
   * Support alternative backend field names
   * in case the Assessment API currently
   * returns one of these.
   */
  maxAttempts?: number;

  maximumAttempts?: number;

  attemptLimit?: number;
};


export default function LearnerAssessmentListPage() {

  const router = useRouter();


  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";


  const [
    assessments,
    setAssessments,
  ] = useState<Assessment[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {

    loadPublishedAssessments();

  }, []);


  async function loadPublishedAssessments() {

    try {

      setLoading(true);

      setError("");


      const response =
        await fetch(
          `${API_URL}/assessment`,
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",
            },

            cache: "no-store",
          },
        );


      if (!response.ok) {

        throw new Error(
          "Unable to load assessments",
        );

      }


      const data =
        await response.json();


      /*
       * Backend may return either:
       *
       * [
       *   assessment,
       *   assessment
       * ]
       *
       * or
       *
       * {
       *   data: [...]
       * }
       */

      const assessmentList =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];


      const published =
        assessmentList.filter(
          (item: any) =>
            String(
              item.status ?? "",
            ).toUpperCase() ===
            "PUBLISHED",
        );


      setAssessments(
        published,
      );

    }
    catch (error) {

      console.error(
        "ASSESSMENT LOAD ERROR",
        error,
      );


      setError(
        "Unable to load available tests",
      );

      setAssessments([]);

    }
    finally {

      setLoading(false);

    }

  }


  /*
   * Get the configured attempt limit.
   *
   * We check several possible property
   * names so the UI continues to work
   * with the current Assessment response.
   */
  function getAttemptLimit(
    assessment: Assessment,
  ): number {

    const value =
      assessment.attemptsAllowed ??
      assessment.maxAttempts ??
      assessment.maximumAttempts ??
      assessment.attemptLimit;


    const numberValue =
      Number(value);


    if (
      Number.isFinite(numberValue) &&
      numberValue > 0
    ) {

      return numberValue;

    }


    /*
     * If the backend has not returned
     * an attempt limit, show "-" rather
     * than incorrectly displaying 0.
     */
    return 0;

  }


  /*
   * Navigate to the assessment overview.
   *
   * IMPORTANT:
   *
   * This page does NOT create an attempt.
   *
   * The actual attempt is created by
   * AssessmentAttemptService when the learner
   * starts the test.
   *
   * Therefore the backend remains the
   * final authority for the attempt limit.
   */
  function proceed(
    assessmentId: string,
  ) {

    router.push(
      `/assessments/${assessmentId}/overview?mode=learner`,
    );

  }


  if (loading) {

    return (

      <div
        className="
          min-h-screen
          bg-[#e9eef5]
          flex
          items-center
          justify-center
          text-[#25324b]
          font-bold
        "
      >

        Loading available assessments...

      </div>

    );

  }


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


        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div
          className="
            mb-8
            rounded-3xl
            bg-[#e9eef5]
            p-8
            shadow-[9px_9px_18px_#c7ccd3,-9px_-9px_18px_#ffffff]
          "
        >

          <h1
            className="
              text-3xl
              font-bold
            "
          >

            Available Assessments

          </h1>


          <p
            className="
              mt-2
              text-gray-500
            "
          >

            Select an assessment and proceed
            to view instructions.

          </p>

        </div>


        {/* =====================================================
            ERROR
        ====================================================== */}

        {
          error && (

            <div
              className="
                mb-5
                rounded-xl
                bg-red-100
                p-4
                text-red-600
              "
            >

              {error}

            </div>

          )
        }


        {/* =====================================================
            NO ASSESSMENTS
        ====================================================== */}

        {
          assessments.length === 0

            ? (

              <div
                className="
                  rounded-3xl
                  bg-[#e9eef5]
                  p-10
                  text-center
                  shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
                "
              >

                <p
                  className="
                    text-gray-500
                  "
                >

                  No published assessments
                  available.

                </p>

              </div>

            )

            : (

              /* =================================================
                 ASSESSMENT CARDS
              ================================================== */

              <div
                className="
                  grid
                  gap-6
                  md:grid-cols-2
                  lg:grid-cols-3
                "
              >

                {
                  assessments.map(
                    (
                      assessment,
                    ) => {

                      const attemptLimit =
                        getAttemptLimit(
                          assessment,
                        );


                      return (

                        <div
                          key={
                            assessment.id
                          }
                          className="
                            rounded-3xl
                            bg-[#e9eef5]
                            p-6
                            shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff]
                          "
                        >


                          {/* =====================================
                              TITLE
                          ====================================== */}

                          <h2
                            className="
                              text-xl
                              font-bold
                            "
                          >

                            {
                              assessment.title
                            }

                          </h2>


                          {/* =====================================
                              CODE
                          ====================================== */}

                          <p
                            className="
                              mt-2
                              text-sm
                              text-gray-500
                            "
                          >

                            {
                              assessment.code
                            }

                          </p>


                          {/* =====================================
                              DESCRIPTION
                          ====================================== */}

                          <p
                            className="
                              mt-4
                              text-sm
                              leading-6
                              text-gray-600
                            "
                          >

                            {
                              assessment.description ||
                              "Complete this assessment by answering all questions within the given time."
                            }

                          </p>


                          {/* =====================================
                              DETAILS
                          ====================================== */}

                          <div
                            className="
                              mt-5
                              space-y-3
                              text-sm
                            "
                          >


                            {/* Technology */}

                            <div
                              className="
                                flex
                                justify-between
                                gap-4
                              "
                            >

                              <span>
                                Technology
                              </span>

                              <b>
                                {
                                  assessment.technology ||
                                  "-"
                                }
                              </b>

                            </div>


                            {/* Difficulty */}

                            <div
                              className="
                                flex
                                justify-between
                                gap-4
                              "
                            >

                              <span>
                                Difficulty
                              </span>

                              <b>
                                {
                                  assessment.difficulty ||
                                  "-"
                                }
                              </b>

                            </div>


                            {/* Duration */}

                            <div
                              className="
                                flex
                                justify-between
                                gap-4
                              "
                            >

                              <span>
                                Duration
                              </span>

                              <b>
                                {
                                  assessment.durationMinutes
                                    ? `${assessment.durationMinutes} min`
                                    : "-"
                                }
                              </b>

                            </div>


                            {/* Questions */}

                            <div
                              className="
                                flex
                                justify-between
                                gap-4
                              "
                            >

                              <span>
                                Questions
                              </span>

                              <b>
                                {
                                  assessment.plannedQuestions ??
                                  0
                                }
                              </b>

                            </div>


                            {/* Marks */}

                            <div
                              className="
                                flex
                                justify-between
                                gap-4
                              "
                            >

                              <span>
                                Total Marks
                              </span>

                              <b>
                                {
                                  assessment.totalMarks ??
                                  0
                                }
                              </b>

                            </div>


                            {/* =================================
                                ATTEMPT LIMIT
                            ================================== */}

                            <div
                              className="
                                flex
                                justify-between
                                gap-4
                                border-t
                                border-gray-300
                                pt-3
                              "
                            >

                              <span>
                                Attempts Allowed
                              </span>

                              <b
                                className="
                                  text-[#24579a]
                                "
                              >

                                {
                                  attemptLimit > 0
                                    ? attemptLimit
                                    : "-"
                                }

                              </b>

                            </div>


                          </div>


                          {/* =====================================
                              ATTEMPT INFORMATION
                          ====================================== */}

                          <div
                            className="
                              mt-5
                              rounded-xl
                              bg-[#e1e7ef]
                              p-3
                              text-xs
                              text-gray-600
                            "
                          >

                            <div
                              className="
                                flex
                                items-center
                                gap-2
                              "
                            >

                              <span
                                className="
                                  font-bold
                                  text-[#25324b]
                                "
                              >

                                Attempt Limit

                              </span>

                            </div>


                            <p
                              className="
                                mt-1
                              "
                            >

                              You can attempt this
                              assessment up to{" "}

                              <b>
                                {
                                  attemptLimit > 0
                                    ? attemptLimit
                                    : "the configured"
                                }
                              </b>{" "}

                              time
                              {attemptLimit === 1
                                ? ""
                                : "s"}.

                            </p>


                            <p
                              className="
                                mt-1
                                text-gray-500
                              "
                            >

                              Once the maximum number
                              of attempts is reached,
                              another attempt cannot
                              be started.

                            </p>

                          </div>


                          {/* =====================================
                              PROCEED BUTTON
                          ====================================== */}

                          <button
                            onClick={() =>
                              proceed(
                                assessment.id,
                              )
                            }
                            className="
                              mt-6
                              w-full
                              rounded-xl
                              bg-[#24579a]
                              py-3
                              font-bold
                              text-white
                              shadow-lg
                              transition
                              hover:bg-[#1d477d]
                              active:scale-[0.98]
                            "
                          >

                            Proceed

                          </button>


                        </div>

                      );

                    },
                  )
                }

              </div>

            )
        }


      </div>

    </div>

  );

}