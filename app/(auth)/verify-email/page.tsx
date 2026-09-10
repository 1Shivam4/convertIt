"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { authClient } from "@/app/lib/auth-client";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }

    authClient.verifyEmail({ query: { token } }).then(({ error }) => {
      if (error) {
        setStatus("error");
        setMessage(
          error.message ?? "Verification failed. The link may have expired.",
        );
      } else {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2500);
      }
    });
  }, [searchParams, router]);

  return (
    <div className="text-center space-y-4 py-4">
      {status === "loading" && (
        <>
          <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">
            Verifying your email…
          </h2>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Email verified!</h2>
          <p className="text-sm text-slate-400">
            Redirecting you to the dashboard…
          </p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Verification failed</h2>
          <p className="text-sm text-slate-400">{message}</p>
          <Link
            href="/sign-in"
            className="inline-block text-sm text-red-400 hover:text-red-300 font-medium"
          >
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}
