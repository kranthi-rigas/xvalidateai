// scripts/seedPermissions.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ============================
   PATH SETUP
============================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================
   LOAD ROLE PERMISSIONS JSON
============================ */
const rolePermissionsPath = path.resolve(
  __dirname,
  "../src/data/rolePermissions.json"
);

const rolePermissions = JSON.parse(
  fs.readFileSync(rolePermissionsPath, "utf-8")
);

/* ============================
   CONFIG (EDIT ONLY THIS)
============================ */
const API_BASE = "https://dev-api.academy51.com";

// 🔐 Admin login (use ENV later if needed)
const ADMIN_EMAIL = "testadmin1@example.com";
const ADMIN_PASSWORD = "StrongPass123!";

// 🔴 REAL GROUP IDS FROM DB
const GROUP_IDS = {
  ADMIN: "c921d63f-3bf5-4ee2-acac-987d212147a0",
  INSTRUCTOR: "bebfa82b-8788-4c5a-a954-fce010f18717",
  STUDENT: "a9e6c0a5-2c25-48f5-86b4-c30229b64d34",
  PARENT: "3ae47850-2ed5-46e8-9e4a-6e4c3146b8f9",
};

/* ============================
   AUTH → GET TOKEN
============================ */
async function getAdminToken() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Login failed: " + err);
  }

  const data = await res.json();
  return data.access_token;
}

/* ============================
   UPDATE GROUP PERMISSIONS
============================ */
async function updateGroupPermissions(token, groupId, permissions) {
  const res = await fetch(
    `${API_BASE}/group/${groupId}/permissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ permissions }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return res.json();
}

/* ============================
   SEED FUNCTION
============================ */
async function seed() {
  try {
    console.log("🔐 Logging in as admin...");
    const token = await getAdminToken();
    console.log("✅ Token acquired");

    console.log("🌱 Seeding permissions...\n");

    for (const role of Object.keys(GROUP_IDS)) {
      const groupId = GROUP_IDS[role];
      const permissions = rolePermissions[role];

      if (!permissions) {
        console.warn(`⚠️ No permissions found for ${role}`);
        continue;
      }

      console.log(`➡️  ${role} → ${groupId}`);
      await updateGroupPermissions(token, groupId, permissions);
      console.log(`✅ ${role} permissions updated\n`);
    }

    console.log("🎉 ALL PERMISSIONS SEEDED SUCCESSFULLY");
  } catch (err) {
    console.error("❌ SEED FAILED");
    console.error(err.message);
  }
}

seed();
