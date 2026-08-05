import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import axios from "axios";

// VITE_API_URL on Vercel = https://prepwise-backend-7tdw.onrender.com/api
// So we only append /auth — NOT /api/auth
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const API_URL = `${BASE}/auth`;

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Handle redirect result when user returns from Google ──
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setGoogleLoading(true);
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          const res = await axios.post(`${API_URL}/google-login`, {
            name: user.displayName,
            email: user.email,
          });
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          navigate("/dashboard");
        }
      } catch (err) {
        // Ignore "no redirect" — only show real errors
        if (
          err.code !== "auth/no-current-user" &&
          err.code !== "auth/null-user"
        ) {
          console.error("Redirect result error:", err.code, err.message);
          if (err.response?.data?.message || err.message) {
            setError(err.response?.data?.message || err.message);
          }
        }
      } finally {
        setGoogleLoading(false);
      }
    };

    handleRedirectResult();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setGoogleLoading(true);

      const isLocal = window.location.hostname === "localhost";

      if (isLocal) {
        // Use popup on localhost
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const res = await axios.post(`${API_URL}/google-login`, {
          name: user.displayName,
          email: user.email,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        // Use redirect on Vercel (avoids popup-closed-by-user / COOP issues)
        await signInWithRedirect(auth, googleProvider);
        // Page will reload — result handled in useEffect above
      }
    } catch (err) {
      console.error("Google login error:", err.code, err.message);
      if (
        err.code !== "auth/popup-closed-by-user" &&
        err.code !== "auth/cancelled-popup-request"
      ) {
        setError(err.response?.data?.message || err.message || "Google sign-in failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async () => {
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/login`, { email, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        await axios.post(`${API_URL}/register`, { name, email, password });
        setIsLogin(true);
        setError("");
      }
    } catch (err) {
      console.error("Auth error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || err.message || "Something went wrong"
      );
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

  const isAnyLoading = loading || googleLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #ede9fe 100%)",
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
        @media(max-width: 880px) { .login-left { display: none !important; } }
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
          background:
            "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #4f46e5 100%)",
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

        <div
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#fff",
            letterSpacing: "-0.2px",
            position: "relative",
            zIndex: 1,
          }}
        >
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
          <div
            style={{
              fontSize: "13px",
              color: "#a5a5c0",
              lineHeight: 1.7,
              marginBottom: "40px",
            }}
          >
            Practice mock interviews, analyze your resume, and get AI-generated
            feedback — all in one place.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              "AI mock interviews with real-time scoring",
              "Resume ATS analysis and skill gap detection",
              "Detailed feedback reports after every session",
            ].map((f) => (
              <div
                key={f}
                style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
              >
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
                <span
                  style={{ fontSize: "13px", color: "#c4c4dc", lineHeight: 1.6 }}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#7a7a9a",
            position: "relative",
            zIndex: 1,
          }}
        >
          © 2026 PrepWise
        </div>
      </div>

      {/* Right — form */}
      <div
        className="login-right"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        {/* Google loading overlay */}
        {googleLoading && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
          >
            <motion.div
              style={{
                width: "28px",
                height: "28px",
                border: "3px solid #e4e4e7",
                borderTop: "3px solid #18181b",
                borderRadius: "50%",
                marginBottom: "16px",
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            />
            <div style={{ fontSize: "14px", color: "#52525b", fontWeight: "500" }}>
              Signing you in with Google…
            </div>
          </div>
        )}

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
              {isLogin
                ? "Enter your credentials to continue"
                : "Fill in the details below to get started"}
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
                onClick={() => { setIsLogin(i === 0); setError(""); }}
                style={{
                  flex: 1,
                  padding: "7px",
                  border: "none",
                  borderRadius: "9px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background:
                    (i === 0) === isLogin ? colors.surface : "transparent",
                  color:
                    (i === 0) === isLogin ? colors.primary : colors.secondary,
                  boxShadow:
                    (i === 0) === isLogin
                      ? "0 1px 3px rgba(0,0,0,0.06)"
                      : "none",
                  transition: "all 0.15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Error */}
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>{error}</span>
                <span
                  style={{ cursor: "pointer", fontWeight: "700", flexShrink: 0 }}
                  onClick={() => setError("")}
                >
                  ✕
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fields */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {!isLogin && (
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#374151",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Full name
                </label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isAnyLoading}
                />
              </div>
            )}
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#374151",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Email address
              </label>
              <input
                style={inputStyle}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isAnyLoading}
              />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "5px",
                }}
              >
                <label
                  style={{ fontSize: "12px", fontWeight: "500", color: "#374151" }}
                >
                  Password
                </label>
                {isLogin && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: colors.secondary,
                      cursor: "pointer",
                    }}
                  >
                    Forgot password?
                  </span>
                )}
              </div>
              <input
                style={inputStyle}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isAnyLoading && handleAuth()}
                disabled={isAnyLoading}
              />
            </div>
            {!isLogin && (
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#374151",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Confirm password
                </label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isAnyLoading && handleAuth()}
                  disabled={isAnyLoading}
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            className="l-btn"
            onClick={handleAuth}
            disabled={isAnyLoading}
            style={{
              width: "100%",
              padding: "11px",
              border: "none",
              borderRadius: "12px",
              background: colors.primary,
              color: "#fff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: isAnyLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: isAnyLoading ? 0.6 : 1,
              marginBottom: "16px",
            }}
          >
            {loading ? "Please wait…" : isLogin ? "Continue" : "Create account"}
          </button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: colors.border }} />
            <span style={{ fontSize: "11px", color: colors.muted }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: "1px", background: colors.border }} />
          </div>

          {/* Google */}
          <button
            className="social"
            onClick={handleGoogleLogin}
            disabled={isAnyLoading}
            style={{
              width: "100%",
              padding: "10px",
              border: `1px solid ${colors.border}`,
              borderRadius: "12px",
              background: colors.surface,
              color: colors.secondary,
              fontSize: "13px",
              fontWeight: "500",
              cursor: isAnyLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: isAnyLoading ? 0.6 : 1,
              marginBottom: "16px",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Footer */}
          <p
            style={{
              fontSize: "12px",
              color: colors.secondary,
              textAlign: "center",
              margin: 0,
            }}
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span
              className="switch"
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
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