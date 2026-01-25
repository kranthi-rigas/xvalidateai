import { FiSettings } from "react-icons/fi";

/**
 * AWS-style Settings Icon Button
 * - No background
 * - Shadow only (no pill)
 * - Darker shadow on hover
 */
export default function AwsSettingsIconButton({
  onClick,
  title = "Preferences",
  size = 16,
}) {
  return (
    <div
      title={title}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",

        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,

        /* AWS default light shadow */
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.18))",
        transition: "filter 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter =
          "drop-shadow(0 6px 10px rgba(0,0,0,0.45))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter =
          "drop-shadow(0 1px 2px rgba(0,0,0,0.18))";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.filter =
          "drop-shadow(0 2px 4px rgba(0,0,0,0.55))";
      }}
    >
      <FiSettings
        size={size}
        style={{
          color: "#374151", // AWS idle icon color
          transition: "color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#0a0a0b"; // darker on hover
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#374151";
        }}
      />
    </div>
  );
}
