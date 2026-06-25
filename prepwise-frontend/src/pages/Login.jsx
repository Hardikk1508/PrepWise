import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import axios from "axios";

const API_URL = "http://localhost:8000/api/auth";

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

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const res = await axios.post(`${API_URL}/google-login`, {
        name: user.displayName,
        email: user.email,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      console.log("Google login successful");
      console.log("Saved token:", localStorage.getItem("token"));

      navigate("/dashboard");
    } catch (error) {
      console.log("Google Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/login`, {
          email,
          password,
        });

        console.log(res.data);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        navigate("/dashboard");
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        await axios.post(`${API_URL}/register`, {
          name,
          email,
          password,
        });

        setIsLogin(true);
        setError("");
      }
    } catch (err) {
      console.log("FULL ERROR:", err);

      if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Response Data:", err.response.data);
      } else if (err.request) {
        console.log("No response received:", err.request);
      } else {
        console.log("Error message:", err.message);
      }

      setError(err.response?.data?.message || err.message || "Something went wrong");
    }

    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    background: colors.surface,
    color: colors.primary,
    boxSizing: "border-box",
    transition: "border-color 0.12s",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #ede9fe 100%)",
        display: "flex",
        fontFamily: "'Inter', -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { border-color: ${colors.primary} !important; }
        input:hover { border-color: ${colors.muted} !important; }
        .l-btn { transition: all .2s ease !important; }
        .l-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(99,102,241,.45) !important;
        }
        .tab:hover { color: ${colors.primary} !important; }
        .social:hover { background: ${colors.accent} !important; border-color: ${colors.muted} !important; }
        .switch:hover { text-decoration: underline; }
        @media(max-width: 880px) {
          .login-left { display: none !important; }
        }
        @media(max-width: 480px) {
          .login-right { padding: 24px !important; }
          .login-card { padding: 28px !important; }
        }
      `}</style>

      {/* Left — brand panel */}
      <div
        className="login-left"
        style={{
          width: "420px",
          background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #4f46e5 100%)",
          borderRadius: "0 40px 40px 0",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 25px rgba(99,102,241,0.35)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            top: "-120px",
            right: "-100px",
            filter: "blur(10px)",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            bottom: "-80px",
            left: "-80px",
            filter: "blur(10px)",
          }}
        />

        <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff", letterSpacing: "-0.2px", position: "relative", zIndex: 1 }}>
          PrepWise
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#fff",
              lineHeight: 1.3,
              letterSpacing: "-0.6px",
              marginBottom: "16px",
            }}
          >
            Interview prep,
            <br />
            done right.
          </div>
          <div style={{ fontSize: "13px", color: "#a5a5c0", lineHeight: 1.7, marginBottom: "40px" }}>
            Practice mock interviews, analyze your resume, and get AI-generated feedback — all in one place.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              "AI mock interviews with real-time scoring",
              "Resume ATS analysis and skill gap detection",
              "Detailed feedback reports after every session",
            ].map((f) => (
              <div key={f} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.6)",
                    marginTop: "7px",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "13px", color: "#c4c4dc", lineHeight: 1.6 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "#7a7a9a", position: "relative", zIndex: 1 }}>© 2026 PrepWise</div>
      </div>

      {/* Right — form */}
      <div
        className="login-right"
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}
      >
        <motion.div
          className="login-card"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "36px",
            borderRadius: "24px",
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ marginBottom: "28px" }}>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: colors.primary,
                margin: "0 0 4px",
                letterSpacing: "-0.4px",
              }}
            >
              {isLogin ? "Sign in" : "Create account"}
            </h1>
            <p style={{ fontSize: "13px", color: colors.secondary, margin: 0 }}>
              {isLogin ? "Enter your credentials to continue" : "Fill in the details below to get started"}
            </p>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              border: `1px solid ${colors.border}`,
              borderRadius: "12px",
              padding: "4px",
              marginBottom: "20px",
              background: colors.accent,
            }}
          >
            {["Sign in", "Sign up"].map((t, i) => (
              <button
                key={t}
                className="tab"
                onClick={() => setIsLogin(i === 0)}
                style={{
                  flex: 1,
                  padding: "7px",
                  border: "none",
                  borderRadius: "9px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: (i === 0) === isLogin ? colors.surface : "transparent",
                  color: (i === 0) === isLogin ? colors.primary : colors.secondary,
                  boxShadow: (i === 0) === isLogin ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: colors.danger,
                  marginBottom: "14px",
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            {!isLogin && (
              <div>
                <label
                  style={{ fontSize: "12px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "5px" }}
                >
                  Full name
                </label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label
                style={{ fontSize: "12px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "5px" }}
              >
                Email address
              </label>
              <input
                style={inputStyle}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <label style={{ fontSize: "12px", fontWeight: "500", color: "#374151" }}>Password</label>
                {isLogin && <span style={{ fontSize: "12px", color: colors.secondary, cursor: "pointer" }}>Forgot password?</span>}
              </div>
              <input
                style={inputStyle}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              />
            </div>
            {!isLogin && (
              <div>
                <label
                  style={{ fontSize: "12px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "5px" }}
                >
                  Confirm password
                </label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                />
              </div>
            )}
          </div>

          <button
            className="l-btn"
            onClick={handleAuth}
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px",
              border: "none",
              borderRadius: "12px",
              background: colors.primary,
              color: "#fff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.6 : 1,
              marginBottom: "16px",
            }}
          >
            {loading ? "Please wait…" : isLogin ? "Continue" : "Create account"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{ flex: 1, height: "1px", background: colors.border }} />
            <span style={{ fontSize: "11px", color: colors.muted }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", background: colors.border }} />
          </div>

          <button
            className="social"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              border: `1px solid ${colors.border}`,
              borderRadius: "12px",
              background: colors.surface,
              color: colors.secondary,
              fontSize: "12px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.6 : 1,
              marginBottom: "16px",
              transition: "all 0.15s",
            }}
          >
            Google
          </button>

          <p style={{ fontSize: "12px", color: colors.secondary, textAlign: "center", margin: 0 }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span
              className="switch"
              onClick={() => setIsLogin(!isLogin)}
              style={{ color: colors.primary, fontWeight: "600", cursor: "pointer" }}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}