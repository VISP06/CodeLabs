import { useState } from "react";
import { supabase } from "../lib/supabase";

type AuthMode = "login" | "signup";

// ── Validation helpers ────────────────────────────────────────────────────────

/** RFC-5322-inspired email regex — covers all practical address formats. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Password rules (signup only):
 *   • At least 8 characters
 *   • At least one uppercase letter  [A-Z]
 *   • At least one digit             [0-9]
 *   • At least one special character
 */
const PASSWORD_RULES = [
  { regex: /.{8,}/,                                        label: "at least 8 characters"  },
  { regex: /[A-Z]/,                                        label: "one uppercase letter"    },
  { regex: /[0-9]/,                                        label: "one number"              },
  { regex: /[!@#$%^&*()\-_=+\[\]{};':",.<>/?\\|`~]/,      label: "one special character"   },
];

function validateEmail(value: string): string {
  if (!value.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(value)) return "Please enter a valid email address.";
  return "";
}

function validatePassword(value: string, mode: AuthMode): string {
  if (!value) return "Password is required.";
  if (mode === "login") return ""; // strict rules only on signup
  const failed = PASSWORD_RULES.filter((r) => !r.regex.test(value));
  if (!failed.length) return "";
  return `Password must contain ${failed.map((r) => r.label).join(", ")}.`;
}

function validateConfirm(password: string, confirm: string): string {
  if (!confirm) return "Please confirm your password.";
  if (confirm !== password) return "Passwords do not match.";
  return "";
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface FieldWrapProps {
  id: string;
  label: string;
  icon: string;
  type: "password" | "text" | "email";
  value: string;
  placeholder: string;
  autoComplete: string;
  error: string;
  errorId: string;
  showToggle?: boolean;
  visible?: boolean;
  onToggleVisible?: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
}

/** Reusable labelled input row with optional password-visibility toggle. */
function FieldWrap({
  id,
  label,
  icon,
  type,
  value,
  placeholder,
  autoComplete,
  error,
  errorId,
  showToggle = false,
  visible = false,
  onToggleVisible,
  onChange,
  onBlur,
}: FieldWrapProps) {
  const hasError = !!error;

  const baseStyle: React.CSSProperties = {
    background: "rgba(10,14,26,0.7)",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "border 0.15s, box-shadow 0.15s",
  };
  const errorStyle: React.CSSProperties = {
    background: "rgba(10,14,26,0.7)",
    border: "1px solid rgba(255,107,107,0.5)",
    boxShadow: "0 0 0 3px rgba(255,107,107,0.07)",
    transition: "border 0.15s, box-shadow 0.15s",
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-on-surface-variant tracking-wider uppercase"
      >
        {label}
      </label>
      <div className="relative">
        {/* Left icon */}
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150"
          style={{ fontSize: "18px", color: hasError ? "#ff6b6b" : "#a0b4c4" }}
        >
          {icon}
        </span>

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-describedby={hasError ? errorId : undefined}
          aria-invalid={hasError}
          className="w-full py-3 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/50 outline-none"
          style={{
            ...(hasError ? errorStyle : baseStyle),
            paddingLeft: "2.5rem",
            paddingRight: showToggle ? "2.75rem" : "1rem",
          }}
          onFocus={(e) => {
            if (!hasError) {
              e.currentTarget.style.border = "1px solid rgba(125,211,252,0.4)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(125,211,252,0.08)";
            }
          }}
          onBlurCapture={(e) => {
            if (!hasError) {
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
        />

        {/* Visibility toggle */}
        {showToggle && (
          <button
            type="button"
            id={`${id}-toggle`}
            onClick={onToggleVisible}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-md transition-colors duration-150 focus:outline-none"
            style={{ color: "#a0b4c4" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#7dd3fc")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "#a0b4c4")
            }
          >
            <span
              className="material-symbols-outlined select-none"
              style={{ fontSize: "18px" }}
            >
              {visible ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>

      {/* Inline field error */}
      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs mt-1 leading-relaxed"
          style={{ color: "#ff6b6b", animation: "fadeSlideIn 0.15s ease-out both" }}
        >
          <span
            className="material-symbols-outlined shrink-0 mt-px"
            style={{ fontSize: "13px" }}
          >
            error
          </span>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface FieldErrors {
  email:    string;
  password: string;
  confirm:  string;
}

/**
 * Auth — Phase 4 Supabase Authentication
 *
 * Glassmorphism-styled email/password auth with:
 *  - Strict client-side validation (regex email + password rules)
 *  - Confirm-password field (signup only) with mismatch detection
 *  - Per-field visibility toggles
 *  - Smooth card height transition when switching modes
 *  - Smart Supabase error interception with actionable copy
 */
export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");

  // Field values
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [username, setUsername] = useState("");

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    email: "", password: "", confirm: "",
  });

  // Top-level Supabase error and success banner
  const [submitError,     setSubmitError]     = useState("");
  const [successMessage,  setSuccessMessage]  = useState("");
  const [loading,         setLoading]         = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────

  /** Full validation pass; returns true only when all fields are clean. */
  const runValidation = (): boolean => {
    const emailErr    = validateEmail(email);
    const passwordErr = validatePassword(password, mode);
    const confirmErr  = mode === "signup" ? validateConfirm(password, confirm) : "";
    setFieldErrors({ email: emailErr, password: passwordErr, confirm: confirmErr });
    return !emailErr && !passwordErr && !confirmErr;
  };

  /** Wipes all state when the user switches tabs. */
  const switchMode = (next: AuthMode) => {
    setMode(next);
    setEmail(""); setPassword(""); setConfirm(""); setUsername("");
    setShowPassword(false); setShowConfirm(false);
    setFieldErrors({ email: "", password: "", confirm: "" });
    setSubmitError(""); setSuccessMessage("");
  };

  // ── onChange helpers (clear stale field error on keystroke) ──────────

  const mkChange =
    <K extends keyof FieldErrors>(
      setter: React.Dispatch<React.SetStateAction<string>>,
      field: K
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (fieldErrors[field])
        setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    };

  // ── Submit ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(""); setSuccessMessage("");
    if (!runValidation()) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
        if (error) throw error;
        setSuccessMessage(
          "Account created! Check your email to confirm your address."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // App.tsx's onAuthStateChange listener handles the redirect
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "An unexpected error occurred.";

      // ── Smart error interception ──────────────────────────────────
      if (/invalid login credentials/i.test(raw)) {
        setSubmitError(
          "Account not found. Switch to the Sign Up tab to create one!"
        );
      } else if (/user already registered/i.test(raw)) {
        setSubmitError(
          "An account with this email already exists. Try logging in."
        );
      } else {
        setSubmitError(raw);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">

      {/* ── Ambient background glows ──────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #7dd3fc 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #c8a0f0 0%, transparent 70%)", filter: "blur(80px)" }}
        />
      </div>

      {/* ── Auth Card ─────────────────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{ animation: "fadeSlideIn 0.4s ease-out both" }}
      >
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-5">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(125,211,252,0.2), rgba(200,160,240,0.2))",
              border: "1px solid rgba(125,211,252,0.3)",
              boxShadow: "0 0 40px rgba(125,211,252,0.15)",
            }}
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "28px" }}>
              code_blocks
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Code<span className="text-primary">Labs</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Master code through precision typing
          </p>
        </div>

        {/* Glass card — overflow:hidden clips the animated confirm field */}
        <div
          className="glass rounded-3xl p-6 overflow-hidden"
          style={{
            boxShadow: "0 8px 60px rgba(0,0,0,0.5)",
            // Smooth height transition as the confirm field slides in/out
            transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Mode toggle tabs */}
          <div className="flex rounded-xl p-1 mb-5" style={{ background: "rgba(10,14,26,0.6)" }}>
            {(["login", "signup"] as AuthMode[]).map((m) => (
              <button
                key={m}
                id={`auth-tab-${m}`}
                onClick={() => switchMode(m)}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                style={
                  mode === m
                    ? {
                        background: "linear-gradient(135deg, rgba(125,211,252,0.15), rgba(200,160,240,0.1))",
                        color: "#7dd3fc",
                        border: "1px solid rgba(125,211,252,0.25)",
                        boxShadow: "0 0 20px rgba(125,211,252,0.1)",
                      }
                    : { color: "#a0b4c4", border: "1px solid transparent" }
                }
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* ── Username (Signup Only) ──────────────────────────────── */}
            {mode === "signup" && (
              <FieldWrap
                id="auth-username"
                label="Username"
                icon="person"
                type="text"
                value={username}
                placeholder="coolcoder99"
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
              />
            )}

            {/* ── Email ───────────────────────────────────────────────── */}
            <FieldWrap
              id="auth-email"
              label="Email"
              icon="mail"
              type="email"
              value={email}
              placeholder="you@example.com"
              autoComplete="email"
              error={fieldErrors.email}
              errorId="auth-email-error"
              onChange={mkChange(setEmail, "email")}
              onBlur={() =>
                setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }))
              }
            />

            {/* ── Password ─────────────────────────────────────────────── */}
            <FieldWrap
              id="auth-password"
              label="Password"
              icon="lock"
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder={
                mode === "signup"
                  ? "Min. 8 chars, uppercase, number, symbol"
                  : "Your password"
              }
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              error={fieldErrors.password}
              errorId="auth-password-error"
              showToggle
              visible={showPassword}
              onToggleVisible={() => setShowPassword((v) => !v)}
              onChange={mkChange(setPassword, "password")}
              onBlur={() =>
                setFieldErrors((prev) => ({
                  ...prev,
                  password: validatePassword(password, mode),
                }))
              }
            />

            {/* Password strength checklist (signup, no error, has value) */}
            {mode === "signup" && !fieldErrors.password && password && (
              <div
                className="grid grid-cols-2 gap-1.5 -mt-1"
                aria-label="Password strength indicators"
                style={{ animation: "fadeSlideIn 0.2s ease-out both" }}
              >
                {PASSWORD_RULES.map((rule) => {
                  const ok = rule.regex.test(password);
                  return (
                    <div
                      key={rule.label}
                      className="flex items-center gap-1 text-xs transition-colors duration-200"
                      style={{ color: ok ? "#7dd3fc" : "#a0b4c4" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                        {ok ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Confirm Password (signup only) ───────────────────────── */}
            <div
              style={{
                // Animate the confirm field smoothly in/out
                display: "grid",
                gridTemplateRows: mode === "signup" ? "1fr" : "0fr",
                transition: "grid-template-rows 0.35s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                {/* Always mounted so the animation works; opacity fades it in */}
                <div
                  style={{
                    opacity: mode === "signup" ? 1 : 0,
                    transition: "opacity 0.25s ease",
                    paddingTop: mode === "signup" ? "0" : "0",
                  }}
                >
                  <FieldWrap
                    id="auth-confirm-password"
                    label="Confirm Password"
                    icon="lock_reset"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    error={fieldErrors.confirm}
                    errorId="auth-confirm-error"
                    showToggle
                    visible={showConfirm}
                    onToggleVisible={() => setShowConfirm((v) => !v)}
                    onChange={mkChange(setConfirm, "confirm")}
                    onBlur={() =>
                      setFieldErrors((prev) => ({
                        ...prev,
                        confirm: validateConfirm(password, confirm),
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* ── Supabase / network submit error ─────────────────────── */}
            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "rgba(255,107,107,0.1)",
                  border: "1px solid rgba(255,107,107,0.3)",
                  color: "#ff6b6b",
                  animation: "fadeSlideIn 0.2s ease-out both",
                }}
              >
                <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: "16px" }}>
                  error
                </span>
                {submitError}
              </div>
            )}

            {/* ── Sign-up success banner ───────────────────────────────── */}
            {successMessage && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "rgba(125,211,252,0.1)",
                  border: "1px solid rgba(125,211,252,0.3)",
                  color: "#7dd3fc",
                  animation: "fadeSlideIn 0.2s ease-out both",
                }}
              >
                <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: "16px" }}>
                  check_circle
                </span>
                {successMessage}
              </div>
            )}

            {/* ── Submit button ────────────────────────────────────────── */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, rgba(125,211,252,0.25), rgba(200,160,240,0.2))",
                border: "1px solid rgba(125,211,252,0.35)",
                color: "#7dd3fc",
                boxShadow: loading ? "none" : "0 0 30px rgba(125,211,252,0.15)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(125,211,252,0.35), rgba(200,160,240,0.3))";
                  e.currentTarget.style.boxShadow = "0 0 40px rgba(125,211,252,0.25)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(125,211,252,0.25), rgba(200,160,240,0.2))";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(125,211,252,0.15)";
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {mode === "login" ? "Signing in…" : "Creating account…"}
                </span>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Mode toggle footer */}
          <p className="mt-6 text-center text-sm text-on-surface-variant">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              id="auth-mode-toggle"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-150 underline-offset-2 hover:underline"
            >
              {mode === "login" ? "Sign up free" : "Log in"}
            </button>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-on-surface-variant/50 mt-6">
          By continuing, you agree to our{" "}
          <span className="text-primary/60">Terms of Service</span> and{" "}
          <span className="text-primary/60">Privacy Policy</span>.
        </p>
      </div>

      {/* ── Keyframes ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
