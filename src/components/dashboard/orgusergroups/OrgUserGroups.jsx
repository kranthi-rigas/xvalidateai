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
import TablePreferencesModal from "../../common/TablePreferencesModal";
import AwsSettingsIconButton from "../../common/AwsSettingsIconButton";

export default function OrgUserGroups() {
  const [groups, setGroups] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const pageLoading = usePageLoader([groups]);
  const navigate = useNavigate();
  const orgExists = hasOrganization();
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const actionsRef = useRef(null);

  // ADMIN Check helper
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

  // Preferences modal
  const [showPreferences, setShowPreferences] = useState(false);

  /* ---------- Column Widths ---------- */
  const [columnWidths, setColumnWidths] = useState({
    name: 200,
    description: 250,
    permissions: 250,
    members: 120,
    created_at: 180,
  });

  const resizingCol = useRef(null);

  const startResize = (key, e) => {
    e.preventDefault();
    resizingCol.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key],
    };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!resizingCol.current) return;
      const { key, startX, startWidth } = resizingCol.current;
      setColumnWidths((prev) => ({
        ...prev,
        [key]: Math.max(120, startWidth + (e.clientX - startX)),
      }));
    };

    const onUp = () => (resizingCol.current = null);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  /* ---------- SORTING ---------- */
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  /* ---------- Table Preferences ---------- */
  const [pageSize, setPageSize] = useState(50);
  const [wrapLines, setWrapLines] = useState(false);
  const [stripedRows, setStripedRows] = useState(false);

  /* ---------- Column Visibility ---------- */
  const [visibleColumns, setVisibleColumns] = useState(
    Object.keys(columnWidths),
  );

  const toggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  /* ---------- SAFE NAME NORMALIZER ---------- */
  const normalizeName = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return typeof value.name === "string" ? value.name : "";
    }
    return String(value);
  };

  /* ---------- Capitalize First Letter ---------- */
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

  /* ---------- FILTERING + SORTING ---------- */
  const filtered = (groups || [])
    .filter((g) => {
      if (!search.trim()) return true;
      return buildSearchText(g).includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      return (a[sortConfig.key] > b[sortConfig.key] ? 1 : -1) * dir;
    });

  /* ---------- Search Helper ---------- */
  function buildSearchText(group) {
    const permissions = (group.permissions || []).join(" ");
    return [group.name, group.description, permissions, group.members]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  /* ---------- Pagination ---------- */
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filtered.slice(startIndex, endIndex);

  /* ---------- Selection ---------- */
  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleSelectAll = (checked) =>
    setSelected(checked ? filtered.map((g) => g.group_id) : []);

  /* ---------- Format Date ---------- */
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /* ---------- CREATE GROUP ---------- */
  const handleCreateGroup = async (payload) => {
    try {
      const res = await createGroup(payload);

      await fetchGroups();

      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /* ---------- DELETE ---------- */
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

  /* ---------- TABLE COLUMNS ---------- */
  const columns = [
    {
      key: "checkbox",
      label: "",
      width: 48,
      resizable: false,
      allSelected: filtered.length > 0 && selected.length === filtered.length,
      onToggleAll: toggleSelectAll,
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.includes(row.group_id)}
          onChange={() => toggleSelect(row.group_id)}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />
      ),
    },
    {
      key: "name",
      label: "Group Name",
      sortable: true,
      resizable: true,
    },
    {
      key: "description",
      label: "Description",
      resizable: true,
    },
    {
      key: "permissions",
      label: "Permissions",
      sortable: true,
      resizable: true,
    },
    {
      key: "members",
      label: "Users",
      sortable: true,
      resizable: true,
    },
    {
      key: "created_at",
      label: "Created At",
      sortable: true,
      resizable: true,
    },
  ];

  const renderCell = (row, key) => {
    switch (key) {
      case "checkbox":
        return columns[0].render(row);

      case "name":
        return (
          <span
            className="font-medium text-primary hover:underline cursor-pointer"
            onClick={() =>
              navigate(`/dashboard/orgusergroupdetails/${row.group_id}`)
            }
          >
            {row.name || "-"}
          </span>
        );

      case "description":
        return (
          <span
            className="truncate text-muted-foreground"
            title={row.description}
          >
            {row.description || "-"}
          </span>
        );

      case "permissions": {
        const rolesList = (row.permissions || []).map(capitalize);
        const text = rolesList.length ? rolesList.join(", ") : "-";
        return (
          <span className="text-muted-foreground" title={text}>
            {text}
          </span>
        );
      }

      case "members":
        return (
          <span className="text-muted-foreground">{row.members} users</span>
        );

      case "created_at":
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {formatDate(row.created_at)}
          </span>
        );

      default:
        return row[key] || "-";
    }
  };

  const visibleTableColumns = columns.filter(
    (col) => col.key === "checkbox" || visibleColumns.includes(col.key),
  );

  /* ---------- Actions Menu ---------- */
  const actionItems = (() => {
    if (!canManage || selected.length === 0) return [];

    // Multi-select or single-select: show delete
    return [{ key: "delete", label: "Delete", danger: true }];
  })();

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  return (
    <div className="space-y">
      <section className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[600px] overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-muted-foreground text-sm" />
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-11 pr-3 py-2.5 border border-border rounded-lg text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm appearance-none"
              placeholder="Search groups by name, description..."
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={async () => {
                setTableLoading(true);
                setSelected([]);
                await fetchGroups();
                setTimeout(() => setTableLoading(false), 300);
              }}
              title="Refresh"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>

            {/* Actions dropdown */}
            <div ref={actionsRef} className="relative">
              <ActionsMenu
                disabled={!canManage || selected.length === 0}
                items={actionItems}
                onSelect={(key) => {
                  if (key === "delete") {
                    setShowDeleteModal(true);
                  }
                }}
              />
            </div>

            {/* Preferences button */}
            <button
              onClick={() => setShowPreferences(true)}
              title="Table Preferences"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <AwsSettingsIconButton
                title="Preferences"
                onClick={() => setShowPreferences(true)}
              />
            </button>

            {/* Create Group Button */}
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
                className="flex items-center px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium shadow-md shadow-primary/20 transition-all transform hover:scale-[1.02]"
              />
            </OrgRequiredWrapper>
          </div>
        </div>

        {/* TABLE */}
        <div className="relative flex-1 overflow-hidden">
          {tableLoading && (
            <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center"></div>
          )}
          <ListTable
            columns={visibleTableColumns}
            data={paginatedData}
            rowKey="group_id"
            renderCell={renderCell}
            sortConfig={sortConfig}
            onSort={requestSort}
            columnWidths={columnWidths}
            startResize={startResize}
            loading={tableLoading}
            selectedCount={selected.length}
            selectionCounterLabel="group"
            pagination={{
              page,
              pageSize,
              total: filtered.length,
              onPageChange: setPage,
            }}
          />
        </div>
      </section>

      {/* MODALS */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onCreate={async (payload) => {
            const result = await handleCreateGroup(payload);
            if (result.success) {
              show("Group created successfully!", { type: "success" });
            }
            return result;
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
  );
}
