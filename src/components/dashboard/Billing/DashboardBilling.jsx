import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  verifyVoucher,
  redeemVoucher,
  createPaypalSubscription,
  createStripeCheckout,
} from "@/apiIntegration/vouchers";
import useToast from "../../../hooks/useToast";
import { SHOW_CREDITS } from "@/config/features";
import { useContextElement } from "@/context/Context";
import { COLORS } from "@/styles/colors";
import AwsButton from "@/components/common/AwsButton";
import SearchableSelect from "@/components/common/SearchableSelect";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  getAddressFormat,
} from "@/data/addressFormats";
import { tierLabel, tierDetail } from "@/data/planPricing";

/* The billing address follows whichever country is picked: the region and
   postal labels, whether the region is a list or free text, and how the postal
   code is checked all come from the country's format. */
const EMPTY_FORM = {
  country: DEFAULT_COUNTRY,
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  voucherCode: "",
};

const fieldStyle = (hasError) => ({
  border: hasError ? "1px solid #dc3545" : "1px solid #dddddd",
  borderRadius: "8px",
  padding: "11px 14px",
  fontSize: "14px",
  width: "100%",
  height: "44px",
  background: "#fff",
});

/** $7,500.00 rather than $7500.00 — a four-figure price needs the separator. */
const formatUsd = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) return `$${value}`;
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

/**
 * The address as the subscription endpoints want it. line2 is dropped when
 * empty, and postal_code with it for the countries that have none, so the
 * payload never carries blank strings.
 */
const toBillingAddressPayload = (form) => {
  const line2 = form.addressLine2.trim();
  const postalCode = form.postalCode.trim();

  return {
    country: form.country,
    line1: form.addressLine1.trim(),
    ...(line2 ? { line2 } : {}),
    city: form.city.trim(),
    ...(form.region.trim() ? { state: form.region.trim() } : {}),
    ...(postalCode ? { postal_code: postalCode } : {}),
  };
};

const labelClass = "text-14 fw-500 mb-5";
const errorClass = "text-red-1 text-13 mt-5";

export default function DashboardBilling() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan || null;
  const show = useToast();
  const { refreshUserPlan, setUserPlan, setUserCredits } = useContextElement();
  const [isPaying, setIsPaying] = useState(false);
  const [isStripePaying, setIsStripePaying] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherData, setVoucherData] = useState(null); // Store verified voucher data

  //PayPal Helper
  const handlePaypalCheckout = async () => {
    if (!plan) return;

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsPaying(true);

    try {
      // plan.id is the component (platform / caio / caio_teacher) and is what
      // sets the price; plan.tier is the enrollment band. Both are needed to
      // reach the right PayPal plan. planId is the entitlement and is sent for
      // the legacy path only. plan.name is a display label and resolves to
      // nothing on the backend.
      const response = await createPaypalSubscription(
        (plan.planId || "").toUpperCase(),
        plan.tier || null,
        plan.id || null,
        toBillingAddressPayload(formData),
      );

      if (response && response.approval_url) {
        window.location.href = response.approval_url;
      } else {
        throw new Error("Failed to create PayPal subscription");
      }
    } catch (error) {
      show(error.message || "Subscription failed", { planType: "error" });
    } finally {
      setIsPaying(false);
    }
  };

  // Stripe Checkout (card / Link)
  const handleStripeCheckout = async () => {
    if (!plan) return;
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIsStripePaying(true);
    try {
      const response = await createStripeCheckout(
        (plan.planId || "").toUpperCase(),
        plan.tier || null,
        plan.id || null,
        toBillingAddressPayload(formData),
      );
      if (response && response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error("Failed to start Stripe checkout");
      }
    } catch (error) {
      show(error.message || "Checkout failed", { planType: "error" });
    } finally {
      setIsStripePaying(false);
    }
  };

  // Reset form state when navigating to this page (when location changes)
  useEffect(() => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setVoucherApplied(false);
    setVoucherData(null);
    setIsSubmitting(false);
    setIsApplyingVoucher(false);
  }, [location.key]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Region and postal code mean different things per country, so switching
  // country clears them rather than carrying a Kansas into France.
  const handleCountryChange = (e) => {
    const country = e.target.value;
    setFormData((prev) => ({ ...prev, country, region: "", postalCode: "" }));
    setErrors((prev) => ({ ...prev, region: "", postalCode: "" }));
  };

  const addressFormat = getAddressFormat(formData.country);
  // Subdivisions read better with their abbreviation, and it gives the search
  // box something short to match on ("CA" → California).
  const regionOptions =
    addressFormat.subdivisions?.map(([code, name]) => [
      code,
      `${code} — ${name}`,
    ]) || null;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Street address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = `${addressFormat.cityLabel} is required`;
    }
    if (addressFormat.regionRequired && !formData.region.trim()) {
      newErrors.region = `${addressFormat.regionLabel} is required`;
    }

    const postalCode = formData.postalCode.trim();
    if (addressFormat.hasPostalCode) {
      if (!postalCode) {
        newErrors.postalCode = `${addressFormat.postalLabel} is required`;
      } else if (
        addressFormat.postalPattern &&
        !addressFormat.postalPattern.test(postalCode)
      ) {
        newErrors.postalCode = addressFormat.postalError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verify voucher (just check if valid, don't redeem yet)
  const handleApplyVoucher = async () => {
    if (!formData.voucherCode.trim()) {
      setErrors((prev) => ({
        ...prev,
        voucherCode: "Please enter a voucher code",
      }));
      return;
    }

    console.log("Applying voucher:", formData.voucherCode.trim());
    setIsApplyingVoucher(true);
    setErrors((prev) => ({
      ...prev,
      voucherCode: "",
    }));

    try {
      // Call API to verify voucher (not redeem)
      const response = await verifyVoucher(formData.voucherCode.trim());
      console.log("Voucher verification response:", response);

      // Handle successful voucher verification
      if (response && response.valid) {
        // Check if voucher plan type matches the selected plan
        const selectedPlanType = plan?.name?.toUpperCase();
        const voucherPlanType = response.plan_type?.toUpperCase();

        if (
          selectedPlanType &&
          voucherPlanType &&
          voucherPlanType !== selectedPlanType
        ) {
          setErrors((prev) => ({
            ...prev,
            voucherCode: `This voucher can not be applied for this plan.`,
          }));
          setVoucherApplied(false);
          setVoucherData(null);
          return;
        }

        setVoucherApplied(true);
        setVoucherData(response);
        console.log("Voucher applied successfully");
      } else {
        console.log("Voucher verification failed - invalid response");
        throw new Error("Voucher verification failed");
      }
    } catch (error) {
      console.error("Voucher verification error:", error);
      // Handle voucher verification error
      setErrors((prev) => ({
        ...prev,
        voucherCode: error.message || "Invalid voucher code",
      }));
      setVoucherApplied(false);
      setVoucherData(null);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setFormData((prev) => ({
      ...prev,
      voucherCode: "",
    }));
    setVoucherApplied(false);
    setVoucherData(null);
  };

  // Change calculateTotal() to this:
  const calculateTotal = () => {
    if (!plan) return 0;

    if (voucherApplied && voucherData) {
      // voucherData.price null/0 means free — show $0.00 not N/A
      const vPrice = voucherData.price;
      return vPrice == null || vPrice === 0 ? 0 : vPrice;
    }

    return plan.price;
  };

  useEffect(() => {
    const fetchPlan = async () => {
      await refreshUserPlan();
    };

    fetchPlan();
  }, [refreshUserPlan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission started", { voucherApplied, plan, formData });

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setIsSubmitting(true);

    try {
      // If voucher is applied, redeem it now
      if (voucherApplied && formData.voucherCode.trim()) {
        console.log(
          "Attempting to redeem voucher:",
          formData.voucherCode.trim(),
        );

        const redeemResponse = await redeemVoucher(
          formData.voucherCode.trim(),
          plan?.id || null,
        );

        console.log("Voucher redeemed successfully:", redeemResponse);

        show(
          `Subscription activated successfully! You now have ${redeemResponse.subscription.credits} credits.`,
          { type: "success" },
        );

        // ── Instant context update from redeem response ──────────────────────────
        // Extract plan type and credits directly from what the server just returned
        const newPlanType = (
          redeemResponse?.subscription?.plan_type ??
          redeemResponse?.plan?.plan_type ??
          voucherData?.plan_type ??
          plan?.name ??
          "business"
        ).toLowerCase();

        const newCredits =
          redeemResponse?.subscription?.credits_remaining ??
          redeemResponse?.subscription?.credits ??
          voucherData?.credits ??
          0;

        // 1. Update React context immediately — unblocks Audit Trail right away
        setUserPlan(newPlanType);
        setUserCredits(newCredits);

        // 2. Patch localStorage immediately so any component reading it directly
        //    (sidebar, guards, etc.) also sees the new plan without a page reload
        try {
          const stored = localStorage.getItem("user_info");
          const parsed = stored ? JSON.parse(stored) : {};
          localStorage.setItem(
            "user_info",
            JSON.stringify({
              ...parsed,
              plan: {
                ...(parsed?.plan || {}),
                plan_type: newPlanType,
                credits_remaining: newCredits,
                credits: newCredits, // ✅ also update total so HeaderCredits shows correct denominator
              },
            }),
          );
        } catch (err) {
          console.warn("localStorage patch failed:", err);
        }

        // 3. Background server sync — non-blocking, updates any fields we missed
        refreshUserPlan().catch((err) =>
          console.warn("Background plan refresh failed:", err),
        );

        // Navigate immediately — context + localStorage already reflect new plan
        navigate("/dashboard/pricing");
      } else {
        console.log(
          "No voucher applied - this should not happen as button should be disabled",
        );
        show("Please apply a valid voucher to complete purchase.", {
          type: "error",
        });
      }
    } catch (error) {
      console.error("Purchase error details:", error);

      const errorMessage =
        error.message || "Failed to complete purchase. Please try again.";

      show(errorMessage, { type: "error" });

      setErrors((prev) => ({
        ...prev,
        submit: errorMessage,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="spicy-y">
      <div className="row">
        <div className="col-xl-8 col-lg-7">
          {/* Billing Form */}
          <div
            className="rounded-16 bg-white -dark-bg-dark-1 shadow-4"
            style={{ padding: "2rem" }}
          >
            <div className="py-30 px-30">
              <h2 className="text-20 fw-600 mb-30">Billing Details</h2>
              <form onSubmit={handleSubmit}>
                {/* Billing Address — laid out for whichever country is
                    chosen, in three rows so the form stays short. */}
                <div className="mb-20 d-flex gap-10 flex-wrap">
                  <div style={{ flex: "1 1 240px" }}>
                    <label htmlFor="country" className={labelClass}>
                      Country <span className="text-red-1">*</span>
                    </label>
                    <SearchableSelect
                      id="country"
                      name="country"
                      value={formData.country}
                      options={COUNTRIES}
                      onChange={handleCountryChange}
                      searchPlaceholder="Search countries…"
                      ariaLabel="Country"
                    />
                  </div>

                  <div style={{ flex: "2 1 300px" }}>
                    <label htmlFor="addressLine1" className={labelClass}>
                      Street Address <span className="text-red-1">*</span>
                    </label>
                    <input
                      id="addressLine1"
                      name="addressLine1"
                      type="text"
                      autoComplete="address-line1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      className={`form-control ${
                        errors.addressLine1 ? "is-invalid" : ""
                      }`}
                      placeholder="123 Main St"
                      style={fieldStyle(errors.addressLine1)}
                    />
                    {errors.addressLine1 && (
                      <div className={errorClass}>{errors.addressLine1}</div>
                    )}
                  </div>
                </div>

                <div className="mb-20 d-flex gap-10 flex-wrap">
                  <div style={{ flex: "1 1 200px" }}>
                    <label htmlFor="addressLine2" className={labelClass}>
                      Apt, Suite, Unit{" "}
                      <span style={{ color: "#6b7280" }}>(optional)</span>
                    </label>
                    <input
                      id="addressLine2"
                      name="addressLine2"
                      type="text"
                      autoComplete="address-line2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Apt 4B"
                      style={fieldStyle(false)}
                    />
                  </div>

                  <div style={{ flex: "2 1 260px" }}>
                    <label htmlFor="city" className={labelClass}>
                      {addressFormat.cityLabel}{" "}
                      <span className="text-red-1">*</span>
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      value={formData.city}
                      onChange={handleChange}
                      className={`form-control ${errors.city ? "is-invalid" : ""}`}
                      placeholder={addressFormat.cityLabel}
                      style={fieldStyle(errors.city)}
                    />
                    {errors.city && (
                      <div className={errorClass}>{errors.city}</div>
                    )}
                  </div>
                </div>

                <div className="mb-20 d-flex gap-10 flex-wrap">
                  <div style={{ flex: "2 1 220px" }}>
                    <label htmlFor="region" className={labelClass}>
                      {addressFormat.regionLabel}{" "}
                      {addressFormat.regionRequired ? (
                        <span className="text-red-1">*</span>
                      ) : (
                        <span style={{ color: "#6b7280" }}>(optional)</span>
                      )}
                    </label>
                    {/* A list where the abbreviations are expected, free text
                        everywhere else. */}
                    {regionOptions ? (
                      <SearchableSelect
                        id="region"
                        name="region"
                        value={formData.region}
                        options={regionOptions}
                        onChange={handleChange}
                        hasError={Boolean(errors.region)}
                        placeholder="Select"
                        searchPlaceholder={`Search ${addressFormat.regionLabel.toLowerCase()}…`}
                        ariaLabel={addressFormat.regionLabel}
                      />
                    ) : (
                      <input
                        id="region"
                        name="region"
                        type="text"
                        autoComplete="address-level1"
                        value={formData.region}
                        onChange={handleChange}
                        className={`form-control ${errors.region ? "is-invalid" : ""}`}
                        placeholder={addressFormat.regionPlaceholder}
                        style={fieldStyle(errors.region)}
                      />
                    )}
                    {errors.region && (
                      <div className={errorClass}>{errors.region}</div>
                    )}
                  </div>

                  {/* Countries without postal codes get no dead field. */}
                  {addressFormat.hasPostalCode && (
                    <div style={{ flex: "1 1 160px" }}>
                      <label htmlFor="postalCode" className={labelClass}>
                        {addressFormat.postalLabel}{" "}
                        <span className="text-red-1">*</span>
                      </label>
                      <input
                        id="postalCode"
                        name="postalCode"
                        type="text"
                        autoComplete="postal-code"
                        maxLength={12}
                        value={formData.postalCode}
                        onChange={handleChange}
                        className={`form-control ${errors.postalCode ? "is-invalid" : ""}`}
                        placeholder={addressFormat.postalPlaceholder}
                        style={fieldStyle(errors.postalCode)}
                      />
                      {errors.postalCode && (
                        <div className={errorClass}>{errors.postalCode}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Voucher Code */}
                <div className="mb-30">
                  <label htmlFor="voucherCode" className="text-16 fw-500 mb-10">
                    Voucher Code
                  </label>
                  <div
                    className="d-flex gap-10"
                    style={{ alignItems: "flex-start" }}
                  >
                    <div style={{ flex: 1 }}>
                      <input
                        id="voucherCode"
                        name="voucherCode"
                        type="text"
                        value={formData.voucherCode}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Enter voucher code"
                        disabled={voucherApplied}
                        style={{
                          border: errors.voucherCode
                            ? "1px solid #dc3545"
                            : "1px solid #dddddd",
                          borderRadius: "8px",
                          padding: "15px",
                          fontSize: "14px",
                          width: "100%",
                        }}
                      />
                      {errors.voucherCode && (
                        <div
                          className="text-14 mt-10 d-flex items-center gap-2"
                          style={{ color: "#dc3545" }}
                        >
                          <i className="fa-solid fa-circle-exclamation"></i>
                          {errors.voucherCode}
                        </div>
                      )}
                      {voucherApplied && voucherData && (
                        <div
                          className="text-14 mt-10"
                          style={{ color: COLORS.success }}
                        >
                          ✓ Voucher verified! {voucherData.plan_name} plan (
                          {voucherData.credits} credits)
                        </div>
                      )}
                    </div>
                    {!voucherApplied ? (
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        className="button -outline-purple-1 text-purple-1 px-30 py-15"
                        disabled={isApplyingVoucher}
                        style={{
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                          marginLeft: "1rem",
                          height: "4rem",
                          flexShrink: 0,
                          color: "#0f3053",
                        }}
                      >
                        {isApplyingVoucher ? "Verifying..." : "Apply"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="button -outline-red-1 text-red-1 px-30 py-15"
                        style={{
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                          marginLeft: "1rem",
                          height: "4rem",
                          flexShrink: 0,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="text-red-1 text-14 mb-20">
                    {errors.submit}
                  </div>
                )}

                {/* Checkout Section */}
                <div className="mt-10 space-y-6">
                  {/* Buttons Row */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Cancel */}
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/pricing")}
                      disabled={isSubmitting || isPaying}
                      className="w-full sm:flex-1 h-14 rounded-lg 
               bg-[#0f3053] text-white font-semibold
               hover:bg-[#0c2744] 
               transition duration-200 disabled:opacity-60"
                    >
                      Cancel
                    </button>

                    {/* Voucher Activation */}
                    {voucherApplied && (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:flex-1 h-14 rounded-lg bg-[#0f3053]
      text-white font-semibold hover:bg-[#0c2744]
      transition flex items-center justify-center gap-3
      disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Activating...
                          </>
                        ) : (
                          "Activate with Voucher"
                        )}
                      </button>
                    )}
                  </div>

                  {/* OR Divider */}
                  <div className="flex items-center">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="px-4 text-sm text-gray-500 font-medium">
                      OR
                    </span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>

                  {/* PayPal Button */}
                  <button
                    type="button"
                    onClick={handlePaypalCheckout}
                    disabled={isPaying || !plan}
                    className="w-full h-14 rounded-lg bg-[#0f3053] text-white
    font-semibold flex items-center justify-center gap-3
    hover:bg-[#0c2744] transition
    disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isPaying ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Redirecting to PayPal...
                      </>
                    ) : (
                      <>
                        <img
                          src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
                          alt="PayPal"
                          className="h-5"
                        />
                        Checkout with PayPal
                      </>
                    )}
                  </button>

                  {/* Stripe (card / Link) Button */}
                  <button
                    type="button"
                    onClick={handleStripeCheckout}
                    disabled={isStripePaying || !plan}
                    className="w-full h-14 mt-3 rounded-lg bg-[#635bff] text-white
    font-semibold flex items-center justify-center gap-3
    hover:bg-[#5249e0] transition
    disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isStripePaying ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Redirecting to checkout...
                      </>
                    ) : (
                      <>
                        <i className="fa-regular fa-credit-card"></i>
                        Pay with card
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="col-xl-4 col-lg-5">
          <div className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 sticky-top">
            <div
              className="py-30 px-30"
              style={{
                padding: "1rem",
              }}
            >
              <h4 className="text-20 fw-600 mb-20">Order Summary</h4>

              {plan ? (
                <>
                  {/* The plan gets the full width of the card: its name is a
                      heading, not a value squeezed beside a label. */}
                  <div
                    style={{
                      paddingBottom: 18,
                      marginBottom: 18,
                      borderBottom: `1px solid ${COLORS.borderLight}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: COLORS.textMuted,
                        marginBottom: 6,
                      }}
                    >
                      Your plan
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        lineHeight: 1.35,
                        color: COLORS.textPrimary,
                      }}
                    >
                      {plan.name}
                    </div>
                    {plan.description && (
                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: COLORS.textMuted,
                          marginTop: 6,
                        }}
                      >
                        {plan.description}
                      </div>
                    )}
                    {tierLabel(plan.tier) && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 10,
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          color: COLORS.primary,
                          background: COLORS.primaryLighter,
                        }}
                      >
                        {tierDetail(plan.tier) || tierLabel(plan.tier)}
                      </span>
                    )}
                  </div>

                  {/* Line items */}
                  <div
                    style={{
                      paddingBottom: 18,
                      marginBottom: 18,
                      borderBottom: `1px solid ${COLORS.borderLight}`,
                    }}
                  >
                    <div className="d-flex justify-between items-center">
                      <span style={{ fontSize: 14, color: COLORS.textMuted }}>
                        Subscription
                      </span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          color: COLORS.textPrimary,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {plan.price === null || plan.price === 0
                          ? "N/A"
                          : formatUsd(plan.price)}
                      </span>
                    </div>

                    {voucherApplied && voucherData && (
                      <>
                        <div
                          className="d-flex justify-between items-center"
                          style={{ marginTop: 10 }}
                        >
                          <span style={{ fontSize: 14, color: COLORS.success }}>
                            Voucher discount
                          </span>
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 500,
                              color: COLORS.success,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {plan.price != null && voucherData.price != null
                              ? `-${formatUsd(plan.price - voucherData.price)}`
                              : voucherData.price == null
                                ? `-${formatUsd(plan.price)}` // voucher covers 100%
                                : "N/A"}
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: 12,
                            padding: "10px 12px",
                            borderRadius: 8,
                            background: COLORS.successLight,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: COLORS.success,
                            }}
                          >
                            {voucherData.plan_name} — voucher verified
                          </div>
                          {SHOW_CREDITS && voucherData.credits && (
                            <div
                              style={{
                                fontSize: 12,
                                color: COLORS.success,
                                marginTop: 2,
                              }}
                            >
                              {voucherData.credits} credits activate on purchase
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Total */}
                  <div className="d-flex justify-between items-baseline">
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: COLORS.textPrimary,
                      }}
                    >
                      Total due today
                    </span>
                    <span
                      style={{
                        fontSize: 26,
                        fontWeight: 700,
                        color: COLORS.primary,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {(() => {
                        const total = calculateTotal();
                        return total === null ? "N/A" : formatUsd(total);
                      })()}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: COLORS.textMuted,
                      textAlign: "right",
                      marginTop: 4,
                    }}
                  >
                    Billed annually in USD
                  </div>

                  {SHOW_CREDITS && (voucherData?.credits || plan.credits) && (
                    <div
                      style={{
                        marginTop: 18,
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: COLORS.primaryLighter,
                        color: COLORS.primary,
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      <i
                        className="fa-solid fa-coins"
                        data-fa-i2svg="false"
                        aria-hidden="true"
                        style={{ marginRight: 6 }}
                      ></i>
                      {voucherData?.credits || plan.credits} credits included
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-40">
                  <div className="text-light-1 text-15">No plan selected</div>
                  <button
                    onClick={() => navigate("/dashboard/pricing")}
                    className="button -purple-1 text-white px-30 py-10 mt-20"
                    style={{ borderRadius: "8px" }}
                  >
                    Select a Plan
                  </button>
                </div>
              )}

              {/* Security note */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <i
                  className="fa-solid fa-lock"
                  data-fa-i2svg="false"
                  aria-hidden="true"
                  style={{
                    fontSize: 13,
                    lineHeight: 1,
                    color: COLORS.success,
                    flexShrink: 0,
                  }}
                ></i>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  <span
                    style={{ fontWeight: 600, color: COLORS.textSecondary }}
                  >
                    Secure payment
                  </span>{" "}
                  · Your information is protected
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
