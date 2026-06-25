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

const sc = (s) => (s >= 9 ? colors.success : s >= 7 ? colors.warning : colors.danger);
const sl = (s) => (s >= 9 ? "Excellent" : s >= 7.5 ? "Good" : s >= 6 ? "Average" : "Needs work");

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function Feedback() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [expanded, setExpanded] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No interview ID provided. Navigate here from History or after completing a session.");
      setLoading(false);
      return;
    }
    axios
      .get(`${API}/interview/${id}`, { headers: authHeaders() })
      .then((res) => {
        if (!res.data.interview) {
          setError("Interview report not available.");
        } else {
          setInterview(res.data.interview);
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setError("Interview report not available.");
        } else {
          setError(err.response?.data?.message || "Failed to load interview data.");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(`${API}/report/${id}`, {
        headers: authHeaders(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", `PrepWise_Report_${id}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Download failed. Please try again.");
    }
    setDownloading(false);
  };

  const skillRows = interview
    ? [
        ["Communication", interview.communication ?? 0],
        ["Technical depth", interview.technicalDepth ?? 0],
        ["Problem solving", interview.problemSolving ?? 0],
        ["Confidence", interview.confidence ?? 0],
      ]
    : [];

  const statChips = interview
    ? [
        { label: "Answered", value: `${interview.questions?.length ?? 0}/5` },
        {
          label: "Best question",
          value: interview.questions?.length
            ? `${Math.max(...interview.questions.map((q) => q.score ?? 0))}/10`
            : "—",
        },
        {
          label: "Needs work",
          value: `${interview.questions?.filter((q) => (q.score ?? 0) < 7).length ?? 0}`,
        },
        { label: "Duration", value: interview.duration ?? "—" },
      ]
    : [];

  const overallScore = interview?.overallScore ?? 0;
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
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(max-width:640px) {
          .two-col { grid-template-columns: 1fr !important; }
          .four-col { grid-template-columns: 1fr 1fr !important; }
        }
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
            onClick={() => navigate(-1)}
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
            ← Back
          </motion.button>
          <span style={{ width: "1px", height: "18px", background: colors.border }} />
          <span style={{ fontSize: "14px", fontWeight: "600" }}>
            {loading ? "Loading…" : interview ? "Session report" : "Report"}
          </span>
        </div>

        {interview && (
          <div style={{ display: "flex", gap: "8px" }}>
            <motion.button
              whileHover={{ background: colors.accent }}
              onClick={handleDownload}
              disabled={downloading}
              style={{
                padding: "8px 16px",
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
                background: colors.surface,
                color: colors.secondary,
                fontSize: "13px",
                fontWeight: "500",
                cursor: downloading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: downloading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {downloading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                    style={{
                      width: "11px",
                      height: "11px",
                      border: `1.5px solid ${colors.muted}`,
                      borderTop: `1.5px solid ${colors.secondary}`,
                      borderRadius: "50%",
                      display: "inline-block",
                    }}
                  />
                  Exporting…
                </>
              ) : (
                "↓ Export PDF"
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/mock-interview")}
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
            >
              Try again
            </motion.button>
          </div>
        )}
      </div>

      <div className="content-pad" style={{ maxWidth: "880px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: "center",
                padding: "80px",
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <motion.div
                style={{
                  width: "26px",
                  height: "26px",
                  border: `3px solid ${colors.border}`,
                  borderTop: `3px solid ${colors.primary}`,
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
              <div style={{ fontSize: "14px", color: colors.secondary }}>Loading your report…</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {!loading && error && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: "center",
                padding: "80px 32px",
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  margin: "0 auto 20px",
                }}
              >
                ⚠️
              </div>
              <div style={{ fontSize: "17px", fontWeight: "700", color: colors.primary, marginBottom: "8px" }}>
                {error === "Interview report not available." ? "Report not available" : "Something went wrong"}
              </div>
              <div style={{ fontSize: "14px", color: colors.secondary, marginBottom: "28px", maxWidth: "360px", margin: "0 auto 28px" }}>
                {error}
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <motion.button
                  whileHover={{ background: colors.accent }}
                  onClick={() => navigate("/history")}
                  style={{
                    padding: "11px 22px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "14px",
                    background: colors.surface,
                    color: colors.secondary,
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  View history
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/mock-interview")}
                  style={{
                    padding: "11px 22px",
                    border: "none",
                    borderRadius: "14px",
                    background: colors.primary,
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  New session
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report */}
        <AnimatePresence>
          {!loading && !error && interview && (
            <motion.div initial="hidden" animate="show" variants={staggerContainer}>
              {/* Header */}
              <motion.div variants={fadeUp} style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
                  {interview.role}
                </h1>
                <p style={{ fontSize: "14px", color: colors.secondary, margin: 0 }}>
                  {interview.type} · {interview.level} ·{" "}
                  {interview.completedAt
                    ? new Date(interview.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : "—"}
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
                  marginBottom: "18px",
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
                    <div style={{ fontSize: "11px", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", fontWeight: "600" }}>
                      Overall score
                    </div>
                    <div style={{ fontSize: "17px", fontWeight: "700", color: sc(overallScore), marginBottom: "14px" }}>
                      {sl(overallScore)}
                    </div>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                      {[
                        ["Questions", `${interview.questions?.length ?? 0}/5`],
                        ["Duration", interview.duration ?? "—"],
                        ["Format", interview.type],
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

              {/* Tabs */}
              <motion.div
                variants={fadeUp}
                style={{
                  display: "flex",
                  background: colors.accent,
                  borderRadius: "14px",
                  padding: "4px",
                  marginBottom: "20px",
                  width: "fit-content",
                }}
              >
                {["overview", "questions", "suggestions"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      padding: "8px 18px",
                      border: "none",
                      borderRadius: "11px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      background: tab === t ? colors.surface : "transparent",
                      color: tab === t ? colors.primary : colors.secondary,
                      boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                      textTransform: "capitalize",
                      transition: "all 0.15s",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </motion.div>

              {/* OVERVIEW */}
              <AnimatePresence mode="wait">
                {tab === "overview" && (
                  <motion.div key="overview" initial="hidden" animate="show" exit={{ opacity: 0 }} variants={staggerContainer}>
                    <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      {/* Skill breakdown */}
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
                        <div style={{ fontSize: "12px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
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

                      {/* Strengths + improvements */}
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
                          <div style={{ fontSize: "12px", fontWeight: "600", color: colors.success, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                            Strengths
                          </div>
                          {(interview.strengths ?? []).length > 0 ? (
                            (interview.strengths ?? []).map((s, i) => (
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
                          <div style={{ fontSize: "12px", fontWeight: "600", color: colors.warning, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                            Areas to improve
                          </div>
                          {(interview.weaknesses ?? []).length > 0 ? (
                            (interview.weaknesses ?? []).map((s, i) => (
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

                    {/* Stat chips */}
                    <motion.div
                      variants={staggerContainer}
                      className="four-col"
                      style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}
                    >
                      {statChips.map((c) => (
                        <motion.div
                          key={c.label}
                          variants={fadeUp}
                          whileHover={{ y: -2 }}
                          style={{
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "16px",
                            padding: "16px",
                            textAlign: "center",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          }}
                        >
                          <div style={{ fontSize: "19px", fontWeight: "700", color: colors.primary, letterSpacing: "-0.4px" }}>{c.value}</div>
                          <div style={{ fontSize: "11px", color: colors.muted, marginTop: "4px" }}>{c.label}</div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}

                {/* QUESTIONS */}
                {tab === "questions" && (
                  <motion.div
                    key="questions"
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    variants={staggerContainer}
                    style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                  >
                    {(interview.questions ?? []).length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "48px",
                          background: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: "20px",
                        }}
                      >
                        <div style={{ fontSize: "14px", color: colors.muted }}>No questions available for this session.</div>
                      </div>
                    ) : (
                      (interview.questions ?? []).map((q, i) => (
                        <motion.div
                          key={i}
                          variants={fadeUp}
                          onClick={() => setExpanded(expanded === i ? null : i)}
                          whileHover={{ y: -1 }}
                          style={{
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "18px",
                            padding: "16px 18px",
                            cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                background: colors.accent,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <span style={{ fontSize: "13px", fontWeight: "700", color: sc(q.score ?? 0), lineHeight: 1 }}>{q.score ?? 0}</span>
                              <span style={{ fontSize: "8px", color: colors.muted }}>/10</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "14px", fontWeight: "600", color: colors.primary, marginBottom: "5px" }}>
                                Q{i + 1}: {q.question}
                              </div>
                              <div style={{ height: "3px", background: colors.accent, borderRadius: "2px" }}>
                                <div style={{ height: "3px", width: `${(q.score ?? 0) * 10}%`, background: colors.primary, borderRadius: "2px" }} />
                              </div>
                            </div>
                            <span style={{ fontSize: "12px", color: sc(q.score ?? 0), fontWeight: "600", flexShrink: 0 }}>{sl(q.score ?? 0)}</span>
                            <span style={{ fontSize: "12px", color: colors.muted }}>{expanded === i ? "↑" : "↓"}</span>
                          </div>

                          <AnimatePresence>
                            {expanded === i && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${colors.accent}`, overflow: "hidden" }}
                              >
                                <div style={{ fontSize: "11px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "7px" }}>
                                  Your answer
                                </div>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: colors.secondary,
                                    lineHeight: 1.6,
                                    padding: "12px 14px",
                                    background: colors.background,
                                    borderRadius: "12px",
                                    border: `1px solid ${colors.border}`,
                                    marginBottom: "14px",
                                  }}
                                >
                                  {q.answer && q.answer.trim().length > 0 ? (
                                    q.answer
                                  ) : (
                                    <span style={{ color: colors.muted, fontStyle: "italic" }}>No answer provided — scored 0</span>
                                  )}
                                </div>

                                {(q.communication != null || q.technicalDepth != null) && (
                                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                                    {[
                                      ["Communication", q.communication],
                                      ["Technical", q.technicalDepth],
                                      ["Problem solving", q.problemSolving],
                                      ["Confidence", q.confidence],
                                    ]
                                      .filter(([, v]) => v != null)
                                      .map(([label, val]) => (
                                        <div
                                          key={label}
                                          style={{
                                            padding: "5px 12px",
                                            borderRadius: "20px",
                                            background: colors.accent,
                                            fontSize: "12px",
                                            color: colors.secondary,
                                          }}
                                        >
                                          {label}: <span style={{ fontWeight: "600", color: sc(val) }}>{val}/10</span>
                                        </div>
                                      ))}
                                  </div>
                                )}

                                <div style={{ fontSize: "11px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "7px" }}>
                                  AI feedback
                                </div>
                                <div style={{ fontSize: "13px", color: colors.secondary, lineHeight: 1.6 }}>{q.feedback || "No feedback available."}</div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* SUGGESTIONS */}
                {tab === "suggestions" && (
                  <motion.div key="suggestions" initial="hidden" animate="show" exit={{ opacity: 0 }} variants={staggerContainer}>
                    {(interview.improvementPlan ?? []).length > 0 && (
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
                        <div style={{ fontSize: "12px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
                          Improvement plan
                        </div>
                        {(interview.improvementPlan ?? []).map((step, i) => (
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

                    {(interview.nextSteps ?? []).length > 0 && (
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
                        <div style={{ fontSize: "12px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
                          Next steps
                        </div>
                        {(interview.nextSteps ?? []).map((step, i) => (
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

                    {(interview.weaknesses ?? []).length > 0 && (
                      <motion.div
                        variants={fadeUp}
                        style={{
                          background: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: "20px",
                          padding: "22px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
                          Focus areas
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "8px" }}>
                          {(interview.weaknesses ?? []).map((w, i) => (
                            <motion.div
                              key={i}
                              whileHover={{ y: -2, borderColor: colors.muted }}
                              style={{
                                background: colors.background,
                                border: `1px solid ${colors.border}`,
                                borderRadius: "14px",
                                padding: "14px 16px",
                              }}
                            >
                              <div style={{ fontSize: "11px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                                Area {i + 1}
                              </div>
                              <div style={{ fontSize: "13px", color: colors.secondary, lineHeight: 1.55 }}>{w}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {(interview.improvementPlan ?? []).length === 0 &&
                      (interview.nextSteps ?? []).length === 0 &&
                      (interview.weaknesses ?? []).length === 0 && (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "48px",
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "20px",
                          }}
                        >
                          <div style={{ fontSize: "14px", color: colors.muted }}>No suggestions available for this session.</div>
                        </div>
                      )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom actions */}
              <motion.div variants={fadeUp} style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
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
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{
                    padding: "11px 20px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "14px",
                    background: colors.surface,
                    color: colors.secondary,
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: downloading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: downloading ? 0.6 : 1,
                  }}
                >
                  ↓ Download report
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}