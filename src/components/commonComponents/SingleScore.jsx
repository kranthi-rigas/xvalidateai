import React from "react";

export default function SingleScore({
  title,
  value,
  icon: Icon,
  color = "#2563EB",
  subtitle,
  valueColor,
}) {
  return (
    <div
      style={{
        padding: "18px 22px",
        background: "#FFFFFF",
        borderRadius: 14,
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#6B7280",
          }}
        >
          {title}
        </span>

        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: valueColor || color || "#111827",
            lineHeight: 1.2,
          }}
        >
          {value}
        </span>

        {/* OPTIONAL SUBTITLE */}
        {subtitle && (
          <span
            style={{
              fontSize: 12,
              color: "#9CA3AF",
              marginTop: 2,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {Icon && (
        <div>
          {React.isValidElement(Icon) ? (
            Icon
          ) : typeof Icon === "string" ? (
            <img src={Icon} alt={`${title} icon`} />
          ) : (
            <Icon size={46} />
          )}
        </div>
      )}
    </div>
  );
}
