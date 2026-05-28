"use client";

import { useState, useRef, useEffect } from "react";

type CriterionResult = {
  score: number;
  feedback: string;
};

type EvalResult = {
  overall: string;
  criteria: Record<string, CriterionResult>;
};

const CRITERIA = [
  {
    key: "writing",
    label: "Writing",
    icon: "✍️",
    desc: "Grammar, clarity, and sentence structure",
  },
  {
    key: "detail",
    label: "Detail",
    icon: "🔍",
    desc: "Specificity, examples, and depth",
  },
  {
    key: "voice",
    label: "Voice",
    icon: "🎙️",
    desc: "Authenticity and personal tone",
  },
  {
    key: "character",
    label: "Character",
    icon: "✨",
    desc: "Personality and unique perspective",
  },
];

const RESULT_KEY = "essay_result";

function saveResult(result: EvalResult) {
  try {
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {}
}
function loadResult(): EvalResult | null {
  try {
    const r = localStorage.getItem(RESULT_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

function ScoreRing({ score }: { score: number }) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 10) * circ;
  const color =
    score >= 8
      ? "#22c55e"
      : score >= 6
      ? "#3b82f6"
      : score >= 4
      ? "#f59e0b"
      : "#ef4444";
  return (
    <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.85rem",
          fontWeight: 800,
          color,
        }}
      >
        {score}
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 8
      ? "#22c55e"
      : score >= 6
      ? "#3b82f6"
      : score >= 4
      ? "#f59e0b"
      : "#ef4444";
  return (
    <div
      style={{
        width: "100%",
        height: "4px",
        background: "#27272a",
        borderRadius: "999px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${score * 10}%`,
          background: color,
          borderRadius: "999px",
          transition: "width 0.8s ease",
        }}
      />
    </div>
  );
}

export default function EssayEvaluator() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResult(loadResult());
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [result, loading]);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setInput(val);
    setWordCount(val.trim() === "" ? 0 : val.trim().split(/\s+/).length);
  }

  function clearAll() {
    setResult(null);
    setError(null);
    setInput("");
    setWordCount(0);
    localStorage.removeItem(RESULT_KEY);
  }

  async function evaluate() {
    if (!input.trim()) return;
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const parsed: EvalResult = JSON.parse(data.reply);
      setResult(parsed);
      saveResult(parsed);
    } catch {
      setError("The AI returned an unexpected response. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const overallScore = result
    ? Math.round(
        (Object.values(result.criteria).reduce((s, c) => s + c.score, 0) /
          CRITERIA.length) *
          10
      ) / 10
    : null;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        background: "#09090b",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "260px",
          background: "#111111",
          borderRight: "1px solid #27272a",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#f4f4f5",
          }}
        >
          ✦ EssayAI
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "#a1a1aa",
              textTransform: "uppercase" as const,
              paddingLeft: "4px",
            }}
          >
            Criteria
          </p>
          {CRITERIA.map((c) => (
            <div
              key={c.key}
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1px solid #27272a",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span>{c.icon}</span>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "#f4f4f5",
                    fontWeight: 500,
                  }}
                >
                  {c.label}
                </span>
              </div>
              {result?.criteria[c.key] && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color:
                      result.criteria[c.key].score >= 8
                        ? "#22c55e"
                        : result.criteria[c.key].score >= 6
                        ? "#3b82f6"
                        : result.criteria[c.key].score >= 4
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                >
                  {result.criteria[c.key].score}/10
                </span>
              )}
            </div>
          ))}
        </div>

        {overallScore !== null && (
          <div
            style={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <p
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "#a1a1aa",
                textTransform: "uppercase" as const,
              }}
            >
              Overall Score
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  color: "#3b82f6",
                  letterSpacing: "-0.04em",
                }}
              >
                {overallScore}
              </span>
              <span style={{ fontSize: "1rem", color: "#a1a1aa" }}>/10</span>
            </div>
            <ScoreBar score={overallScore} />
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          <button
            onClick={clearAll}
            style={{
              width: "100%",
              padding: "11px 14px",
              border: "1px solid #27272a",
              borderRadius: "12px",
              background: "transparent",
              color: "#a1a1aa",
              fontWeight: 500,
              fontSize: "0.88rem",
              cursor: "pointer",
              textAlign: "left" as const,
            }}
          >
            🗑 Clear & Reset
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Input */}
        <div
          style={{
            flex: 1,
            borderRight: "1px solid #27272a",
            padding: "36px 32px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f4f4f5" }}
            >
              Your Essay
            </h2>
            <p
              style={{
                fontSize: "0.82rem",
                color: "#a1a1aa",
                marginTop: "4px",
              }}
            >
              Paste your essay and click Evaluate
            </p>
          </div>

          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Paste your essay here..."
            style={{
              flex: 1,
              width: "100%",
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "24px",
              padding: "20px",
              color: "#f4f4f5",
              resize: "none",
              outline: "none",
              fontSize: "0.95rem",
              lineHeight: 1.75,
              fontFamily: "inherit",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#27272a";
              e.target.style.boxShadow = "none";
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "14px",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>
              {wordCount} word{wordCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={evaluate}
              disabled={loading || !input.trim()}
              style={{
                padding: "12px 28px",
                border: "none",
                borderRadius: "18px",
                background: loading || !input.trim() ? "#27272a" : "#3b82f6",
                color: loading || !input.trim() ? "#a1a1aa" : "white",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                transition: "0.2s ease",
              }}
            >
              {loading ? "Evaluating…" : "Evaluate →"}
            </button>
          </div>
        </div>

        {/* Right: Feedback */}
        <div
          style={{
            flex: 1,
            padding: "36px 32px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            minWidth: 0,
          }}
        >
          <div>
            <h2
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f4f4f5" }}
            >
              Feedback
            </h2>
            <p
              style={{
                fontSize: "0.82rem",
                color: "#a1a1aa",
                marginTop: "4px",
              }}
            >
              AI-powered analysis across 4 criteria
            </p>
          </div>

          {(result || loading) && (
            <div
              style={{
                background: "#18181b",
                border: "1px solid rgba(59,130,246,0.25)",
                borderRadius: "24px",
                padding: "20px 24px",
              }}
            >
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "#3b82f6",
                  marginBottom: "10px",
                }}
              >
                ✦ Overall Summary
              </p>
              {loading ? (
                <div
                  style={{ display: "flex", gap: "5px", alignItems: "center" }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#3b82f6",
                        animation: `pulse 1.2s ease-in-out ${
                          i * 0.2
                        }s infinite`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: "0.92rem",
                    lineHeight: 1.75,
                    color: "#f4f4f5",
                  }}
                >
                  {result?.overall}
                </p>
              )}
            </div>
          )}

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "24px",
                padding: "16px 20px",
                fontSize: "0.88rem",
                color: "#ef4444",
              }}
            >
              ⚠ {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {CRITERIA.map((c) => {
              const data = result?.criteria[c.key];
              const isLoading = loading && !data;
              return (
                <div
                  key={c.key}
                  style={{
                    background: "#18181b",
                    border: `1px solid ${
                      data ? "rgba(59,130,246,0.25)" : "#27272a"
                    }`,
                    borderRadius: "24px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    transition: "border-color 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>{c.icon}</span>
                      <div>
                        <div
                          style={{
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            color: "#f4f4f5",
                          }}
                        >
                          {c.label}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#a1a1aa" }}>
                          {c.desc}
                        </div>
                      </div>
                    </div>
                    {data && <ScoreRing score={data.score} />}
                  </div>

                  {data && <ScoreBar score={data.score} />}

                  <div style={{ height: "1px", background: "#27272a" }} />

                  {isLoading ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        alignItems: "center",
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "#3b82f6",
                            animation: `pulse 1.2s ease-in-out ${
                              i * 0.2
                            }s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  ) : data ? (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        lineHeight: 1.75,
                        color: "#f4f4f5",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {data.feedback}
                    </p>
                  ) : (
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "#a1a1aa",
                        fontStyle: "italic",
                      }}
                    >
                      Awaiting essay…
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {!result && !loading && !error && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "#a1a1aa",
                textAlign: "center" as const,
                paddingBottom: "40px",
              }}
            >
              <div style={{ fontSize: "2.5rem" }}>✦</div>
              <p style={{ fontSize: "0.95rem", fontWeight: 500 }}>
                No feedback yet
              </p>
              <p
                style={{
                  fontSize: "0.82rem",
                  maxWidth: "260px",
                  lineHeight: 1.6,
                }}
              >
                Paste your essay on the left and click Evaluate to get started.
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
