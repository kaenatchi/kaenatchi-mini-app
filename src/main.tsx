import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ReceiptRecoveryPreview from "./ReceiptRecoveryPreview";
import "./index.css";

const isolatedPreview =
  new URLSearchParams(window.location.search).get("isolatedPreview") ===
  "receipt-recovery";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isolatedPreview ? <ReceiptRecoveryPreview /> : <App />}
  </React.StrictMode>
);
