import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import RefreshButton from "../../common/RefreshButton";
import ActionsMenu from "../../common/ActionsMenu";
import AwsButton from "../../common/AwsButton";
import DeleteConfirmModal from "../../common/DeleteConfirmModal";
import ListTable from "../../common/ListTable";
import CreateGroupModal from "./CreateGroupModal";
import PageLoader from "@/components/common/PageLoader";
import usePageLoader from "@/data/usePageLoader";
import {
  createGroup,
  deleteGroup,
  getGroups,
} from "../../../apiIntegration/organization";
import useToast from "../../../hooks/useToast";
import OrgRequiredWrapper from "@/components/common/OrgRequiredWrapper";
import { hasOrganization } from "@/data/orgGuard";

export default function OrgUserGroups() {
  const [groups, setGroups] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const pageLoading = usePageLoader([groups]);
  const navigate = useNavigate();
  const orgExists = hasOrganization();

  //ADMIN Check helper
  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");

  const roles = Array.isArray(userInfo.roles)
    ? userInfo.roles
    : String(userInfo.roles || "").split(",");

  const isAdmin = roles.map((r) => r.toUpperCase()).includes("ADMIN");

  const hasOrg = hasOrganization();

  // FINAL PERMISSION
  const canManage = hasOrg && isAdmin;

  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const show = useToast();

  // ----------------------------------------------------
  // SAFE NAME NORMALIZER
  // ----------------------------------------------------
  const normalizeName = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return typeof value.name === "string" ? value.name : "";
    }
    return String(value);
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

    const maxWidth = (columnWidths[key] || 150) - 24; // subtract padding
    const textWidth = measureTextWidth(value);

    return textWidth > maxWidth;
  };

  // Capitalize First Letter
  const capitalize = (str) =>
    typeof str === "string"
      ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      : str;
  const fetchGroups = async () => {
    try {
      const res = await getGroups();

      const normalized = (res.groups || []).map((g) => ({
        ...g,
        name: normalizeName(g.name),
        description:
          typeof g.name === "object"
            ? g.name.description || ""
            : g.description || "",
        members: g.num_users || 0,
      }));

      setGroups(normalized);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // ----------------------------------------------------
  // FILTERING
  // ----------------------------------------------------
  const filtered = (groups || [])
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    .map((g) => ({
      ...g,
      __isSelected: selected.includes(g.group_id),
    }));

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

  // ----------------------------------------------------
  // CREATE GROUP
  // ----------------------------------------------------
  const handleCreateGroup = async (payload) => {
    try {
      const res = await createGroup(payload); // ← now sends name, desc, permissions, tags, metadata

      await fetchGroups();

      show("Group created successfully!", { type: "success" });

      return { success: true, data: res };
    } catch (err) {
      show("Error creating group", { type: "error" });

      return { success: false, error: err.message };
    }
  };

  // ----------------------------------------------------
  // DELETE
  // ----------------------------------------------------
  const handleConfirmDelete = async () => {
    setDeleteError("");

    try {
      for (const id of selected) {
        await deleteGroup(id);
      }

      await fetchGroups();
      setSelected([]);
      setShowDeleteModal(false);

      show("Group(s) deleted successfully!", { type: "success" });
    } catch (err) {
      setDeleteError("Failed to delete selected groups.");
    }
  };

  // ----------------------------------------------------
  // TABLE COLUMNS
  // ----------------------------------------------------
  /* ---------- Add columnWidths state ---------- */
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 60,
    name: 200,
    description: 250,
    permissions: 250,
    members: 120,
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

  const columns = [
    {
      key: "checkbox",
      label: "",
      width: 50,
      allSelected: filtered.length > 0 && selected.length === filtered.length,
      onToggleAll: (checked) =>
        setSelected(checked ? filtered.map((g) => g.group_id) : []),
    },
    {
      key: "name",
      label: "Group Name",
      sortable: true,
      resizable: true,
      width: 150,
    },
    { key: "description", label: "Description", resizable: true },
    {
      key: "permissions",
      label: "Permissions",
      sortable: true,
      resizable: true,
      width: 140,
    },
    {
      key: "members",
      label: "Users",
      sortable: true,
      resizable: true,
      width: 180,
    },
    {
      key: "created_at",
      label: "Created At",
      sortable: true,
      resizable: true,
      width: 180,
    },
  ];

  const renderCell = (row, key) => {
    if (key === "checkbox")
      return (
        <input
          type="checkbox"
          checked={selected.includes(row.group_id)}
          onChange={() =>
            setSelected((prev) =>
              prev.includes(row.group_id)
                ? prev.filter((x) => x !== row.group_id)
                : [...prev, row.group_id],
            )
          }
        />
      );

    if (key === "name")
      return (
        <span
          style={{ color: "#0972d3", fontWeight: 500, cursor: "pointer" }}
          onClick={() =>
            navigate(`/dashboard/orgusergroupdetails/${row.group_id}`)
          }
        >
          {row.name || "-"}
        </span>
      );

    if (key === "description") {
      const text = row.description || "-";

      const showTip = shouldShowTooltip(text, "description");

      return (
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: (columnWidths.description || 200) - 20,
            cursor: showTip ? "pointer" : "default",
          }}
          title={showTip ? text : ""}
        >
          {text}
        </div>
      );
    }

    if (key === "permissions") {
      const rolesList = (row.permissions || []).map(capitalize);
      const text = rolesList.length ? rolesList.join(", ") : "-";

      const showTip = shouldShowTooltip(text, "permissions");

      return (
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: (columnWidths.permissions || 150) - 20,
            cursor: showTip ? "pointer" : "default",
          }}
          title={showTip ? text : ""}
        >
          {text}
        </div>
      );
    }

    // ✅ FIXED
    if (key === "members") return `${row.members} users`;

    if (key === "created_at")
      return row.created_at ? new Date(row.created_at).toLocaleString() : "-";

    return row[key] || "-";
  };

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------
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
        {/* Toasts are shown via global ToastProvider */}

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
              placeholder="Search groups…"
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
            <RefreshButton
              onRefresh={fetchGroups}
              setTableLoading={setTableLoading}
            />

            <ActionsMenu
              selected={selected}
              onDelete={() => setShowDeleteModal(true)}
            />

            <OrgRequiredWrapper
              disabled={!canManage}
              message={
                !hasOrg
                  ? "Please create an organization before creating groups"
                  : "Only admin users can create user groups"
              }
            >
              <AwsButton
                label="+ Create Group"
                onClick={() => {
                  if (!canManage) return;
                  setShowCreateGroupModal(true);
                }}
              />
            </OrgRequiredWrapper>
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
              columns={columns}
              data={filtered}
              rowKey="group_id"
              renderCell={renderCell}
              sortConfig={sortConfig}
              onSort={handleSort}
              columnWidths={columnWidths}
              startResize={startResize} // <-- same as user table
            />

            {tableLoading && (
              <div className="table-refresh-overlay">
                <div className="table-spinner"></div>
              </div>
            )}
          </div>
        </div>

        {/* PAGINATION */}
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

        {/* CREATE MODAL */}
        {showCreateGroupModal && (
          <CreateGroupModal
            onClose={() => setShowCreateGroupModal(false)}
            onCreate={handleCreateGroup}
          />
        )}

        {/* DELETE MODAL */}
        {showDeleteModal && (
          <DeleteConfirmModal
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            error={deleteError}
            title="Delete Group"
            message="Are you sure you want to delete the selected group(s)?"
          />
        )}
      </div>
    </div>
  );
}

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
