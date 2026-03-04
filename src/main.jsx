import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/tailwind.css"; // Tailwind CSS — must be first so app styles can override
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import ToastContainer from "./components/common/ToastContainer.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
      <ToastContainer />
    </ToastProvider>
  </React.StrictMode>
);
