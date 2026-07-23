"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export interface StackConfig {
  backend: string;
  database: string;
  cloud: string;
  users: string;
  challenge: string;
}

interface AnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateReport: (config: StackConfig) => void;
  initialStep?: FlowStep;
}

type FlowStep = "preloader" | "signup" | "signin" | "configure";

export function AnalyzerModal({ isOpen, onClose, onGenerateReport, initialStep }: AnalyzerModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<FlowStep>(initialStep || "preloader");
  const [loadingLines, setLoadingLines] = useState<string[]>([]);
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });
  const [signinForm, setSigninForm] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [config, setConfig] = useState<StackConfig>({
    backend: "Node.js",
    database: "PostgreSQL",
    cloud: "AWS",
    users: "100k MAU",
    challenge: "High latency during peak traffic",
  });

  // Reset flow states whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      const startingStep = initialStep || "preloader";
      setStep(startingStep);
      setLoadingLines([]);
      setSignupForm({ name: "", email: "", password: "" });
      setSigninForm({ email: "", password: "" });
      setErrorMsg(null);
      setLoading(false);

      // Only run preloader timeouts if we are actually starting on preloader step
      if (startingStep === "preloader") {
        const line1 = setTimeout(() => {
          setLoadingLines((prev) => [...prev, "> Ingesting system topology blueprints..."]);
        }, 300);

        const line2 = setTimeout(() => {
          setLoadingLines((prev) => [...prev, "> Evaluating scale tier load boundaries..."]);
        }, 900);

        const line3 = setTimeout(() => {
          setLoadingLines((prev) => [...prev, "> Establishing secure analysis tunnel..."]);
        }, 1500);

        const finishLoader = setTimeout(() => {
          setStep("signup");
        }, 2300);

        return () => {
          clearTimeout(line1);
          clearTimeout(line2);
          clearTimeout(line3);
          clearTimeout(finishLoader);
        };
      }
    }
  }, [isOpen, initialStep]);

  // Lock document body scroll and listen for Escape key to close
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalMargin = document.body.style.margin;
      document.body.style.overflow = "hidden";
      document.body.style.margin = "0";
      document.documentElement.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.margin = originalMargin;
        document.documentElement.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: signupForm.email,
      password: signupForm.password,
      options: {
        data: {
          full_name: signupForm.name,
        },
      },
    });

    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setStep("configure");
    }
  };

  const handleSigninSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: signinForm.email,
      password: signinForm.password,
    });

    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setStep("configure");
    }
  };

  const handleGitHubSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateReport(config);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#FFFFFF] w-screen h-screen flex flex-col items-center justify-start p-6 sm:p-12 text-[#0D0D0B] select-none overflow-y-auto relative">
      {/* Dark Faded Grid Overlay Layer (fading from all ends) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-45"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(13, 13, 11, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(13, 13, 11, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      {/* Pulsing Warm Brown Ambient Glow Layer - centered on screen behind the form content */}
      <div className="absolute top-1/2 left-1/2 w-[550px] sm:w-[750px] h-[350px] sm:h-[450px] bg-[#C89B0C] blur-[100px] pointer-events-none rounded-full animate-glow-pulse z-0 opacity-40" />

      {/* Header with centered branding and no ESC tag */}
      <div className="flex items-center justify-center border-b border-[#E2E2DF] pb-4 w-full shrink-0 relative z-10">
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 bg-[#FCDD2D] border border-[#0D0D0B] flex items-center justify-center font-mono font-bold text-xs text-[#0D0D0B] transition-transform group-hover:scale-[1.05]">
            SP
          </div>
          <span className="font-display font-bold text-lg text-[#0D0D0B] tracking-tight group-hover:text-[#555550] transition-colors">
            ScalePilot
          </span>
        </Link>
      </div>

      {/* Centered Main Content Wrapper */}
      <div className="flex-1 flex flex-col justify-center w-full max-w-lg mx-auto py-8 shrink-0 relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: Custom Preloader */}
          {step === "preloader" && (
            <motion.div
              key="preloader-step"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#0D0D0B]">
                  Analyzing Target Stack...
                </h3>
                <p className="font-mono text-xs text-[#555550] uppercase tracking-wider">
                  Analyzing architecture parameters for ingestion.
                </p>
              </div>

              {/* Console Scanning Lines */}
              <div className="bg-[#F8F8F6] border border-[#E2E2DF] p-5 h-28 font-mono text-xs text-[#555550] space-y-2 flex flex-col justify-start">
                {loadingLines.map((line, idx) => (
                  <div key={idx} className="animate-fade-in font-bold text-[#0D0D0B]">
                    {line}
                  </div>
                ))}
              </div>

              {/* Minimalist Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-2.5 bg-[#F8F8F6] border border-[#0D0D0B] p-[1.5px]">
                  <motion.div
                    className="h-full bg-[#0D0D0B]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.2, ease: "easeInOut" }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-[#555550]">
                  <span>INITIALIZING SCANNER</span>
                  <span>COMPILING RUNTIMES</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Sign Up Screen */}
          {step === "signup" && (
            <motion.div
              key="signup-step"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <div className="space-y-1">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#0D0D0B]">
                  Create Architect Profile
                </h3>
                <p className="font-mono text-xs text-[#555550] uppercase tracking-wider">
                  Setup your profile to save reports and receive blueprints.
                </p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-4 font-mono text-xs">
                {errorMsg && (
                  <div className="p-3 bg-[#FFF0F0] border border-[#FFD2D2] text-[#D8000C] text-[11px] font-bold uppercase tracking-wider">
                    Error: {errorMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[#555550] uppercase tracking-wider block font-bold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    disabled={loading}
                    className="w-full bg-[#F8F8F6] border border-[#0D0D0B] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#555550] uppercase tracking-wider block font-bold">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="architect@company.com"
                    disabled={loading}
                    className="w-full bg-[#F8F8F6] border border-[#0D0D0B] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#555550] uppercase tracking-wider block font-bold">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full bg-[#F8F8F6] border border-[#0D0D0B] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#FCDD2D] hover:bg-[#ebd028] text-[#0D0D0B] border border-[#0D0D0B] uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loading ? "Creating Profile..." : "Create Account & Continue"}</span>
                  <span>→</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/sign-in")}
                    className="text-[#555550] hover:text-[#0D0D0B] underline cursor-pointer"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 3: Sign In Screen */}
          {step === "signin" && (
            <motion.div
              key="signin-step"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <div className="space-y-1">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#0D0D0B]">
                  Welcome Back
                </h3>
                <p className="font-mono text-xs text-[#555550] uppercase tracking-wider">
                  Sign in to access your architecture evaluations.
                </p>
              </div>

              <form onSubmit={handleSigninSubmit} className="space-y-4 font-mono text-xs">
                {errorMsg && (
                  <div className="p-3 bg-[#FFF0F0] border border-[#FFD2D2] text-[#D8000C] text-[11px] font-bold uppercase tracking-wider">
                    Error: {errorMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[#555550] uppercase tracking-wider block font-bold">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={signinForm.email}
                    onChange={(e) => setSigninForm({ ...signinForm, email: e.target.value })}
                    placeholder="architect@company.com"
                    disabled={loading}
                    className="w-full bg-[#F8F8F6] border border-[#0D0D0B] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#555550] uppercase tracking-wider block font-bold">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={signinForm.password}
                    onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full bg-[#F8F8F6] border border-[#0D0D0B] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#FCDD2D] hover:bg-[#ebd028] text-[#0D0D0B] border border-[#0D0D0B] uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loading ? "Verifying..." : "Sign In & Continue"}</span>
                  <span>→</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-[1px] bg-[#E2E2DF]" />
                  <span className="text-[10px] text-[#888880] uppercase tracking-wider">or</span>
                  <div className="flex-1 h-[1px] bg-[#E2E2DF]" />
                </div>

                {/* OAuth Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  {/* GitHub OAuth Button */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGitHubSignIn}
                    className="py-3.5 bg-[#FFFFFF] hover:bg-[#F8F8F6] text-[#0D0D0B] border border-[#0D0D0B] uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 fill-[#0D0D0B]" viewBox="0 0 16 16">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    <span className="text-[10px]">GitHub</span>
                  </button>

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleSignIn}
                    className="py-3.5 bg-[#FFFFFF] hover:bg-[#F8F8F6] text-[#0D0D0B] border border-[#0D0D0B] uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.49 14.98 0 12 0 7.35 0 3.37 2.67 1.44 6.56l3.86 3C6.23 6.94 8.89 5.04 12 5.04z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.77 2.92c2.2-2.03 3.68-5.03 3.68-8.64z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.44c-.24-.73-.38-1.5-.38-2.3 0-.8.14-1.58.38-2.3l-3.86-3C.53 8.42 0 10.15 0 12s.53 3.58 1.44 5.24l3.86-3z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.77-2.92c-1.05.7-2.39 1.13-4.19 1.13-3.11 0-5.77-1.9-6.7-4.52l-3.86 3C3.37 21.33 7.35 24 12 24z"
                      />
                    </svg>
                    <span className="text-[10px]">Google</span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/sign-up")}
                    className="text-[#555550] hover:text-[#0D0D0B] underline cursor-pointer"
                  >
                    Don't have an account? Sign Up
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 4: Configuration Form */}
          {step === "configure" && (
            <motion.div
              key="configure-step"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <div className="space-y-1">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#0D0D0B]">
                  Configure Your Stack
                </h3>
                <p className="font-mono text-xs text-[#555550] uppercase tracking-wider">
                  Select your architectural parameters for custom analysis.
                </p>
              </div>

              <form onSubmit={handleConfigSubmit} className="space-y-5 font-mono text-xs">
                {/* Backend Selection */}
                <div className="space-y-2">
                  <label className="text-[#555550] uppercase tracking-wider block font-bold">
                    1. Backend Runtime / Services
                  </label>
                  <select
                    value={config.backend}
                    onChange={(e) => setConfig({ ...config, backend: e.target.value })}
                    className="w-full bg-[#F8F8F6] border border-[#0D0D0B] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold"
                  >
                    <option value="Node.js">Node.js (Express / NestJS)</option>
                    <option value="Go">Go (Gin / Fiber microservices)</option>
                    <option value="Python">Python (Django / FastAPI)</option>
                    <option value="Ruby on Rails">Ruby on Rails</option>
                    <option value="Java / Spring">Java / Spring Boot</option>
                  </select>
                </div>

                {/* Database Selection */}
                <div className="space-y-2">
                  <label className="text-[#555550] uppercase tracking-wider block font-bold">
                    2. Primary Database Engine
                  </label>
                  <select
                    value={config.database}
                    onChange={(e) => setConfig({ ...config, database: e.target.value })}
                    className="w-full bg-[#F8F8F6] border border-[#0D0D0B] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold"
                  >
                    <option value="PostgreSQL">PostgreSQL (Single Instance)</option>
                    <option value="MySQL">MySQL / InnoDB Cluster</option>
                    <option value="MongoDB">MongoDB Atlas Sharded</option>
                    <option value="DynamoDB">Amazon DynamoDB</option>
                  </select>
                </div>

                {/* Cloud Provider */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[#555550] uppercase tracking-wider block font-bold">
                      3. Cloud Platform
                    </label>
                    <select
                      value={config.cloud}
                      onChange={(e) => setConfig({ ...config, cloud: e.target.value })}
                      className="w-full bg-[#F8F8F6] border border-[#0D0D0B] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold"
                    >
                      <option value="AWS">AWS (ECS / EKS)</option>
                      <option value="GCP">GCP (Cloud Run / GKE)</option>
                      <option value="Azure">Azure App Services</option>
                      <option value="Bare Metal / Hetzner">Bare Metal / Hetzner</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[#555550] uppercase tracking-wider block font-bold">
                      4. Scale Tier
                    </label>
                    <select
                      value={config.users}
                      onChange={(e) => setConfig({ ...config, users: e.target.value })}
                      className="w-full bg-[#F8F8F6] border border-[#0D0D0B] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold"
                    >
                      <option value="10k MAU">10,000 Active Users</option>
                      <option value="100k MAU">100,000 Active Users</option>
                      <option value="1M MAU">1,000,000 Active Users</option>
                      <option value="10M+ MAU">10,000,000+ Active Users</option>
                    </select>
                  </div>
                </div>

                {/* Primary Bottleneck */}
                <div className="space-y-2">
                  <label className="text-[#555550] uppercase tracking-wider block font-bold">
                    5. Primary Operational Challenge
                  </label>
                  <select
                    value={config.challenge}
                    onChange={(e) => setConfig({ ...config, challenge: e.target.value })}
                    className="w-full bg-[#F8F8F6] border border-[#0D0D0B] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold"
                  >
                    <option value="High latency during peak traffic">High latency during peak traffic (P99 &gt; 2.5s)</option>
                    <option value="Database query locks & memory exhaustion">Database query locks &amp; CPU spikes</option>
                    <option value="Deployments breaking down independent services">Deployments breaking downstream services</option>
                    <option value="Rapidly scaling cloud bill without clear optimization">Cloud infrastructure cost inefficiency</option>
                  </select>
                </div>

                {/* Submit Action */}
                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3 bg-[#F8F8F6] text-[#555550] hover:text-[#0D0D0B] border border-[#E2E2DF] uppercase tracking-wider cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#FCDD2D] hover:bg-[#ebd028] text-[#0D0D0B] border border-[#0D0D0B] uppercase tracking-wider flex items-center gap-2 cursor-pointer font-bold"
                  >
                    <span>Generate Evolution Report</span>
                    <span className="text-[#0D0D0B]">→</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
export default AnalyzerModal;
