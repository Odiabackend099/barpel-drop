"use client";

import { useState } from "react";
import { Chrome, ArrowRight, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { BarpelLogo } from "@/components/brand/BarpelLogo";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: "", color: "bg-[#D0EDE8]", width: "0%" };
  if (password.length < 6) return { label: "Too short", color: "bg-red-400", width: "25%" };
  if (password.length < 8) return { label: "Weak", color: "bg-amber-400", width: "50%" };
  if (password.length < 12) return { label: "Good", color: "bg-teal", width: "75%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  async function handleGoogleSignup() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || !confirmPassword) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    // Use server-side admin signup — no email sending, no rate limits
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const result = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(result.error ?? "Something went wrong.");
      return;
    }

    // User created and confirmed — sign in immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // Middleware handles redirect to /onboarding or /dashboard
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F0F9F8]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex justify-center">
            <BarpelLogo size={64} />
          </div>
          <h1 className="font-display text-2xl font-bold text-navy mb-2">
            Create your account
          </h1>
          <p className="text-[#4A7A6D] text-sm">
            Start automating your store&apos;s customer support
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#D0EDE8] p-6 shadow-sm">
          <div className="space-y-5">
              {/* Google OAuth */}
              <button
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#F0F9F8] border border-[#D0EDE8] rounded-xl text-sm font-medium text-navy hover:bg-[#E8F7F5] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Chrome className="w-5 h-5" />
                )}
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D0EDE8]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-[#8AADA6]">or</span>
                </div>
              </div>

              {/* Signup form */}
              <form onSubmit={handleSignUp} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-white border border-[#D0EDE8] rounded-xl text-sm text-navy placeholder:text-[#8AADA6] focus:outline-none focus:border-teal transition-colors"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min. 8 characters)"
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-11 bg-white border border-[#D0EDE8] rounded-xl text-sm text-navy placeholder:text-[#8AADA6] focus:outline-none focus:border-teal transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8AADA6] hover:text-teal transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-[#F0F9F8] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    {strength.label && (
                      <p className="text-xs text-[#8AADA6]">
                        Strength:{" "}
                        <span className={
                          strength.label === "Strong" ? "text-emerald-500" :
                          strength.label === "Good" ? "text-teal" :
                          strength.label === "Weak" ? "text-amber-500" : "text-red-400"
                        }>
                          {strength.label}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-11 bg-white border border-[#D0EDE8] rounded-xl text-sm text-navy placeholder:text-[#8AADA6] focus:outline-none focus:border-teal transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {confirmPassword.length > 0 && (
                      <span className={passwordsMatch ? "text-emerald-500" : "text-red-400"}>
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-[#8AADA6] hover:text-teal transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password || !confirmPassword}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #00A99D, #7DD9C0)",
                    boxShadow: "0 4px 20px rgba(0,169,157,0.3)",
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Error */}
              {error && (
                <div className="text-sm text-center text-danger space-y-1">
                  <p>{error}</p>
                  {error.includes("already exists") && (
                    <Link href="/login" className="text-teal hover:underline block">
                      Sign in instead →
                    </Link>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm text-[#4A7A6D] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-teal font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-[#8AADA6] mt-3">
          By creating an account, you agree to our{" "}
          <a href="/terms" className="hover:underline">Terms of Service</a>{" "}
          and{" "}
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
