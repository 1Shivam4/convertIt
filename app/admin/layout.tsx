"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Coins,
  Cpu,
  Layers,
  Activity,
  Megaphone,
  LogOut,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "Core",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "Identity & Access",
    items: [
      { label: "Users Directory", href: "/admin/users", icon: Users },
      { label: "Provision & Invite", href: "/admin/users/create", icon: UserPlus },
    ],
  },
  {
    title: "Monetization",
    items: [
      { label: "Token Distribution", href: "/admin/tokens", icon: Coins },
    ],
  },
  {
    title: "Operations & Health",
    items: [
      { label: "BullMQ Queues", href: "/admin/queues", icon: Layers },
      { label: "Conversion Logs", href: "/admin/jobs", icon: Activity },
      { label: "Engine Diagnostics", href: "/admin/system", icon: Cpu },
    ],
  },
  {
    title: "Broadcasts",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    // Verify session and fetch admin metrics
    fetch("/api/admin/metrics")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
        } else {
          setAdminUser({ name: "Administrator", email: "admin@convertit.test" });
        }
      })
      .catch(() => {
        router.push("/admin/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-rose-500 selection:text-white font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0">
        {/* Admin Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              ConvertIt <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold uppercase tracking-wider">Ops</span>
            </div>
            <div className="text-[11px] text-slate-400">Admin Control Center</div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-rose-400" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-rose-400" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User / Logout Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/60">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              Public App
            </span>
            <span className="text-[10px] text-slate-400">ConvertIt →</span>
          </Link>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-semibold text-slate-200 truncate">System Admin</div>
              <div className="text-[10px] text-slate-400 truncate">admin@convertit.test</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out of Admin"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
