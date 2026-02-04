import React from "react";

export default function HeaderNotifications({ hasUnread = true }) {
  return (
    <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/10 transition-colors relative">
      <i className="fa-regular fa-bell"></i>
      {hasUnread && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
      )}
    </button>
  );
}