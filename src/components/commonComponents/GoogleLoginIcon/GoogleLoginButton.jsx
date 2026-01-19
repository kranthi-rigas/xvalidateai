import GoogleIcon from "./GoogleIcon";
import "./GoogleLoginButton.css";

export default function GoogleLoginButton({ onClick, loading = false }) {
  return (
    <button
      type="button"
      className="google-icon-btn"
      onClick={onClick}
      disabled={loading}
      aria-label="Sign in with Google"
    >
      {loading ? "…" : <GoogleIcon size={20} />}
    </button>
  );
}
