"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Lock, User, Eye, EyeOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { signUp, signIn, sendVerificationEmail } from "@/app/lib/auth-client";
import { toast } from "sonner";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  // Resend verification state
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendInputEmail, setResendInputEmail] = useState("");
  const [resendSuccessMessage, setResendSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const currentEmail = watch("email");

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    setRegisteredEmail(values.email);
    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: "/dashboard",
    });

    if (error) {
      setServerError(error.message ?? "Failed to create account");
    } else {
      setSuccess(true);
      setResendCooldown(60);
    }
  };

  const handleGoogle = async () => {
    await signIn.social({ provider: "google", callbackURL: "/dashboard" });
  };

  const handleResendVerification = async (targetEmail: string) => {
    const emailToSend = targetEmail.trim();
    if (!emailToSend || !emailToSend.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (resendCooldown > 0) {
      toast.info(`Please wait ${resendCooldown}s before requesting another email.`);
      return;
    }

    setIsResending(true);
    setResendSuccessMessage("");
    try {
      const { error } = await sendVerificationEmail({
        email: emailToSend,
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(error.message || "Failed to resend verification email.");
      } else {
        toast.success("Verification email sent! Please check your inbox.");
        setResendSuccessMessage(`Verification link sent to ${emailToSend}.`);
        setResendCooldown(60);
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Check your email</h2>
          <p className="text-sm text-slate-400 mt-1">
            We sent a verification link to <span className="text-white font-medium">{registeredEmail}</span>. Click it to activate your account.
          </p>
        </div>

        {/* Resend button in success view */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs space-y-2">
          <p className="text-slate-400">Didn&apos;t receive the email or it expired?</p>
          <button
            type="button"
            onClick={() => handleResendVerification(registeredEmail)}
            disabled={isResending || resendCooldown > 0}
            className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isResending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sending email...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : "Resend verification email"}
              </>
            )}
          </button>
        </div>

        <div className="pt-2">
          <Link
            href="/sign-in"
            className="inline-block text-sm text-slate-400 hover:text-white font-medium transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">Create an account</h1>
        <p className="text-sm text-slate-400 mt-1">
          Start converting files for free
        </p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm mb-5 cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-slate-500">or continue with email</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm space-y-2">
            <div>{serverError}</div>
            {(serverError.toLowerCase().includes("exist") ||
              serverError.toLowerCase().includes("already") ||
              serverError.toLowerCase().includes("registered")) && (
              <div className="pt-1 border-t border-red-500/20 text-xs text-slate-300 flex items-center justify-between">
                <span>Account unverified?</span>
                <button
                  type="button"
                  onClick={() => handleResendVerification(currentEmail)}
                  disabled={isResending || resendCooldown > 0}
                  className="text-red-400 hover:text-red-300 font-semibold underline disabled:opacity-50 cursor-pointer"
                >
                  {isResending ? "Sending..." : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend verification email"}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="John Doe"
              {...register("name")}
              className="w-full bg-[#0b0d11] border border-white/10 focus:border-red-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className="w-full bg-[#0b0d11] border border-white/10 focus:border-red-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              {...register("password")}
              className="w-full bg-[#0b0d11] border border-white/10 focus:border-red-500 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("confirmPassword")}
              className="w-full bg-[#0b0d11] border border-white/10 focus:border-red-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm shadow-lg shadow-red-600/20 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      {/* Resend Verification Section for existing unverified accounts */}
      <div className="mt-6 pt-5 border-t border-white/10 text-center">
        <button
          type="button"
          onClick={() => {
            setShowResendModal((prev) => !prev);
            if (!resendInputEmail && currentEmail) setResendInputEmail(currentEmail);
          }}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 font-medium cursor-pointer"
        >
          <Mail className="w-3.5 h-3.5 text-red-400" />
          Didn&apos;t receive verification email? <span className="text-red-400 hover:underline">Resend it</span>
        </button>

        {showResendModal && (
          <div className="mt-3 p-4 bg-[#0b0d11] border border-white/10 rounded-xl text-left space-y-3">
            <p className="text-xs text-slate-400">
              Enter your registered email to receive a fresh verification link:
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your-email@example.com"
                value={resendInputEmail}
                onChange={(e) => setResendInputEmail(e.target.value)}
                className="flex-1 bg-[#131722] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => handleResendVerification(resendInputEmail)}
                disabled={isResending || resendCooldown > 0}
                className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                {isResending && <Loader2 className="w-3 h-3 animate-spin" />}
                {resendCooldown > 0 ? `${resendCooldown}s` : "Send"}
              </button>
            </div>
            {resendSuccessMessage && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {resendSuccessMessage}
              </p>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-red-400 hover:text-red-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
