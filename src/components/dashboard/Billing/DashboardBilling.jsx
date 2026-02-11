import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  verifyVoucher,
  redeemVoucher,
  createPaypalSubscription,
} from "@/apiIntegration/vouchers";
import useToast from "../../../hooks/useToast";
import { useContextElement } from "@/context/Context";
import { COLORS } from "@/styles/colors";
import AwsButton from "@/components/common/AwsButton";

export default function DashboardBilling() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan || null;
  const show = useToast();
  const { refreshUserPlan } = useContextElement();
  const [isPaying, setIsPaying] = useState(false);

  const [formData, setFormData] = useState({
    billingAddress: "",
    voucherCode: "",
  });

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
    console.log(plan);

    try {
      const response = await createPaypalSubscription(plan.name);

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

  // Reset form state when navigating to this page (when location changes)
  useEffect(() => {
    setFormData({
      billingAddress: "",
      voucherCode: "",
    });
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.billingAddress.trim()) {
      newErrors.billingAddress = "Billing address is required";
    }
    //  else if (formData.billingAddress.trim().length < 10) {
    //   newErrors.billingAddress = "Please enter a complete billing address";
    // }

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

  const calculateTotal = () => {
    if (!plan) return 0;

    // If voucher is applied, use the voucher price
    if (voucherApplied && voucherData) {
      return voucherData.price || 0;
    }

    // Otherwise use the original plan price
    return plan.price;
  };

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

        // Refresh user plan in Context and localStorage, then navigate
        await refreshUserPlan();
        navigate("/dashboard/pricing");
      } else {
        console.log(
          "No voucher applied - this should not happen as button should be disabled",
        );
        show("Please apply a valid voucher to complete purchase.", {
          type: "error",
        });
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
                {/* Billing Address */}
                <div className="mb-30">
                  <label
                    htmlFor="billingAddress"
                    className="text-16 fw-500 mb-10"
                  >
                    Billing Address <span className="text-red-1">*</span>
                  </label>
                  <textarea
                    id="billingAddress"
                    name="billingAddress"
                    rows="4"
                    value={formData.billingAddress}
                    onChange={handleChange}
                    className={`form-control ${
                      errors.billingAddress ? "is-invalid" : ""
                    }`}
                    placeholder="Enter your complete billing address including street, city, state, and postal code"
                    style={{
                      border: errors.billingAddress
                        ? "1px solid #dc3545"
                        : "1px solid #dddddd",
                      borderRadius: "8px",
                      padding: "15px",
                      fontSize: "14px",
                      width: "100%",
                      resize: "vertical",
                    }}
                  />
                  {errors.billingAddress && (
                    <div className="text-red-1 text-14 mt-10">
                      {errors.billingAddress}
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
                        <div className="text-red-1 text-14 mt-10">
                          {errors.voucherCode}
                        </div>
                      )}
                      {voucherApplied && voucherData && (
                        // <div className="text-yellow-1 text-14 mt-10" style={{ color: "#FFD700" }}>
                        <div
                          className=" text-14 mt-10"
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

                {/* PayPal Button */}
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
              <h4 className="text-20 fw-600 mb-30">Order Summary</h4>

              {plan ? (
                <>
                  <div className="border-bottom-light pb-20 mb-20">
                    <div className="d-flex justify-between items-center mb-10">
                      <span className="text-15 text-light-1">Plan</span>
                      <span className="text-16 fw-600 text-dark-1">
                        {plan.name}
                      </span>
                    </div>
                    <div className="text-13 text-light-1">
                      {plan.description}
                    </div>
                  </div>

                  <div className="border-bottom-light pb-20 mb-20">
                    <div className="d-flex justify-between items-center mb-10">
                      <span className="text-15 text-light-1">Price</span>
                      <span className="text-16 text-dark-1">
                        {plan.price === null || plan.price === 0
                          ? "N/A"
                          : `$${
                              typeof plan.price === "number"
                                ? plan.price.toFixed(2)
                                : plan.price
                            }`}
                      </span>
                    </div>
                    {voucherApplied && voucherData && (
                      <>
                        <div className="d-flex justify-between items-center mb-10">
                          <span
                            className="text-15 "
                            style={{ color: COLORS.success }}
                          >
                            Voucher Discount
                          </span>
                          <span
                            className="text-16 "
                            style={{ color: COLORS.success }}
                          >
                            {plan.price !== null && voucherData.price !== null
                              ? `-$${(plan.price - voucherData.price).toFixed(
                                  2,
                                )}`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="mt-10 px-10 py-8 rounded-6 bg-green-3">
                          <div
                            className="text-12 "
                            style={{ color: COLORS.success }}
                          >
                            <strong>{voucherData.plan_name}</strong> - Voucher
                            verified
                          </div>
                          <div
                            className="text-11 "
                            style={{ color: COLORS.success }}
                            mt-5
                          >
                            $ {voucherData.credits} credits will be activated on
                            purchase
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="d-flex justify-between items-center">
                    <span className="text-18 fw-600 text-dark-1">Total</span>
                    <span className="text-24 fw-700 text-purple-1">
                      {(() => {
                        const total = calculateTotal();
                        return total === null || total === 0
                          ? "N/A"
                          : `$${
                              typeof total === "number"
                                ? total.toFixed(2)
                                : total
                            }`;
                      })()}
                    </span>
                  </div>

                  {(voucherData?.credits || plan.credits) && (
                    <div className="mt-20 px-15 py-10 rounded-8 bg-purple-3">
                      <div className="text-13 text-purple-1 text-center">
                        $ {voucherData?.credits || plan.credits} credits
                        included
                      </div>
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

              {/* Security Badge */}
              <div className="mt-30 pt-20 border-top-light">
                <div className="d-flex items-center gap-10">
                  <span style={{ fontSize: "20px" }}>🔒</span>
                  <div>
                    <div className="text-13 fw-500 text-dark-1">
                      Secure Payment
                    </div>
                    <div className="text-12 text-light-1 mt-5">
                      Your information is protected
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
