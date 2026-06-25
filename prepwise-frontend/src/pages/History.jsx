import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
const sl = (s) => (s >= 8 ? "Excellent" : s >= 6 ? "Good" : "Average");

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function History() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    axios
      .get(`${API}/interview/history`, { headers: authHeaders() })
      .then((res) => setInterviews(res.data.interviews || []))
      .catch(() => setInterviews([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = interviews
    .filter((d) => {
      const mf = filter === "All" || d.type === filter;
      const ms = d.role.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase());
      return mf && ms;
    })
    .sort((a, b) =>
      sort === "newest" ? new Date(b.completedAt) - new Date(a.completedAt) : new Date(a.completedAt) - new Date(b.completedAt)
    );

  const grouped = filtered.reduce((acc, item) => {
    const month = new Date(item.completedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});

  const total = interviews.length;
  const avgScore = total > 0 ? (interviews.reduce((a, b) => a + b.overallScore, 0) / total).toFixed(1) : "—";
  const best = total > 0 ? Math.max(...interviews.map((i) => i.overallScore)) : "—";

  const downloadReport = async (id) => {
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #ede9fe 100%)",
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
        .row:hover { background: #f9f9f9 !important; }
        input:focus { outline: none; border-color: #18181b !important; }
        input:hover { border-color: #a1a1aa !important; }
        @media(max-width:640px){ .stat-row{ grid-template-columns: 1fr 1fr !important; } }
        @media(max-width:560px){ .nav-pad{ padding: 0 16px !important; } .content-pad{ padding: 18px !important; } }
      `}</style>

      {/* Nav */}
      <div
        className="nav-pad"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid rgba(255,255,255,0.3)`,
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
          <span style={{ fontSize: "14px", fontWeight: "600" }}>History</span>
        </div>
        <span style={{ fontSize: "15px", fontWeight: "700", letterSpacing: "-0.3px" }}>PrepWise</span>
      </div>

      <div className="content-pad" style={{ maxWidth: "880px", margin: "0 auto", padding: "32px 24px 48px" }}>
        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.4 }} style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px", letterSpacing: "-0.4px" }}>Activity</h1>
          <p style={{ fontSize: "14px", color: colors.secondary, margin: 0 }}>All your completed interview sessions.</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="stat-row"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "24px" }}
        >
          {[
            ["Total", total],
            ["Avg score", avgScore !== "—" ? `${avgScore}/10` : "—"],
            ["Best", best !== "—" ? `${best}/10` : "—"],
            ["This month", interviews.filter((i) => new Date(i.completedAt).getMonth() === new Date().getMonth()).length],
          ].map(([l, v]) => (
            <motion.div
              key={l}
              variants={fadeUp}
              whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.06)" }}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "18px",
                padding: "16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: "700", color: colors.primary, letterSpacing: "-0.4px" }}>{v}</div>
              <div style={{ fontSize: "11px", color: colors.muted, marginTop: "4px" }}>{l}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Controls */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Search by role or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: "180px",
              padding: "10px 14px",
              border: `1px solid ${colors.border}`,
              borderRadius: "12px",
              fontSize: "13px",
              fontFamily: "inherit",
              color: colors.primary,
              background: colors.surface,
              transition: "border-color 0.12s",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", background: colors.accent, borderRadius: "12px", padding: "4px", gap: "2px" }}>
            {["All", "Technical", "Behavioral", "HR"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 14px",
                  border: "none",
                  borderRadius: "9px",
                  background: filter === f ? colors.surface : "transparent",
                  color: filter === f ? colors.primary : colors.secondary,
                  fontSize: "12px",
                  fontWeight: filter === f ? "600" : "400",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: "9px 14px",
              border: `1px solid ${colors.border}`,
              borderRadius: "12px",
              background: colors.surface,
              color: colors.secondary,
              fontSize: "12px",
              fontFamily: "inherit",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", padding: "60px" }}>
              <motion.div
                style={{
                  width: "24px",
                  height: "24px",
                  border: `3px solid ${colors.border}`,
                  borderTop: `3px solid ${colors.primary}`,
                  borderRadius: "50%",
                  margin: "0 auto",
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        <AnimatePresence>
          {!loading && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: "center",
                padding: "70px 32px",
                background: colors.surface,
                borderRadius: "24px",
                border: `1px solid ${colors.border}`,
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
                {total === 0 ? "🗂" : "🔍"}
              </div>
              <div style={{ fontSize: "16px", color: colors.primary, fontWeight: "600", marginBottom: "8px" }}>
                {total === 0 ? "No sessions yet" : "No results found"}
              </div>
              <div style={{ fontSize: "13px", color: colors.muted, marginBottom: total === 0 ? "24px" : "0" }}>
                {total === 0 ? "Complete a mock interview to see it here." : "Try a different search or filter."}
              </div>
              {total === 0 && (
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/mock-interview")}
                  style={{
                    padding: "11px 24px",
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
                  Start first session →
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grouped list */}
        {!loading &&
          Object.entries(grouped).map(([month, items], groupIdx) => (
            <motion.div
              key={month}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ duration: 0.4, delay: 0.05 + groupIdx * 0.05 }}
              style={{ marginBottom: "24px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{month}</span>
                <div style={{ flex: 1, height: "1px", background: colors.border }} />
                <span style={{ fontSize: "11px", color: colors.muted }}>{items.length}</span>
              </div>
              <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {items.map((item) => (
                  <motion.div
                    key={item._id}
                    className="row"
                    variants={fadeUp}
                    whileHover={{ y: -1 }}
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "18px",
                      padding: "16px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                      transition: "background 0.1s",
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "10px",
                        background: colors.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: colors.secondary,
                        flexShrink: 0,
                      }}
                    >
                      ◎
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: colors.primary, marginBottom: "3px" }}>{item.role}</div>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", color: colors.muted }}>{item.type}</span>
                        <span style={{ fontSize: "12px", color: colors.muted }}>{item.level}</span>
                        <span style={{ fontSize: "12px", color: colors.muted }}>{new Date(item.completedAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ marginTop: "8px", height: "3px", background: colors.accent, borderRadius: "2px", maxWidth: "180px" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.overallScore * 10}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          style={{ height: "3px", background: colors.primary, borderRadius: "2px" }}
                        />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: sc(item.overallScore) }}>{item.overallScore}/10</div>
                      <div style={{ fontSize: "11px", color: colors.muted, marginTop: "2px" }}>{sl(item.overallScore)}</div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <motion.button
                        whileHover={{ background: colors.accent }}
                        onClick={() => navigate(`/history/${item._id}`)}
                        style={{
                          padding: "7px 13px",
                          border: `1px solid ${colors.border}`,
                          borderRadius: "10px",
                          background: colors.surface,
                          color: colors.secondary,
                          fontSize: "12px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Details
                      </motion.button>
                      <motion.button
                        whileHover={{ background: colors.accent }}
                        onClick={() => downloadReport(item._id)}
                        style={{
                          padding: "7px 13px",
                          border: `1px solid ${colors.border}`,
                          borderRadius: "10px",
                          background: colors.surface,
                          color: colors.secondary,
                          fontSize: "12px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        ↓ PDF
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
}