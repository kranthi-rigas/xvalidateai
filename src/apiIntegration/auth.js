// src/api/auth.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// One shared refresh at a time. The API rotates the refresh token, so when
// several requests hit a 401 together (a page that loads /profile and its own
// data at once) the second call with the old token comes back "invalid refresh
// token" and that request fails even though the session is fine. Everyone waits
// on the same refresh instead and retries with the token it produced.
let refreshPromise = null;

// Set once the session has been ended, so a burst of failing requests
// produces a single redirect rather than one per request.
let sessionExpired = false;

export const SESSION_EXPIRED_REASON = "session_expired";

// The refresh token itself was refused — nothing can mint a new access token,
// so the only way forward is a fresh login. Without this the page stays put
// and renders every failed request as empty data ("No records found", 0s).
function handleSessionExpired() {
  if (sessionExpired) return;

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_info");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user_info");

  // Already on the login page — nothing to redirect to.
  if (window.location.pathname === "/auth") return;

  // The full-page redirect resets this module, so the flag only has to
  // outlive the requests still in flight on the current page.
  sessionExpired = true;
  const next = window.location.pathname + window.location.search;
  window.location.assign(
    `/auth?mode=login&reason=${SESSION_EXPIRED_REASON}&next=${encodeURIComponent(next)}`,
  );
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;

    let userId = "";
    try {
      userId =
        JSON.parse(localStorage.getItem("user_info") || "{}")?.user_id || "";
    } catch {
      userId = "";
    }

    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: refreshToken,
        user_id: userId,
      }),
    });

    if (!refreshResponse.ok) {
      // 401/403 means the refresh token is expired or revoked. Anything else
      // (5xx, gateway errors) may be temporary, so keep the session.
      if (refreshResponse.status === 401 || refreshResponse.status === 403) {
        handleSessionExpired();
      }
      return null;
    }

    const newToken = await refreshResponse.json().catch(() => null);
    if (!newToken?.access_token) return null;

    localStorage.setItem("access_token", newToken.access_token);
    if (newToken.refresh_token) {
      localStorage.setItem("refresh_token", newToken.refresh_token);
    }
    return newToken.access_token;
  })()
    .catch((err) => {
      console.error("Token refresh failed:", err);
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function fetchWithAuth(url, options = {}) {
  const accessToken = localStorage.getItem("access_token");

  const finalOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
      "Content-Type": "application/json",
    },
  };

  let response = await fetch(url, finalOptions);

  // If token is expired or invalid
  if (response.status === 403 || response.status === 401) {
    const refreshed = await refreshAccessToken();
    // A concurrent request may have refreshed while this one waited, so fall
    // back to whatever token is in storage now.
    const retryToken = refreshed || localStorage.getItem("access_token");

    // Nothing new to try with — hand the original failure back.
    if (!retryToken || retryToken === accessToken) return response;

    finalOptions.headers.Authorization = `Bearer ${retryToken}`;
    response = await fetch(url, finalOptions);
  }

  return response;
}

export { fetchWithAuth };

export async function signup(userData) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const errorText = await res.text();

      // Try to parse backend JSON error safely
      let message = "Signup failed";
      try {
        const parsed = JSON.parse(errorText);
        message = parsed.error || parsed.message || message;
      } catch {
        message = errorText || message;
      }

      throw new Error(message);
    }

    return await res.json();
  } catch (err) {
    console.error("Signup error:", err);

    throw err;
  }
}

export async function login(credentials) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
       const error = new Error(data?.error || "Login failed");
      error.status = res.status;      
      error.data = data;              
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Login error:", err);
    throw err; 
  }
}

export async function googleLogin(code) {
  try {
    const url = new URL(`${API_BASE_URL}/auth/google/login`);
    url.searchParams.append("code", code); // Add parameters
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Login failed");
    }

    return await res.json();
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
}

/**
 * Logs out the user by calling the /auth/logout endpoint.
 *
 * @param {string} [token] - Optional access token, if your backend requires it later.
 * @returns {Promise<Object>} - The logout API response.
 */
export async function logoutUser(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to logout user");
    }

    return await res.json();
  } catch (err) {
    console.error("Logout error:", err);
    throw err;
  }
}

export async function fetchUserProfile(token) {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Fetch user profile response:", res);
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to fetch user profile");
    }

    return await res.json();
  } catch (err) {
    console.error("Fetch user profile error:", err);
    throw err;
  }
}

export async function updateUserProfile(token, profileData) {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(profileData),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to update profile");
    }

    return await res.json();
  } catch (err) {
    console.error("Update user profile error:", err);
    throw err;
  }
}

export const applyInstructor = async (formData, token) => {
  const apiUrl = `${API_BASE_URL}/instructors/signup`;

  const userInfo = JSON.parse(localStorage.getItem("user_info"));

  const payload = {
    email: userInfo?.email || "",
    first_name: formData.firstName,
    last_name: formData.lastName,
    phone: formData.phone,
    country: "India",
    qualification: formData.qualification,
    years_of_experience: formData.experience,
    expertise: formData.subjects,
    bio: formData.bio,
    portfolio: formData.portfolio,
  };

  try {
    const response = await fetchWithAuth(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!response.ok) {
      throw new Error(
        typeof data === "string" ? data : data?.body || "Failed to apply"
      );
    }

    return data;
  } catch (err) {
    console.error("❌ applyInstructor Error:", err);
    throw err;
  }
};
//Update / Reset Password (UPDATED PAYLOAD)
export async function updatePassword({ password, new_password }) {
  const accessToken = localStorage.getItem("access_token");

  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      password,
      new_password,
    }),
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  // treat 400 invalid token AFTER success as success
  if (!res.ok && !text.toLowerCase().includes("invalid token")) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.error || data?.message || "Password update failed"
      //   ^^^^^^^^^^^
      // API returns { "error": "Current password is incorrect" }
      // so check data.error BEFORE data.message
    );
  }

  return data;
}
// Verify Email
export async function verifyEmail(token) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-email?token=${token}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.message || "Verification failed"
    );
  }

  return data;
}
// Forgot Password
export async function forgotPassword({ email }) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.message || "Failed to send reset link"
    );
  }

  return data;
}
// Reset Password (from email link)
export async function resetPassword({ token, new_password }) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      new_password,
    }),
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.message || "Password reset failed"
    );
  }

  return data;
}
