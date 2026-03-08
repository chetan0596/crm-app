import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { setUserPermissions, setUserRoles, setUserData } from "../utils/permissions";

export default function Login() {

  const nav = useNavigate();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [showPass,setShowPass] = useState(false);
  const [remember,setRemember] = useState(false);

  const [err,setErr] = useState("");
  const [loading,setLoading] = useState(false);

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

      localStorage.setItem("token", res.data.data.access_token);

      // Store user permissions, roles, and user data
      if (res.data.data.user) {
        const user = res.data.data.user;
        // Extract permission names from permission objects
        const permissions = user.permissions?.map(p => p.name || p) || [];
        const roles = user.roles?.map(r => r.name) || [];
        setUserPermissions(permissions);
        setUserRoles(roles);
        setUserData({ id: user.id, name: user.name, email: user.email });
      }

      if (remember) {
        localStorage.setItem("remember_email", email);
      }

      nav("/");

    } catch {
      setErr("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page d-flex align-items-center justify-content-center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0d6efd 0%, #6f42c1 100%)"
      }}
    >

      <div className="login-box">

        {/* Logo */}
        <div className="text-center mb-3 text-white">
          <div
            className="mb-2"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700
            }}
          >
            C
          </div>

          <h3 className="mb-0"><b>CRM</b> Admin</h3>
          <small>Management System</small>
        </div>


        {/* Card */}
        <div className="card shadow-lg border-0">

          <div className="card-body p-4">

            <p className="text-center text-muted mb-3">
              Sign in to continue
            </p>

            <form onSubmit={login}>

              {/* Email */}
              <div className="input-group mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email address"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <i className="fas fa-envelope"></i>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="input-group mb-3">
                <input
                  type={showPass ? "text" : "password"}
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                />

                <div
                  className="input-group-append"
                  style={{ cursor:"pointer" }}
                  onClick={()=>setShowPass(s=>!s)}
                >
                  <div className="input-group-text">
                    <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </div>
                </div>
              </div>

              {/* Remember */}
              <div className="d-flex justify-content-between mb-3">

                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={remember}
                    onChange={()=>setRemember(r=>!r)}
                    id="remember"
                  />
                  <label className="form-check-label" htmlFor="remember">
                    Remember me
                  </label>
                </div>

                <a href="#" className="text-sm">
                  Forgot password?
                </a>

              </div>

              {/* Error */}
              {err && (
                <div className="alert alert-danger py-2">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {err}
                </div>
              )}

              {/* Button */}
              <button
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin mr-2"></i> Signing in...</>
                  : "Sign In"}
              </button>

            </form>

            <div className="text-center mt-3">
              <span className="text-muted">Don't have an account? </span>
              <Link to="/register" className="text-primary">Register</Link>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-3 text-white-50 small">
          © {new Date().getFullYear()} CRM System
        </div>

      </div>
    </div>
  );
}
