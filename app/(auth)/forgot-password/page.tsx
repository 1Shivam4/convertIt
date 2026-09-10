"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { authClient } from "@/app/lib/auth-client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    const { error } = await (authClient as any).forgetPassword({
      email: values.email,
      redirectTo: "/reset-password",
    });
    if (error) {
      setServerError(
        error.message ?? "Something went wrong. Please try again.",
      );
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Check your email</h2>
        <p className="text-sm text-slate-400">
          We sent a password reset link to your email. It expires in 1 hour.
        </p>
        <Link
          href="/sign-in"
          className="inline-block text-sm text-red-400 hover:text-red-300 font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">Forgot password?</h1>
        <p className="text-sm text-slate-400 mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 text-sm">
            {serverError}
          </div>
        )}
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Remember your password?{" "}
        <Link
          href="/sign-in"
          className="text-red-400 hover:text-red-300 font-medium"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
