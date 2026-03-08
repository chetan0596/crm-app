import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {

  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async (e) => {
    e?.preventDefault();
    setErr("");

    if (!name || !email || !password) {
      setErr("All fields are required");
      return;
    }

    if (password !== passwordConfirmation) {
      setErr("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      await api.post("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation
      });

      toast.success("Registration successful! Please login.");
      nav("/login");

    } catch (e) {
      const msg = e.response?.data?.message 
        || e.response?.data?.errors?.email?.[0]
        || e.response?.data?.errors?.password?.[0]
        || "Registration failed";
      setErr(msg);
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
              Create your account
            </p>

            <form onSubmit={register}>

              {/* Name */}
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <i className="fas fa-user"></i>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="input-group mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                  onChange={e => setPassword(e.target.value)}
                />
                <div
                  className="input-group-append"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPass(s => !s)}
                >
                  <div className="input-group-text">
                    <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="input-group mb-3">
                <input
                  type={showPass ? "text" : "password"}
                  className="form-control"
                  placeholder="Confirm password"
                  value={passwordConfirmation}
                  onChange={e => setPasswordConfirmation(e.target.value)}
                />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <i className="fas fa-lock"></i>
                  </div>
                </div>
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
                className="btn btn-success btn-block"
                disabled={loading}
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin mr-2"></i> Creating account...</>
                  : "Register"}
              </button>

            </form>

            <div className="text-center mt-3">
              <span className="text-muted">Already have an account? </span>
              <Link to="/login" className="text-primary">Sign in</Link>
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
