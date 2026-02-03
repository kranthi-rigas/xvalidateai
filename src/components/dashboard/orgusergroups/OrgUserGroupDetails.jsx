import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ListTable from "../../common/ListTable";
import RefreshButton from "../../common/RefreshButton";
import AwsButton from "../../common/AwsButton";
import {
  getGroupById,
  getGroups,
  removeUsersFromGroup,
  updateGroupPermissions,
} from "../../../apiIntegration/organization";
import { SlArrowRight } from "react-icons/sl";
import useToast from "../../../hooks/useToast";

export default function OrgUserGroupDetails() {
  const { group_id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [actionLoading, setActionLoading] = useState(false);
  const show = useToast();

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [filteredPerms, setFilteredPerms] = useState([]);

  // Capitalize helper
  const capitalize = (str) =>
    typeof str === "string"
      ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      : str;

  // use global show(message, {type})

  // LOAD DATA (Users + Permissions)
  async function loadData() {
    try {
      const res = await getGroupById(group_id);

      // USERS
      const users = Array.isArray(res.users)
        ? res.users.map((u) => ({
            user_id: u.user_id,
            email: u.email ?? "-",
            roles: u.roles ?? [],
            status: u.status ?? "-",
            created_at: u.created_at ?? null,
          }))
        : [];

      // PERMISSIONS from getGroups API
      const groupsAPI = await getGroups();
      const selectedGroup = groupsAPI.groups.find(
        (g) => g.group_id === group_id
      );

      const permissions = Array.isArray(selectedGroup?.permissions)
        ? selectedGroup.permissions
        : [];

      setGroup({
        name: typeof res.name === "object" ? res.name.name : res.name,
        description:
          typeof res.name === "object"
            ? res.name.description
            : res.description || "",
        created_at: res.created_at,
        permissions,
        users,
      });

      setLoading(false);
    } catch (err) {
      console.error("Failed to load group:", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "permissions") loadData();
  }, [activeTab]);

  // CAPITALIZED PERMISSIONS + SAFELY INITIALIZE FILTERED LIST
  useEffect(() => {
    if (!group) return;

    const perms = group.permissions.map((p) => ({
      name: capitalize(p),
      raw: p, // <-- important!
    }));

    setFilteredPerms(perms);
  }, [group]);

  // USERS TABLE CONFIG
  const columns = [
    {
      key: "checkbox",
      label: "",
      width: 40,
      allSelected:
        group?.users?.length > 0 && selectedUsers.length === group.users.length,
      onToggleAll: (checked) =>
        setSelectedUsers(checked ? group?.users?.map((u) => u.user_id) : []),
    },
    { key: "email", label: "Email", width: 200 },
    { key: "roles", label: "Roles", width: 200 },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Creation Time" },
  ];

  const renderCell = (user, key) => {
    if (key === "checkbox")
      return (
        <input
          type="checkbox"
          checked={selectedUsers.includes(user.user_id)}
          onChange={() =>
            setSelectedUsers((prev) =>
              prev.includes(user.user_id)
                ? prev.filter((id) => id !== user.user_id)
                : [...prev, user.user_id]
            )
          }
        />
      );

    if (key === "email") return user.email;
    if (key === "roles") return user.roles?.map(capitalize).join(", ") || "-";
    if (key === "status") return capitalize(user.status);

    if (key === "created_at")
      return user.created_at
        ? new Date(user.created_at * 1000).toLocaleString()
        : "-";
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
        <div style={{ color: COLORS.primary, fontWeight: 600 }}>
          Loading group details…
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

  // REMOVE USERS
  const handleRemoveUsers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setActionLoading(true);
      await removeUsersFromGroup(group_id, selectedUsers);

      show("Users removed successfully!", { type: "success" });
      await loadData();
      setSelectedUsers([]);
    } catch {
      show("Failed to remove users", { type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePermissions = async () => {
    if (selectedPerms.length === 0) return;

    try {
      setActionLoading(true);

      // Convert selectedPerms (Capitalized) back to lowercase/original-case matches
      const selectedOriginal = selectedPerms.map((p) => p.toLowerCase());

      // Filter out removed permissions → API expects original-case values
      const updatedPermissions = group.permissions.filter(
        (perm) => !selectedPerms.includes(perm)
      );

      // API call
      await updateGroupPermissions(group_id, updatedPermissions);

      show("Permissions removed successfully!", { type: "success" });

      // Refresh screen
      await loadData();
      setSelectedPerms([]);
    } catch (err) {
      console.error(err);
      show("Failed to remove permissions", { type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // PERMISSIONS LIST (capitalized)
  const permissions = group.permissions.map((p) => ({
    name: capitalize(p),
  }));

  return (
    <div className="dashboard__content bg-light-4">
      {/* SUMMARY */}
      <div
        style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          padding: 24,
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          Summary
        </h2>

        <div style={{ display: "flex", gap: 40 }}>
          <div>
            <div style={{ fontWeight: 600 }}>User group name</div>
            <div>{group.name}</div>
          </div>

          <div style={{ width: 1, background: COLORS.border }} />

          <div>
            <div style={{ fontWeight: 600 }}>Description</div>
            <div>{group.description || "-"}</div>
          </div>

          <div style={{ width: 1, background: COLORS.border }} />

          <div>
            <div style={{ fontWeight: 600 }}>Creation time</div>
            <div>{new Date(group.created_at).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 30, fontSize: 15, fontWeight: 600 }}>
        <div
          onClick={() => setActiveTab("users")}
          style={{
            cursor: "pointer",
            color: activeTab === "users" ? "#0972D3" : "#374151",
            borderBottom:
              activeTab === "users" ? "3px solid #0972D3" : "transparent",
            paddingBottom: 8,
          }}
        >
          Users ({group?.users?.length || 0})
        </div>

        <div style={{ width: 1, background: COLORS.border }} />

        <div
          onClick={() => setActiveTab("permissions")}
          style={{
            cursor: "pointer",
            color: activeTab === "permissions" ? "#0972D3" : "#374151",
            borderBottom:
              activeTab === "permissions" ? "3px solid #0972D3" : "transparent",
            paddingBottom: 8,
          }}
        >
          Permissions
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height: 1,
          background: "#ddd",
          margin: "10px 0",
        }}
      />

      {/* PERMISSIONS TAB */}
      {activeTab === "permissions" && (
        <div
          style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            padding: 20,
            marginBottom: 25,
          }}
        >
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>
              Permissions ({permissions.length})
            </h3>

            <div style={{ display: "flex", gap: 10 }}>
              <RefreshButton onRefresh={loadData} />

              <AwsButton
                label="Remove"
                disabled={selectedPerms.length === 0}
                onClick={handleRemovePermissions}
              />

              <AwsButton
                label="Add permissions"
                onClick={() =>
                  navigate(
                    `/dashboard/orgattachpermissions/${group_id}/permissions`
                  )
                }
              />
            </div>
          </div>

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
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                setFilteredPerms(
                  permissions.filter((p) => p.name.toLowerCase().includes(q))
                );
              }}
              style={{
                width: 300,
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
            <div style={{ width: 60 }} />
          </div>

          {/* LIST TABLE */}
          <ListTable
            columns={[
              {
                key: "checkbox",
                label: "",
                width: 1,
                allSelected:
                  filteredPerms.length > 0 &&
                  selectedPerms.length === filteredPerms.length,
                onToggleAll: (checked) =>
                  setSelectedPerms(
                    checked ? filteredPerms.map((p) => p.raw) : []
                  ),
              },
              { key: "name", label: "Permission Name" },
            ]}
            data={filteredPerms}
            rowKey={(p) => p.name}
            renderCell={(perm, key) => {
              if (key === "checkbox") {
                return (
                  <div style={{ padding: 0, margin: 0 }}>
                    <input
                      type="checkbox"
                      style={{ margin: 0 }}
                      checked={selectedPerms.includes(perm.raw)}
                      onChange={(e) =>
                        setSelectedPerms((prev) =>
                          e.target.checked
                            ? [...prev, perm.raw]
                            : prev.filter((p) => p !== perm.raw)
                        )
                      }
                    />
                  </div>
                );
              }
              if (key === "name") {
                return <span>{perm.name}</span>;
              }
            }}
            columnWidths={{}}
            hideEmptyMessage={true}
          />

          {/* NO RECORDS */}
          {filteredPerms.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: COLORS.textMuted }}>
              No permissions attached
            </div>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div
          style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            padding: 20,
          }}
        >
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>
              Users in this group ({group.users.length})
            </h3>

            <div style={{ display: "flex", gap: 10 }}>
              <RefreshButton onRefresh={loadData} />

              <AwsButton
                label="Remove"
                disabled={selectedUsers.length === 0}
                onClick={handleRemoveUsers}
              />

              <AwsButton
                label="Add users"
                onClick={() =>
                  navigate(`/dashboard/orgaddusertogroup/${group_id}/add-users`)
                }
              />
            </div>
          </div>

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
              placeholder="Search users…"
              style={{
                width: 300,
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />

            <div style={{ display: "flex", gap: 15 }}>
              <span style={{ cursor: "pointer" }}>‹</span>
              <span>1</span>
              <span style={{ cursor: "pointer" }}>›</span>
            </div>
          </div>

          {/* USERS TABLE */}
          <ListTable
            columns={columns}
            data={group.users}
            rowKey="user_id"
            renderCell={renderCell}
            columnWidths={{}}
          />
        </div>
      )}
    </div>
  );
}
