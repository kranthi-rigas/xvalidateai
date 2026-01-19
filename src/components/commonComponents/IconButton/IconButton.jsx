import "./IconButton.css";

export default function IconButton({
  icon,
  onClick,
  ariaLabel,
  disabled = false,
}) {
  return (
    <button
      className="icon-btn"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}
