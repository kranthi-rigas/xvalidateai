import { useState, forwardRef } from "react";

const PhoneInput = forwardRef(({ phone, phoneCode, onChange }, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {/* Country Code */}
      <input
        disabled
        value={phoneCode}
        style={{
          width: 80,
          height: 48,
          background: "transparent",
          textAlign: "center",
          borderRadius: 8,
          border: "1px solid #DDDDDD",
          color: "#0F172A",
        }}
      />

      {/* Phone Number */}
      <input
        ref={ref}
        required
        value={phone}
        placeholder="Phone number"
        inputMode="numeric"
        onChange={(e) => {
          // 🔥 clears tooltip immediately when typing
          e.target.setCustomValidity("");
          onChange(e);
        }}
        onInvalid={(e) => {
          // ✅ ONLY custom message
          e.target.setCustomValidity("Please enter a valid phone number");
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          height: 48,
          background: "transparent",
          borderRadius: 8,
          padding: "0 14px",
          color: "#0F172A",
          border: "1px solid #DDDDDD",
          boxShadow: focused ? "inset 0 0 0 1px rgba(184,181,181,0.6)" : "none",
          outline: "none",
        }}
      />
    </div>
  );
});

export default PhoneInput;
