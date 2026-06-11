"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminResponsesPage() {
  const router = useRouter();
  const [surveys, setSurveys]         = useState([]);
  const [selected, setSelected]       = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [totalResponses, setTotal]    = useState(0);
  const [overallMean, setOverallMean] = useState(0);
  const [overallSD, setOverallSD]     = useState(0);
  const [recentRespondents, setRecent]= useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingResp, setLoadingResp] = useState(false);

  useEffect(() => {
    fetch("/api/admin/surveys").then(r => {
      if (r.status === 401) { router.push("/login"); return null; }
      return r.json();
    }).then(d => { if (d) { setSurveys(d); setLoading(false); } });
  }, [router]);

  async function loadResponses(survey) {
    setSelected(survey);
    setLoadingResp(true);
    const r = await fetch(`/api/admin/responses?surveyId=${survey.id}`);
    const d = await r.json();
    setQuestions(d.questions || []);
    setTotal(d.totalResponses || 0);
    setOverallMean(d.overallMean || 0);
    setOverallSD(d.overallSD || 0);
    setRecent(d.recentRespondents || []);
    setLoadingResp(false);
  }

  function interpretation(mean) {
    const m = parseFloat(mean);
    if (m >= 4.21) return { label: "Very High", color: "#16a34a" };
    if (m >= 3.41) return { label: "High",      color: "#4F8CFF" };
    if (m >= 2.61) return { label: "Moderate",  color: "#ca8a04" };
    if (m >= 1.81) return { label: "Low",       color: "#f97316" };
    return             { label: "Very Low",  color: "#dc2626" };
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #4F8CFF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", margin: 0 }}>📋 Survey Responses</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>View and analyze student feedback</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>

          {/* ── Survey list ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>SELECT SURVEY</p>
            {surveys.length === 0 && <p style={{ fontSize: 13, color: "#94a3b8" }}>No surveys yet.</p>}
            {surveys.map(s => (
              <button key={s.id} onClick={() => loadResponses(s)} style={{
                padding: "12px 14px", borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left",
                background: selected?.id === s.id ? "#EBF1FF" : "white",
                borderLeft: `3px solid ${selected?.id === s.id ? "#4F8CFF" : "transparent"}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.15s",
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: selected?.id === s.id ? "#4F8CFF" : "#1e293b", margin: "0 0 4px" }}>{s.title}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{s._count?.responses || 0} responses</p>
              </button>
            ))}
          </div>

          {/* ── Results panel ── */}
          <div>
            {!selected ? (
              <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>👈</p>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>Select a survey to view results</p>
              </div>
            ) : loadingResp ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <div style={{ width: 28, height: 28, border: "3px solid #4F8CFF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : totalResponses === 0 ? (
              <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>📭</p>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>No responses yet for this survey</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Summary bar */}
                <div style={{ background: "white", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>{selected.title}</h2>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#4F8CFF" }}>{totalResponses} response{totalResponses !== 1 ? "s" : ""}</span>
                </div>

                {/* Question analysis table */}
                <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 14 }}>QUESTION ANALYSIS (5-Point Likert Scale)</p>

                  {/* Table header */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 70px 70px 90px",
                    gap: 8, padding: "6px 14px", marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Question</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "center" }}>Mean</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "center" }}>SD</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "center" }}>Interpretation</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {questions.map((q, i) => {
                      const interp = interpretation(q.mean);
                      return (
                        <div key={q.id} style={{
                          display: "grid", gridTemplateColumns: "1fr 70px 70px 90px",
                          gap: 8, padding: "12px 14px", background: "#F8FAFF", borderRadius: 12,
                          alignItems: "center", animation: `fadeSlideUp 0.4s ease ${i * 0.04}s both`,
                        }}>
                          {/* Question text */}
                          <div>
                            <p style={{ fontSize: 12, color: "#475569", margin: "0 0 6px" }}>
                              <strong style={{ color: "#1e293b" }}>{i + 1}.</strong> {q.question}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 99, height: 5, overflow: "hidden" }}>
                                <div style={{ width: `${(q.mean / 5) * 100}%`, height: "100%", background: interp.color, borderRadius: 99, transition: "width 1s ease" }} />
                              </div>
                              <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>{q.count}n · {q.category}</span>
                            </div>
                          </div>

                          {/* Mean */}
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 20, fontWeight: 800, color: interp.color, margin: 0, lineHeight: 1 }}>{q.mean.toFixed(2)}</p>
                          </div>

                          {/* SD */}
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 20, fontWeight: 700, color: "#64748b", margin: 0, lineHeight: 1 }}>{q.sd.toFixed(2)}</p>
                            <p style={{ fontSize: 9, color: "#94a3b8", margin: "2px 0 0" }}>std dev</p>
                          </div>

                          {/* Interpretation badge */}
                          <div style={{ textAlign: "center" }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 20,
                              background: `${interp.color}18`, color: interp.color, whiteSpace: "nowrap",
                            }}>
                              {interp.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall mean + SD footer */}
                  <div style={{ marginTop: 14, padding: "16px 18px", background: "linear-gradient(135deg,#1e293b,#334155)", borderRadius: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 90px", gap: 8, alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: "0 0 2px" }}>Overall Mean Score</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                          Based on {totalResponses} response{totalResponses !== 1 ? "s" : ""} · {questions.length} questions
                        </p>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 26, fontWeight: 900, color: "#4F8CFF", margin: 0, lineHeight: 1 }}>{overallMean.toFixed(2)}</p>
                        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>mean</p>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 26, fontWeight: 900, color: "#a5b4fc", margin: 0, lineHeight: 1 }}>{overallSD.toFixed(2)}</p>
                        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>std dev</p>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 20,
                          background: `${interpretation(overallMean).color}30`,
                          color: interpretation(overallMean).color,
                        }}>
                          {interpretation(overallMean).label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interpretation scale legend */}
                <div style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase" }}>Scale Interpretation</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { range: "4.21 – 5.00", label: "Very High", color: "#16a34a" },
                      { range: "3.41 – 4.20", label: "High",      color: "#4F8CFF" },
                      { range: "2.61 – 3.40", label: "Moderate",  color: "#ca8a04" },
                      { range: "1.81 – 2.60", label: "Low",       color: "#f97316" },
                      { range: "1.00 – 1.80", label: "Very Low",  color: "#dc2626" },
                    ].map(s => (
                      <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: `${s.color}10`, borderRadius: 20 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.range} = {s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent respondents */}
                {recentRespondents.length > 0 && (
                  <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>RECENT RESPONDENTS</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {recentRespondents.map((r, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#F8FAFF", borderRadius: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "linear-gradient(135deg,#4F8CFF,#667eea)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontWeight: 800, fontSize: 13, flexShrink: 0,
                          }}>
                            {(r.name || r.email || "?")[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", margin: 0 }}>{r.name || "Unknown"}</p>
                            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{r.email}</p>
                          </div>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{formatDate(r.submittedAt || r.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}