import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoPng from "../assets/logo.png";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Loader2,
  Mail,
  UserRound,
} from "lucide-react";
import { registerUser } from "../services/api.js";
import ThemeToggle from "../components/ThemeToggle.jsx";

const getPasswordStrength = (password) => {
  if (!password) {
    return { label: "Add a password", level: 0, width: "0%" };
  }

  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (checks <= 1) {
    return { label: "Weak", level: 1, width: "25%" };
  }

  if (checks === 2) {
    return { label: "Fair", level: 2, width: "50%" };
  }

  if (checks === 3) {
    return { label: "Good", level: 3, width: "75%" };
  }

  return { label: "Strong", level: 4, width: "100%" };
};

const Register = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // NOTE: kept in state to avoid touching validation logic elsewhere.
  // UI requirement: remove ToS checkbox from the rendered page.
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = getPasswordStrength(form.password);

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await registerUser(form);
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleGoogleSuccess = async (credentialResponse) => {
  //   try {
  //     const res = await fetch("http://localhost:5001/api/auth/google", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         credential: credentialResponse.credential,
  //       }),
  //     });

  const handleGoogleSuccess = async (credentialResponse) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/google`,
      {
        credential: credentialResponse.credential,
      }
    );

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    navigate("/dashboard");
  } catch (error) {
    console.error("Google Register Error:", error);
  }
};

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-slate-900 dark:text-white">
      {/* Sticky navbar (Landing style) */}
      <header className="sticky top-0 z-50 border-b border-white/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lg text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900">
                <img
                  src={logoPng}
                  alt="DocuMind AI"
                  className="h-9 w-9 rounded-2xl object-contain"
                />
              </span>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                  DocuMind AI
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Document intelligence platform
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/15" />
        <div className="absolute right-[-8rem] top-[15%] h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl dark:bg-violet-500/15" />
        <div className="absolute bottom-[-10rem] left-[22%] h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl dark:bg-fuchsia-500/10" />
      </div>

      <main className="mx-auto flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="relative mx-auto w-full max-w-[450px] overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/70 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10" />

            <div className="relative">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Create Account
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Start using DocuMind AI today
                </h1>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key={error}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-6 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
                  >
                    <span className="font-semibold">Registration error.</span>{" "}
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Full Name
                  </label>
                  <div className="group relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Narendra modi"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Email
                  </label>
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Min 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Confirm Password
                  </label>
                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-11 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={loading ? undefined : { y: -2 }}
                  whileTap={loading ? undefined : { scale: 0.98 }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>

                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      console.log("Google Register Failed");
                    }}
                    theme="outline"
                    size="large"
                    shape="pill"
                    width="320"
                  />
                </div>
              </form>

              {/* <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                By continuing, you agree to our Terms and Privacy Policy.
              </p> */}

              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-primary transition-colors hover:text-cyan-600 dark:hover:text-cyan-300"
                >
                  Login
                </Link>
              </p>

              {/* Keep state to avoid unused warnings; UI requirement: no checkbox */}
              <span className="sr-only">{termsAccepted ? "yes" : "no"}</span>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Register;
