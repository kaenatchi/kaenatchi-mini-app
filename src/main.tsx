import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import ReceiptRecoveryPreview from "./ReceiptRecoveryPreview";
import "./index.css";

const isolatedPreview =
  new URLSearchParams(window.location.search).get("isolatedPreview") ===
  "receipt-recovery";

// Keep the main application module unloaded in isolated preview mode.
const App = lazy(() => import("./App"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isolatedPreview ? (
      <ReceiptRecoveryPreview />
    ) : (
      <Suspense fallback={<div dir="rtl" style={{ padding: 24 }}>در حال بارگذاری…</div>}>
        <App />
      </Suspense>
    )}
  </React.StrictMode>
);
