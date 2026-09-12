"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";

import "./c-practice.css";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

const DEFAULT_CODE = `#include <stdio.h>

int main(void)
{
    int a;
    int b;

    scanf("%d %d", &a, &b);

    printf("%d\\\\n", a + b);

    return 0;
}
`;

interface RunResponse {
  executionId: string;

  language: string;

  status:
    | "SUCCESS"
    | "COMPILE_ERROR"
    | "RUNTIME_ERROR"
    | "TIMEOUT";

  stdout: string;

  stderr: string;

  exitCode: number | null;

  executionTimeMs: number;
}

export default function CPracticePage() {
  const [code, setCode] =
    useState(DEFAULT_CODE);

  const [input, setInput] =
    useState("10 20");

  const [output, setOutput] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [
    executionTime,
    setExecutionTime,
  ] = useState<number | null>(
    null,
  );

  const [isRunning, setIsRunning] =
    useState(false);

  /* ============================================================
     RUN CODE
     ============================================================ */

  async function runCode() {
    try {
      setIsRunning(true);

      setStatus("RUNNING");

      setOutput("");

      setExecutionTime(null);

      const response =
        await fetch(
          `${API_URL}/execution/run`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              language: "c",

              code,

              input,
            }),
          },
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const result: RunResponse =
        await response.json();

      setStatus(
        result.status,
      );

      setExecutionTime(
        result.executionTimeMs,
      );

      if (
        result.status ===
        "SUCCESS"
      ) {
        setOutput(
          result.stdout ||
            "Program completed with no output.",
        );
      } else {
        setOutput(
          result.stderr ||
            result.stdout ||
            result.status,
        );
      }
    } catch (error) {
      console.error(
        "C EXECUTION ERROR:",
        error,
      );

      setStatus("ERROR");

      setOutput(
        "Unable to connect to the execution service.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  /* ============================================================
     RESET
     ============================================================ */

  function resetCode() {
    setCode(DEFAULT_CODE);

    setInput("10 20");

    setOutput("");

    setStatus("");

    setExecutionTime(null);
  }

  /* ============================================================
     STATUS CLASS
     ============================================================ */

  const statusClass = status
    ? `status-${status.toLowerCase()}`
    : "";

  /* ============================================================
     UI
     ============================================================ */

  return (
    <main className="c-practice-page">

      <div className="c-practice-container">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="c-practice-header">

          <div className="c-header-left">

            <h1>
              C Programming Practice
            </h1>

            <p>
              Write, compile, run and
              validate C programs in the
              eLabs secure coding
              environment.
            </p>

          </div>

          <div className="c-language-badge">
            C · GCC
          </div>

        </header>

        {/* ======================================================
            WORKSPACE
        ====================================================== */}

        <div className="c-workspace">

          {/* ====================================================
              PROBLEM PANEL
          ==================================================== */}

          <aside className="neo-card problem-panel">

            <span className="problem-number">
              PRACTICE 01
            </span>

            <h2>
              Add Two Numbers
            </h2>

            <p className="problem-description">
              Write a C program that
              reads two integers from
              standard input and prints
              their sum.
            </p>

            {/* INPUT */}

            <div className="problem-section">

              <h3>
                Input
              </h3>

              <p>
                Two space-separated
                integers.
              </p>

              <div className="example-box">
                10 20
              </div>

            </div>

            {/* EXPECTED OUTPUT */}

            <div className="problem-section">

              <h3>
                Expected Output
              </h3>

              <div className="example-box">
                30
              </div>

            </div>

            {/* CONSTRAINTS */}

            <div className="problem-section">

              <h3>
                Constraints
              </h3>

              <p>
                Read values using standard
                input and print only the
                required result.
              </p>

            </div>

          </aside>

          {/* ====================================================
              EDITOR COLUMN
          ==================================================== */}

          <section className="editor-column">

            {/* ==================================================
                CODE EDITOR
            ================================================== */}

            <div className="neo-card editor-card">

              <div className="editor-toolbar">

                <span className="editor-title">
                  Code Editor
                </span>

                <span className="editor-file">
                  main.c
                </span>

              </div>

              <div className="editor-wrapper">

                <Editor
                  height="500px"
                  language="c"
                  theme="vs-dark"
                  value={code}
                  onChange={(value) =>
                    setCode(
                      value ?? "",
                    )
                  }
                  options={{
                    minimap: {
                      enabled: false,
                    },

                    fontSize: 15,

                    lineNumbers:
                      "on",

                    automaticLayout:
                      true,

                    scrollBeyondLastLine:
                      false,

                    tabSize: 4,

                    wordWrap: "on",
                  }}
                />

              </div>

            </div>

            {/* ==================================================
                INPUT
            ================================================== */}

            <div className="neo-card input-card">

              <label
                className="section-label"
                htmlFor="custom-input"
              >
                Custom Input
              </label>

              <textarea
                id="custom-input"
                className="custom-input"
                value={input}
                onChange={(event) =>
                  setInput(
                    event.target.value,
                  )
                }
                placeholder="Enter program input..."
              />

              {/* =================================================
                  ACTION BAR
              ================================================= */}

              <div className="action-bar">

                <button
                  type="button"
                  className="neo-button run-button"
                  onClick={
                    runCode
                  }
                  disabled={
                    isRunning
                  }
                >
                  {isRunning
                    ? "Running..."
                    : "▶ Run Code"}
                </button>

                <button
                  type="button"
                  className="neo-button test-button"
                  disabled
                  title="Test runner will be enabled when test-case execution is implemented."
                >
                  ✓ Run Tests
                </button>

                <button
                  type="button"
                  className="neo-button reset-button"
                  onClick={
                    resetCode
                  }
                  disabled={
                    isRunning
                  }
                >
                  ↻ Reset
                </button>

              </div>

            </div>

            {/* ==================================================
                OUTPUT CONSOLE
            ================================================== */}

            <div className="neo-card output-card">

              <div className="output-header">

                <h3>
                  Output Console
                </h3>

                {status && (
                  <span
                    className={`status-badge ${statusClass}`}
                  >
                    {status}
                  </span>
                )}

              </div>

              <pre className="output-console">
                {output ||
                  "Run your C program to see the output here."}
              </pre>

              {executionTime !==
                null && (
                <div className="execution-meta">

                  Execution time:{" "}
                  {
                    executionTime
                  }{" "}
                  ms

                </div>
              )}

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}
