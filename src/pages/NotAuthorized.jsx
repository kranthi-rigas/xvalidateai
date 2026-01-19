export default function NotAuthorized() {
  const user = JSON.parse(localStorage.getItem("user_info") || "{}");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFFFFF",
        padding: "32px 48px",
        fontFamily: "var(--font-primary)",
      }}
    >
      {/* ---------- Breadcrumbs (Academy51 style) ---------- */}
      <div
        style={{
          fontSize: 14,
          color: "#6B7280",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{ cursor: "pointer" }}
          onClick={() => (window.location.href = "/dashboard")}
        >
          Dashboard
        </span>
        <span>›</span>
        <span style={{ fontWeight: 600 }}>Access Denied</span>
      </div>

      {/* ---------- Page Title ---------- */}
      <h1
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: "#1E293B",
          marginBottom: 16,
        }}
      >
        Access Denied
      </h1>

      {/* ---------- Icon + Description ---------- */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#FFF7ED",
            border: "1px solid #FDE2C3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 40, color: "#F97316" }}>🔒</span>
        </div>

        <div>
          <p
            style={{
              fontSize: 16,
              color: "#374151",
              marginBottom: 14,
              maxWidth: 650,
              lineHeight: "1.6",
            }}
          >
            You do not have permission to access this section of Academy51.
          </p>

          <p
            style={{
              fontSize: 14,
              color: "#6B7280",
              maxWidth: 600,
              lineHeight: "1.5",
              marginBottom: 28,
            }}
          >
            If you believe you should have access, please contact your
            organization administrator.
          </p>

          {/* ---------- Return Button ---------- */}
          <button
            onClick={() => (window.location.href = "/dashboard")}
            style={{
              padding: "12px 26px",
              background: "#6366F1",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#4F46E5")}
            onMouseLeave={(e) => (e.target.style.background = "#6366F1")}
          >
            Return to Dashboard
          </button>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "#E5E7EB",
          marginTop: 40,
          marginBottom: 20,
        }}
      />

      {/* ---------- Technical Info ---------- */}
      <div
        style={{
          fontSize: 13,
          color: "#6B7280",
          maxWidth: 700,
          lineHeight: "1.4",
        }}
      >
        <b>Technical details:</b>
        <div style={{ marginTop: 6 }}>
          <div>
            • Attempted page:{" "}
            <span style={{ color: "#111827" }}>Admin-only section</span>
          </div>
          <div>
            • Required role: <span style={{ color: "#111827" }}>Admin</span>
          </div>
          <div>
            • Your roles:{" "}
            <span style={{ color: "#111827" }}>
              {user?.roles?.join(", ") || "None"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
