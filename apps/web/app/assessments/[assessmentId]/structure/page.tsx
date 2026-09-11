// Updated Step 2 Assessment Structure page
// This file keeps backend unchanged.
// API payload matches AssessmentSection table:
// assessmentId, title, description, totalMarks, durationMinutes, sequence

"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import "./structure.css";

export default function AssessmentStructurePage(){

  const router = useRouter();
  const params = useParams();

  const assessmentId = params.assessmentId as string;

  const [section,setSection] = useState({
    name:"",
    description:"",
    marks:0,
    timeLimitMinutes:0
  });

  async function saveAndContinue(){

    const response = await fetch(
      "http://localhost:3001/assessment-sections",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          assessmentId,

          title:section.name,

          description:
            section.description,

          totalMarks:
            section.marks,

          durationMinutes:
            section.timeLimitMinutes,

          sequence:1
        })
      }
    );

    if(!response.ok){
      throw new Error("Section save failed");
    }

    router.push(
      `/assessments/${assessmentId}/questions`
    );
  }


  return (
    <main className="structure-page">

      <div className="structure-card">

        <button
          className="back-link"
          onClick={() =>
            router.push(
              `/assessments/${assessmentId}/edit`
            )
          }
        >
          ← Back to Assessment Setup
        </button>


        <h1>
          Assessment Structure
        </h1>


        <div className="form-section">

          <label>Section Name</label>

          <input
            value={section.name}
            onChange={(e)=>
              setSection({
                ...section,
                name:e.target.value
              })
            }
          />


          <label>Description</label>

          <textarea
            value={section.description}
            onChange={(e)=>
              setSection({
                ...section,
                description:e.target.value
              })
            }
          />


          <label>Total Marks</label>

          <input
            type="number"
            value={section.marks}
            onChange={(e)=>
              setSection({
                ...section,
                marks:Number(e.target.value)
              })
            }
          />


          <label>Duration Minutes</label>

          <input
            type="number"
            value={section.timeLimitMinutes}
            onChange={(e)=>
              setSection({
                ...section,
                timeLimitMinutes:Number(e.target.value)
              })
            }
          />


        </div>


        <div className="footer-actions">

          <button
            className="secondary-button"
            onClick={() =>
              router.push(
                `/assessments/${assessmentId}/edit`
              )
            }
          >
            ← Back
          </button>


          <button
            className="primary-button"
            onClick={saveAndContinue}
          >
            Save & Continue →
          </button>

        </div>


      </div>

    </main>
  );
}
