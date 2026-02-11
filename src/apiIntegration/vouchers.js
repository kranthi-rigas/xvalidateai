// src/apiIntegration/vouchers.js
import { API_BASE_URL, fetchWithAuth } from "./auth";

/**
 * Verify a voucher code (check if valid without redeeming)
 * @param {string} voucherCode - The voucher code to verify
 * @returns {Promise} Response with voucher details
 */
export async function verifyVoucher(voucherCode) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/vouchers/verify?code=${encodeURIComponent(voucherCode)}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.detail || "Invalid voucher code");
    }

    return await response.json();
  } catch (err) {
    console.error("Voucher verification error:", err);
    throw err;
  }
}

/**
 * Redeem a voucher code
 * @param {string} voucherCode - The voucher code to redeem
 * @param {string} planId - The plan ID (optional, if needed by backend)
 * @returns {Promise} Response with subscription details
 * Response structure:
 * {
 *   message: string,
 *   subscription: {
 *     subscription_id: string,
 *     user_id: string,
 *     plan_type: string,
 *     plan_name: string,
 *     credits: number,
 *     credits_remaining: number,
 *     price: number,
 *     status: string,
 *     features: string[],
 *     voucher_code: string,
 *     created_at: number,
 *     updated_at: number,
 *     expires_at: number
 *   }
 * }
 */
export async function redeemVoucher(voucherCode, planId = null) {
  try {
    const payload = {
      voucher_code: voucherCode,
    };

    // Add planId to payload if provided
    if (planId) {
      payload.plan_id = planId;
    }

    const response = await fetchWithAuth(`${API_BASE_URL}/vouchers/redeem`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.detail || "Failed to redeem voucher");
    }

    return await response.json();
  } catch (err) {
    console.error("Voucher redemption error:", err);
    throw err;
  }
}

//PayPal Integration API Function
export async function createPaypalSubscription(payload) {
  const res = await fetchWithAuth("/subscriptions/paypal", {
    method: "POST",
    body: JSON.stringify({
      plan_type: payload.planType, // FREE | PREMIUM | BUSINESS
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to create PayPal subscription");
  }

  return res.json();
}
//
export async function confirmPaypalSubscription(subscriptionId) {
  const res = await fetchWithAuth("/subscriptions/paypal/confirm", {
    method: "POST",
    body: JSON.stringify({
      subscription_id: subscriptionId,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to confirm PayPal subscription");
  }

  return res.json();
}
export async function cancelPaypalSubscription(reason = "User requested cancellation") {
  const res = await fetchWithAuth("/subscriptions/paypal/cancel", {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to cancel subscription");
  }

  return res.json();
}