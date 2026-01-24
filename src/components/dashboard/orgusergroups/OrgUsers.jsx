import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ActionsMenu from "../../common/ActionsMenu";
import ListTable from "../../common/ListTable";
import { SlUserFollow } from "react-icons/sl";
import InviteUsersModal from "./InviteUsersModal";
import AwsButton from "../../common/AwsButton";
import RefreshButton from "../../common/RefreshButton";
import { getUsers, inviteUsers } from "../../../apiIntegration/organization";
import PageLoader from "@/components/common/PageLoader";
import usePageLoader from "@/data/usePageLoader";
import useToast from "../../../hooks/useToast";
import OrgRequiredWrapper from "@/components/common/OrgRequiredWrapper";
import { hasOrganization } from "@/data/orgGuard";
import TablePreferencesModal from "../../common/TablePreferencesModal";
import AwsSettingsIconButton from "../../common/AwsSettingsIconButton";

export default function OrgUsers({ refreshProjects }) {
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const pageLoading = usePageLoader([users]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const show = useToast();
  const orgExists = hasOrganization();

  // ADMIN + ORG context
  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");

  // ---------- ROLES ----------
  const roles = Array.isArray(userInfo.roles)
    ? userInfo.roles
    : String(userInfo.roles || "").split(",");

  // ADMIN check
  const isAdmin = roles.map((r) => r.toUpperCase()).includes("ADMIN");

  // ---------- ORGANIZATION ----------
  const hasOrg = hasOrganization();

  // normalize org name safely
  const orgName = (userInfo.organization?.name || "").trim().toLowerCase();

  // default orgs should behave like "no org"
  const isDefaultOrg = orgName === "academy51" || orgName === "myacademy51";

  // ✅ VALID org = exists AND not default
  const hasValidOrg = hasOrg && !isDefaultOrg;

  // ✅ FINAL permission (authoritative)
  const canManage = hasValidOrg && isAdmin;

  // Preferences modal
  const [showPreferences, setShowPreferences] = useState(false);

  /* ---------- Add columnWidths state ---------- */
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 60,
    email: 220,
    groups: 150,
    roles: 140,
    status: 120,
    created_at: 180,
  });

  const resizingCol = useRef(null);

  const startResize = (key, e) => {
    resizingCol.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key],
    };
  };

  const handleResize = (e) => {
    if (!resizingCol.current) return;

    const { key, startX, startWidth } = resizingCol.current;
    const newWidth = Math.max(80, startWidth + (e.clientX - startX));

    setColumnWidths((prev) => ({
      ...prev,
      [key]: newWidth,
    }));
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", () => (resizingCol.current = null));

    return () => {
      window.removeEventListener("mousemove", handleResize);
    };
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await getUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }

  // ---------- Filtered ----------
  const filtered = (users || [])
    .filter((u) => {
      const name = `${u.first_name || ""} ${u.last_name || ""}`.trim();
      const email = u.email || "";
      return `${name} ${email}`.toLowerCase().includes(search.toLowerCase());
    })
    .map((u) => ({ ...u, __isSelected: selected.includes(u.user_id) }));

  // ---------- SORTING ----------
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  //Tooltip
  // Measure exact pixel-width of text
  const measureTextWidth = (text, font = "14px Amazon Ember") => {
    const canvas =
      measureTextWidth.canvas ||
      (measureTextWidth.canvas = document.createElement("canvas"));
    const ctx = canvas.getContext("2d");
    ctx.font = font;
    return ctx.measureText(text).width;
  };

  // Check if tooltip is needed (text is truncated)
  const shouldShowTooltip = (value, key) => {
    if (!value) return false;

    const maxWidth = columnWidths[key] - 24; // subtract padding
    const textWidth = measureTextWidth(value);

    return textWidth > maxWidth;
  };

  // Capitalize First Letter
  const capitalize = (str) =>
    typeof str === "string"
      ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      : str;

  // Status → Color Mapping
  const getStatusColor = (status) => {
    if (!status) return "#374151"; // default grey

    const s = status.toLowerCase();

    if (s === "invited") return "#1D4ED8"; // BLUE
    if (s === "active") return "#059669"; // GREEN
    if (s === "inactive") return "#DC2626"; // RED

    return "#374151"; // fallback grey
  };

  // ---------- Columns ----------
  const columns = [
    {
      key: "checkbox",
      label: "",
      width: 50,
      sortable: false,
      resizable: false,

      // ⭐ Select-all should work only if rows exist
      allSelected: filtered.length > 0 && selected.length === filtered.length,

      // ⭐ Select-all toggle: works for all users
      onToggleAll: (checked) =>
        setSelected(checked ? filtered.map((u) => u.user_id) : []),
    },

    {
      key: "email",
      label: "Email",
      sortable: true,
      resizable: true,
      width: 220,
    },
    {
      key: "groups",
      label: "Groups",
      sortable: false,
      resizable: true,
      width: 150,
    },
    {
      key: "roles",
      label: "Roles",
      sortable: true,
      resizable: true,
      width: 140,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      resizable: true,
      width: 120,
    },
    {
      key: "created_at",
      label: "Creation Time",
      sortable: true,
      resizable: true,
      width: 180,
    },
  ];
  // ---------- Render Cell ----------
  const renderCell = (row, key) => {
    if (key === "checkbox")
      return (
        <input
          type="checkbox"
          checked={selected.includes(row.user_id)}
          onChange={() =>
            setSelected((prev) =>
              prev.includes(row.user_id)
                ? prev.filter((x) => x !== row.user_id)
                : [...prev, row.user_id],
            )
          }
        />
      );

    // -------------------- EMAIL --------------------
    if (key === "email") {
      const text = row.email || "";
      const showTip = shouldShowTooltip(text, "email");

      return (
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: columnWidths.email - 20,
            cursor: showTip ? "pointer" : "default",
          }}
          title={showTip ? text : ""}
        >
          {text}
        </div>
      );
    }

    // -------------------- ROLES --------------------
    if (key === "roles") {
      const rolesList = (row.roles || []).map(capitalize);
      const text = rolesList.length ? rolesList.join(", ") : "-";
      const showTip = shouldShowTooltip(text, "roles");
      return (
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: columnWidths.roles - 20,
            cursor: showTip ? "pointer" : "default",
          }}
          title={showTip ? text : ""}
        >
          {text}
        </div>
      );
    }

    // -------------------- GROUPS --------------------
    if (key === "groups") {
      const groups =
        row.groups
          ?.map((g) => (typeof g.name === "object" ? g.name.name : g.name))
          .join(", ") || "-";

      const showTip = shouldShowTooltip(groups, "groups");

      return (
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: columnWidths.groups - 20,
            cursor: showTip ? "pointer" : "default",
          }}
          title={showTip ? groups : ""}
        >
          {groups}
        </div>
      );
    }
    // -------------------- STATUS --------------------
    if (key === "status") {
      const statusText = capitalize(row.status || "-");
      const color = getStatusColor(row.status);
      const showTip = shouldShowTooltip(statusText, "status");

      return (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 12,
            background: "#F3F4F6",
            color,
            fontWeight: 600,
            cursor: showTip ? "pointer" : "default",
          }}
          title={showTip ? statusText : ""}
        >
          {statusText}
        </span>
      );
    }

    // -------------------- CREATED AT --------------------
    if (key === "created_at") {
      return row.created_at
        ? new Date(row.created_at * 1000).toLocaleString()
        : "-";
    }

    return row[key] || "-";
  };

  // Table preferences
  const [pageSize, setPageSize] = useState(25);
  const [wrapLines, setWrapLines] = useState(false);
  const [stripedRows, setStripedRows] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState(
    columns.map((c) => c.key),
  );
  const toggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };
  const visibleCols = columns.filter((c) => visibleColumns.includes(c.key));

  // ---------- Table Refresh ---------- //
  const [tableLoading, setTableLoading] = useState(false);
  {
    tableLoading && (
      <div className="table-refresh-overlay">
        <div className="table-spinner"></div>
      </div>
    );
  }

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }
  return (
    <div className="dashboard__content">
      <div className="dashboard-body">
        {/* ---------- TOP BAR ---------- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            gap: 12,
          }}
        >
          {/* Search */}
          <div style={{ flex: 1, maxWidth: 420 }}>
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid #D1D5DB",
                background: "#F8F9FC",
                fontSize: 14,
                height: 40,
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Refresh Button */}
            <RefreshButton
              onRefresh={loadUsers}
              setTableLoading={setTableLoading}
            />

            <ActionsMenu
              selected={selected}
              items={
                isAdmin
                  ? [
                      {
                        key: "edit",
                        label: "Edit",
                        onClick: () => alert("Edit user: " + selected[0]),
                      },
                      {
                        key: "delete",
                        label: "Delete",
                        danger: true,
                        onClick: () => alert("Delete users: " + selected),
                      },
                    ]
                  : [] // 🔥 NON-ADMIN → NO DROPDOWN ITEMS
              }
            />

            <OrgRequiredWrapper
              disabled={!canManage}
              message={
                !hasOrg || isDefaultOrg
                  ? "Please create an organization before inviting users"
                  : !isAdmin
                    ? "Only admin users can invite users"
                    : ""
              }
            >
              <AwsButton
                label="Invite Users"
                onClick={() => {
                  if (!canManage) return;
                  setShowInviteModal(true);
                }}
              >
                <SlUserFollow size={15} />
              </AwsButton>
            </OrgRequiredWrapper>
            <AwsSettingsIconButton
              onClick={() => setShowPreferences(true)}
              title="Preferences"
            />
          </div>
        </div>

        {/* ---------- TABLE ---------- */}
        <div
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div style={{ position: "relative" }}>
            <ListTable
              columns={visibleCols}
              data={filtered.slice(0, pageSize)}
              rowKey="user_id"
              renderCell={renderCell}
              sortConfig={sortConfig}
              onSort={handleSort}
              columnWidths={columnWidths}
              startResize={startResize}
            />

            {tableLoading && (
              <div className="table-refresh-overlay">
                <div className="table-spinner"></div>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Pagination ---------- */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <button style={pgBtn}>{"<"}</button>
          <span style={pageTag}>1</span>
          <button style={pgBtn}>{">"}</button>
        </div>
      </div>

      {/* ---------- MODAL ---------- */}
      {showInviteModal && (
        <InviteUsersModal
          onClose={() => setShowInviteModal(false)}
          onInvite={async (emails, roles, groups) => {
            try {
              const res = await inviteUsers({
                emails,
                roles,
                groups,
              });

              show("Users invited successfully!", { type: "success" });

              loadUsers();
              return { success: true };
            } catch (err) {
              console.error("Invite failed:", err);

              let message = "Failed to invite users";

              try {
                const parsed = JSON.parse(err.message);
                message = parsed.message || message;
              } catch {}

              show(message, { type: "error" });

              return { success: false, error: message };
            }
          }}
        />
      )}
      {showPreferences && (
        <TablePreferencesModal
          open={showPreferences}
          onClose={() => setShowPreferences(false)}
          pageSize={pageSize}
          setPageSize={setPageSize}
          wrapLines={wrapLines}
          setWrapLines={setWrapLines}
          stripedRows={stripedRows}
          setStripedRows={setStripedRows}
          columns={columns}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
        />
      )}
    </div>
  );
}

/* ---------- Pagination Styles ---------- */
const pgBtn = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "#F3F4F6",
  border: "1px solid #D1D5DB",
  cursor: "pointer",
};

const pageTag = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "#EEF2FF",
};
