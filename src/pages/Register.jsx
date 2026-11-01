import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Link as MuiLink, TextField, Typography } from "@mui/material";
import { Iconify } from "../components/iconify";

const loginFeatures = [
  { label: "Invoices", icon: "solar:file-text-bold-duotone", x: 170, y: 90, color: "#e77885" },
  { label: "Reports", icon: "solar:pie-chart-2-bold-duotone", x: 300, y: 55, color: "#6488df" },
  { label: "WhatsApp", icon: "solar:chat-round-dots-bold-duotone", x: 440, y: 90, color: "#ba5e9b" },
  { label: "Customers", icon: "solar:users-group-two-rounded-bold-duotone", x: 250, y: 155, color: "#8270ed" },
  { label: "Quotations", icon: "solar:document-bold-duotone", x: 345, y: 165, color: "#ec9761" },
  { label: "Inventory", icon: "solar:box-bold-duotone", x: 80, y: 225, color: "#b39660" },
  { label: "Automation", icon: "solar:magic-stick-3-bold-duotone", x: 190, y: 215, color: "#d1a244" },
  { label: "Sales", icon: "solar:graph-up-bold-duotone", x: 410, y: 215, color: "#25afaa" },
  { label: "Leads", icon: "solar:filter-bold-duotone", x: 515, y: 235, color: "#3ca8e0" },
  { label: "Follow-ups", icon: "solar:calendar-mark-bold-duotone", x: 185, y: 300, color: "#db647d" },
  { label: "Teams", icon: "solar:users-group-rounded-bold-duotone", x: 425, y: 305, color: "#9a79bd" },
  { label: "Payments", icon: "solar:card-bold-duotone", x: 95, y: 380, color: "#54add4" },
  { label: "Targets", icon: "solar:target-bold-duotone", x: 200, y: 385, color: "#e97b62" },
  { label: "Vendors", icon: "solar:shop-2-bold-duotone", x: 405, y: 390, color: "#d9a553" },
  { label: "Purchases", icon: "solar:bag-4-bold-duotone", x: 530, y: 385, color: "#9275bd" },
  { label: "Users", icon: "solar:user-speak-rounded-bold-duotone", x: 260, y: 450, color: "#599ba2" },
  { label: "Services", icon: "solar:hand-shake-bold-duotone", x: 345, y: 450, color: "#c974aa" },
  { label: "Notes", icon: "solar:notes-bold-duotone", x: 165, y: 515, color: "#79b56c" },
  { label: "Tasks", icon: "solar:checklist-bold-duotone", x: 445, y: 510, color: "#ed9073" },
  { label: "Reminders", icon: "solar:bell-bing-bold-duotone", x: 305, y: 555, color: "#e5a040" },
];

export default function Register() {

  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [animationPaused, setAnimationPaused] = useState(false);

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
    <Box
      component="main"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '52% 48%', lg: '58.5% 41.5%' },
        minHeight: '100dvh',
        width: '100%',
        overflowX: 'hidden',
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
            <img src={`${import.meta.env.BASE_URL}sarth-logo-symbol.png`} alt="Sarth" />
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
              <span className="login-feature-icon"><Iconify icon={feature.icon} width="1em" /></span>
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
          <Iconify icon={animationPaused ? "solar:play-bold" : "solar:pause-bold"} width={12} aria-hidden="true" />
        </IconButton>
      </Box>

      <Box
        component="section"
        aria-labelledby="register-title"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', px: { xs: 3, sm: 6 }, py: { xs: 4, sm: 6 } }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5 } }}>
            <Box
              component="img"
              src={`${import.meta.env.BASE_URL}sarth-logo.png`}
              alt="Sarth — Grow Business"
              sx={{ width: { xs: 170, sm: 220 }, maxWidth: '100%', height: 'auto' }}
            />
          </Box>

          {/* Card */}
          <Box>
            <Typography id="register-title" variant="h4" sx={{ color: 'text.primary', fontWeight: 700, textAlign: 'center', mb: 1 }}>
              Create your account
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: { xs: 4, sm: 5 } }}>
              Get started with your CRM account.
            </Typography>

            <Box component="form" onSubmit={register} noValidate>
              {/* Name */}
              <TextField
                label="Full name"
                name="name"
                type="text"
                autoComplete="name"
                fullWidth
                required
                value={name}
                onChange={e => setName(e.target.value)}
                sx={{ mb: 3 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Iconify icon="solar:user-rounded-bold-duotone" width={20} sx={{ color: 'text.disabled' }} aria-hidden="true" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Email */}
              <TextField
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                fullWidth
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                sx={{ mb: 3 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Iconify icon="solar:letter-bold-duotone" width={20} sx={{ color: 'text.disabled' }} aria-hidden="true" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Password */}
              <TextField
                label="Password"
                name="password"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                fullWidth
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPass(s => !s)}
                          aria-label={showPass ? "Hide password" : "Show password"}
                          aria-pressed={showPass}
                          edge="end"
                        >
                          <Iconify icon={showPass ? "solar:eye-closed-bold" : "solar:eye-bold"} width={20} aria-hidden="true" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Confirm Password */}
              <TextField
                label="Confirm password"
                name="passwordConfirmation"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                fullWidth
                required
                value={passwordConfirmation}
                onChange={e => setPasswordConfirmation(e.target.value)}
                sx={{ mb: 3 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Iconify icon="solar:lock-password-bold-duotone" width={20} sx={{ color: 'text.disabled' }} aria-hidden="true" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

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
                {loading ? "Creating account..." : "Register"}
              </Button>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
              Already have an account?{' '}
              <MuiLink component={Link} to="/login" underline="hover" sx={{ fontWeight: 700 }}>
                Sign in
              </MuiLink>
            </Typography>
          </Box>

          {/* Footer */}
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textAlign: 'center', mt: { xs: 4, sm: 6 } }}>
            © {new Date().getFullYear()} Sarth. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
