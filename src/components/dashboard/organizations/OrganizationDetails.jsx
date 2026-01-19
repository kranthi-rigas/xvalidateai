import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getOrganizations } from "../../../apiIntegration/organization";
import { SlArrowRight } from "react-icons/sl";

export default function OrganizationDetails({ organization, onBack }) {
  if (!organization) {
    return (
      <div style={{ paddingTop: 150, textAlign: "center" }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #2F5FD9",
            borderRadius: "50%",
            margin: "0 auto 12px",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <div style={{ color: "#2F5FD9", fontWeight: 600 }}>
          Loading Organization Details…
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  /* ---------- STATUS BADGE ---------- */
  const StatusBadge = ({ status }) => {
    const map = {
      ACTIVE: ["#ECFDF5", "#065F46"],
      PENDING: ["#EEF2FF", "#3730A3"],
      SUSPENDED: ["#FEF3C7", "#92400E"],
      REJECTED: ["#FEE2E2", "#991B1B"],
      DEACTIVATED: ["#F3F4F6", "#374151"],
    };

    const [bg, color] = map[status] || map.DEACTIVATED;

    return (
      <span
        style={{
          padding: "6px 12px",
          borderRadius: 999,
          fontSize: 12.5,
          fontWeight: 600,
          background: bg,
          color,
          textTransform: "lowercase",
        }}
      >
        {status}
      </span>
    );
  };

  const showComment =
    organization.status !== "PENDING" &&
    typeof organization.comment === "string" &&
    organization.comment.trim().length > 0;

  return (
    <div className="dashboard__content bg-light-4">
      {/* ---------- BREADCRUMB ---------- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
          marginBottom: 16,
        }}
      >
        <span
          style={{ color: "#4F46E5", cursor: "pointer", fontWeight: 500 }}
          onClick={onBack}
        >
          Organizations
        </span>
        <SlArrowRight size={12} style={{ color: "#9CA3AF" }} />
        <span style={{ color: "#374151", fontWeight: 500 }}>
          {organization.name}
        </span>
      </div>

      {/* ---------- PAGE TITLE ---------- */}
      <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 30 }}>
        Organization Details
      </h2>

      {/* ---------- OUTER CARD ---------- */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          background: "white",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          padding: 40,
        }}
      >
        {/* ===== HEADER ===== */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={metaLabel}>Organization Name</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {organization.name}
            </div>
          </div>

          <StatusBadge status={organization.status} />
        </div>

        {/* ===== DESCRIPTION / COMMENT ===== */}
        <div
          style={{
            marginTop: 28,
            padding: "20px 24px",
            background: "#F9FAFB",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
          }}
        >
          <div style={{ marginBottom: showComment ? 16 : 0 }}>
            <div style={metaLabel}>Description</div>
            <div style={metaValue}>{organization.description || "-"}</div>
          </div>

          {showComment && (
            <div>
              <div style={metaLabel}>Comment</div>
              <div style={metaValue}>{organization.comment}</div>
            </div>
          )}
        </div>

        {/* ===== META GRID ===== */}
        <div
          style={{
            marginTop: 28,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 20,
          }}
        >
          <MetaCard label="Slug" value={organization.slug} />
          <MetaCard label="Email" value={organization.email} />
          <MetaCard label="Address" value={organization.address} />
          <MetaCard
            label="Creation Time"
            value={new Date(organization.created_at).toLocaleString()}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- HELPERS ---------- */
const metaLabel = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6B7280",
  marginBottom: 6,
  textTransform: "uppercase",
};

const metaValue = {
  fontSize: 14.5,
  fontWeight: 500,
  color: "#111827",
  lineHeight: 1.6,
};

const MetaCard = ({ label, value }) => (
  <div
    style={{
      padding: "16px 18px",
      borderRadius: 12,
      border: "1px solid #E5E7EB",
      background: "#FFFFFF",
    }}
  >
    <div style={metaLabel}>{label}</div>
    <div style={metaValue}>{value || "-"}</div>
  </div>
);
