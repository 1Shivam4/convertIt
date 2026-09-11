"use client";

import { useSession } from "@/app/lib/auth-client";
import { PLAN_LIMITS, formatFileSize, type Plan } from "@/app/lib/plans";
import { Check, Zap, Star, User } from "lucide-react";

const plans: { key: Plan; icon: React.ReactNode; price: string; popular?: boolean; features: string[] }[] = [
  {
    key: "FREE",
    icon: <User className="w-5 h-5" />,
    price: "Free",
    features: [
      `${formatFileSize(PLAN_LIMITS.FREE.maxFileSizeBytes)} max file size`,
      `${PLAN_LIMITS.FREE.rateLimit} conversions/min`,
      "Unlimited PDF conversions",
      "Image & media conversions",
      `${PLAN_LIMITS.FREE.storageTTLHours}h file storage`,
      "Job history (30 days)",
    ],
  },
  {
    key: "STANDARD",
    icon: <Star className="w-5 h-5" />,
    price: "$9/mo",
    popular: true,
    features: [
      `${formatFileSize(PLAN_LIMITS.STANDARD.maxFileSizeBytes)} max file size`,
      `${PLAN_LIMITS.STANDARD.rateLimit} conversions/min`,
      "Unlimited PDF conversions",
      "Image & media conversions",
      `${PLAN_LIMITS.STANDARD.storageTTLHours / 24} days file storage`,
      "Unlimited job history",
      "API key access",
      `${PLAN_LIMITS.STANDARD.concurrentUploads} concurrent uploads`,
      "Priority queue processing",
    ],
  },
  {
    key: "PRO",
    icon: <Zap className="w-5 h-5" />,
    price: "$29/mo",
    features: [
      `${formatFileSize(PLAN_LIMITS.PRO.maxFileSizeBytes)} max file size`,
      `${PLAN_LIMITS.PRO.rateLimit} conversions/min`,
      "Unlimited PDF conversions",
      "Image & media conversions",
      `${PLAN_LIMITS.PRO.storageTTLHours / 24} days file storage`,
      "Unlimited job history",
      "API key access",
      `${PLAN_LIMITS.PRO.concurrentUploads} concurrent uploads`,
      "Highest queue priority",
      "Webhook callbacks (coming soon)",
    ],
  },
];

const planColors: Record<Plan, string> = {
  GUEST: "border-white/10",
  FREE: "border-white/10",
  STANDARD: "border-blue-500/50",
  PRO: "border-yellow-500/50",
};

const planBadge: Record<Plan, string> = {
  GUEST: "bg-white/10 text-slate-400",
  FREE: "bg-white/10 text-slate-400",
  STANDARD: "bg-blue-500/20 text-blue-400",
  PRO: "bg-yellow-500/20 text-yellow-400",
};

export default function BillingPage() {
  const { data: session } = useSession();
  const currentPlan = ((session?.user as any)?.plan ?? "FREE") as Plan;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Plans</h1>
        <p className="text-slate-400 mt-1">
          You are currently on the{" "}
          <span className={`font-semibold px-2 py-0.5 rounded text-xs uppercase ${planBadge[currentPlan]}`}>
            {currentPlan}
          </span>{" "}
          plan.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(({ key, icon, price, popular, features }) => {
          const isCurrent = key === currentPlan;
          return (
            <div
              key={key}
              className={`relative rounded-2xl border bg-[#131722]/60 p-6 flex flex-col gap-5 ${planColors[key]} ${
                popular ? "ring-1 ring-blue-500/30" : ""
              }`}
            >
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              {/* Plan header */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${planBadge[key]}`}>
                  {icon}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{key}</p>
                  <p className="text-slate-400 text-sm font-semibold">{price}</p>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-center text-sm text-slate-400 font-medium">
                  Current Plan
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-not-allowed opacity-60 ${
                    key === "PRO"
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  Upgrade — Coming Soon
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
        <span className="text-white font-medium">💳 Stripe billing coming soon.</span>{" "}
        Paid plans will be available shortly. Contact us if you need a plan upgraded manually for testing.
      </div>
    </div>
  );
}
