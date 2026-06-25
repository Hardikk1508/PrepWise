import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://localhost:8000/api";
const NAV = [
  { key: "dashboard", label: "Overview", path: "/dashboard" },
  { key: "resume", label: "Resume", path: "/resume" },
  { key: "mock", label: "Interview", path: "/mock-interview" },
  { key: "feedback", label: "Feedback", path: "/feedback" },
  { key: "history", label: "History", path: "/history" },
];
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

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const active = NAV.find((n) => location.pathname === n.path)?.key || "dashboard";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    axios
      .get(`${API}/interview/dashboard`, { headers: authHeaders() })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        { label: "Resume score", value: data.stats.resumeScore, suffix: "%", note: "From latest analysis" },
        { label: "Sessions done", value: data.stats.total, suffix: "", note: `Avg ${data.stats.avgScore}/10` },
        { label: "Avg score", value: data.stats.avgScore, suffix: "/10", note: `Best: ${data.stats.bestScore}/10` },
        { label: "Readiness", value: data.stats.readiness, suffix: "%", note: `Last: ${data.stats.latestScore}/10` },
      ]
    : [];

  const skills = data
    ? [
        { label: "Communication", value: Math.round(data.skills.communication * 10) },
        { label: "Technical depth", value: Math.round(data.skills.technicalDepth * 10) },
        { label: "Problem solving", value: Math.round(data.skills.problemSolving * 10) },
        { label: "Confidence", value: Math.round(data.skills.confidence * 10) },
      ]
    : [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div
      style={{
        display: "flex",
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
        @media(max-width: 980px) {
          .sidebar { display: none !important; }
          .stats-row { grid-template-columns: 1fr 1fr !important; }
          .main-cols { grid-template-columns: 1fr !important; }
        }
        @media(max-width: 560px) {
          .stats-row { grid-template-columns: 1fr !important; }
          .hero-pad { padding: 24px 18px !important; }
          .content-pad { padding: 18px !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div
        className="sidebar"
        style={{
          width: "216px",
          background: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ padding: "26px 24px 20px" }}>
          <span style={{ fontSize: "19px", fontWeight: "700", color: colors.primary, letterSpacing: "-0.4px" }}>
            PrepWise
          </span>
        </div>

        <nav style={{ flex: 1, padding: "4px 14px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: colors.muted,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              padding: "10px 10px 8px",
            }}
          >
            Menu
          </div>
          {NAV.map((item) => (
            <motion.div
              key={item.key}
              onClick={() => navigate(item.path)}
              whileHover={{ x: 2 }}
              transition={{ duration: 0.15 }}
              style={{
                padding: "10px 12px",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: active === item.key ? "600" : "400",
                color: active === item.key ? colors.primary : colors.secondary,
                background: active === item.key ? colors.accent : "transparent",
                marginBottom: "2px",
              }}
            >
              {item.label}
            </motion.div>
          ))}
        </nav>

        <div style={{ padding: "16px 14px", borderTop: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 10px", marginBottom: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: colors.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "600",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.primary,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name || "User"}
              </div>
              <div style={{ fontSize: "11px", color: colors.muted }}>Free plan</div>
            </div>
          </div>
          <motion.button
            whileHover={{ background: colors.accent }}
            onClick={logout}
            style={{
              width: "100%",
              padding: "9px 10px",
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              background: "transparent",
              color: colors.secondary,
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            Sign out
          </motion.button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            background: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            padding: "0 32px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>
              {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
            </span>
            <span style={{ fontSize: "13px", color: colors.muted, marginLeft: "10px" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/mock-interview")}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "14px",
              background: colors.primary,
              color: "#fff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            New session
          </motion.button>
        </div>

        <div className="content-pad" style={{ padding: "32px 32px 48px", maxWidth: "1080px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "100px 20px" }}>
              <motion.div
                style={{
                  width: "28px",
                  height: "28px",
                  border: `3px solid ${colors.border}`,
                  borderTop: `3px solid ${colors.primary}`,
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
              <div style={{ fontSize: "14px", color: colors.muted }}>Loading your dashboard…</div>
            </div>
          ) : !data || data.stats.total === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
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
                  background: colors.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  margin: "0 auto 20px",
                }}
              >
                ✨
              </div>
              <div style={{ fontSize: "17px", fontWeight: "600", color: colors.primary, marginBottom: "8px" }}>
                No sessions yet
              </div>
              <div style={{ fontSize: "14px", color: colors.secondary, marginBottom: "28px", maxWidth: "360px", margin: "0 auto 28px" }}>
                Complete your first mock interview to unlock personalized analytics, skill tracking, and AI-powered recommendations.
              </div>
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/mock-interview")}
                style={{
                  padding: "12px 26px",
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
                Start first session →
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* Hero banner */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{ duration: 0.45 }}
                className="hero-pad"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, #2a2a32 100%)`,
                  borderRadius: "24px",
                  padding: "32px 36px",
                  marginBottom: "24px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-40px",
                    right: "-40px",
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.04)",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
                    Readiness score
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "14px" }}>
                    <span style={{ fontSize: "44px", fontWeight: "700", color: "#fff", letterSpacing: "-1.5px" }}>
                      {data.stats.readiness}%
                    </span>
                    <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
                      based on {data.stats.total} session{data.stats.total !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.12)", borderRadius: "4px", maxWidth: "420px" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.stats.readiness}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ height: "6px", background: "#fff", borderRadius: "4px" }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="stats-row"
                initial="hidden"
                animate="show"
                variants={staggerContainer}
                style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}
              >
                {stats.map((s) => (
                  <motion.div
                    key={s.label}
                    variants={fadeUp}
                    whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.06)" }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "18px",
                      padding: "20px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: "26px", fontWeight: "700", color: colors.primary, letterSpacing: "-0.6px" }}>
                      {s.value}
                      <span style={{ fontSize: "14px", color: colors.muted, fontWeight: "400" }}>{s.suffix}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: colors.muted, marginTop: "6px" }}>{s.note}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Main cols */}
              <div className="main-cols" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px", marginBottom: "16px" }}>
                {/* Recent sessions */}
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontSize: "15px", fontWeight: "600" }}>Recent activity</span>
                    <span
                      style={{ fontSize: "13px", color: colors.muted, cursor: "pointer", fontWeight: "500" }}
                      onClick={() => navigate("/history")}
                    >
                      View all →
                    </span>
                  </div>
                  {data.recentSessions.length === 0 ? (
                    <div style={{ fontSize: "13px", color: colors.muted, padding: "20px 0", textAlign: "center" }}>
                      No sessions yet
                    </div>
                  ) : (
                    data.recentSessions.map((item, i) => (
                      <motion.div
                        key={item._id}
                        whileHover={{ background: colors.background, x: 2 }}
                        onClick={() => navigate(`/history/${item._id}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "13px 14px",
                          borderRadius: "14px",
                          marginBottom: "4px",
                          cursor: "pointer",
                          border: `1px solid transparent`,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "600" }}>{item.role}</div>
                          <div style={{ fontSize: "12px", color: colors.muted, marginTop: "2px" }}>
                            {item.type} · {new Date(item.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            color: item.overallScore >= 8 ? colors.success : item.overallScore >= 6 ? colors.warning : colors.danger,
                          }}
                        >
                          {item.overallScore}/10
                        </span>
                      </motion.div>
                    ))
                  )}
                </motion.div>

                {/* Skills */}
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "18px" }}>Skill progress</div>
                  {skills.map((sk, idx) => (
                    <div key={sk.label} style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                        <span style={{ color: colors.secondary }}>{sk.label}</span>
                        <span style={{ color: colors.muted, fontWeight: "500" }}>{sk.value}%</span>
                      </div>
                      <div style={{ height: "5px", background: colors.accent, borderRadius: "4px" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${sk.value}%` }}
                          transition={{ duration: 0.7, delay: 0.2 + idx * 0.08, ease: "easeOut" }}
                          style={{ height: "5px", background: colors.primary, borderRadius: "4px" }}
                        />
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Suggestions */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{ duration: 0.4, delay: 0.2 }}
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "600" }}>Recommended for you</span>
                  <span style={{ fontSize: "12px", color: colors.muted }}>Based on your data</span>
                </div>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "10px" }}
                >
                  {(data.suggestions || []).map((s) => (
                    <motion.div
                      key={s.text}
                      variants={fadeUp}
                      whileHover={{ y: -2, borderColor: colors.muted }}
                      style={{
                        padding: "16px",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "16px",
                        transition: "border-color 0.15s",
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: "13px", color: colors.secondary, lineHeight: 1.55 }}>{s.text}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}