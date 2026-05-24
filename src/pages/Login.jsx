import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { setUserPermissions, setUserRoles, setUserData } from "../utils/permissions";
import { setAuthTokens, setupAxiosInterceptors } from "../utils/auth";

export default function Login() {

  const nav = useNavigate();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [showPass,setShowPass] = useState(false);
  const [remember,setRemember] = useState(false);

  const [err,setErr] = useState("");
  const [loading,setLoading] = useState(false);

  // Setup axios interceptors on component mount
  useEffect(() => {
    setupAxiosInterceptors();
    
    // Check for remembered email
    const rememberedEmail = localStorage.getItem("remember_email");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
    }
  }, []);

  const login = async (e) => {
    e?.preventDefault();
    setErr("");

    if (!email || !password) {
      setErr("Email and password required");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/login",{email,password});

      // Use secure token storage
      const { access_token, refresh_token, expires_in } = res.data.data;
      
      // Handle API returning 0 or missing expires_in (token never expires)
      const actualExpiresIn = expires_in && expires_in > 0 ? expires_in : 86400; // Default 24 hours
      
      setAuthTokens(access_token, refresh_token, actualExpiresIn);

      // Store user permissions, revoked permissions, roles, and user data
      if (res.data.data.user) {
        const user = res.data.data.user;
        // Extract permission names from permission objects (effective permissions already apply revoked)
        const permissions = user.permissions?.map(p => p.name || p) || [];
        const revoked = user.revoked_permissions || [];
        const roles = user.roles?.map(r => r.name) || [];
        setUserPermissions(permissions, revoked);
        setUserRoles(roles);
        setUserData({ id: user.id, name: user.name, email: user.email });
      }

      if (remember) {
        localStorage.setItem("remember_email", email);
      } else {
        localStorage.removeItem("remember_email");
      }

      nav("/");

    } catch (error) {
      setErr(error.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page d-flex align-items-center justify-content-center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)",
      }}
    >
      <div className="login-box" style={{ width: "100%", maxWidth: 420, padding: "0 16px" }}>

        {/* Logo */}
        <div className="text-center mb-4 text-white">
          <div
            className="mb-3 d-inline-flex align-items-center justify-content-center"
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              fontSize: 32,
              fontWeight: 800,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <i className="fas fa-cube"></i>
          </div>
          <h3 className="mb-1 fw-bold" style={{ fontSize: "1.75rem", letterSpacing: "-0.5px" }}>CRM Admin</h3>
          <small style={{ opacity: 0.75, fontSize: "0.9rem" }}>Management System</small>
        </div>

        {/* Card */}
        <div
          className="card border-0"
          style={{
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            overflow: "hidden",
          }}
        >
          <div className="card-body p-4 p-sm-5">
            <h5 className="text-center fw-semibold mb-1" style={{ color: "#1e293b" }}>Welcome back</h5>
            <p className="text-center text-muted mb-4 small">Please enter your credentials to sign in</p>

            <form onSubmit={login}>

              {/* Email */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary mb-1">Email address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0" style={{ borderColor: "#e2e8f0" }}>
                    <i className="fas fa-envelope text-muted" style={{ fontSize: 14 }}></i>
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0 ps-0"
                    placeholder="name@company.com"
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                    style={{ borderColor: "#e2e8f0", fontSize: "0.95rem" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary mb-1">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0" style={{ borderColor: "#e2e8f0" }}>
                    <i className="fas fa-lock text-muted" style={{ fontSize: 14 }}></i>
                  </span>
                  <input
                    type={showPass ? "text" : "password"}
                    className="form-control border-start-0 border-end-0 ps-0"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    style={{ borderColor: "#e2e8f0", fontSize: "0.95rem" }}
                  />
                  <span
                    className="input-group-text bg-light border-start-0"
                    style={{ borderColor: "#e2e8f0", cursor: "pointer" }}
                    onClick={()=>setShowPass(s=>!s)}
                  >
                    <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"} text-muted`} style={{ fontSize: 14 }}></i>
                  </span>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={remember}
                    onChange={()=>setRemember(r=>!r)}
                    id="remember"
                    style={{ cursor: "pointer" }}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="remember" style={{ cursor: "pointer" }}>
                    Remember me
                  </label>
                </div>
                <a href="#" className="small text-decoration-none fw-medium" style={{ color: "#3b82f6" }}>
                  Forgot password?
                </a>
              </div>

              {/* Error */}
              {err && (
                <div className="alert alert-danger d-flex align-items-center py-2 mb-3" style={{ borderRadius: 8, fontSize: "0.9rem" }}>
                  <i className="fas fa-circle-exclamation me-2"></i>
                  <div>{err}</div>
                </div>
              )}

              {/* Button */}
              <button
                className="btn btn-primary w-100 py-2 fw-semibold"
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  border: "none",
                  borderRadius: 10,
                  fontSize: "1rem",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                  transition: "all 0.2s ease",
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

            </form>

            <div className="text-center mt-4">
              <span className="text-muted small">Don't have an account? </span>
              <Link to="/register" className="small fw-semibold text-decoration-none" style={{ color: "#2563eb" }}>Register</Link>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 small" style={{ color: "rgba(255,255,255,0.6)" }}>
          © {new Date().getFullYear()} CRM System. All rights reserved.
        </div>

      </div>
    </div>
  );
}
