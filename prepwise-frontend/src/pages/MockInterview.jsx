import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://localhost:8000/api";
const ROLES = ["Frontend Developer", "Backend Developer", "Full Stack Developer", "React Developer", "Software Engineer"];
const LEVELS = ["Fresher", "1-2 Years", "3-5 Years", "5+ Years"];
const TYPES = ["Technical", "Behavioral", "HR"];
const DURATIONS = ["5 min", "10 min", "15 min", "20 min"];

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

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function MockInterview() {
  const [showEndModal, setShowEndModal] = useState(false);
  const navigate = useNavigate();
  const [stage, setStage] = useState("setup");
  const [config, setConfig] = useState({ role: ROLES[0], level: LEVELS[0], type: TYPES[0], duration: DURATIONS[1] });

  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [scores, setScores] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  const [timeLeft, setTimeLeft] = useState(600);
  const [totalTime, setTotalTime] = useState(600);
  const timerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [overallScore, setOverallScore] = useState(0);
  const [savedInterviewId, setSavedInterviewId] = useState(null);

  const submittingRef = useRef(false);
  const savedRef = useRef(false);

  const startInterview = async () => {
    setLoading(true);
    setLoadingMsg("Generating your interview questions…");
    setError("");
    try {
      const res = await axios.post(
        `${API}/interview/start`,
        { role: config.role, level: config.level, type: config.type, duration: config.duration },
        { headers: authHeaders() }
      );
      setInterviewId(res.data.interviewId);
      setQuestions(res.data.questions);
      setQIndex(0);
      setScores([]);
      setEvaluations([]);
      setCurrentAnswer("");
      savedRef.current = false;
      submittingRef.current = false;
      const mins = Number(config.duration.split(" ")[0]);
      setTimeLeft(mins * 60);
      setTotalTime(mins * 60);
      setStage("interview");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate questions. Check your connection.");
    }
    setLoading(false);
  };

  const finalizeInterview = async (currentInterviewId) => {
    if (savedRef.current) return;
    savedRef.current = true;

    clearInterval(timerRef.current);

    try {
      const saveRes = await axios.post(
        `${API}/interview/save`,
        { interviewId: currentInterviewId },
        { headers: authHeaders() }
      );

      setOverallScore(saveRes.data.overallScore);
      setSavedInterviewId(saveRes.data.interviewId);
      setStage("completed");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save report");
      savedRef.current = false;
    }
  };

  const nextQuestion = async () => {
    if (loading || submittingRef.current) return;

    submittingRef.current = true;
    setLoading(true);
    setLoadingMsg("Evaluating your answer...");

    try {
      const res = await axios.post(
        `${API}/interview/evaluate`,
        {
          interviewId,
          questionIndex: qIndex,
          answer: currentAnswer,
        },
        {
          headers: authHeaders(),
        }
      );

      const evaluation = res.data.evaluation;

      setScores((prev) => [...prev, evaluation.score]);
      setEvaluations((prev) => [...prev, evaluation]);

      setCurrentAnswer("");

      if (qIndex + 1 >= questions.length) {
        setLoadingMsg("Generating final report...");
        await finalizeInterview(interviewId);
      } else {
        setQIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to evaluate answer");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stage !== "interview") return;

    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          finalizeInterview(interviewId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [stage, interviewId]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const timerPct = (timeLeft / totalTime) * 100;
  const timerStroke = timerPct > 50 ? colors.primary : timerPct > 25 ? colors.warning : colors.danger;

  const downloadReport = async () => {
    try {
      const id = savedInterviewId || interviewId;
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
      setError("Download failed.");
    }
  };

  const endSession = () => {
    clearInterval(timerRef.current);
    setStage("setup");
    setInterviewId(null);
    setQuestions([]);
    savedRef.current = false;
    submittingRef.current = false;
  };

  const hasTrailingDescriptive =
    config.type === "Technical" && questions.length > 0 && questions.some((q) => q.type === "subjective");

  const currentQuestion = questions[qIndex];
  const isMcq = currentQuestion?.type === "mcq";

  const selectStyle = {
    width: "100%",
    padding: "11px 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    background: colors.surface,
    color: colors.primary,
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
  };

  const chipStyle = (on) => ({
    padding: "9px 16px",
    border: `1px solid ${on ? colors.primary : colors.border}`,
    borderRadius: "12px",
    background: on ? colors.primary : colors.surface,
    color: on ? "#fff" : colors.secondary,
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
  });

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
        textarea:focus { outline: none; border-color: ${colors.muted} !important; }
        .mcq-option:hover { border-color: ${colors.muted} !important; }
        @media(max-width:880px){ .sg,.ig,.rg{ grid-template-columns: 1fr !important; } }
        @media(max-width:560px){ .nav-pad{ padding: 0 16px !important; } .content-pad{ padding: 18px !important; } }
      `}</style>

      {/* Navbar */}
      <div
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
        className="nav-pad"
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
            {stage === "setup" ? "New session" : stage === "interview" ? `Question ${qIndex + 1} of ${questions.length}` : "Session results"}
          </span>
        </div>
        <span style={{ fontSize: "15px", fontWeight: "700", letterSpacing: "-0.3px" }}>PrepWise</span>
      </div>

      <div className="content-pad" style={{ maxWidth: "920px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                padding: "13px 16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "14px",
                fontSize: "13px",
                color: colors.danger,
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{error}</span>
              <span style={{ cursor: "pointer", fontWeight: "600", marginLeft: "12px" }} onClick={() => setError("")}>
                ✕
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: "center",
                padding: "60px",
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "20px",
                marginBottom: "20px",
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
              <div style={{ fontSize: "14px", color: colors.secondary, fontWeight: "500" }}>{loadingMsg}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SETUP */}
        {stage === "setup" && !loading && (
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.4 }}>
            <div style={{ marginBottom: "28px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
                Configure your session
              </h1>
              <p style={{ fontSize: "14px", color: colors.secondary, margin: 0 }}>
                Questions are generated by AI based on your selections.
              </p>
            </div>

            <div className="sg" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Settings */}
              <div
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "20px",
                  padding: "26px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "20px" }}>Settings</div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: colors.secondary, display: "block", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Role
                  </label>
                  <select style={selectStyle} value={config.role} onChange={(e) => setConfig({ ...config, role: e.target.value })}>
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: colors.secondary, display: "block", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Experience
                  </label>
                  <select style={selectStyle} value={config.level} onChange={(e) => setConfig({ ...config, level: e.target.value })}>
                    {LEVELS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: colors.secondary, display: "block", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Format
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {TYPES.map((t) => (
                      <motion.button
                        key={t}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setConfig({ ...config, type: t })}
                        style={chipStyle(config.type === t)}
                      >
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: colors.secondary, display: "block", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Duration
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {DURATIONS.map((d) => (
                      <motion.button
                        key={d}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setConfig({ ...config, duration: d })}
                        style={chipStyle(config.duration === d)}
                      >
                        {d}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {config.type === "Technical" && Number(config.duration.split(" ")[0]) >= 15 && (
                  <div
                    style={{
                      padding: "11px 14px",
                      background: colors.accent,
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: colors.secondary,
                      marginBottom: "18px",
                      lineHeight: 1.5,
                    }}
                  >
                    This interview contains 2 descriptive questions at the end.
                  </div>
                )}
                {config.type === "Technical" && Number(config.duration.split(" ")[0]) < 15 && (
                  <div
                    style={{
                      padding: "11px 14px",
                      background: colors.accent,
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: colors.secondary,
                      marginBottom: "18px",
                      lineHeight: 1.5,
                    }}
                  >
                    This interview consists of multiple-choice questions only.
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startInterview}
                  style={{
                    width: "100%",
                    padding: "13px",
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
                  Generate questions →
                </motion.button>
              </div>

              {/* Preview + how it works */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <motion.div
                  whileHover={{ y: -2 }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "22px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>
                    Preview
                  </div>
                  {[
                    ["Role", config.role],
                    ["Level", config.level],
                    ["Format", config.type],
                    ["Duration", config.duration],
                    ["Questions", "5 (AI-generated)"],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "9px 0",
                        borderBottom: `1px solid ${colors.accent}`,
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: colors.secondary }}>{l}</span>
                      <span style={{ color: colors.primary, fontWeight: "600" }}>{v}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "22px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                    How it works
                  </div>
                  {["AI generates unique questions every session", "Each answer is evaluated in real-time", "Empty answers receive a score of 0", "Full PDF report generated at the end"].map(
                    (t) => (
                      <div key={t} style={{ fontSize: "13px", color: colors.secondary, marginBottom: "8px", lineHeight: 1.5, display: "flex", gap: "8px" }}>
                        <span style={{ color: colors.muted }}>—</span>
                        {t}
                      </div>
                    )
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* INTERVIEW */}
        {stage === "interview" && !loading && questions.length > 0 && (
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.35 }}>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", color: colors.muted, fontWeight: "500" }}>
                  {config.role} · {config.type} · {config.level}
                </span>
                <motion.button
                  whileHover={{ background: "#fef2f2" }}
                  onClick={() => setShowEndModal(true)}
                  style={{
                    padding: "7px 14px",
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    background: colors.surface,
                    color: colors.danger,
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  End session
                </motion.button>
              </div>
              {hasTrailingDescriptive && (
                <div
                  style={{
                    padding: "9px 14px",
                    background: colors.accent,
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: colors.secondary,
                    marginBottom: "10px",
                  }}
                >
                  This interview contains 2 descriptive questions at the end.
                </div>
              )}
              <div style={{ height: "5px", background: colors.accent, borderRadius: "4px" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(qIndex / questions.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ height: "5px", background: colors.primary, borderRadius: "4px" }}
                />
              </div>
            </div>

            <div className="ig" style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Question card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={qIndex}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "20px",
                      padding: "26px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "18px",
                        paddingBottom: "16px",
                        borderBottom: `1px solid ${colors.accent}`,
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: colors.primary,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}
                      >
                        AI
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "600" }}>AI Interviewer</span>
                      <span style={{ fontSize: "12px", color: colors.muted }}>{config.type} round</span>
                      {isMcq && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: colors.secondary,
                            padding: "3px 9px",
                            borderRadius: "20px",
                            background: colors.accent,
                            fontWeight: "600",
                          }}
                        >
                          MCQ
                        </span>
                      )}
                      <span style={{ marginLeft: "auto", fontSize: "12px", color: colors.muted, fontWeight: "500" }}>
                        Q{qIndex + 1}/{questions.length}
                      </span>
                    </div>
                    <p style={{ fontSize: "16px", lineHeight: 1.7, margin: 0, color: colors.primary, fontWeight: "500" }}>
                      {currentQuestion?.question}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Answer area */}
                <div
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "22px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: colors.secondary, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      {isMcq ? "Select an answer" : "Your response"}
                    </span>
                  </div>

                  {isMcq ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(currentQuestion?.options || []).map((opt, oi) => (
                        <motion.label
                          key={oi}
                          className="mcq-option"
                          whileHover={{ y: -1 }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "13px 15px",
                            border: `1px solid ${currentAnswer === opt ? colors.primary : colors.border}`,
                            borderRadius: "14px",
                            background: currentAnswer === opt ? colors.background : colors.surface,
                            cursor: "pointer",
                            fontSize: "14px",
                            color: colors.primary,
                          }}
                        >
                          <input
                            type="radio"
                            name={`mcq-${qIndex}`}
                            value={opt}
                            checked={currentAnswer === opt}
                            onChange={() => setCurrentAnswer(opt)}
                            style={{ accentColor: colors.primary, width: "16px", height: "16px", flexShrink: 0 }}
                          />
                          <span>{opt}</span>
                        </motion.label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Type your response here. Leave blank to skip (score: 0)."
                      style={{
                        width: "100%",
                        minHeight: "110px",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "14px",
                        padding: "14px 15px",
                        color: colors.primary,
                        fontSize: "14px",
                        resize: "vertical",
                        fontFamily: "inherit",
                        lineHeight: 1.6,
                        background: colors.background,
                      }}
                    />
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <motion.button
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={nextQuestion}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: "12px",
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
                      {qIndex + 1 === questions.length ? "Finish & evaluate →" : "Submit & next →"}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Right panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <motion.div
                  whileHover={{ y: -2 }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "20px",
                    textAlign: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>
                    Time left
                  </div>
                  <svg width="84" height="84" viewBox="0 0 84 84" style={{ display: "block", margin: "0 auto 10px" }}>
                    <circle cx="42" cy="42" r="36" fill="none" stroke={colors.accent} strokeWidth="5" />
                    <circle
                      cx="42"
                      cy="42"
                      r="36"
                      fill="none"
                      stroke={timerStroke}
                      strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 36}
                      strokeDashoffset={2 * Math.PI * 36 * (1 - timerPct / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 42 42)"
                      style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
                    />
                    <text x="42" y="38" textAnchor="middle" fill={colors.primary} fontSize="14" fontWeight="700">
                      {fmt(timeLeft)}
                    </text>
                    <text x="42" y="54" textAnchor="middle" fill={colors.muted} fontSize="8">
                      remaining
                    </text>
                  </svg>
                  <div style={{ fontSize: "12px", color: timerStroke, fontWeight: "600" }}>
                    {timerPct > 50 ? "On track" : timerPct > 25 ? "Wrap up" : "Almost done"}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                    Questions
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {questions.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: i < qIndex ? colors.accent : i === qIndex ? colors.primary : colors.background,
                          color: i < qIndex ? colors.secondary : i === qIndex ? "#fff" : colors.muted,
                          border: `1px solid ${i === qIndex ? colors.primary : colors.border}`,
                        }}
                      >
                        {i < qIndex ? "✓" : i + 1}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {scores.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ y: -2 }}
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "20px",
                      padding: "16px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                      Scores so far
                    </div>
                    {scores.map((s, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "5px 0",
                          borderBottom: `1px solid ${colors.accent}`,
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ color: colors.secondary }}>Q{i + 1}</span>
                        <span style={{ color: sc(s), fontWeight: "600" }}>{s}/10</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* COMPLETED */}
        {stage === "completed" && !loading && (
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.4 }}>
            <div style={{ marginBottom: "24px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px", letterSpacing: "-0.4px" }}>
                Session complete
              </h1>
              <p style={{ fontSize: "14px", color: colors.secondary, margin: 0 }}>
                Your answers have been evaluated. View your full report below.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "20px",
                padding: "26px 28px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "24px",
                flexWrap: "wrap",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", fontWeight: "600" }}>
                  Overall score
                </div>
                <div style={{ fontSize: "42px", fontWeight: "700", letterSpacing: "-1.2px", color: sc(overallScore) }}>
                  {overallScore}
                  <span style={{ fontSize: "16px", color: colors.muted, fontWeight: "400" }}>/10</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: "120px" }}>
                <div style={{ height: "5px", background: colors.accent, borderRadius: "4px" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallScore * 10}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ height: "5px", background: sc(overallScore), borderRadius: "4px" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "24px" }}>
                {[
                  ["Questions", `${scores.length}/5`],
                  ["Format", config.type],
                  ["Role", config.role.split(" ")[0]],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{v}</div>
                    <div style={{ fontSize: "12px", color: colors.muted }}>{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="rg" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <motion.div
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
                  Per question
                </div>
                {scores.map((s, i) => (
                  <div key={i} style={{ marginBottom: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                      <span style={{ color: colors.secondary }}>Q{i + 1}: {questions[i]?.question?.slice(0, 28)}…</span>
                      <span style={{ color: sc(s), fontWeight: "600" }}>{s}/10</span>
                    </div>
                    <div style={{ height: "4px", background: colors.accent, borderRadius: "3px" }}>
                      <div style={{ height: "4px", width: `${s * 10}%`, background: sc(s), borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div
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
                  AI feedback
                </div>
                {evaluations.slice(0, 3).map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "14px",
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: "600", color: colors.secondary, marginBottom: "4px" }}>Q{i + 1}</div>
                    <div style={{ fontSize: "13px", color: colors.secondary, lineHeight: 1.55 }}>{ev.feedback}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStage("setup")}
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
                Try again
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
                Download report
              </motion.button>
              <motion.button
                whileHover={{ background: colors.accent }}
                onClick={() => navigate(`/history/${savedInterviewId}`)}
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
                View full report
              </motion.button>
              <motion.button
                whileHover={{ background: colors.accent }}
                onClick={() => navigate("/dashboard")}
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
                Dashboard
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* End session modal */}
      <AnimatePresence>
        {showEndModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                background: colors.surface,
                padding: "30px",
                borderRadius: "20px",
                width: "380px",
                maxWidth: "100%",
                textAlign: "center",
                boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  margin: "0 auto 16px",
                }}
              >
                ⚠️
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", margin: "0 0 8px", color: colors.primary }}>
                End session?
              </h3>
              <p style={{ fontSize: "13px", color: colors.secondary, margin: "0 0 24px", lineHeight: 1.5 }}>
                Your progress on this session will be lost. This action cannot be undone.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <motion.button
                  whileHover={{ background: colors.accent }}
                  onClick={() => setShowEndModal(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "12px",
                    background: colors.surface,
                    color: colors.secondary,
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowEndModal(false);
                    endSession();
                  }}
                  style={{
                    flex: 1,
                    padding: "11px",
                    border: "none",
                    borderRadius: "12px",
                    background: colors.danger,
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Yes, end session
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}