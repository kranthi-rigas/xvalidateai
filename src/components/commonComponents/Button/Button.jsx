import "./Button.css";

export default function Button({
  label,
  onClick,
  variant = "primary",
  disabled = false,
  icon,
  type = "button",
  size = "default", // "default" or "lg"
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}${size === "lg" ? " btn-lg" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {label && <span>{label}</span>}
    </button>
  );
}
