"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import type { UserResponse } from "@/lib/contracts";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await api.post<UserResponse>(
          "/auth/register",
          { email: email.trim(), password },
          false,
        );
        router.push("/login?registered=1");
      } else {
        await login(email.trim(), password);
        router.replace("/");
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.status === 401) setError("The email or password is incorrect.");
        else if (caught.status === 409) setError("An account with this email already exists.");
        else if (caught.status === 422) setError("Check your email and password, then try again.");
        else if (caught.status === 429) setError("Too many attempts. Wait a minute and try again.");
        else setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-decoration" aria-hidden="true">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-decoration-content">
          <span className="auth-kicker"><span className="status-dot" /> HEALTH & PERFORMANCE</span>
          <h2>Build habits.<br /><span>Measure progress.</span></h2>
          <p>Your training, nutrition, and recovery in one focused space.</p>
          <div className="auth-feature-list">
            <span><i>✓</i> Workout tracking</span>
            <span><i>✓</i> Nutrition insights</span>
            <span><i>✓</i> Progress over time</span>
          </div>
        </div>
        <div className="auth-decoration-footer">PSYCH / BUILT FOR CONSISTENCY</div>
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand">
          <span className="brand-mark"><Activity size={20} strokeWidth={2.6} /></span>
          <span>psych<span className="brand-dot">.</span></span>
        </div>
        <div className="auth-card">
          <a className="auth-brand" href="/" aria-label="Psych home">
            <span className="brand-mark"><Activity size={20} strokeWidth={2.6} /></span>
            <span>psych<span className="brand-dot">.</span></span>
          </a>
          <p className="auth-eyebrow">{isRegister ? "START YOUR JOURNEY" : "WELCOME BACK"}</p>
          <h1>{isRegister ? "Create your account" : "Sign in to Psych"}</h1>
          <p className="auth-description">
            {isRegister
              ? "Set up your account and start tracking your progress."
              : "Your next step starts with showing up."}
          </p>

          {!isRegister && typeof window !== "undefined" && window.location.search.includes("registered=1") && (
            <div className="auth-success" role="status">Account created. You can sign in now.</div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={17} />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
              />
            </div>

            <div className="auth-password-label">
              <label htmlFor="password">Password</label>
              {!isRegister && <span>Secure access</span>}
            </div>
            <div className="auth-input-wrap">
              <LockKeyhole size={17} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={isRegister ? 8 : 1}
                maxLength={128}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {isRegister && (
              <>
                <label htmlFor="confirm-password">Confirm password</label>
                <div className="auth-input-wrap">
                  <LockKeyhole size={17} />
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </div>
              </>
            )}

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
              {!isSubmitting && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to Psych?"}{" "}
            <Link href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="auth-legal">By continuing, you agree to use Psych responsibly and keep your account secure.</p>
        </div>
      </section>
    </main>
  );
}
