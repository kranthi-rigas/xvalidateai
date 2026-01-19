import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getUsers,
  getGroupById,
  addUsersToGroup,
} from "../../../apiIntegration/organization";
import ListTable from "../../common/ListTable";
import RefreshButton from "../../common/RefreshButton";
import AwsButton from "../../common/AwsButton";

export default function OrgAddUsersToGroup() {
  const { group_id } = useParams();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [existingUserIds, setExistingUserIds] = useState([]);

  const [allUsers, setAllUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const capitalize = (str) =>
    typeof str === "string"
      ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      : str;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // GET GROUP → extract existing users
      const groupRes = await getGroupById(group_id);

      const usersInGroup = groupRes.users?.map((u) => u.user_id) || [];
      setExistingUserIds(usersInGroup);

      setGroupName(
        typeof groupRes.name === "object" ? groupRes.name.name : groupRes.name
      );

      // GET ALL USERS
      const res = await getUsers({ limit: 500 });

      const all = res.users.map((u) => ({
        user_id: u.user_id,
        email: u.email ?? "-",
        roles: u.roles ?? [],
        status: u.status ?? "-",
        created_at: u.created_at ?? null,
      }));

      // FILTER OUT USERS ALREADY IN THIS GROUP
      const available = all.filter((u) => !usersInGroup.includes(u.user_id));

      setAllUsers(available);
      setFiltered(available);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }

  // SEARCH
  useEffect(() => {
    setFiltered(
      allUsers.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, allUsers]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = (checked) => {
    setSelected(checked ? filtered.map((u) => u.user_id) : []);
  };

  const handleAdd = async () => {
    if (selected.length === 0) return;

    try {
      await addUsersToGroup(group_id, selected);

      navigate(`/dshb-orgusergroupdetails/${group_id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to add users");
    }
  };

  /** TABLE COLUMNS (matching Group Details table style) */
  const columns = [
    { key: "checkbox", label: "", width: 40 },
    { key: "email", label: "Email" },
    { key: "roles", label: "Roles", width: 200 },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Creation Time" },
  ];

  const renderCell = (user, key) => {
    if (key === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={selected.includes(user.user_id)}
          onChange={() => toggleSelect(user.user_id)}
        />
      );
    }
    if (key === "email") return user.email || "-";
    if (key === "roles") return user.roles?.map(capitalize).join(", ") || "-";

    if (key === "created_at")
      return user.created_at
        ? new Date(user.created_at * 1000).toLocaleString()
        : "-";

    if (key === "status") return capitalize(user.status);
  };

  return (
    <div className="dashboard__content bg-light-4">
      {/* TITLE */}
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Add users to {groupName}
      </h2>

      {/* TABLE CARD */}
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
          Other users in this account ({filtered.length})
        </h3>

        {/* SEARCH + REFRESH */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <input
            type="text"
            placeholder="Search"
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

        {/* TABLE (fixed from Group Details version) */}
        <ListTable
          columns={columns}
          data={filtered}
          rowKey="user_id"
          renderCell={renderCell}
          sortConfig={{}}
          onSort={() => {}}
          columnWidths={{}}
          allSelected={selected.length === filtered.length}
          onToggleAll={toggleAll}
        />
      </div>

      {/* FOOTER BUTTONS */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <AwsButton
          label="Cancel"
          onClick={() => navigate(`/dashboard/orgusergroupdetails/${group_id}`)}
        />

        <AwsButton
          label="Add users"
          disabled={selected.length === 0}
          onClick={handleAdd}
        />
      </div>
    </div>
  );
}
