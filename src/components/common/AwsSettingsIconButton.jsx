import { FiSettings } from "react-icons/fi";
import COLORS from "../../styles/colors";

/**
 * Settings Icon Button - Design System Compliant
 *
 * Features:
 * - Trust Blue design system colors
 * - Smooth hover transitions
 * - Shadow effects on interaction
 * - WCAG AA/AAA accessible
 * - Keyboard navigation support
 *
 * @param {function} onClick - Click handler
 * @param {string} title - Tooltip text
 * @param {number} size - Icon size in pixels
 */
export default function AwsSettingsIconButton({
  onClick,
  title = "Preferences",
  size = 16,
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-label={title}
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
        borderRadius: "6px",

        /* Design system shadow */
        filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.18))",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        // Hover state - Trust Blue background with deeper shadow
        e.currentTarget.style.background = COLORS.hover;
        e.currentTarget.style.filter =
          "drop-shadow(0 4px 8px rgba(0, 67, 206, 0.25))";
      }}
      onMouseLeave={(e) => {
        // Default state
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.filter =
          "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.18))";
      }}
      onMouseDown={(e) => {
        // Pressed state
        e.currentTarget.style.background = COLORS.pressed;
        e.currentTarget.style.filter =
          "drop-shadow(0 2px 4px rgba(0, 67, 206, 0.35))";
      }}
      onMouseUp={(e) => {
        // Return to hover state
        e.currentTarget.style.background = COLORS.hover;
        e.currentTarget.style.filter =
          "drop-shadow(0 4px 8px rgba(0, 67, 206, 0.25))";
      }}
      onFocus={(e) => {
        // Keyboard focus state
        e.currentTarget.style.outline = `2px solid ${COLORS.borderFocus}`;
        e.currentTarget.style.outlineOffset = "2px";
      }}
      onBlur={(e) => {
        // Remove focus outline
        e.currentTarget.style.outline = "none";
      }}
    >
      <FiSettings
        size={size}
        style={{
          color: COLORS.textSecondary,
          transition: "color 0.2s ease",
          pointerEvents: "none", // Prevent icon from capturing mouse events
        }}
      />

      <style>{`
        /* Ensure hover effect on icon when button is hovered */
        button:hover svg {
          color: ${COLORS.primary} !important;
        }

        /* Active/pressed state */
        button:active svg {
          color: ${COLORS.primaryDark} !important;
        }

        /* Focus visible for accessibility */
        button:focus-visible {
          outline: 2px solid ${COLORS.borderFocus} !important;
          outline-offset: 2px;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          button {
            transition: none !important;
          }
          button svg {
            transition: none !important;
          }
        }
      `}</style>
    </button>
  );
}
