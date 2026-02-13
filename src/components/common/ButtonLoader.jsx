import React from "react";

export default function ButtonLoader({ dark = false }) {
  return <span className={`btn-spinner ${dark ? "dark" : ""}`} />;
}
