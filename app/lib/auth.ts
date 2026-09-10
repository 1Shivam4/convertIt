import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { dash } from "@better-auth/infra";
import { prisma } from "@/app/lib/prisma";
import { sendEmail } from "@/app/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: [
    "https://threefold-expand-unclasp.ngrok-free.dev",
    "http://localhost:3000",
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // ── Email + Password ───────────────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your ConvertIt password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2>Reset your password</h2>
            <p>Click the button below to reset your ConvertIt password. This link expires in 1 hour.</p>
            <a href="${url}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Reset Password
            </a>
            <p style="color:#666;font-size:13px;margin-top:16px">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    },
  },

  // ── Email Verification ─────────────────────────────────────────────────────
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your ConvertIt email",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2>Welcome to ConvertIt!</h2>
            <p>Click the button below to verify your email address and activate your account.</p>
            <a href="${url}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Verify Email
            </a>
          </div>
        `,
      });
    },
  },

  // ── Google OAuth ───────────────────────────────────────────────────────────
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  plugins: process.env.BETTER_AUTH_API_KEY
    ? [
        dash({
          apiKey: process.env.BETTER_AUTH_API_KEY,
        }),
      ]
    : [],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
