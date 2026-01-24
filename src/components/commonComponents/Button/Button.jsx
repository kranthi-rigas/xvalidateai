export default function Button({
  label,
  onClick,
  variant = "primary",
  disabled = false,
  icon,
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {label && <span>{label}</span>}
    </button>
  );
}
