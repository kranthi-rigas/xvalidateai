import React, { useState, useEffect } from "react";
import Select from "react-select";
import { COLORS } from "@/styles/colors";
import AwsButton from "@/components/common/AwsButton";
import {
  updatePassword,
  fetchUserProfile,
  updateUserProfile,
} from "@/apiIntegration/auth";
import SubscriptionTab from "@/components/dashboard/Settings/SubscriptionTab";

// ── Country flag helpers ───────────────────────────────────────────────────
const CountryOption = ({ data, innerProps, innerRef, isFocused }) => (
  <div
    ref={innerRef}
    {...innerProps}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      background: isFocused ? "#EEF2FF" : "#fff",
      cursor: "pointer",
    }}
  >
    <img
      src={data.flag}
      alt={data.label}
      width={20}
      height={14}
      style={{ borderRadius: 2 }}
    />
    <span>{data.label}</span>
  </div>
);

const CountrySingleValue = ({ data }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <img
      src={data.flag}
      alt={data.label}
      width={20}
      height={14}
      style={{ borderRadius: 2 }}
    />
    <span>{data.label}</span>
  </div>
);

const selectStyles = {
  control: (base) => ({
    ...base,
    minHeight: 40,
    borderRadius: 8,
    borderColor: "hsl(var(--border))",
    boxShadow: "none",
    "&:hover": { borderColor: "hsl(var(--border))" },
  }),
  valueContainer: (base) => ({
    ...base,
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
  }),
  singleValue: (base) => ({
    ...base,
    display: "flex",
    alignItems: "center",
    gap: 10,
  }),
  indicatorSeparator: () => ({ display: "none" }),
};

// ── Reusable password input ────────────────────────────────────────────────
function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-0 w-10 h-full flex items-center justify-center text-muted-foreground pointer-events-none">
        <i className="fa-solid fa-lock text-sm" />
      </span>
      <input
        type={show ? "text" : "password"}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required
        placeholder={placeholder}
        className="block w-full pl-11 pr-10 py-2.5 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground placeholder-muted-foreground"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-0 w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? (
          <i key="hide" className="fa-solid fa-eye-slash text-sm" />
        ) : (
          <i key="show" className="fa-solid fa-eye text-sm" />
        )}
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ModernSettings() {
  const [activeTab, setActiveTab] = useState("edit");

  // ── Profile state ──────────────────────────────────────────────────────
  const [countries, setCountries] = useState([]);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    phoneCode: "",
    email: "",
    country: null,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // ── Password state ─────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // ── Load countries ─────────────────────────────────────────────────────
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,idd,cca2",
        );
        const data = await res.json();
        const formatted = data
          .filter(
            (c) =>
              c?.idd?.root &&
              c?.name?.common &&
              typeof c?.name?.common === "string" &&
              c?.cca2,
          )
          .map((c) => ({
            label: c.name.common,
            value: c.name.common,
            code: c.idd.root + (c.idd.suffixes?.[0] || ""),
            flag: `https://flagcdn.com/w20/${c.cca2.toLowerCase()}.png`,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setCountries(formatted);
      } catch (err) {
        console.error("Failed to load countries", err);
      }
    };
    loadCountries();
  }, []);

  // ── Fetch profile from API (runs after countries load) ─────────────────
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setProfileLoading(false);
        return;
      }
      try {
        const data = await fetchUserProfile(token);
        const matchedCountry =
          countries.find((c) => c.value === data.country) || null;

        setProfile({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          country: matchedCountry,
          phoneCode: matchedCountry?.code || "",
          phone: matchedCountry
            ? (data.phone || "").replace(matchedCountry.code, "")
            : data.phone || "",
        });

        if (data.avatar_url) setPreviewImage(data.avatar_url);
      } catch (err) {
        setProfileError("Failed to load profile. Please try again later.");
        console.error("Error fetching user profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [countries]);

  // ── Phone validation ───────────────────────────────────────────────────
  const validatePhone = () => {
    if (!profile.country) return "Please select a country";
    if (profile.country.label === "India") {
      if (profile.phone.length !== 10)
        return "Indian phone number must be 10 digits";
    } else {
      if (profile.phone.length < 6 || profile.phone.length > 15)
        return "Phone number must be between 6 and 15 digits";
    }
    return null;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (profile.country?.label === "India" && value.length > 10) return;
    if (value.length > 15) return;
    setProfile((prev) => ({ ...prev, phone: value }));
  };

  // ── Image upload ───────────────────────────────────────────────────────
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreviewImage("");
  };

  // ── Profile submit ─────────────────────────────────────────────────────
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);

    const validationError = validatePhone();
    if (validationError) {
      setProfileError(validationError);
      return;
    }

    setProfileSaving(true);
    const token = localStorage.getItem("access_token");

    const payload = {
      first_name: profile.firstName,
      last_name: profile.lastName,
      phone: `${profile.phoneCode}${profile.phone}`,
      country: profile.country?.label || "",
      avatar_url: previewImage || "",
    };

    try {
      await updateUserProfile(token, payload);

      // ✅ Update localStorage so sidebar/header reflects changes immediately
      const existing = JSON.parse(localStorage.getItem("user_info") || "{}");
      localStorage.setItem(
        "user_info",
        JSON.stringify({
          ...existing,
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: `${profile.phoneCode}${profile.phone}`,
          country: profile.country?.label || "",
        }),
      );

      setProfileMessage("Profile updated successfully!");
    } catch (err) {
      setProfileError("Failed to update profile. Please try again later.");
      console.error("Update profile error:", err);
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Computed values ────────────────────────────────────────────────────
  const initials =
    (profile.firstName?.[0] || "").toUpperCase() +
    (profile.lastName?.[0] || "").toUpperCase();

  const phoneValidationError = validatePhone();
  const isProfileFormInvalid = !!phoneValidationError || profileSaving;

  // ── Password handlers ──────────────────────────────────────────────────
  const passwordsMatch =
    passwordForm.new_password &&
    passwordForm.confirm_password &&
    passwordForm.new_password === passwordForm.confirm_password;

  const isSameAsCurrent =
    passwordForm.new_password &&
    passwordForm.current_password &&
    passwordForm.new_password === passwordForm.current_password;

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const togglePasswordVisibility = (field) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (isSameAsCurrent) {
      setPasswordError(
        "New password must be different from your current password",
      );
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }
    if (!passwordsMatch) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    try {
      setPasswordLoading(true);
      await updatePassword({
        password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordSuccess(
        "Password changed successfully! Redirecting to Login Page...",
      );
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("/");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err?.error ||
        err?.data?.error ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update password";

      if (
        errorMessage.toLowerCase().includes("token") ||
        errorMessage.toLowerCase().includes("expired")
      ) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("/");
        return;
      }
      setPasswordError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Tab button helper ──────────────────────────────────────────────────
  const TAB = (key, label, extra = "") => (
    <button
      onClick={() => setActiveTab(key)}
      className={`py-3 px-3 text-sm font-medium transition-all duration-150 border-b-2 rounded-t-md ${extra} ${
        activeTab === key
          ? "text-white border-secondary bg-secondary shadow-sm"
          : "border-transparent text-muted-foreground hover:text-primary hover:bg-muted/60 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="spicy-y">
      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="mb-8 border-b border-border">
        <nav className="flex space-x-8" aria-label="Tabs">
          {TAB("edit", "Edit Profile")}
          {TAB("subscription", "Subscription")}
          {TAB("password", "Password")}
          {TAB("preferences", "Preferences")}
          <button
            onClick={() => setActiveTab("close")}
            className={`py-3 px-3 text-sm font-medium border-b-2 transition-all duration-150 rounded-t-md ml-auto ${
              activeTab === "close"
                ? "text-white border-red-500 bg-red-500 shadow-sm"
                : "border-transparent text-destructive hover:text-red-700 hover:bg-red-50 hover:border-red-300"
            }`}
          >
            Close Account
          </button>
        </nav>
      </div>

      {/* ── Edit Profile Tab ──────────────────────────────────────────────── */}
      {activeTab === "edit" && (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Avatar section */}
          <div className="p-6 sm:p-8 border-b border-border bg-gradient-to-r from-blue-50/50 to-transparent">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
              <div className="relative flex-shrink-0">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-white"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full text-white flex items-center justify-center text-2xl font-bold shadow-md ring-4 ring-white"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    {initials || "?"}
                  </div>
                )}
                
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">
                  Profile
                </h3>
                
                <div className="flex gap-3">
                  
                  
                </div>
              </div>
            </div>
          </div>

          {/* Profile form */}
          <div className="p-6 sm:p-8">
            {profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-muted-foreground" />
                <span className="ml-3 text-sm text-muted-foreground">
                  Loading profile...
                </span>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit}>
                {/* Success / Error banners */}
                {profileMessage && (
                  <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <i className="fa-solid fa-circle-check text-green-600 mt-0.5" />
                    <p className="text-sm text-green-800">{profileMessage}</p>
                  </div>
                )}
                {profileError && (
                  <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <i className="fa-solid fa-circle-exclamation text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{profileError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  {/* First Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="firstName"
                      className="text-sm font-medium text-foreground"
                    >
                      First Name
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-muted-foreground pointer-events-none">
                        <i className="fa-regular fa-user" />
                      </span>
                      <input
                        type="text"
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        placeholder="First Name"
                        required
                        className="block w-full pl-11 pr-3 py-2 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="lastName"
                      className="text-sm font-medium text-foreground"
                    >
                      Last Name
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-muted-foreground pointer-events-none">
                        <i className="fa-regular fa-user" />
                      </span>
                      <input
                        type="text"
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        placeholder="Last Name"
                        required
                        className="block w-full pl-11 pr-3 py-2 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-foreground"
                      />
                    </div>
                  </div>

                  {/* Email — read-only */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-muted-foreground pointer-events-none">
                        <i className="fa-regular fa-envelope" />
                      </span>
                      <input
                        type="email"
                        id="email"
                        value={profile.email}
                        disabled
                        className="block w-full pl-11 pr-24 py-2 bg-muted/50 border border-border rounded-lg outline-none text-sm text-foreground opacity-70 cursor-not-allowed"
                      />
                      <span className="absolute right-3 pointer-events-none">
                        <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Country — react-select with flags */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Country
                    </label>
                    <Select
                      options={countries}
                      value={profile.country}
                      placeholder="Select country"
                      isClearable
                      isSearchable
                      components={{
                        Option: CountryOption,
                        SingleValue: CountrySingleValue,
                      }}
                      onChange={(selected) => {
                        setProfile((prev) => ({
                          ...prev,
                          country: selected,
                          phoneCode: selected?.code || "",
                          phone: "",
                        }));
                      }}
                      styles={selectStyles}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="phone"
                      className="text-sm font-medium text-foreground"
                    >
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      {/* Phone code — read-only, auto-filled from country */}
                      <input
                        type="text"
                        value={profile.phoneCode}
                        disabled
                        className="w-20 flex-none px-2 py-2 bg-muted border border-border rounded-lg outline-none text-sm text-center font-medium text-foreground opacity-70 cursor-not-allowed"
                      />
                      <div className="relative flex-1 flex items-center">
                        <span className="absolute left-3 text-muted-foreground pointer-events-none">
                          <i className="fa-solid fa-phone" />
                        </span>
                        <input
                          type="tel"
                          id="phone"
                          value={profile.phone}
                          onChange={handlePhoneChange}
                          placeholder="Phone number"
                          required
                          className="block w-full pl-11 pr-3 py-2 bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none text-sm text-foreground placeholder-muted-foreground"
                        />
                      </div>
                    </div>
                    {phoneValidationError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <i className="fa-solid fa-circle-exclamation" />
                        {phoneValidationError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end pt-5 border-t border-border">
                  
                  <AwsButton
                    type="submit"
                    label={profileSaving ? "Saving..." : "Update Profile"}
                    variant="primary"
                    disabled={isProfileFormInvalid}
                    loading={profileSaving}
                  />
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Subscription Tab ─────────────────────────────────────────── */}
      {activeTab === "subscription" && <SubscriptionTab />}

      {/* ── Password Tab ──────────────────────────────────────────────────── */}
      {activeTab === "password" && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary mb-1">
              Change Password
            </h2>
            <p className="text-muted-foreground text-sm">
              Update your password to keep your account secure. You'll be logged
              out after changing your password.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="max-w-md">
            {passwordSuccess && (
              <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <i className="fa-solid fa-circle-check text-green-600 mt-0.5" />
                <p className="text-sm text-green-800">{passwordSuccess}</p>
              </div>
            )}
            {passwordError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <i className="fa-solid fa-circle-exclamation text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{passwordError}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="current_password"
                  className="text-sm font-medium text-foreground"
                >
                  Current Password
                </label>
                <PasswordInput
                  id="current_password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  show={showPasswords.current}
                  onToggle={() => togglePasswordVisibility("current")}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="new_password"
                  className="text-sm font-medium text-foreground"
                >
                  New Password
                </label>
                <PasswordInput
                  id="new_password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Min 8 characters"
                  show={showPasswords.new}
                  onToggle={() => togglePasswordVisibility("new")}
                />
                {isSameAsCurrent && (
                  <p className="text-xs text-red-600">
                    <i className="fa-solid fa-xmark mr-1" />
                    New Password must be different from your current password
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirm_password"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm New Password
                </label>
                <PasswordInput
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  show={showPasswords.confirm}
                  onToggle={() => togglePasswordVisibility("confirm")}
                />
                {passwordForm.confirm_password && (
                  <p
                    className={`text-xs ${passwordsMatch ? "text-green-600" : "text-red-600"}`}
                  >
                    {passwordsMatch ? (
                      <span>
                        <i className="fa-solid fa-check mr-1" />
                        Passwords match
                      </span>
                    ) : (
                      <span>
                        <i className="fa-solid fa-xmark mr-1" />
                        Passwords do not match
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
              <AwsButton
                type="button"
                onClick={() => {
                  setPasswordForm({
                    current_password: "",
                    new_password: "",
                    confirm_password: "",
                  });
                  setPasswordError("");
                  setPasswordSuccess("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear Form
              </AwsButton>
              <AwsButton
                type="submit"
                loading={passwordLoading}
                label={passwordLoading ? "Updating..." : "Change Password"}
                variant="primary"
                disabled={
                  passwordLoading || !passwordsMatch || !!isSameAsCurrent
                }
                onClick={() => {}}
              />
            </div>
          </form>

          <div className="mt-6 max-w-md p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-shield-halved" /> Security Tips
            </h4>
            <ul className="text-xs text-blue-800 space-y-1 ml-5 list-disc">
              <li>
                Use a strong password with a mix of letters, numbers, and
                symbols
              </li>
              <li>Don't reuse passwords from other websites</li>
              <li>Consider using a password manager</li>
              <li>You'll be logged out after changing your password</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Preferences Tab ───────────────────────────────────────────────── */}
      {activeTab === "preferences" && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-primary mb-6">
            Preferences
          </h2>
          <p className="text-muted-foreground mb-6">
            Customize your experience and notification settings.
          </p>
        </div>
      )}

      {/* ── Close Account Tab ─────────────────────────────────────────────── */}
      {activeTab === "close" && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
          <h2
            className="text-xl font-semibold mb-6"
            style={{ color: COLORS.error }}
          >
            Close Account
          </h2>
          <p className="text-muted-foreground mb-6">
            Permanently delete your account and all associated data.
          </p>
        </div>
      )}

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>Last login: Today at 10:42 AM from IP 192.168.1.1</p>
      </div>
    </div>
  );
}
