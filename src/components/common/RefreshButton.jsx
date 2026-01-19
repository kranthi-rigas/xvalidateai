import React, { useState } from "react";
import { LuRefreshCcw } from "react-icons/lu";

export default function RefreshButton({ onRefresh, setTableLoading }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClick = async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    setTableLoading?.(true);

    try {
      await onRefresh();
    } finally {
      setTableLoading?.(false);
      setIsRefreshing(false);
    }
  };

  return (
    <div data-anim="none">
      <button
        type="button"
        className={`refresh-btn ${isRefreshing ? "is-loading" : ""}`}
        title="Refresh"
        onClick={handleClick}
      >
        <LuRefreshCcw className="refresh-icon" aria-hidden />
      </button>
    </div>
  );
}
