import React, { useState, useEffect } from "react";
import COLORS from "../../styles/colors";

/**
 * Reusable Modal Component - AI Compliance Design System
 *
 * Follows Trust Blue design system with WCAG AA/AAA compliance
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal content
 * @param {React.ReactNode} footer - Optional footer content (buttons, etc.)
 * @param {string} size - Modal size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 * @param {boolean} showCloseButton - Show X button in top right
 * @param {boolean} closeOnOverlayClick - Allow closing by clicking overlay
 * @param {string} className - Additional classes for modal content
 * @param {boolean} error - Error state (red border + shake animation)
 */

export default function ReusableModal({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = "",
  error = false,
}) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 10);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      setAnimate(false);
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && onClose) {
      onClose();
    }
  };

  // Size variants following design system spacing
  const sizeStyles = {
    sm: { maxWidth: "384px" }, // 24rem
    md: { maxWidth: "450px" }, // Design system default
    lg: { maxWidth: "512px" }, // 32rem
    xl: { maxWidth: "576px" }, // 36rem
    full: { maxWidth: "calc(100vw - 2rem)", margin: "0 1rem" },
  };

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: "1rem",
    paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
    paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
    paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
    paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  };

  const modalStyle = {
    ...sizeStyles[size],
    width: "100%",
    background: COLORS.bgPrimary,
    padding: "20px",
    borderRadius: "18px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
    maxHeight: "calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem)",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    position: "relative",
    margin: "auto",

    // Animation
    transform: animate ? "scale(1)" : "scale(0.92)",
    opacity: animate ? 1 : 0,
    transition: "all 0.25s ease-out",

    // Error state
    ...(error && {
      border: `2px solid ${COLORS.error}`,
      boxShadow: `0 0 0 4px ${COLORS.errorLight}, 0 20px 60px rgba(0, 0, 0, 0.35)`,
      animation: "shake 0.35s",
    }),
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
  };

  const titleStyle = {
    fontSize: "20px",
    fontWeight: 700,
    color: COLORS.textPrimary,
    margin: 0,
    lineHeight: 1.5,
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    padding: "8px",
    cursor: "pointer",
    color: COLORS.textSecondary,
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
    marginLeft: "auto",
  };

  const closeButtonHoverStyle = {
    background: COLORS.hover,
    color: COLORS.textPrimary,
  };

  const footerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "16px",
    gap: "12px",
  };

  return (
    <>
      <div
        style={overlayStyle}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        <div
          style={modalStyle}
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={headerStyle}>
            {title && (
              <h2 id="modal-title" style={titleStyle}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                style={closeButtonStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, closeButtonHoverStyle);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = COLORS.textSecondary;
                }}
                aria-label="Close modal"
                type="button"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div>{children}</div>

          {/* Footer */}
          {footer && <div style={footerStyle}>{footer}</div>}
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0) scale(1); }
          25% { transform: translateX(-4px) scale(1); }
          50% { transform: translateX(4px) scale(1); }
          75% { transform: translateX(-2px) scale(1); }
          100% { transform: translateX(0) scale(1); }
        }
        
        /* Hide scrollbar on modal content while keeping functionality */
        div[role="dialog"] > div::-webkit-scrollbar {
          width: 6px;
        }
        
        div[role="dialog"] > div::-webkit-scrollbar-track {
          background: transparent;
        }
        
        div[role="dialog"] > div::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        div[role="dialog"] > div::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
        
        div[role="dialog"] > div {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
        
        /* Focus visible for accessibility */
        button:focus-visible {
          outline: 2px solid ${COLORS.borderFocus};
          outline-offset: 2px;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          div[role="dialog"] > div {
            transition: none;
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
