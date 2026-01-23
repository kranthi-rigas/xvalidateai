// src/api/auth.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return response; // No refresh token => cannot retry
    const userInfo = JSON.parse(localStorage.getItem("user_info"));

    // Call refresh endpoint
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: refreshToken,
        user_id: userInfo.user_id,
      }),
    });

    if (!refreshResponse.ok) {
      // Refresh failed, user must log in again
      return response;
    }

    const newToken = await refreshResponse.json();
    localStorage.setItem("access_token", newToken.access_token);
    localStorage.setItem("refresh_token", newToken.refresh_token);

    // retry original request with new token
    finalOptions.headers.Authorization = `Bearer ${newToken.access_token}`;
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
      const error = await res.text();
      throw new Error(error || "Signup failed");
    }

    return await res.json();
  } catch (err) {
    alert("Signup failed. " + err.message);
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

  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
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

  // 🔥 treat 400 invalid token AFTER success as success
  if (!res.ok && !text.toLowerCase().includes("invalid token")) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.message || "Password update failed"
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
