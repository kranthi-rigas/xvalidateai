import { useEffect, useState } from "react";

export function useCountryPhone() {
  const [countries, setCountries] = useState([]);
  const [countryValue, setCountryValue] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  useEffect(() => {
    const loadCountries = async () => {
      const res = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,idd,cca2"
      );
      const data = await res.json();

      const formatted = data
        .filter((c) => c?.idd?.root && c?.name?.common && c?.cca2)
        .map((c) => ({
          label: c.name.common,
          value: c.name.common,
          code: c.idd.root + (c.idd.suffixes?.[0] || ""),
          flag: `https://flagcdn.com/w20/${c.cca2.toLowerCase()}.png`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      setCountries(formatted);
    };

    loadCountries();
  }, []);

  const selectedCountry =
    countries.find((c) => c.value === countryValue) || null;

  const onCountryChange = (option) => {
    setCountryValue(option?.value || "");
    setPhoneCode(option?.code || "");
    setPhone("");
  };

  // ✅ SAME VALIDATION AS EDIT PROFILE
  const validatePhone = () => {
    if (!selectedCountry) return "Please select a country";

    if (selectedCountry.label === "India") {
      if (phone.length !== 10) {
        return "Indian phone number must be 10 digits";
      }
    } else {
      if (phone.length < 6 || phone.length > 15) {
        return "Phone number must be between 6 and 15 digits";
      }
    }
    return null;
  };

  return {
    countries,
    selectedCountry,
    phone,
    phoneCode,
    setPhone,
    onCountryChange,
    validatePhone, // ✅ expose
  };
}
