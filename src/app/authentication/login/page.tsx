"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccountLogo from "@/app/components/AccountLogo";
import { loginService } from "@/app/services/loginService";

import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="flex items-center justify-center min-h-screen  bg-gray-50 dark:bg-gray-900 px-5  sm-px-0">
      <div className="bg-[var(--color1)] shadow-xl rounded-xl p-8 w-full max-w-md text-white">
        <div className="flex flex-col items-center mb-6">
          <AccountLogo
            fallback="/app-logo.png"
            alt="Expense Tracker"
            className="mb-4 h-20 max-w-full object-contain"
          />
          <h2 className="text-2xl font-bold text-center">Login</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium ">Email</label>
            <input
              type="email"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium ">Password</label>
            <input
              type="password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--color2)] hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Login"}
          </button>

          <div className="font-bold text-center">
            Don't have an account?
            <Link href="/authentication/register">Register</Link>
          </div>
        </form>
        {message && (
          <p className="bg-red-500 mt-4 text-center text-md text-white p-2 rounded-lg">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
