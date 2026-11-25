"use client";
import { useId, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginService } from "@/app/services/loginService";

import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const formId = useId();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginInProgress = useRef(false);

  const { login } = useAuth();

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginInProgress.current) return;

    loginInProgress.current = true;
    setIsSubmitting(true);
    setMessage("");

    try {
      const { access_token: token, user } = await loginService({ email, password });

      document.cookie = `access_token=${token}; path=/; Secure; SameSite=Strict`;
      login(user);
      router.replace("/dashboard");
    } catch (error) {
      loginInProgress.current = false;
      setIsSubmitting(false);
      setMessage(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-[#edf3f1] px-4 py-8 dark:bg-[#071f1d] sm:px-6">
      <section
        aria-labelledby={`${formId}-title`}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-[#dbe7e3] bg-white shadow-[0_16px_48px_rgba(8,44,40,0.12)]"
      >
        <div className="relative isolate grid place-items-center overflow-hidden border-b-4 border-[#f7bd51] bg-linear-to-br from-[#082c28] to-[#056455] px-6 py-7 sm:py-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -bottom-36 -z-10 size-64 rounded-full border border-white/15 bg-white/5 ring-24 ring-white/5"
          />
          <img src="/app-logo.png" alt="Expense Tracker" className="h-14 max-w-full object-contain sm:h-16" />
        </div>

        <div className="px-6 py-7 sm:px-9 sm:py-8">
          <h1 id={`${formId}-title`} className="text-2xl font-bold tracking-tight text-[#082c28] sm:text-3xl">
            Sign in
          </h1>

          <form onSubmit={handleLogin} className="mt-6 space-y-4" aria-busy={isSubmitting}>
            <div>
              <label htmlFor={`${formId}-email`} className="mb-1.5 block text-sm font-semibold text-[#082c28]">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#056455]" aria-hidden="true" />
                <input
                  id={`${formId}-email`}
                  name="email"
                  type="email"
                  autoComplete="username"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pr-3.5 pl-10 text-base text-[#082c28] transition-colors focus:border-[#056455] focus:ring-2 focus:ring-[#056455]/20 focus:outline-none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-password`} className="mb-1.5 block text-sm font-semibold text-[#082c28]">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#056455]" aria-hidden="true" />
                <input
                  id={`${formId}-password`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pr-12 pl-10 text-base text-[#082c28] transition-colors focus:border-[#056455] focus:ring-2 focus:ring-[#056455]/20 focus:outline-none"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0.5 grid w-11 cursor-pointer place-items-center rounded-lg text-[#056455] hover:bg-teal-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#056455]"
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {message && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#f7bd51] text-[#12332d] enabled:hover:bg-[#edaf3c] flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
              {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
            </button>
          </form>

          <p className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            Don’t have an account?{" "}
            <Link href="/authentication/register" className="rounded font-semibold text-[#056455] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#056455]">
              Register
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
