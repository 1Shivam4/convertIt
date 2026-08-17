import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="p-4 border-t border-white/10 text-center md:text-left text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-600/20 border border-red-500/30 flex items-center justify-center p-1">
            <Image
              src="/icons/loop.svg"
              width={16}
              height={16}
              alt="ConvertIt"
            />
          </div>
          <span className="font-bold text-white text-sm">
            convert<span className="text-red-500">it</span>
          </span>
          <span className="ml-2 text-slate-500">
            &copy; {new Date().getFullYear()} ConvertIt Inc. All rights
            reserved.
          </span>
        </div>

        <div className="flex items-center gap-6 text-slate-400">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/api" className="hover:text-white transition-colors">
            API
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
