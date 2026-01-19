import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AwsButton from "../../common/AwsButton";
import RefreshButton from "../../common/RefreshButton";
import ListTable from "../../common/ListTable";

import {
  getGroups,
  getUserAttributes,
  updateGroupPermissions,
} from "../../../apiIntegration/organization";

export default function AttachPermissions() {
  const { group_id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  // Capitalize helper
  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : str;

  // -------------------------------------------------------
  // LOAD DATA
  // -------------------------------------------------------
  async function loadData() {
    try {
      const groupsRes = await getGroups();
      const selectedGroup = groupsRes.groups.find(
        (g) => g.group_id === group_id
      );

      const currentPermissions =
        selectedGroup?.permissions?.map(capitalize) || [];

      const userAttributes = await getUserAttributes();
      const allPermissions = Array.isArray(userAttributes.roles)
        ? userAttributes.roles.map(capitalize)
        : [];

      const otherPermissions = allPermissions.filter(
        (perm) => !currentPermissions.includes(perm)
      );

      setGroup({
        name: selectedGroup?.name || "",
        currentPermissions,
        otherPermissions,
      });

      setLoading(false);
    } catch (err) {
      console.error("Failed to load permissions page:", err);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------
  const togglePermission = (perm) => {
    setSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleAll = (checked, list) => {
    setSelected(checked ? list : []);
  };

  const handleSave = async () => {
    const finalPermissions = [...group.currentPermissions, ...selected];

    await updateGroupPermissions(group_id, finalPermissions);
    navigate(`/dashboard/orgusergroupdetails/${group_id}`);
  };

  if (loading || !group) {
    return (
      <div style={{ paddingTop: 150, textAlign: "center" }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #4F46E5",
            borderRadius: "50%",
            margin: "0 auto 12px",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <div style={{ color: "#4F46E5", fontWeight: 600 }}>
          Loading permissions details…
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

  // SEARCH FILTER
  const filtered = group.otherPermissions.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  // LISTTABLE CONFIG
  const otherColumns = [
    {
      key: "checkbox",
      label: "",
      width: 1,
      allSelected: filtered.length > 0 && selected.length === filtered.length,
      onToggleAll: (checked) => toggleAll(checked, filtered),
    },
    { key: "perm", label: "Permission Name" },
  ];

  const renderOther = (perm, key) => {
    if (key === "checkbox") {
      return (
        <div style={{ padding: 0, margin: 0 }}>
          <input
            type="checkbox"
            style={{ margin: 0 }}
            checked={selected.includes(perm)}
            onChange={() => togglePermission(perm)}
          />
        </div>
      );
    }
    if (key === "perm") return <span>{perm}</span>;
  };

  return (
    <div className="dashboard__content bg-light-4">
      {/* --------------------------------------------------------
          TITLE
      -------------------------------------------------------- */}
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Attach permissions to {group.name}
      </h2>

      {/* --------------------------------------------------------
          CURRENT PERMISSIONS (AWS STYLE FIXED)
      -------------------------------------------------------- */}
      <div
        style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          marginBottom: 25,
          overflow: "hidden",
        }}
      >
        <details open>
          <summary
            style={{
              padding: "14px 20px",
              fontSize: 17,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: "1px solid #E5E7EB",
              listStyle: "none",
            }}
          >
            <span className="aws-arrow">▶</span>
            Current permissions ({group.currentPermissions.length})
          </summary>

          {/* TABLE HEADER */}
          <div
            style={{
              padding: "12px 20px", // FIXED horizontal padding
              background: "#F9FAFB",
              borderBottom: "1px solid #E5E7EB",
              fontWeight: 600,
              fontSize: 14,
              color: "#374151",
              display: "flex",
            }}
          >
            <div style={{ flex: 1 }}>Permission Name</div>
          </div>

          {/* TABLE BODY */}
          {group.currentPermissions.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#6B7280" }}>
              No permissions attached
            </div>
          ) : (
            group.currentPermissions.map((perm, index) => (
              <div
                key={perm}
                style={{
                  padding: "12px 20px", // FIXED padding
                  borderBottom: "1px solid #F3F4F6",
                  background: index % 2 === 0 ? "white" : "#FAFAFA",
                  display: "flex",
                  fontSize: 15,
                  color: "#111827",
                }}
              >
                <div style={{ flex: 1 }}>{perm}</div>
              </div>
            ))
          )}
        </details>
      </div>

      {/* --------------------------------------------------------
          OTHER PERMISSIONS
      -------------------------------------------------------- */}
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 15 }}>
          Other permissions ({filtered.length})
        </h3>

        {/* SEARCH */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <input
            type="text"
            placeholder="Search permissions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: 350,
              border: "1px solid #D1D5DB",
              padding: "7px 10px",
              borderRadius: 8,
            }}
          />

          <RefreshButton onRefresh={loadData} />
        </div>

        {/* TABLE */}
        <ListTable
          columns={otherColumns}
          data={filtered}
          rowKey={(p) => p}
          renderCell={renderOther}
          allSelected={selected.length === filtered.length}
          onToggleAll={(checked) => toggleAll(checked, filtered)}
          columnWidths={{}}
        />
      </div>

      {/* FOOTER BUTTONS */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <AwsButton
          label="Cancel"
          onClick={() =>
            navigate(`/dashboard/dorgusergroupdetails/${group_id}`)
          }
        />
        <AwsButton
          label="Add permissions"
          disabled={selected.length === 0}
          onClick={handleSave}
        />
      </div>

      {/* AWS arrow rotation */}
      <style>{`
        details[open] .aws-arrow {
          transform: rotate(90deg);
        }
        .aws-arrow {
          display: inline-block;
          transition: transform 0.15s ease-in-out;
          font-size: 11px;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
