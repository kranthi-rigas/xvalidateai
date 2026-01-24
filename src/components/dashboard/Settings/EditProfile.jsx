import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
  fetchUserProfile,
  updateUserProfile,
} from "../../../apiIntegration/auth.js";
import AwsButton from "@/components/common/AwsButton";

const flagEmoji = (code) =>
  code
    ? String.fromCodePoint(
        ...code
          .toUpperCase()
          .split("")
          .map((c) => 127397 + c.charCodeAt()),
      )
    : "";

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

export default function EditProfile({ activeTab }) {
  const [previewImage, setPreviewImage] = useState("");
  const [countries, setCountries] = useState([]);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    phoneCode: "",
    email: "",
    address1: "",
    address2: "",
    state: "",
    country: null,
    avatar: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Fetch countries & phone codes (FIXED)
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

  // ✅ Fetch profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
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
          address1: data.address_line1 || "",
          address2: data.address_line2 || "",
          state: data.state || "",
          country: matchedCountry,
          phoneCode: matchedCountry?.code || "",
          phone: matchedCountry
            ? data.phone?.replace(matchedCountry.code, "")
            : "",
          avatar: data.avatar_url || "",
        });

        if (data.avatar_url) setPreviewImage(data.avatar_url);
      } catch (err) {
        setError("Failed to load profile. Please try again later.");
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [countries]);

  //validation phone number helper
  const validatePhone = () => {
    if (!profile.country) return "Please select a country";

    if (profile.country.label === "India") {
      if (profile.phone.length !== 10) {
        return "Indian phone number must be 10 digits";
      }
    } else {
      if (profile.phone.length < 6 || profile.phone.length > 15) {
        return "Phone number must be between 6 and 15 digits";
      }
    }
    return null;
  };

  //Handle phone input
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    // India → max 10 digits
    if (profile.country?.label === "India" && value.length > 10) return;

    // Other countries → max 15 digits
    if (value.length > 15) return;

    setProfile((prev) => ({ ...prev, phone: value }));
  };

  // ✅ Handle image upload preview
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  // ✅ Remove image
  const handleRemoveImage = () => {
    document.getElementById("imageUpload1").value = "";
    setPreviewImage("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate first
    const validationError = validatePhone();
    if (validationError) {
      setError(validationError);
      setMessage(null);
      setSaving(false);
      return;
    }

    // ✅ Only now start saving
    setSaving(true);
    setError(null);
    setMessage(null);

    const token = localStorage.getItem("access_token");

    const payload = {
      first_name: profile.firstName,
      last_name: profile.lastName,
      phone: `${profile.phoneCode}${profile.phone}`,
      address_line1: profile.address1,
      address_line2: profile.address2,
      state: profile.state,
      country: profile.country?.label, // ✅ send name only
      avatar_url: previewImage || profile.avatar,
    };

    try {
      await updateUserProfile(token, payload);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Compute initials
  const initials =
    (profile.firstName?.charAt(0).toUpperCase() || "") +
    (profile.lastName?.charAt(0).toUpperCase() || "");

  if (loading) {
    return (
      <div
        className={`tabs__pane -tab-item-1 ${
          activeTab == 1 ? "is-active" : ""
        }`}
      >
        <p>Loading profile...</p>
      </div>
    );
  }

  const phoneValidationError = validatePhone();
  const isFormInvalid = !!phoneValidationError || saving;

  return (
    <div
      className={`tabs__pane -tab-item-1 ${activeTab == 1 ? "is-active" : ""}`}
    >
      <div className="row y-gap-20 x-gap-20 items-center">
        {/* ✅ Avatar Section */}
        <label className="col-auto" htmlFor="imageUpload1">
          {previewImage ? (
            <img
              className="size-100"
              src={previewImage}
              alt="User avatar"
              style={{
                objectFit: "cover",
                borderRadius: "50%",
                width: "100px",
                height: "100px",
              }}
            />
          ) : initials ? (
            <div
              className="d-flex justify-center align-center text-24 fw-600 text-white"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#2F5FD9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "uppercase",
              }}
            >
              {initials}
            </div>
          ) : (
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#f2f3f4",
              }}
            />
          )}
        </label>

        <div className="col-auto">
          <div className="text-16 fw-500 text-dark-1">Your avatar</div>

          <div className="d-flex x-gap-10 y-gap-10 flex-wrap pt-15">
            {/* Upload */}
            {/* <div>
              <div className="d-flex justify-center items-center size-40 rounded-8 bg-light-3">
                <label
                  style={{ cursor: "pointer" }}
                  htmlFor="imageUpload1"
                  className="icon-cloud text-16"
                ></label>
                <input
                  id="imageUpload1"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>
            </div> */}

            {/* Delete */}
            {/* <div>
              <div
                style={{ cursor: "pointer" }}
                onClick={handleRemoveImage}
                className="d-flex justify-center items-center size-40 rounded-8 bg-light-3"
              >
                <div className="icon-bin text-16"></div>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* ✅ Profile Form */}
      <div className="border-top-light pt-30 mt-30">
        <form onSubmit={handleSubmit} className="contact-form row y-gap-30">
          {/* First Name */}
          <div className="col-md-6">
            <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
              First Name
            </label>
            <input
              name="firstName"
              type="text"
              value={profile.firstName}
              onChange={handleChange}
              placeholder="First Name"
              required
            />
          </div>

          {/* Last Name */}
          <div className="col-md-6">
            <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
              Last Name
            </label>
            <input
              name="lastName"
              type="text"
              value={profile.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              required
            />
          </div>
          {/* Country */}
          <div className="col-md-6">
            <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
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
          <div className="col-md-6">
            <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
              Phone
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={profile.phoneCode}
                disabled
                style={{
                  width: 80,
                  background: "#F3F4F6",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              />

              <input
                name="phone"
                type="text"
                value={profile.phone}
                onChange={handlePhoneChange}
                placeholder="Phone"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="col-md-6">
            <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
              Email Address
            </label>
            <input
              type="text"
              value={profile.email}
              disabled
              placeholder="Email"
            />
          </div>

          <div className="col-12">
            <AwsButton
              type="submit"
              label="Update Profile"
              isLoading={saving}
              disabled={isFormInvalid}
              size="lg"
            />
          </div>
        </form>

        {message && <p className="text-success mt-10">{message}</p>}
        {error && (
          <p
            style={{
              color: "#DC2626", // Tailwind red-600
              marginTop: 10,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

//Styles for country dropdown
const selectStyles = {
  control: (base) => ({
    ...base,
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center", // ✅ vertical centering
  }),
  valueContainer: (base) => ({
    ...base,
    display: "flex",
    alignItems: "center", // ✅ centers text + flag
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
