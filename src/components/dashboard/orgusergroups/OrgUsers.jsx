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

  const DEFAULT_ORGS = ["xvalidateai", "myacademy51", "academy51"];

  const orgNameRaw = userInfo?.organization?.name;
  const orgName = (orgNameRaw || "").toLowerCase();

  /* ⭐ Treat empty/null as default */
  const isDefaultOrg = !orgName || DEFAULT_ORGS.includes(orgName);

  const canManage = hasOrg && isAdmin && !isDefaultOrg;

  // Preferences modal
  const [showPreferences, setShowPreferences] = useState(false);

  /* ---------- Column Widths ---------- */
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

  /* ---------- Filtered + Sorted ---------- */
  const filtered = (users || [])
    .filter((u) => {
      if (!search.trim()) return true;
      return buildSearchText(u).includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      return (a[sortConfig.key] > b[sortConfig.key] ? 1 : -1) * dir;
    });

  /* ---------- Search Helper ---------- */
  function buildSearchText(user) {
    const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const email = user.email || "";
    const roles = (user.roles || []).join(" ");
    const groups = (user.groups || [])
      .map((g) => (typeof g.name === "object" ? g.name.name : g.name))
      .join(" ");
    const status = user.status || "";

    return [name, email, roles, groups, status]
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
    setSelected(checked ? filtered.map((u) => u.user_id) : []);

  /* ---------- Capitalize First Letter ---------- */
  const capitalize = (str) =>
    typeof str === "string"
      ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      : str;

  /* ---------- Get Status Badge ---------- */
  const getStatusBadge = (status) => {
    const statusMap = {
      invited: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      },
      active: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      },
      inactive: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      },
    };

    const lowerStatus = (status || "").toLowerCase();
    return (
      statusMap[lowerStatus] || {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      }
    );
  };

  /* ---------- Format Date ---------- */
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /* ---------- Columns ---------- */
  const columns = [
    {
      key: "checkbox",
      label: "",
      width: 48,
      resizable: false,
      allSelected: filtered.length > 0 && selected.length === filtered.length,
      onToggleAll: toggleSelectAll,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      resizable: true,
    },
    {
      key: "groups",
      label: "Groups",
      sortable: false,
      resizable: true,
    },
    {
      key: "roles",
      label: "Roles",
      sortable: true,
      resizable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      resizable: true,
    },
    {
      key: "created_at",
      label: "Creation Time",
      sortable: true,
      resizable: true,
    },
  ];

  /* ---------- Render Cell ---------- */
  const renderCell = (row, key) => {
    switch (key) {
      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={selected.includes(row.user_id)}
            onChange={() => toggleSelect(row.user_id)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
        );

      case "email":
        return (
          <span className="text-muted-foreground">{row.email || "-"}</span>
        );

      case "roles": {
        const rolesList = (row.roles || []).map(capitalize);
        const text = rolesList.length ? rolesList.join(", ") : "-";
        return (
          <span className="text-muted-foreground" title={text}>
            {text}
          </span>
        );
      }

      case "groups": {
        const groups =
          row.groups
            ?.map((g) => (typeof g.name === "object" ? g.name.name : g.name))
            .join(", ") || "-";

        return (
          <span className="truncate text-muted-foreground" title={groups}>
            {groups}
          </span>
        );
      }

      case "status": {
        const badge = getStatusBadge(row.status);
        const statusText = capitalize(row.status || "-");

        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}
          >
            {statusText}
          </span>
        );
      }

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

    // Multi-select: could add bulk actions here
    if (selected.length > 1) return [];

    // Single select: add edit/delete actions
    return [
      { key: "edit", label: "Edit", disabled: true },
      { key: "delete", label: "Delete", danger: true, disabled: true },
    ];
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
              placeholder="Search users by name, email, role..."
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={async () => {
                setTableLoading(true);
                setSelected([]);
                await loadUsers();
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
                onSelect={() => {}}
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

            {/* Invite Users Button */}
            <OrgRequiredWrapper
              disabled={!canManage}
              message={
                !hasOrg || isDefaultOrg
                  ? "Please create your organization before inviting users"
                  : "Only admin users can invite users"
              }
            >
              <AwsButton
                disabled={!canManage}
                onClick={() => {
                  if (!canManage) return;
                  setShowInviteModal(true);
                }}
                className="flex items-center px-5 py-2.5 shadow-md transition-all transform hover:scale-[1.02]"
              >
                <SlUserFollow size={15} className="mr-2" />
                Invite Users
              </AwsButton>
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
            rowKey="user_id"
            renderCell={renderCell}
            sortConfig={sortConfig}
            onSort={requestSort}
            columnWidths={columnWidths}
            startResize={startResize}
            loading={tableLoading}
            selectedCount={selected.length}
            selectionCounterLabel="user"
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
