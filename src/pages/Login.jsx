import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, IconButton, InputAdornment, Link as MuiLink, TextField, Typography } from "@mui/material";
import { setUserPermissions, setUserRoles, setUserData } from "../utils/permissions";
import { setAuthTokens, setupAxiosInterceptors } from "../utils/auth";

const loginFeatures = [
  { label: "Invoices", icon: "fa-file-invoice-dollar", x: 170, y: 90, color: "#e77885" },
  { label: "Reports", icon: "fa-chart-pie", x: 300, y: 55, color: "#6488df" },
  { label: "WhatsApp", icon: "fa-comments", x: 440, y: 90, color: "#ba5e9b" },
  { label: "Customers", icon: "fa-user-group", x: 250, y: 155, color: "#8270ed" },
  { label: "Quotations", icon: "fa-file-lines", x: 345, y: 165, color: "#ec9761" },
  { label: "Inventory", icon: "fa-boxes-stacked", x: 80, y: 225, color: "#b39660" },
  { label: "Automation", icon: "fa-wand-magic-sparkles", x: 190, y: 215, color: "#d1a244" },
  { label: "Sales", icon: "fa-chart-line", x: 410, y: 215, color: "#25afaa" },
  { label: "Leads", icon: "fa-filter", x: 515, y: 235, color: "#3ca8e0" },
  { label: "Follow-ups", icon: "fa-calendar-check", x: 185, y: 300, color: "#db647d" },
  { label: "Teams", icon: "fa-people-group", x: 425, y: 305, color: "#9a79bd" },
  { label: "Payments", icon: "fa-credit-card", x: 95, y: 380, color: "#54add4" },
  { label: "Targets", icon: "fa-bullseye", x: 200, y: 385, color: "#e97b62" },
  { label: "Vendors", icon: "fa-store", x: 405, y: 390, color: "#d9a553" },
  { label: "Purchases", icon: "fa-bag-shopping", x: 530, y: 385, color: "#9275bd" },
  { label: "Users", icon: "fa-user-tie", x: 260, y: 450, color: "#599ba2" },
  { label: "Services", icon: "fa-handshake", x: 345, y: 450, color: "#c974aa" },
  { label: "Notes", icon: "fa-note-sticky", x: 165, y: 515, color: "#79b56c" },
  { label: "Tasks", icon: "fa-list-check", x: 445, y: 510, color: "#ed9073" },
  { label: "Reminders", icon: "fa-bell", x: 305, y: 555, color: "#e5a040" },
];

export default function Login() {

  const nav = useNavigate();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [showPass,setShowPass] = useState(false);
  const [remember,setRemember] = useState(false);
  const [animationPaused, setAnimationPaused] = useState(false);

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
    <Box
      component="main"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '52% 48%', lg: '58.5% 41.5%' },
        minHeight: '100vh',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        component="section"
        className={`login-illustration${animationPaused ? " is-paused" : ""}`}
        aria-label="Connected business tools"
        sx={{ display: { xs: 'none', md: 'flex' } }}
      >
        <div className="login-feature-network" aria-hidden="true">
          <svg className="login-network-lines" viewBox="0 0 600 600" focusable="false">
            {loginFeatures.map((feature, index) => (
              <path
                key={feature.label}
                d={`M 300 310 Q ${300 + (feature.x - 300) * 0.15} ${feature.y} ${feature.x} ${feature.y}`}
                style={{ "--delay": `${-index * 0.4}s` }}
              />
            ))}
          </svg>
          <div className="login-network-hub">
            <svg viewBox="200 130 395 385" focusable="false">
              <image href={`${import.meta.env.BASE_URL}sarth-logo.png`} width="1568" height="627" />
            </svg>
          </div>
          {loginFeatures.map((feature, index) => (
            <div
              key={feature.label}
              className="login-feature"
              style={{
                left: `${feature.x / 6}%`,
                top: `${feature.y / 6}%`,
                "--feature-color": feature.color,
                "--delay": `${-index * 0.4}s`,
              }}
            >
              <span className="login-feature-icon"><i className={`fas ${feature.icon}`} /></span>
              <span className="login-feature-label">{feature.label}</span>
            </div>
          ))}
        </div>
        <IconButton
          className="login-motion-toggle"
          onClick={() => setAnimationPaused(paused => !paused)}
          aria-pressed={animationPaused}
          aria-label={animationPaused ? "Resume illustration animation" : "Pause illustration animation"}
        >
          <i className={`fas ${animationPaused ? "fa-play" : "fa-pause"}`} aria-hidden="true" />
        </IconButton>
      </Box>

      <Box
        component="section"
        aria-labelledby="login-title"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', px: { xs: 3, sm: 6 }, py: 6 }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box
              component="img"
              src={`${import.meta.env.BASE_URL}sarth-logo.png`}
              alt="Sarth — Grow Business"
              sx={{ width: 220, maxWidth: '100%', height: 'auto' }}
            />
          </Box>

          {/* Card */}
          <Box>
            <Typography id="login-title" variant="h4" sx={{ color: 'text.primary', fontWeight: 700, textAlign: 'center', mb: 1 }}>
              Hi, Welcome back
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: 5 }}>
              More effectively with optimized workflows.
            </Typography>

            <Box component="form" onSubmit={login} noValidate>
              {/* Email */}
              <TextField
                label="Email address"
                name="email"
                type="email"
                autoComplete="username"
                fullWidth
                required
                value={email}
                onChange={e=>setEmail(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Password */}
              <TextField
                label="Password"
                name="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                fullWidth
                required
                value={password}
                onChange={e=>setPassword(e.target.value)}
                sx={{ mb: 1.5 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={()=>setShowPass(s=>!s)}
                          aria-label={showPass ? "Hide password" : "Show password"}
                          aria-pressed={showPass}
                          edge="end"
                        >
                          <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Remember + Forgot */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                  control={<Checkbox checked={remember} onChange={()=>setRemember(r=>!r)} size="small" />}
                  label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
                />
                <MuiLink href="#" variant="body2" underline="hover" sx={{ fontWeight: 600 }}>
                  Forgot password?
                </MuiLink>
              </Box>

              {/* Error */}
              {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}

              {/* Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress color="inherit" size={18} /> : null}
                sx={{ py: 1.35, fontSize: 15 }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
              New on our platform?{' '}
              <MuiLink component={Link} to="/register" underline="hover" sx={{ fontWeight: 700 }}>
                Get started
              </MuiLink>
            </Typography>
          </Box>

          {/* Footer */}
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textAlign: 'center', mt: 6 }}>
            © {new Date().getFullYear()} Sarth. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
