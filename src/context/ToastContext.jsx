import React, { createContext, useCallback, useState, useContext } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const show = useCallback(
    (message, { type = "info", timeout = 4000 } = {}) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, type }]);
      if (timeout)
        setTimeout(
          () => setToasts((t) => t.filter((x) => x.id !== id)),
          timeout
        );
      return id;
    },
    []
  );

  const remove = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, show, remove }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx)
    throw new Error("useToastContext must be used within a ToastProvider");
  return ctx;
};

export default ToastContext;
