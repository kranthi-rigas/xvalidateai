// useCountryPhone.js
import { useState } from "react";
import { COUNTRIES } from "../data/countries"; // ← the file I gave you

const DIAL_CODES = {
  // keep your existing DIAL_CODES object here unchanged
  AF: "+93", AL: "+355", /* ... rest of it ... */
};

// Build the formatted list once at module load — no fetch, no useEffect
const FORMATTED_COUNTRIES = COUNTRIES.map((c) => ({
  label: c.label,
  value: c.label,           // your hook uses label as value (country name)
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
    countries: FORMATTED_COUNTRIES,  // ← static, always ready, no loading state
    selectedCountry,
    phone,
    phoneCode,
    setPhone,
    onCountryChange,
    validatePhone,
  };
}