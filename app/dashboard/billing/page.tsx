"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/app/lib/auth-client";
import { PLAN_LIMITS, formatFileSize, type Plan } from "@/app/lib/plans";
import { Check, Zap, Star, User, Loader2, ShieldAlert, CreditCard } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";

const plans: {
  key: Plan;
  icon: React.ReactNode;
  price: string;
  popular?: boolean;
  features: string[];
}[] = [
  {
    key: "FREE",
    icon: <User className="w-5 h-5" />,
    price: "Free",
    features: [
      `${formatFileSize(PLAN_LIMITS.FREE.maxFileSizeBytes)} max file size`,
      "Unlimited PDF conversions",
      "25 Image conversions / day",
      "5 Audio & Video conversions / day",
      `${PLAN_LIMITS.FREE.rateLimit} req/min rate limit`,
      `${PLAN_LIMITS.FREE.storageTTLHours}h cloud storage`,
      "Job history (30 days)",
    ],
  },
  {
    key: "STANDARD",
    icon: <Star className="w-5 h-5" />,
    price: PLAN_LIMITS.STANDARD.priceDisplay,
    popular: true,
    features: [
      `${formatFileSize(PLAN_LIMITS.STANDARD.maxFileSizeBytes)} max file size`,
      "Unlimited PDF conversions",
      "500 Image conversions / day",
      "100 Audio & Video conversions / day",
      `${PLAN_LIMITS.STANDARD.rateLimit} req/min rate limit`,
      `${PLAN_LIMITS.STANDARD.storageTTLHours / 24} days cloud storage`,
      "Unlimited job history",
      "API key access (unlimited keys)",
      `${PLAN_LIMITS.STANDARD.concurrentUploads} concurrent uploads`,
      "High queue priority",
    ],
  },
  {
    key: "PRO",
    icon: <Zap className="w-5 h-5" />,
    price: PLAN_LIMITS.PRO.priceDisplay,
    features: [
      `${formatFileSize(PLAN_LIMITS.PRO.maxFileSizeBytes)} max file size`,
      "Unlimited PDF conversions",
      "Unlimited Image conversions",
      "Unlimited Audio & Video conversions",
      `${PLAN_LIMITS.PRO.rateLimit} req/min rate limit`,
      `${PLAN_LIMITS.PRO.storageTTLHours / 24} days cloud storage`,
      "Unlimited job history",
      "API key access (unlimited keys)",
      `${PLAN_LIMITS.PRO.concurrentUploads} concurrent uploads`,
      "Highest instant queue priority",
    ],
  },
];

const PLAN_RANK: Record<Plan, number> = {
  GUEST: 0,
  FREE: 1,
  STANDARD: 2,
  PRO: 3,
};

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
  const [livePlan, setLivePlan] = useState<Plan | null>(null);
  const currentPlan = (livePlan || (session?.user as any)?.plan || "FREE") as Plan;
  const currentRank = PLAN_RANK[currentPlan] ?? 1;
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.plan) {
          setLivePlan(data.user.plan as Plan);
        }
      })
      .catch(() => {});
  }, []);

  const handleUpgrade = async (targetPlan: Plan) => {
    if (PLAN_RANK[targetPlan] <= currentRank) return;
    setLoadingPlan(targetPlan);

    try {
      const res = await fetch("/api/billing/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize checkout.");
      }

      // Check if Razorpay JS SDK is loaded
      if (typeof window === "undefined" || !(window as any).Razorpay) {
        throw new Error("Razorpay SDK is still loading. Please try again in a few seconds.");
      }

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "ConvertIt",
        description: data.description,
        handler: function (response: any) {
          toast.success("Payment authorized! Your plan is being upgraded.");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
        prefill: {
          name: data.user?.name || "",
          email: data.user?.email || "",
        },
        theme: {
          color: "#2563eb",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error(response.error?.description || "Payment failed.");
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will retain access until the end of the billing period.")) {
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch("/api/billing/razorpay/cancel-subscription", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel subscription.");

      toast.success("Subscription cancellation scheduled for the end of the billing cycle.");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setIsScriptLoaded(true)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Plans</h1>
          <p className="text-slate-400 mt-1">
            You are currently on the{" "}
            <span className={`font-semibold px-2 py-0.5 rounded text-xs uppercase ${planBadge[currentPlan]}`}>
              {currentPlan}
            </span>{" "}
            tier.
          </p>
        </div>

        {currentPlan !== "FREE" && currentPlan !== "GUEST" && (
          <button
            onClick={handleCancelSubscription}
            disabled={cancelling}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all self-start md:self-auto"
          >
            {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            Cancel Auto-Renewal
          </button>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(({ key, icon, price, popular, features }) => {
          const isCurrent = key === currentPlan;
          const cardRank = PLAN_RANK[key] ?? 1;
          const isLowerPlan = cardRank < currentRank;
          const isHigherPlan = cardRank > currentRank;
          const isLoading = loadingPlan === key;

          return (
            <div
              key={key}
              className={`relative rounded-2xl border bg-[#131722]/60 p-6 flex flex-col gap-5 transition-all ${
                isLowerPlan
                  ? "opacity-50 border-white/5 bg-slate-950/40"
                  : isCurrent
                  ? `${planColors[key]} ring-2 ring-yellow-500/40 bg-[#131722]/90 shadow-xl`
                  : popular
                  ? `${planColors[key]} ring-1 ring-blue-500/30`
                  : planColors[key]
              }`}
            >
              {popular && isHigherPlan && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-yellow-500 text-slate-950 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-md">
                  Active Tier
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
                {features.map((f, idx) => (
                  <li key={idx} className={`flex items-start gap-2 text-sm ${isLowerPlan ? "text-slate-500" : "text-slate-300"}`}>
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isLowerPlan ? "text-slate-600" : "text-green-400"}`} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA Button Actions */}
              {isCurrent ? (
                <div className="w-full py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center text-sm text-yellow-400 font-semibold">
                  ✓ Current Plan
                </div>
              ) : isLowerPlan ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-xl text-xs font-medium bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed"
                >
                  Included in your plan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpgrade(key)}
                  disabled={isLoading}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                    key === "PRO"
                      ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 shadow-lg shadow-yellow-500/20"
                      : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Opening Checkout...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Upgrade to {key}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400 flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <span className="text-white font-medium">Secure Payments powered by Razorpay:</span>{" "}
          Supports UPI Autopay (GPay, PhonePe, Paytm), RuPay/Visa/Mastercard, Netbanking, and International Cards.
        </div>
      </div>
    </div>
  );
}
