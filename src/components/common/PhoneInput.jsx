import { useState } from "react";
import { COLORS } from "../../styles/colors";

export default function PhoneInput({ phone, phoneCode, onChange, error }) {
  const [focused, setFocused] = useState(false);

  return (
    <>
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        {/* Country Code */}
        <input
          disabled
          value={phoneCode}
          style={{
            width: 80,
            flexShrink: 0,
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
          value={phone}
          onChange={onChange}
          placeholder="Phone number"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            // An <input> has an intrinsic width of ~20 characters, and a flex
            // item will not shrink past it without this — which is what made
            // the field overhang its card.
            minWidth: 0,
            height: 48,
            background: "transparent",
            borderRadius: 8,
            padding: "0 14px",
            color: "#0F172A",

            /* ✅ TRANSPARENT HIGHLIGHT (VISIBLE) */
            border: "1px solid #DDDDDD",
            boxShadow: focused
              ? "inset 0 0 0 1px rgba(184, 181, 181, 0.6)"
              : "none",

            outline: "none",
            transition: "box-shadow 0.15s ease",
          }}
        />
      </div>

      {error && (
        <p style={{ color: COLORS.error, fontSize: 13, marginTop: 6 }}>
          {error}
        </p>
      )}
    </>
  );
}
