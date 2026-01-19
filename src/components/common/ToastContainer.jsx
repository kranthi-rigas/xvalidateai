import React from "react";
import { useToastContext } from "../../context/ToastContext";
import "./toast.css";

export default function ToastContainer() {
  const { toasts, remove } = useToastContext();
  return (
    <div className="toast-root" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type}`}
          onClick={() => remove(t.id)}
        >
          <div className="toast-message">{t.message}</div>
        </div>
      ))}
    </div>
  );
}
