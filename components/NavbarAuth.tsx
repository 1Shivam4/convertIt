"use client";

import Link from "next/link";
import { User, LayoutDashboard, LogOut } from "lucide-react";
import { useSession, signOut } from "@/app/lib/auth-client";

export default function NavbarAuth() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="w-16 h-8 bg-white/5 rounded-md animate-pulse shrink-0" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg transition-all"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Dashboard
        </Link>

        <button
          type="button"
          onClick={() => signOut()}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/sign-in"
        className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="text-xs font-medium bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-md transition-all shadow-sm hover:shadow-red-600/20"
      >
        Sign up
      </Link>
    </div>
  );
}
