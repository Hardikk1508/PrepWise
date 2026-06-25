import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://localhost:8000/api";
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const colors = {
  background: "#fafafa",
  surface: "#ffffff",
  primary: "#18181b",
  secondary: "#71717a",
  muted: "#a1a1aa",
  border: "#e4e4e7",
  accent: "#f4f4f5",
  success: "#16a34a",
  warning: "#ca8a04",
  danger: "#dc2626",
};

const sc = (s) => (s >= 8 ? colors.success : s >= 6 ? colors.warning : colors.danger);

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function InterviewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/interview/${id}`, { headers: authHeaders() })
      .then((res) => setInterview(res.data.interview))
      .catch(() => navigate("/history"))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadReport = async () => {
    try {
      const res = await axios.get(`${API}/report/${id}`, { headers: authHeaders(), responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", `PrepWise_Report_${id}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Download failed.");
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.background,
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        <motion.div
          style={{
            width: "26px",
            height: "26px",
            border: `3px solid ${colors.border}`,
            borderTop: `3px solid ${colors.primary}`,
            borderRadius: "50%",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      </motion.div>
    );
  }

  if (!interview) return null;

  const skillRows = [
    ["Communication", interview.communication ?? 0],
    ["Technical depth", interview.technicalDepth ?? 0],
    ["Problem solving", interview.problemSolving ?? 0],
    ["Confidence", interview.confidence ?? 0],
  ];

  const overallScore = interview.overallScore ?? 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (overallScore / 10) * circumference;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: colors.primary,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 8px; }
        @media(max-width:640px){ .two-col{ grid-template-columns: 1fr !important; } }
        @media(max-width:560px){ .nav-pad{ padding: 0 16px !important; } .content-pad{ padding: 18px !important; } }
      `}</style>

      {/* Nav */}
      <div
        className="nav-pad"
        style={{
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          height: "64px",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <motion.button
            whileHover={{ background: colors.accent }}
            onClick={() => navigate("/history")}
            style={{
              padding: "8px 14px",
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              background: colors.surface,
              color: colors.secondary,
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ← History
          </motion.button>
          <span style={{ width: "1px", height: "18px", background: colors.border }} />
          <span style={{ fontSize: "14px", fontWeight: "600" }}>Interview report</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <motion.button
            whileHover={{ background: colors.accent }}
            onClick={downloadReport}
            style={{
              padding: "8px 16px",
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              background: colors.surface,
              color: colors.secondary,
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ↓ Download PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "10px",
              background: colors.primary,
              color: "#fff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onClick={() => navigate("/mock-interview")}
          >
            Try again
          </motion.button>
        </div>
      </div>

      <div className="content-pad" style={{ maxWidth: "880px", margin: "0 auto", padding: "32px 24px" }}>
        <motion.div initial="hidden" animate="show" variants={staggerContainer}>
          {/* Header */}
          <motion.div variants={fadeUp} style={{ marginBottom: "24px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px", letterSpacing: "-0.4px" }}>{interview.role}</h1>
            <p style={{ fontSize: "14px", color: colors.secondary, margin: 0 }}>
              {interview.type} · {interview.level} ·{" "}
              {new Date(interview.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </motion.div>

          {/* Score banner */}
          <motion.div
            variants={fadeUp}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: "22px",
              padding: "28px 30px",
              marginBottom: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
                <circle cx="60" cy="60" r="54" fill="none" stroke={colors.accent} strokeWidth="10" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke={sc(overallScore)}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="56" textAnchor="middle" fill={colors.primary} fontSize="26" fontWeight="700">
                  {overallScore}
                </text>
                <text x="60" y="74" textAnchor="middle" fill={colors.muted} fontSize="11">
                  / 10
                </text>
              </svg>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: colors.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                    fontWeight: "600",
                  }}
                >
                  Overall score
                </div>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  {[
                    ["Questions", interview.questions.length],
                    ["Type", interview.type],
                    ["Duration", interview.duration],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: colors.primary }}>{v}</div>
                      <div style={{ fontSize: "12px", color: colors.muted }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Skills + Strengths/Weaknesses */}
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -2 }}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "20px",
                padding: "22px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: colors.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "16px",
                }}
              >
                Skill scores
              </div>
              {skillRows.map(([label, val], idx) => (
                <div key={label} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                    <span style={{ color: colors.secondary }}>{label}</span>
                    <span style={{ color: sc(val), fontWeight: "600" }}>{val}/10</span>
                  </div>
                  <div style={{ height: "5px", background: colors.accent, borderRadius: "4px" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val * 10}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.06, ease: "easeOut" }}
                      style={{ height: "5px", background: colors.primary, borderRadius: "4px" }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -2 }}
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "20px",
                  padding: "18px",
                  flex: 1,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: colors.success,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "10px",
                  }}
                >
                  Strengths
                </div>
                {(interview.strengths || []).length > 0 ? (
                  (interview.strengths || []).map((s, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "13px",
                        color: colors.secondary,
                        lineHeight: 1.6,
                        paddingBottom: "8px",
                        borderBottom: i < interview.strengths.length - 1 ? `1px solid ${colors.accent}` : "none",
                        marginBottom: "8px",
                      }}
                    >
                      {s}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "13px", color: colors.muted }}>Not available</div>
                )}
              </motion.div>

              <motion.div
                variants={fadeUp}
                whileHover={{ y: -2 }}
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "20px",
                  padding: "18px",
                  flex: 1,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: colors.warning,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "10px",
                  }}
                >
                  Areas to improve
                </div>
                {(interview.weaknesses || []).length > 0 ? (
                  (interview.weaknesses || []).map((s, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "13px",
                        color: colors.secondary,
                        lineHeight: 1.6,
                        paddingBottom: "8px",
                        borderBottom: i < interview.weaknesses.length - 1 ? `1px solid ${colors.accent}` : "none",
                        marginBottom: "8px",
                      }}
                    >
                      {s}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "13px", color: colors.muted }}>Not available</div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Questions */}
          <motion.div
            variants={fadeUp}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: "20px",
              padding: "22px",
              marginBottom: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: colors.muted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "16px",
              }}
            >
              Question breakdown
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {interview.questions.map((q, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -1 }}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{
                    borderRadius: "14px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    border: `1px solid ${colors.accent}`,
                    background: colors.background,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9px",
                        background: colors.accent,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: "700", color: sc(q.score), lineHeight: 1 }}>{q.score}</span>
                      <span style={{ fontSize: "8px", color: colors.muted }}>/10</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: colors.primary, marginBottom: "4px" }}>
                        Q{i + 1}: {q.question}
                      </div>
                      <div style={{ height: "3px", background: colors.accent, borderRadius: "2px" }}>
                        <div style={{ height: "3px", width: `${q.score * 10}%`, background: colors.primary, borderRadius: "2px" }} />
                      </div>
                    </div>
                    <span style={{ fontSize: "12px", color: colors.muted }}>{expanded === i ? "↑" : "↓"}</span>
                  </div>
                  <AnimatePresence>
                    {expanded === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${colors.border}`, overflow: "hidden" }}
                      >
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: colors.muted,
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            marginBottom: "7px",
                          }}
                        >
                          Your answer
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: colors.secondary,
                            lineHeight: 1.6,
                            marginBottom: "12px",
                            padding: "10px 12px",
                            background: colors.surface,
                            borderRadius: "10px",
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {q.answer || <span style={{ color: colors.muted, fontStyle: "italic" }}>No answer provided</span>}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: colors.muted,
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            marginBottom: "7px",
                          }}
                        >
                          AI feedback
                        </div>
                        <div style={{ fontSize: "13px", color: colors.secondary, lineHeight: 1.6 }}>{q.feedback}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Improvement plan */}
          {interview.improvementPlan?.length > 0 && (
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -2 }}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "20px",
                padding: "22px",
                marginBottom: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: colors.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "16px",
                }}
              >
                Improvement plan
              </div>
              {interview.improvementPlan.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "11px 0",
                    borderBottom: i < interview.improvementPlan.length - 1 ? `1px solid ${colors.accent}` : "none",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "8px",
                      background: colors.accent,
                      color: colors.secondary,
                      fontSize: "11px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: "14px", color: colors.secondary, lineHeight: 1.6 }}>{step}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Next steps */}
          {interview.nextSteps?.length > 0 && (
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -2 }}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "20px",
                padding: "22px",
                marginBottom: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: colors.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "16px",
                }}
              >
                Next steps
              </div>
              {interview.nextSteps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "9px 0",
                    borderBottom: i < interview.nextSteps.length - 1 ? `1px solid ${colors.accent}` : "none",
                  }}
                >
                  <span style={{ fontSize: "13px", color: colors.muted, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: "14px", color: colors.secondary, lineHeight: 1.6 }}>{step}</span>
                </div>
              ))}
            </motion.div>
          )}

          <motion.div variants={fadeUp} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/mock-interview")}
              style={{
                padding: "11px 20px",
                border: "none",
                borderRadius: "14px",
                background: colors.primary,
                color: "#fff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              New session
            </motion.button>
            <motion.button
              whileHover={{ background: colors.accent }}
              onClick={downloadReport}
              style={{
                padding: "11px 20px",
                border: `1px solid ${colors.border}`,
                borderRadius: "14px",
                background: colors.surface,
                color: colors.secondary,
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ↓ Download PDF
            </motion.button>
            <motion.button
              whileHover={{ background: colors.accent }}
              onClick={() => navigate("/history")}
              style={{
                padding: "11px 20px",
                border: `1px solid ${colors.border}`,
                borderRadius: "14px",
                background: colors.surface,
                color: colors.secondary,
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← All sessions
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}