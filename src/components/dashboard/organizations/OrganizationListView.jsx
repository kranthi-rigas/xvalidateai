import React, { useState, useEffect, useRef } from "react";
import ListTable, { LinkStyle as TableLink } from "../../common/ListTable";
import RefreshButton from "../../common/RefreshButton";
import ActionsMenu from "../../common/ActionsMenu";
import AwsButton from "../../common/AwsButton";
import { useNavigate, Link } from "react-router-dom";
import OrganizationDetails from "./OrganizationDetails";
import PageLoader from "../../common/PageLoader";
import usePageLoader from "@/data/usePageLoader";
import { getOrganizations } from "../../../apiIntegration/organization"; // you will create these APIs
import ReviewOrganizationModal from "./ReviewOrganizationModal";
import TablePreferencesModal from "../../common/TablePreferencesModal";
import AwsSettingsIconButton from "../../common/AwsSettingsIconButton";

export default function OrganizationListView({ setShowCreateModal }) {
  const navigate = useNavigate();
  const [viewOrg, setViewOrg] = useState(null);
  const [organizations, setOrganizations] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [activeOrg, setActiveOrg] = useState(null);
  const pageLoading = usePageLoader([organizations]);
  const [showPreferences, setShowPreferences] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  //action menu helper
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
    slug: 180,
    email: 230,
    address: 300,
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

    setColumnWidths((prev) => ({ ...prev, [key]: newWidth }));
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", () => (resizingCol.current = null));

    return () => window.removeEventListener("mousemove", handleResize);
  }, []);

  /* ---------- FETCH DATA ---------- */
  const loadOrganizations = async () => {
    try {
      const res = await getOrganizations();
      setOrganizations(res.organizations || []);
    } catch (err) {
      console.error("Error loading organizations:", err);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  /* ---------- SEARCH ---------- */
  const filtered = (organizations || [])
    .filter((o) => (o.name || "").toLowerCase().includes(search.toLowerCase()))
    .map((o) => ({
      ...o,
      __isSelected: selected.includes(o.org_id),
    }));

  /* ---------- SORTING ---------- */
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";

    setSortConfig({ key, direction });
  };

  /* ---------- SELECTION ---------- */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (checked) =>
    setSelected(checked ? filtered.map((x) => x.org_id) : []);

  /* ---------- TABLE COLUMNS ---------- */
  const columns = [
    {
      key: "checkbox",
      label: "",
      width: 60,
      sortable: false,
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

    { key: "slug", label: "Slug", sortable: true, resizable: true },
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

  /* ---------- RENDER CELL ---------- */
  const renderCell = (row, key) => {
    if (key === "checkbox")
      return (
        <input
          type="checkbox"
          checked={selected.includes(row.org_id)}
          onChange={() => toggleSelect(row.org_id)}
        />
      );

    if (key === "name")
      return (
        <span
          style={TableLink}
          onMouseDown={(e) => e.stopPropagation()} // 🔥 critical
          onClick={(e) => {
            e.stopPropagation(); // 🔥 critical
            setViewOrg(row);
          }}
        >
          {row.name || "-"}
        </span>
      );

    if (key === "status") {
      const status = (row.status || "").toUpperCase();

      const colorMap = {
        ACTIVE: { bg: "#ECFDF5", text: "#065F46" },
        SUSPENDED: { bg: "#FEF3C7", text: "#92400E" },
        DEACTIVATED: { bg: "#F3F4F6", text: "#374151" },
        REJECTED: { bg: "#FEE2E2", text: "#991B1B" },
        PENDING: { bg: "#E0E7FF", text: "#3730A3" },
      };

      const colors = colorMap[status] || {
        bg: "#F3F4F6",
        text: "#374151",
      };

      return (
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 600,
            background: colors.bg,
            color: colors.text,
            textTransform: "capitalize",
          }}
        >
          {status.toLowerCase()}
        </span>
      );
    }

    if (key === "created_at")
      return row.created_at ? new Date(row.created_at).toLocaleString() : "-";

    return row[key] || "-";
  };

  //page spineer helper

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  return viewOrg ? (
    <OrganizationDetails
      organization={viewOrg}
      onBack={() => setViewOrg(null)}
    />
  ) : (
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
              placeholder="Search organizations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid #D1D5DB",
                background: "#F9FAFB",
                fontSize: 14,
                height: 40,
                fontFamily: "Amazon Ember, sans-serif",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <RefreshButton
              onRefresh={loadOrganizations}
              setTableLoading={setTableLoading}
            />

            <ActionsMenu
              selected={selected}
              items={ORG_ACTIONS}
              disabled={selected.length !== 1}
              onSelect={(actionKey) => {
                const orgId = selected[0];
                const org = organizations.find((o) => o.org_id === orgId);

                if (!org) {
                  console.error("Selected organization not found");
                  return;
                }

                setActiveOrg(org); // ✅ SET ACTIVE ORG
                setSelectedAction(actionKey);
                setShowReviewModal(true);
              }}
            />

            <AwsButton
              label="+ Create Organization"
              onClick={() => navigate("/dashboard/createorganization")}
            />
            <AwsSettingsIconButton
              onClick={() => setShowPreferences(true)}
              title="Preferences"
            />
          </div>
        </div>

        {/* ---------- TABLE ---------- */}
        <div style={{ position: "relative" }}>
          <ListTable
            columns={columns}
            data={filtered}
            rowKey="org_id"
            renderCell={renderCell}
            sortConfig={sortConfig}
            onSort={requestSort}
            columnWidths={columnWidths}
            startResize={startResize}
          />

          {tableLoading && (
            <div className="table-refresh-overlay">
              <div className="table-spinner"></div>
            </div>
          )}
        </div>

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

        {showPreferences && (
          <TablePreferencesModal
            open={showPreferences}
            onClose={() => setShowPreferences(false)}
            /* These are REQUIRED props */
            pageSize={10}
            setPageSize={() => {}}
            wrapLines={false}
            setWrapLines={() => {}}
            stripedRows={false}
            setStripedRows={() => {}}
            columns={columns}
            visibleColumns={columns.map((c) => c.key)}
            toggleColumn={() => {}}
          />
        )}

        {/* ---------- PAGINATION (Static) ---------- */}
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
