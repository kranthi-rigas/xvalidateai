import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "@/styles/colors";
import { useContextElement } from "@/context/Context";
import { fetchUserProfile } from "@/apiIntegration/auth";

// ── Plan config ────────────────────────────────────────────────────────────
const PLAN_META = {
  free: { label: "Free", icon: "fa-solid fa-rocket", color: COLORS.secondary },
  premium: {
    label: "Premium",
    icon: "fa-solid fa-star",
    color: COLORS.primary,
  },
  business: {
    label: "Business",
    icon: "fa-solid fa-building",
    color: COLORS.success,
  },
};

const PLAN_TOTALS = {
  free: { credits: 20, scans: 2 },
  premium: { credits: 100, scans: 10 },
  business: { credits: 300, scans: 30 },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatExpiry(ts) {
  if (!ts) return null;
  try {
    return new Date(ts * 1000).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function daysLeft(ts) {
  if (!ts) return null;
  const diff = ts * 1000 - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function extractPlanFromObject(obj) {
  if (!obj?.plan) return null;
  const p = obj.plan;
  return {
    plan: (p.plan_type ?? "free").toLowerCase(),
    expiresAt: p.expires_at ?? null,
    creditsTotal: p.credits ?? null,
    creditsLeft: p.credits_remaining ?? null,
    creditsUsed: p.credits_used ?? null,
    status: p.status ?? "ACTIVE",
    voucherCode: p.voucher_code ?? null,
    isSubscription: p.is_subscription_based ?? false,
  };
}

function getPlanFromStorage() {
  const keys = [
    "user_info",
    "user",
    "userProfile",
    "profile",
    "currentUser",
    "authUser",
    "userData",
  ];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const result = extractPlanFromObject(parsed);
      if (result) return result;
    } catch {
      /* skip */
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw[0] !== "{") continue;
      const parsed = JSON.parse(raw);
      const result = extractPlanFromObject(parsed);
      if (result) return result;
    } catch {
      /* skip */
    }
  }

  return null;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function SubscriptionTab() {
  const navigate = useNavigate();

  const { userPlan, user, userData, userProfile, profile, refreshUserPlan } =
    useContextElement();

  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Always fetches fresh data from API — used on mount and on credits-updated
  const fetchFromAPI = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token");
      const data = await fetchUserProfile(token);
      // Keep localStorage in sync
      const existing = JSON.parse(localStorage.getItem("user_info") || "{}");
      localStorage.setItem(
        "user_info",
        JSON.stringify({ ...existing, ...data }),
      );
      const result = extractPlanFromObject(data);
      setPlanInfo(
        result ?? {
          plan: "free",
          expiresAt: null,
          creditsTotal: 20,
          creditsLeft: null,
          creditsUsed: null,
          status: "ACTIVE",
        },
      );
      refreshUserPlan?.();
    } catch (err) {
      console.error("SubscriptionTab: failed to load plan", err);
      setError("Could not load subscription data. Please refresh.");
      setPlanInfo({
        plan: "free",
        expiresAt: null,
        creditsTotal: 20,
        creditsLeft: null,
        creditsUsed: null,
        status: "ACTIVE",
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Always go straight to API on mount — never use stale cache
  useEffect(() => {
    fetchFromAPI(true);
  }, []);

  // Re-fetch silently whenever a scan approval fires credits-updated
  useEffect(() => {
    const handleCreditsUpdated = () => fetchFromAPI(false);
    window.addEventListener("credits-updated", handleCreditsUpdated);
    return () =>
      window.removeEventListener("credits-updated", handleCreditsUpdated);
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────
  const {
    plan = "free",
    expiresAt = null,
    creditsTotal = null,
    creditsLeft = null,
    creditsUsed = null,
    status = "ACTIVE",
    voucherCode = null,
  } = planInfo ?? {};

  const meta = PLAN_META[plan] || PLAN_META.free;
  const totals = PLAN_TOTALS[plan] || PLAN_TOTALS.free;

  const expiry = formatExpiry(expiresAt);
  const remaining = daysLeft(expiresAt);
  const isExpired = status === "EXPIRED" || (remaining === 0 && !!expiresAt);
  const soonWarn = !isExpired && remaining !== null && remaining <= 30;
  const isBusiness = plan === "business";

  // Credit display — prefer API values, fall back to plan totals
  const totalCredits = creditsTotal ?? totals.credits;
  const leftCredits = creditsLeft ?? "—";
  const usedCredits = creditsUsed ?? "—";
  const usedScans = creditsUsed !== null ? Math.floor(creditsUsed / 10) : "—";
  const totalScans = totals.scans;

  // Credit usage percentage for progress bar
  const usagePct =
    creditsLeft !== null && totalCredits
      ? Math.round(((totalCredits - creditsLeft) / totalCredits) * 100)
      : null;

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-12 flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-muted-foreground" />
        <span className="ml-3 text-sm text-muted-foreground">
          Loading subscription...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <i className="fa-solid fa-circle-exclamation text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* ── Plan header ──────────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 border-b border-border bg-gradient-to-r from-blue-50/40 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${meta.color}18` }}
            >
              <i
                className={meta.icon}
                style={{ fontSize: 22, color: meta.color }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-lg font-semibold text-primary">
                  {meta.label} Plan
                </span>
                {isExpired ? (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                    Expired
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                    {status === "ACTIVE" ? "Active" : status}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {plan === "free"
                  ? "Free forever · No credit card needed"
                  : "Billed annually"}
              </p>
            </div>
          </div>

          {/* Right side — price for paid plans, upgrade button for free/premium */}
          <div className="flex items-center gap-6">
            {plan !== "free" && (
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  ${{ premium: "1,000", business: "3,000" }[plan] ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">per year</p>
              </div>
            )}

            {!isBusiness && plan !== "free" && (
              <div className="w-px h-10 bg-border flex-shrink-0" />
            )}

            {!isBusiness && (
              <button
                onClick={() =>
                  navigate("/dashboard/pricing", {
                    state: {
                      highlightPlan: plan === "premium" ? "business" : null,
                    },
                  })
                }
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 shadow-sm border"
                style={{
                  backgroundColor: COLORS.primary,
                  borderColor: COLORS.primary,
                  color: "#ffffff",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <i className="fa-solid fa-bolt text-xs" />
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          {
            label: "Credits left",
            value:
              creditsLeft !== null
                ? `${creditsLeft} / ${totalCredits}`
                : `${totalCredits}`,
            color:
              creditsLeft !== null && creditsLeft < totalCredits * 0.2
                ? "text-red-600"
                : "text-green-600",
          },
          {
            label: "Credits used",
            value: usedCredits !== null ? `${usedCredits}` : "—",
            color: "text-foreground",
          },
          {
            label: "Expires",
            value: plan === "free" ? "-" : (expiry ?? "—"),
            color: isExpired
              ? "text-destructive"
              : soonWarn
                ? "text-amber-600"
                : "text-foreground",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 sm:p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-base font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Credit usage progress bar ─────────────────────────────────────── */}
      {usagePct !== null && (
        <div className="px-6 sm:px-8 pt-5 pb-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Credit usage</p>
            <p className="text-xs font-medium text-foreground">
              {usagePct}% used
            </p>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${usagePct}%`,
                backgroundColor:
                  usagePct > 80
                    ? "#ef4444"
                    : usagePct > 50
                      ? "#f59e0b"
                      : COLORS.success,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Expiry warning banner ─────────────────────────────────────────── */}
      {plan !== "free" && (soonWarn || isExpired) && (
        <div
          className={`mx-6 mt-5 p-3.5 rounded-lg border flex items-start gap-3
          ${isExpired ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}
        >
          <i
            className={`fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0
            ${isExpired ? "text-red-500" : "text-amber-500"}`}
          />
          <p
            className={`text-sm flex-1 ${isExpired ? "text-red-800" : "text-amber-800"}`}
          >
            {isExpired
              ? "Your plan has expired. Renew now to restore access to your features."
              : `Your plan expires in ${remaining} day${remaining !== 1 ? "s" : ""}. Renew to avoid interruption.`}
          </p>
          <button
            onClick={() =>
              navigate("/dashboard/pricing/billing", {
                state: { plan: { id: plan } },
              })
            }
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border transition-colors hover:bg-muted"
            style={{
              borderColor: isExpired ? "#fca5a5" : "#fcd34d",
              color: isExpired ? "#b91c1c" : "#92400e",
            }}
          >
            Renew now
          </button>
        </div>
      )}

      {/* ── Plan details ─────────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Plan details
        </p>
        <div>
          {[
            {
              icon: "fa-regular fa-credit-card",
              label: "Plan type",
              val: meta.label,
            },
            {
              icon: "fa-regular fa-calendar",
              label: "Billing cycle",
              val: plan === "free" ? "-" : "Annually",
            },
            {
              icon: "fa-regular fa-clock",
              label: "Renewal date",
              val:
                plan === "free"
                  ? "N/A"
                  : expiry
                    ? `${expiry}${remaining !== null ? ` · ${remaining} day${remaining !== 1 ? "s" : ""} left` : ""}`
                    : "—",
            },
            {
              icon: "fa-regular fa-user",
              label: "Seats",
              val: plan === "business" ? "Multiple users" : "Single user",
            },
          ].map(({ icon, label, val }) => (
            <div
              key={label}
              className="flex items-center justify-between py-3 border-b border-border last:border-0 text-sm"
            >
              <span className="flex items-center gap-2.5 text-muted-foreground">
                <i className={`${icon} w-4 text-center`} />
                {label}
              </span>
              <span
                className={`font-medium font-mono text-xs sm:text-sm sm:font-sans ${
                  label === "Renewal date" && soonWarn
                    ? "text-amber-600"
                    : label === "Renewal date" && isExpired
                      ? "text-destructive"
                      : label === "Voucher code"
                        ? "text-purple-700 bg-purple-50 px-2 py-0.5 rounded"
                        : "text-foreground"
                }`}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
