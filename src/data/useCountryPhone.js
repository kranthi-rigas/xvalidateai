// useCountryPhone.js
import { useState } from "react";
import { COUNTRIES } from "../data/countries"; // ← the file I gave you

const DIAL_CODES = {
  // keep your existing DIAL_CODES object here unchanged
  AF: "+93",
  AL: "+355" /* ... rest of it ... */,
};

// Build the formatted list once at module load — no fetch, no useEffect
const FORMATTED_COUNTRIES = COUNTRIES.map((c) => ({
  label: c.label,
  value: c.label, // your hook uses label as value (country name)
  iso: c.value, // ISO 3166-1 alpha-2, for APIs that want "US"
  code: c.phoneCode,
  flag: `https://flagcdn.com/w20/${c.value.toLowerCase()}.png`,
})).sort((a, b) => a.label.localeCompare(b.label));

export function useCountryPhone() {
  const [countryValue, setCountryValue] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  const selectedCountry =
    FORMATTED_COUNTRIES.find((c) => c.value === countryValue) || null;

  const onCountryChange = (option) => {
    setCountryValue(option?.value || "");
    setPhoneCode(option?.code || "");
    setPhone("");
  };

  // Prefill from a saved profile: match the country by name and strip its
  // dial code off the stored phone number (phone is saved as code + number).
  const prefill = ({ country, phone: savedPhone }) => {
    // A saved country arrives either as its name ("India", from the signup
    // form) or as its ISO code ("IN", from a social signup), so both are
    // matched here — otherwise the field comes back empty and the dial code
    // never gets stripped off the stored number.
    const key = (country || "").trim().toLowerCase();
    const match =
      FORMATTED_COUNTRIES.find((c) => c.value.toLowerCase() === key) ||
      FORMATTED_COUNTRIES.find((c) => (c.iso || "").toLowerCase() === key) ||
      null;
    setCountryValue(match?.value || "");
    setPhoneCode(match?.code || "");

    const digits = (savedPhone || "").replace(/\D/g, "");
    const codeDigits = (match?.code || "").replace(/\D/g, "");
    setPhone(
      codeDigits && digits.startsWith(codeDigits)
        ? digits.slice(codeDigits.length)
        : digits,
    );
  };

  const validatePhone = () => {
    if (!selectedCountry) return "Please select a country";
    if (selectedCountry.label === "India") {
      if (phone.length !== 10) return "Indian phone number must be 10 digits";
    } else {
      if (phone.length < 6 || phone.length > 15)
        return "Phone number must be between 6 and 15 digits";
    }
    return null;
  };

  return {
    countries: FORMATTED_COUNTRIES, // ← static, always ready, no loading state
    selectedCountry,
    phone,
    phoneCode,
    setPhone,
    onCountryChange,
    prefill,
    validatePhone,
  };
}
