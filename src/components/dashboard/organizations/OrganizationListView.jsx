import React, { useState, useEffect, useRef } from "react";
import ListTable from "../../common/ListTable";
import RefreshButton from "../../common/RefreshButton";
import ActionsMenu from "../../common/ActionsMenu";
import AwsButton from "../../common/AwsButton";
import { useNavigate, Link } from "react-router-dom";
import OrganizationDetails from "./OrganizationDetails";
import PageLoader from "../../common/PageLoader";
import usePageLoader from "@/data/usePageLoader";
import { getOrganizations } from "../../../apiIntegration/organization";
import ReviewOrganizationModal from "./ReviewOrganizationModal";
import TablePreferencesModal from "../../common/TablePreferencesModal";
import AwsSettingsIconButton from "../../common/AwsSettingsIconButton";
import CreateOrganizationModal from "./CreateOrganization";
import OrgRequiredWrapper from "@/components/common/OrgRequiredWrapper";

export default function OrganizationListView() {
  const navigate = useNavigate();
  const [viewOrg, setViewOrg] = useState(null);
  const [organizations, setOrganizations] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [activeOrg, setActiveOrg] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [showPreferences, setShowPreferences] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const [page, setPage] = useState(1);
  const actionsRef = useRef(null);

  /* ---------- Action Menu Items ---------- */
  const ORG_ACTIONS = [
    { key: "ACTIVATE", label: "Activate" },
    { key: "SUSPEND", label: "Suspend" },
    { key: "DEACTIVATE", label: "Deactivate" },
    { key: "REJECT", label: "Reject" },
  ];

  /* ---------- Column Widths ---------- */
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 60,
    name: 220,
    status: 160,
    email: 230,
    address: 300,
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

  /* ---------- Table Preferences ---------- */
  const [pageSize, setPageSize] = useState(50);
  const [wrapLines, setWrapLines] = useState(false);
  const [stripedRows, setStripedRows] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(
    Object.keys(columnWidths),
  );

  const toggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  };

  /* ---------- FETCH DATA ---------- */
  const loadOrganizations = async ({ showPageLoader = false } = {}) => {
    try {
      if (showPageLoader) setPageLoading(true);
      else setTableLoading(true);

      const res = await getOrganizations();
      setOrganizations(res.organizations || []);
    } catch (err) {
      console.error("Error loading organizations:", err);
    } finally {
      if (showPageLoader) setPageLoading(false);
      else setTableLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations({ showPageLoader: true });
  }, []);

  /* ---------- ADMIN CHECK ---------- */
  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");

  const roles = Array.isArray(userInfo.roles)
    ? userInfo.roles
    : String(userInfo.roles || "").split(",");

  const isAdmin = roles.map((r) => r.toUpperCase()).includes("ADMIN");

  const planType = userInfo?.plan?.plan_type?.toUpperCase() || "FREE";
  const isEnterprisePlan = planType === "ENTERPRISE";
  const isFreePlan = planType === "FREE";

  const DEFAULT_ORGS = ["academy51", "myacademy51", "xvalidateai"];

  const orgList = organizations || [];

  const nonDefaultOrgCount = orgList.filter(
    (org) => !DEFAULT_ORGS.includes((org.name || "").toLowerCase()),
  ).length;

  const hasReachedOrgLimit = !isEnterprisePlan && nonDefaultOrgCount >= 1;
  const canCreateOrg = isAdmin && !hasReachedOrgLimit && !isFreePlan;

  const createOrgTooltip = !isAdmin
    ? "Only admin users can create an organization"
    : isFreePlan
      ? "As per your Free plan, creating organizations is not available. Please upgrade to the Business plan to avail this feature."
      : hasReachedOrgLimit
        ? "Your current plan allows only one organization. Please upgrade to the Enterprise plan to create more."
        : "";

  /* ---------- SEARCH ---------- */
  const filtered = (organizations || [])
    .filter((o) => {
      if (!search.trim()) return true;
      return buildSearchText(o).includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      return (a[sortConfig.key] > b[sortConfig.key] ? 1 : -1) * dir;
    });

  /* ---------- Search Helper ---------- */
  function buildSearchText(org) {
    return [org.org_id, org.name, org.status, org.email, org.address]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  /* ---------- PAGINATION ---------- */
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filtered.slice(startIndex, endIndex);

  /* ---------- SORTING ---------- */
  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  /* ---------- SELECTION ---------- */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (checked) =>
    setSelected(checked ? filtered.map((x) => x.org_id) : []);

  /* ---------- Actions Menu Items ---------- */
  const actionItems = (() => {
    if (!isAdmin || selected.length === 0) return [];

    // Multi-select: no actions
    if (selected.length > 1) return [];

    // Single select: show all actions
    return ORG_ACTIONS;
  })();

  /* ---------- TABLE COLUMNS ---------- */
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
      key: "name",
      label: "Organization Name",
      sortable: true,
      resizable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      resizable: true,
    },
    { key: "email", label: "Email", sortable: true, resizable: true },
    { key: "address", label: "Address", sortable: false, resizable: true },
    {
      key: "created_at",
      label: "Created At",
      sortable: true,
      resizable: true,
      sortKey: "created_at",
    },
  ];

  /* ---------- Get Status Badge ---------- */
  const getStatusBadge = (status) => {
    const statusMap = {
      ACTIVE: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      },
      SUSPENDED: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
      },
      DEACTIVATED: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      },
      REJECTED: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      },
      PENDING: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      },
    };

    const upperStatus = (status || "").toUpperCase();
    return (
      statusMap[upperStatus] || {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      }
    );
  };

  /* ---------- Format Date ---------- */
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const utcDate = new Date(dateString + "Z");
    return utcDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  /* ---------- RENDER CELL ---------- */
  const renderCell = (row, key) => {
    switch (key) {
      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={selected.includes(row.org_id)}
            onChange={() => toggleSelect(row.org_id)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
        );

      case "name":
        return (
          <span
            className="font-medium text-primary hover:underline cursor-pointer"
            onClick={() => setViewOrg(row)}
          >
            {row.name || "-"}
          </span>
        );

      case "status": {
        const badge = getStatusBadge(row.status);
        const status = (row.status || "").toLowerCase();

        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }

      case "email":
        return (
          <span className="text-muted-foreground">{row.email || "-"}</span>
        );

      case "address":
        return (
          <span className="truncate text-muted-foreground" title={row.address}>
            {row.address || "-"}
          </span>
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

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  return viewOrg ? (
    <OrganizationDetails
      organization={viewOrg}
      onBack={() => setViewOrg(null)}
    />
  ) : (
    <div className="space-y">
      <section className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[600px] overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search + mobile refresh */}
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
                placeholder="Search organizations..."
              />
            </div>

            {/* Refresh – mobile only */}
            <button
              onClick={async () => {
                setTableLoading(true);
                setSelected([]);
                await loadOrganizations();
                setTimeout(() => setTableLoading(false), 300);
              }}
              title="Refresh"
              className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>

            {/* Preferences – mobile only */}
            <button
              onClick={() => setShowPreferences(true)}
              title="Table Preferences"
              className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <AwsSettingsIconButton
                title="Preferences"
                onClick={() => setShowPreferences(true)}
              />
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Refresh – desktop only */}
            <button
              onClick={async () => {
                setTableLoading(true);
                setSelected([]);
                await loadOrganizations();
                setTimeout(() => setTableLoading(false), 300);
              }}
              title="Refresh"
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>

            {/* Actions dropdown */}
            <div ref={actionsRef} className="relative">
              <ActionsMenu
                disabled={!isAdmin || selected.length !== 1}
                items={actionItems}
                onSelect={(actionKey) => {
                  if (!isAdmin) return;

                  const orgId = selected[0];
                  const org = organizations.find((o) => o.org_id === orgId);

                  if (!org) {
                    console.error("Selected organization not found");
                    return;
                  }

                  setActiveOrg(org);
                  setSelectedAction(actionKey);
                  setShowReviewModal(true);
                }}
              />
            </div>

            {/* Preferences button – desktop only */}
            <button
              onClick={() => setShowPreferences(true)}
              title="Table Preferences"
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <AwsSettingsIconButton
                title="Preferences"
                onClick={() => setShowPreferences(true)}
              />
            </button>

            {/* Create Organization Button */}
            <OrgRequiredWrapper
              disabled={!canCreateOrg}
              message={createOrgTooltip}
            >
              <AwsButton
                //disabled={!canCreateOrg}
                label={
                  isFreePlan
                    ? "🔒 Create Organization"
                    : "+ Create Organization"
                }
                aria-disabled={!canCreateOrg}
                onClick={() => {
                  if (!canCreateOrg) return;
                  setShowCreateOrgModal(true);
                }}
                className="flex items-center px-5 py-2.5 rounded-lg text-sm font-medium shadow-md transition-all transform hover:scale-[1.02]"
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
            rowKey="org_id"
            renderCell={renderCell}
            sortConfig={sortConfig}
            onSort={requestSort}
            columnWidths={columnWidths}
            startResize={startResize}
            loading={tableLoading}
            selectedCount={selected.length}
            selectionCounterLabel="organization"
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
      {showReviewModal && (
        <ReviewOrganizationModal
          organization={activeOrg}
          action={selectedAction}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            setSelected([]);
            loadOrganizations();
          }}
        />
      )}

      {showCreateOrgModal && (
        <CreateOrganizationModal
          setShowCreateModal={setShowCreateOrgModal}
          onSuccess={() => {
            setShowCreateOrgModal(false);
            loadOrganizations();
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
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
          columns={columns}
        />
      )}
    </div>
  );
}
