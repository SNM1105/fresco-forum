"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginContent() {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const withGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${params.get("next") || "/feed"}` },
    });
  };

  const resendVerification = async () => {
    if (!email) {
      setError("Enter your email before requesting a new verification email.");
      return;
    }

    setError(null);
    setStatus(null);
    setLoading(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setStatus("Verification email sent. Check your inbox and spam folder.");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username }, // read by the handle_new_user trigger, see supabase/functions.sql
        },
      });
      setLoading(false);
      if (error) return setError(error.message);
      setStatus("Check your email to confirm your account.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push(params.get("next") || "/feed");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-plaster">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <span className="font-display font-semibold text-2xl text-ink">
            Fresco <span className="text-sienna">Forum</span>
          </span>
        </div>

        <div className="rounded-md p-6 bg-card border border-line">
          <div className="flex mb-5 rounded-full p-1 bg-plaster-deep">
            {["signup", "login"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm rounded-full capitalize font-medium ${
                  mode === m ? "bg-card text-ink" : "text-ink-faint"
                }`}
              >
                {m === "signup" ? "Sign up" : "Log in"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={withGoogle}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium mb-4 border border-line text-ink"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-ink-faint">or use your school email</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@concordia.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2.5 rounded-md text-sm outline-none border border-line bg-transparent"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2.5 rounded-md text-sm outline-none border border-line bg-transparent"
            />
            {mode === "signup" && (
              <input
                placeholder="Username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-3 py-2.5 rounded-md text-sm outline-none border border-line bg-transparent"
              />
            )}

            {error && <p className="text-xs text-sienna-deep">{error}</p>}
            {status && <p className="text-xs text-lapis">{status}</p>}

            {mode === "signup" && (
              <button
                type="button"
                onClick={resendVerification}
                disabled={loading || !email}
                className="text-xs font-medium text-lapis underline underline-offset-2 disabled:opacity-50"
              >
                Resend verification email
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-2.5 rounded-md text-sm font-semibold text-white bg-sienna disabled:opacity-60"
            >
              {loading ? "Working…" : mode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>

          <p className="text-[11px] leading-relaxed mt-4 text-ink-faint">
            A recognized school email verifies you automatically — check{" "}
            <code className="text-lapis">supabase/schema.sql</code> for the current domain list.
            Anyone can sign up; verification just tells other students where you're from.
          </p>
        </div>
      </div>
    </div>
  );
}
