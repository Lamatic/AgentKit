"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { login } from "@/actions/login";
import BrandLogo from "@/components/BrandLogo";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const username = watch("username") ?? "";
  const password = watch("password") ?? "";

  const hasError = searchParams.get("error") === "1";

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("username", values.username);
      formData.set("password", values.password);
      await login(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsLoading(false);
    }
  };

  const showInvalid = hasError && !error;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background font-body text-on-surface">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-primary-container/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[30%] w-[30%] rounded-full bg-secondary-container/30 blur-[100px]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 py-12">
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <BrandLogo className="h-10 w-10" />
            <h1 className="font-headline text-4xl font-semibold tracking-tight text-primary">
              Queryline
            </h1>
          </div>
          <p className="mx-auto max-w-xs text-sm font-medium text-on-surface-variant">
            Secure, read-only exploration of your Azure SQL database.
          </p>
        </div>

        <Card className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-8 shadow-soft sm:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {(error || hasError) && (
              <div className="flex items-start gap-3 rounded-lg border border-error/40 bg-error-container px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-on-error-container" />
                <p className="text-sm font-medium text-on-error-container">
                  {error || "Invalid username or password"}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-on-surface">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  {...register("username")}
                  aria-invalid={!!errors.username}
                  className={`w-full rounded-lg border bg-surface-container-lowest px-4 py-3 font-body text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${
                    errors.username ? "border-error" : "border-input"
                  }`}
                  placeholder="Enter username"
                  disabled={isLoading}
                />
                {(errors.username || showInvalid) && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <AlertCircle className="h-5 w-5 text-error" fill="currentColor" strokeWidth={0} />
                  </div>
                )}
              </div>
              {errors.username && (
                <p className="mt-1 text-sm font-medium text-error">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-on-surface">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  aria-invalid={!!errors.password}
                  className={`w-full rounded-lg border bg-surface-container-lowest px-4 py-3 pr-12 font-body text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${
                    errors.password ? "border-error" : "border-input"
                  }`}
                  placeholder="Enter password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant transition-colors hover:text-primary focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password ? (
                <p className="mt-2 text-sm font-medium text-error">{errors.password.message}</p>
              ) : (
                showInvalid && (
                  <p className="mt-2 text-sm font-medium text-error">
                    Invalid credentials provided.
                  </p>
                )
              )}
            </div>

            <Button
              type="submit"
              className="group h-12 w-full gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary hover:bg-primary/90"
              disabled={!username.trim() || !password.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 border-t border-outline-variant/40 pt-6 text-center">
            <p className="text-xs text-on-surface-variant">
              For demo access details, please check the README.md.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}