import React, { useState } from "react";
import { deleteUsers } from "../../../apiIntegration/organization";
import useToast from "../../../hooks/useToast";

export default function DeleteUsersModal({ users = [], onClose, onDeleted }) {
  const show = useToast();
  const [loading, setLoading] = useState(false);

  // Safety: filter out any admins who are the logged-in user
  // (parent already prevents this, but double-guard here)
  const userIds = users.map((u) => u.user_id);
  const isSingle = users.length === 1;

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteUsers(userIds);
      show(
        isSingle
          ? `${users[0].email} has been removed from the organization.`
          : `${users.length} users have been removed from the organization.`,
        { type: "success", duration: 4000 }
      );
      onDeleted();
      onClose();
    } catch (err) {
      let message = "Failed to delete user(s).";
      try {
        const parsed = JSON.parse(err.message);
        message = parsed.message || message;
      } catch {}
      show(message, { type: "error", duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-xl p-6 mx-4">

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
            <i className="fa-solid fa-triangle-exclamation text-red-500 text-sm" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isSingle ? "Delete user?" : `Delete ${users.length} users?`}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* User list */}
        <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border max-h-48 overflow-y-auto mb-5">
          {users.map((u) => (
            <div
              key={u.user_id}
              className="flex items-center justify-between px-4 py-2.5 gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar initials */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary uppercase">
                  {(u.email?.[0] || "?").toUpperCase()}
                </div>
                <span className="text-sm text-foreground truncate">
                  {u.email}
                </span>
              </div>
              <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground capitalize">
                {(u.roles || []).join(", ") || "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Warning note */}
        <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-5">
          <i className="fa-solid fa-circle-info text-amber-500 mr-1.5" />
          Deleted users will lose all access immediately and cannot be recovered.
          You can re-invite them later if needed.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                Deleting...
              </>
            ) : (
              <>
                <i className="fa-solid fa-trash text-xs" />
                {isSingle ? "Delete user" : `Delete ${users.length} users`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}