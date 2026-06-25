import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "http://localhost:8000/api/resume";

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

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const [analysisId, setAnalysisId] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setFileError("Only PDF files are accepted.");
      setFile(null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setFileError("File must be under 5 MB.");
      setFile(null);
      return;
    }
    setFileError("");
    setFile(f);
    setResult(null);
    setProgress(0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setFile(null);
    setResult(null);
    setProgress(0);
    setFileError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    setProgress(0);
    setFileError("");
    const fd = new FormData();
    fd.append("resume", file);
    try {
      const res = await axios.post(`${API_URL}/analyze`, fd, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("token")}` },
        onUploadProgress: (e) => setProgress(Math.min(Math.round((e.loaded * 100) / e.total), 90)),
      });
      setProgress(100);
      setTimeout(() => {
        setAnalyzing(false);
        setResult(res.data.analysis);
        setAnalysisId(res.data.analysisId);
        showToast("Analysis complete");
      }, 300);
    } catch (err) {
      setAnalyzing(false);
      setProgress(0);
      setFileError(err.response?.data?.message || (err.message === "Network Error" ? "Cannot connect to server." : "Analysis failed."));
    }
  };

  const handleDownload = async () => {
    if (!analysisId) return;
    try {
      const res = await axios.get(`${API_URL}/download/${analysisId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", "PrepWise_Resume_Report.pdf");
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setFileError("Download failed.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setFileError("");
    setAnalysisId(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const atsScore = result?.atsScore ?? 0;
  const atsColor = atsScore >= 80 ? colors.success : atsScore >= 60 ? colors.warning : colors.danger;
  const atsLabel = atsScore >= 80 ? "Strong" : atsScore >= 60 ? "Fair" : "Needs work";

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (atsScore / 100) * circumference;

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
        @media(max-width:768px){ .two-col{ grid-template-columns: 1fr !important; } }
        @media(max-width:560px){ .nav-pad{ padding: 0 16px !important; } .content-pad{ padding: 18px !important; } }
      `}</style>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -16, x: "-50%" }}
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              background: colors.primary,
              color: "#fff",
              padding: "11px 22px",
              borderRadius: "14px",
              fontSize: "13px",
              fontWeight: "600",
              zIndex: 9999,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
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
          <span style={{ fontSize: "14px", fontWeight: "600" }}>Resume analyzer</span>
        </div>
        <span style={{ fontSize: "15px", fontWeight: "700", letterSpacing: "-0.3px" }}>PrepWise</span>
      </div>

      <div className="content-pad" style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 24px" }}>
        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.4 }} style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px", letterSpacing: "-0.4px" }}>Resume analyzer</h1>
          <p style={{ fontSize: "14px", color: colors.secondary, margin: 0 }}>
            Upload your PDF to get an ATS score, skill gaps, and actionable suggestions.
          </p>
        </motion.div>

        {!result && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.4, delay: 0.05 }}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: "22px",
              overflow: "hidden",
              marginBottom: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <motion.div
              className="drop"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              whileHover={{ borderColor: colors.muted }}
              style={{
                margin: "18px",
                borderRadius: "18px",
                padding: "56px 24px",
                textAlign: "center",
                cursor: "pointer",
                border: `2px dashed ${dragging ? colors.primary : file ? colors.muted : colors.border}`,
                background: dragging ? colors.background : file ? colors.background : "transparent",
                transition: "all 0.15s",
              }}
            >
              <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "16px",
                        background: colors.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "26px",
                        margin: "0 auto 14px",
                      }}
                    >
                      📄
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: colors.primary, marginBottom: "4px" }}>{file.name}</div>
                    <div style={{ fontSize: "12px", color: colors.muted, marginBottom: "16px" }}>{(file.size / 1024).toFixed(1)} KB · PDF</div>
                    <motion.button
                      whileHover={{ background: "#fef2f2" }}
                      onClick={handleRemove}
                      style={{
                        padding: "7px 16px",
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
                      Remove file
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "16px",
                        background: colors.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        color: colors.muted,
                        margin: "0 auto 16px",
                      }}
                    >
                      ↑
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "600", color: colors.primary, marginBottom: "5px" }}>Drop your resume here</div>
                    <div style={{ fontSize: "13px", color: colors.muted, marginBottom: "18px" }}>PDF only · max 5 MB</div>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                      style={{
                        padding: "10px 22px",
                        border: "none",
                        borderRadius: "12px",
                        background: colors.primary,
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Choose file
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {fileError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    margin: "0 18px 14px",
                    padding: "11px 14px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    fontSize: "13px",
                    color: colors.danger,
                  }}
                >
                  {fileError}
                </motion.div>
              )}
            </AnimatePresence>

            <div
              style={{
                padding: "14px 18px 18px",
                borderTop: `1px solid ${colors.accent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "12px", color: colors.muted }}>{file ? `${file.name} selected` : "No file selected"}</span>
              <motion.button
                whileHover={file && !analyzing ? { scale: 1.02, y: -1 } : {}}
                whileTap={file && !analyzing ? { scale: 0.98 } : {}}
                onClick={handleAnalyze}
                disabled={!file || analyzing}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "12px",
                  background: !file ? colors.border : colors.primary,
                  color: !file ? colors.muted : "#fff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: !file || analyzing ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {analyzing ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                      style={{
                        width: "12px",
                        height: "12px",
                        border: "1.5px solid rgba(255,255,255,0.3)",
                        borderTop: "1.5px solid #fff",
                        borderRadius: "50%",
                        display: "inline-block",
                      }}
                    />
                    Analyzing…
                  </>
                ) : (
                  "Analyze →"
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ padding: "0 18px 16px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: colors.muted, marginBottom: "6px" }}>
                    <span>Processing your resume</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ height: "4px", background: colors.accent, borderRadius: "3px" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      style={{ height: "4px", background: colors.primary, borderRadius: "3px" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial="hidden" animate="show" variants={staggerContainer}>
              {/* ATS Score */}
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -2 }}
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
                      stroke={atsColor}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="56" textAnchor="middle" fill={colors.primary} fontSize="24" fontWeight="700">
                      {atsScore}
                    </text>
                    <text x="60" y="74" textAnchor="middle" fill={colors.muted} fontSize="11">
                      / 100
                    </text>
                  </svg>
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <div style={{ fontSize: "11px", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", fontWeight: "600" }}>
                      ATS score
                    </div>
                    <div style={{ fontSize: "17px", fontWeight: "700", color: atsColor, marginBottom: "6px" }}>{atsLabel}</div>
                    {result.wordCount && (
                      <div style={{ fontSize: "13px", color: colors.secondary }}>{result.wordCount} words detected</div>
                    )}
                  </div>
                </div>
              </motion.div>

              <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                {/* Skills */}
                <motion.div
                  variants={fadeUp}
                  whileHover={{ y: -2 }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>
                    Detected skills <span style={{ color: colors.primary }}>({result?.skillsFound?.length ?? 0})</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(result?.skillsFound ?? []).map((sk) => (
                      <span
                        key={sk}
                        style={{
                          padding: "5px 12px",
                          border: "1px solid #bbf7d0",
                          borderRadius: "20px",
                          background: "#f0fdf4",
                          color: "#15803d",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                    {(result?.skillsFound?.length ?? 0) === 0 && <span style={{ fontSize: "13px", color: colors.muted }}>None found</span>}
                  </div>
                </motion.div>

                {/* Sections */}
                <motion.div
                  variants={fadeUp}
                  whileHover={{ y: -2 }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>
                    Section checklist
                  </div>
                  {Object.entries(result?.sections ?? {}).map(([sec, ok]) => (
                    <div
                      key={sec}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: `1px solid ${colors.accent}`,
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: colors.secondary }}>{sec}</span>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: ok ? colors.success : colors.danger }}>
                        {ok ? "✓ Found" : "Missing"}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Missing keywords */}
              {(result?.missingKeywords?.length ?? 0) > 0 && (
                <motion.div
                  variants={fadeUp}
                  whileHover={{ y: -2 }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "20px",
                    marginBottom: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>
                    Missing keywords <span style={{ color: colors.primary }}>({result.missingKeywords.length})</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {result.missingKeywords.map((kw) => (
                      <span
                        key={kw}
                        style={{
                          padding: "5px 12px",
                          border: "1px solid #fecdd3",
                          borderRadius: "20px",
                          background: "#fff1f2",
                          color: "#be123c",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        + {kw}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Suggestions */}
              {(result?.suggestions?.length ?? 0) > 0 && (
                <motion.div
                  variants={fadeUp}
                  whileHover={{ y: -2 }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "20px",
                    marginBottom: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
                    Suggestions
                  </div>
                  {result.suggestions.map((tip, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "14px",
                        padding: "11px 0",
                        borderBottom: i < result.suggestions.length - 1 ? `1px solid ${colors.accent}` : "none",
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
                      <span style={{ fontSize: "14px", color: colors.secondary, lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              <motion.div variants={fadeUp} style={{ display: "flex", gap: "10px" }}>
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  style={{
                    padding: "11px 22px",
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
                  Download report
                </motion.button>
                <motion.button
                  whileHover={{ background: colors.accent }}
                  onClick={handleReset}
                  style={{
                    padding: "11px 22px",
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
                  Analyze another
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}