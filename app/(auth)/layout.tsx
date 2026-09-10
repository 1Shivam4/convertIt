import type { ReactNode } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0d11] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight group-hover:text-red-400 transition-colors">
          ConvertIt
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-[#131722] border border-white/10 rounded-2xl shadow-2xl p-8">
        {children}
      </div>

      <p className="mt-6 text-xs text-slate-600">
        © {new Date().getFullYear()} ConvertIt. All rights reserved.
      </p>
    </div>
  );
}
