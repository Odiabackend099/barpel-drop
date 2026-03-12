"use client";

import { useState } from "react";
import { Chrome, Mail, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { BarpelLogo } from "@/components/brand/BarpelLogo";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogleLogin() {
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

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    if (showMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setMagicLinkSent(true);
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email before signing in. Check your inbox.");
      } else if (error.message.toLowerCase().includes("invalid login credentials")) {
        setError("Incorrect email or password.");
      } else {
        setError(error.message);
      }
    } else {
      // Middleware handles onboarding redirect automatically
      router.push("/dashboard");
    }
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
            Welcome back
          </h1>
          <p className="text-[#4A7A6D] text-sm">
            Sign in to your Barpel Drop AI account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#D0EDE8] p-6 shadow-sm">
          {magicLinkSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[#C8F0E8] flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-teal" />
              </div>
              <h2 className="font-display text-lg font-bold text-navy mb-2">
                Check your email
              </h2>
              <p className="text-sm text-[#4A7A6D]">
                We sent a magic link to{" "}
                <strong className="text-navy">{email}</strong>
              </p>
              <button
                onClick={() => { setMagicLinkSent(false); setShowMagicLink(false); }}
                className="mt-4 text-sm text-teal hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Google OAuth */}
              <button
                onClick={handleGoogleLogin}
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

              {/* Email + password / magic link form */}
              <form onSubmit={handleEmailLogin} className="space-y-3">
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

                {!showMagicLink && (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      autoComplete="current-password"
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
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim() || (!showMagicLink && !password)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #00A99D, #7DD9C0)",
                    boxShadow: "0 4px 20px rgba(0,169,157,0.3)",
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : showMagicLink ? (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Magic Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Secondary actions */}
              <div className="flex items-center justify-between text-xs text-[#4A7A6D]">
                <button
                  type="button"
                  onClick={() => { setShowMagicLink(!showMagicLink); setError(null); }}
                  className="hover:text-teal transition-colors"
                >
                  {showMagicLink ? "Use password instead" : "Send magic link instead"}
                </button>
                {!showMagicLink && (
                  <Link href="/forgot-password" className="hover:text-teal transition-colors">
                    Forgot password?
                  </Link>
                )}
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-center text-danger">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-[#4A7A6D] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-teal font-medium hover:underline">
            Sign up free
          </Link>
        </p>

        <p className="text-center text-xs text-[#8AADA6] mt-3">
          By signing in, you agree to our{" "}
          <a href="/terms" className="hover:underline">Terms of Service</a>{" "}
          and{" "}
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
