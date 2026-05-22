import React, { useState, useEffect, useRef } from "react";
import ActionsMenu from "../../common/ActionsMenu";
import ListTable from "../../common/ListTable";
import { SlUserFollow } from "react-icons/sl";
import InviteUsersModal from "./InviteUsersModal";
import AwsButton from "../../common/AwsButton";
import {
  getUsers,
  inviteUsers,
  deleteUsers,
} from "../../../apiIntegration/organization";
import PageLoader from "@/components/common/PageLoader";
import usePageLoader from "@/data/usePageLoader";
import useToast from "../../../hooks/useToast";
import OrgRequiredWrapper from "@/components/common/OrgRequiredWrapper";
import { hasOrganization } from "@/data/orgGuard";
import TablePreferencesModal from "../../common/TablePreferencesModal";
import AwsSettingsIconButton from "../../common/AwsSettingsIconButton";
import EditUserModal from "./EditUserModal";
import DeleteUsersModal from "./DeleteUsersModal";

export default function OrgUsers({ refreshProjects }) {
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const pageLoading = usePageLoader([users]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const show = useToast();
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const actionsRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState([]);

  /* ---------- Role / Org checks ---------- */
  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const loggedInUserId = userInfo?.user_id || userInfo?.sub || "";

  // Derive the org_admin ID from the logged-in user's profile
  const orgAdminId = userInfo?.organization?.org_admin || "";

  const roles = Array.isArray(userInfo.roles)
    ? userInfo.roles
    : String(userInfo.roles || "").split(",");

  const isAdmin = roles.map((r) => r.toUpperCase()).includes("ADMIN");
  const hasOrg = hasOrganization();

  const DEFAULT_ORGS = ["xvalidateai", "myacademy51", "academy51"];
  const orgNameRaw = userInfo?.organization?.name;
  const orgName = (orgNameRaw || "").toLowerCase();
  const isDefaultOrg = !orgName || DEFAULT_ORGS.includes(orgName);
  const canManage = hasOrg && isAdmin && !isDefaultOrg;

  const [showPreferences, setShowPreferences] = useState(false);

  /* ---------- Column Widths ---------- */
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 60,
    email: 220,
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
      setUsers(res);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }

  /* ---------- Sorting ---------- */
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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

  function buildSearchText(user) {
    const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const email = user.email || "";
    const userRoles = (user.roles || []).join(" ");
    const status = user.status || "";
    return [name, email, userRoles, status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  /* ---------- Pagination ---------- */
  const startIndex = (page - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  /* ---------- Selection ---------- */
  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleSelectAll = (checked) =>
    setSelected(checked ? paginatedData.map((u) => u.user_id) : []);

  /* ---------- Helpers ---------- */
  const capitalize = (str) =>
    typeof str === "string"
      ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      : str;

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
    return (
      statusMap[(status || "").toLowerCase()] || {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      }
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(timestamp * 1000).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    setSelected([]);
  }, [page]);

  /* ---------- Columns ---------- */
  const columns = [
    {
      key: "checkbox",
      label: "",
      width: 48,
      resizable: false,
      allSelected:
        paginatedData.length > 0 &&
        paginatedData.every((u) => selected.includes(u.user_id)),
      onToggleAll: toggleSelectAll,
    },
    { key: "email", label: "Email", sortable: true, resizable: true },
    { key: "roles", label: "Roles", sortable: true, resizable: true },
    { key: "status", label: "Status", sortable: true, resizable: true },
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
        const text = (row.roles || []).map(capitalize).join(", ") || "-";
        return (
          <span className="text-muted-foreground" title={text}>
            {text}
          </span>
        );
      }
      case "status": {
        const badge = getStatusBadge(row.status);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}
          >
            {capitalize(row.status || "-")}
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

  /* ---------- Delete Guard ---------- */
  // A user is deletable if they are not the logged-in user AND not the org admin
  const isDeletable = (user) =>
    user.user_id !== loggedInUserId && user.user_id !== orgAdminId;

  const selectedUsers = (users || []).filter((u) =>
    selected.includes(u.user_id),
  );
  const deletableUsers = selectedUsers.filter(isDeletable);
  const nonDeletableCount = selectedUsers.length - deletableUsers.length;

  // Break down why users are non-deletable for precise tooltip messaging
  const selfSelected = selectedUsers.some((u) => u.user_id === loggedInUserId);
  const orgAdminSelected = selectedUsers.some(
    (u) => u.user_id === orgAdminId && u.user_id !== loggedInUserId,
  );

  // Block delete entirely if the org admin is among the selected — never allow deleting the owner
  const deleteEnabled =
    canManage &&
    selected.length > 0 &&
    deletableUsers.length > 0 &&
    !orgAdminSelected;

  const deleteTooltip = (() => {
    if (!canManage || selected.length === 0) return "";

    // Org admin is selected — always fully blocked, regardless of other selections
    if (orgAdminSelected)
      return "This user's email is associated with the current organization. Please contact support@xvalidateai.com.";

    // Only self selected and no one else deletable
    if (deletableUsers.length === 0 && selfSelected)
      return "You cannot delete your own account.";

    // Self is in selection alongside other deletable users — warn self will be skipped
    if (selfSelected)
      return `Your own account will be skipped. ${deletableUsers.length} user(s) will be deleted.`;

    return "";
  })();

  /* ---------- Actions Menu ---------- */
  const actionItems = (() => {
    if (!canManage || selected.length === 0) return [];

    const isSingleSelect = selected.length === 1;
    const selectedUser = isSingleSelect
      ? users?.find((u) => u.user_id === selected[0])
      : null;

    // Edit — single select only
    const editItem = (() => {
      if (!isSingleSelect) return null;
      const isSelf = selectedUser?.user_id === loggedInUserId;
      const isOrgOwner =
        orgAdminId && selectedUser?.user_id === orgAdminId && !isSelf;
      return {
        key: "edit",
        label: "Edit",
        disabled: isSelf || isOrgOwner,
        tooltip: isSelf
          ? "You can't edit your own account. Ask another admin to make changes."
          : isOrgOwner
            ? "This user is the organization owner. Please contact support@xvalidateai.com to make changes."
            : "",
        onClick: () => {
          if (isSelf || isOrgOwner) return;
          setEditingUser(selectedUser);
          setShowEditModal(true);
        },
      };
    })();

    // Delete — single or multi
    const deleteItem = {
      key: "delete",
      label:
        selected.length > 1 ? `Delete (${deletableUsers.length})` : "Delete",
      danger: true,
      disabled: !deleteEnabled,
      tooltip: deleteTooltip,
      onClick: () => {
        if (!deleteEnabled) return;
        setUsersToDelete(deletableUsers);
        setShowDeleteModal(true);
      },
    };

    return [...(editItem ? [editItem] : []), deleteItem];
  })();

  if (pageLoading) return <PageLoader loading={true} />;

  return (
    <div className="space-y">
      <section className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[600px] overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-96">
            <div className="relative flex-1">
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

            {/* Refresh – mobile */}
            <button
              onClick={async () => {
                setTableLoading(true);
                setSelected([]);
                await loadUsers();
                setTimeout(() => setTableLoading(false), 300);
              }}
              title="Refresh"
              className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <i className="fa-solid fa-rotate-right" />
            </button>

            {/* Preferences – mobile */}
            <button
              onClick={() => setShowPreferences(true)}
              className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <AwsSettingsIconButton
                title="Preferences"
                onClick={() => setShowPreferences(true)}
              />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh – desktop */}
            <button
              onClick={async () => {
                setTableLoading(true);
                setSelected([]);
                await loadUsers();
                setTimeout(() => setTableLoading(false), 300);
              }}
              title="Refresh"
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <i className="fa-solid fa-rotate-right" />
            </button>

            {/* Actions dropdown */}
            <div ref={actionsRef} className="relative">
              <ActionsMenu
                disabled={!canManage || selected.length === 0}
                items={actionItems}
                onSelect={(key) => {
                  const item = actionItems.find((a) => a.key === key);
                  if (item?.onClick) item.onClick();
                }}
              />
            </div>

            {/* Preferences – desktop */}
            <button
              onClick={() => setShowPreferences(true)}
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <AwsSettingsIconButton
                title="Preferences"
                onClick={() => setShowPreferences(true)}
              />
            </button>

            {/* Invite Users */}
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
            <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center" />
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
          onInvite={async (emails, roles) => {
            try {
              const res = await inviteUsers({ emails, roles });
              const failed = res?.failed_invitations || [];
              const invited = res?.invited_users || [];
              if (failed.length > 0 && invited.length === 0) {
                failed.forEach((f) =>
                  show(`${f.email}: ${f.reason}`, {
                    type: "error",
                    duration: 5000,
                  }),
                );
                return { success: false };
              }
              if (failed.length > 0 && invited.length > 0) {
                show(`${invited.length} user(s) invited successfully.`, {
                  type: "success",
                });
                failed.forEach((f) =>
                  show(`${f.email}: ${f.reason}`, {
                    type: "error",
                    duration: 5000,
                  }),
                );
                loadUsers();
                return { success: true };
              }
              show("Users invited successfully!", { type: "success" });
              loadUsers();
              return { success: true };
            } catch (err) {
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

      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSave={async () => {
            setSelected([]);
            await loadUsers();
          }}
        />
      )}

      {showDeleteModal && usersToDelete.length > 0 && (
        <DeleteUsersModal
          users={usersToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setUsersToDelete([]);
          }}
          onDeleted={() => {
            setSelected([]);
            loadUsers();
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
