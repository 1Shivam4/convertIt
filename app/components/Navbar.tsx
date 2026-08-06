import Link from "next/link";
import Image from "next/image";
import NavItems from "./NavItems";
import { Moon } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#0b0d11]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
            <Image
              src="/icons/loop.svg"
              width={24}
              height={24}
              alt="ConvertIt logo"
              className="w-full h-full filter invert brightness-200 sepia hue-rotate-[320deg] saturate-500"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center">
            convert<span className="text-red-500 font-extrabold">it</span>
          </span>
        </Link>

        {/* Navigation Items (Client Component for interactivity) */}
        <NavItems />

        {/* Action Buttons & Theme Switcher */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md transition-all shadow-sm hover:shadow-red-600/20"
          >
            Sign up
          </Link>

          <button
            type="button"
            aria-label="Toggle theme"
            className="p-2 text-slate-400 hover:text-white rounded-md transition-colors hover:bg-white/5"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
