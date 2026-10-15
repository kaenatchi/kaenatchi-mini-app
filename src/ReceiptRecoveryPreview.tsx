import { useState } from "react";

type Scenario = "unknown" | "received" | "pending";

const scenarios: Record<Scenario, { title: string; detail: string }> = {
  unknown: {
    title: "وضعیت ارسال هنوز مشخص نیست",
    detail: "پاسخ قطعی از سامانه دریافت نشده. برای جلوگیری از ارسال تکراری، ارسال دوباره موقتاً غیرفعال است.",
  },
  received: {
    title: "فیش دریافت شده است",
    detail: "وضعیت نمونه نشان می‌دهد فیش برای بررسی ثبت شده؛ ارسال دوباره لازم نیست.",
  },
  pending: {
    title: "فیش هنوز تأیید نشده است",
    detail: "در این سناریوی نمونه، وضعیت پرداخت همچنان در انتظار است. فرم حفظ می‌شود و پس از بررسی وضعیت می‌توان ادامه داد.",
  },
};

export default function ReceiptRecoveryPreview() {
  const [scenario, setScenario] = useState<Scenario>("unknown");
  const [checked, setChecked] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const current = scenarios[scenario];

  const checkStatus = () => {
    setChecked(true);
    if (scenario === "unknown") {
      setScenario("received");
    } else if (scenario === "received") {
      setScenario("received");
    } else {
      setScenario("pending");
      setAttemptedSubmit(false);
    }
  };

  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "#f7f3e9", color: "#183d2f", padding: "24px 16px", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ border: "1px solid #d6c9ad", borderRadius: 18, padding: 16, background: "#fffaf0", marginBottom: 18 }}>
          <strong style={{ display: "block", fontSize: 17 }}>پیش‌نمایش ایزولهٔ بازیابی ارسال فیش</strong>
          <p style={{ margin: "8px 0 0", lineHeight: 1.8, fontSize: 13 }}>حالت نمایشی: تمام وضعیت‌ها ساختگی‌اند. این صفحه هیچ درخواست شبکه‌ای نمی‌فرستد و به رزرو، پرداخت، Worker، CMS یا VIP متصل نیست.</p>
        </div>

        <section style={{ borderRadius: 22, padding: 20, background: "#fff", boxShadow: "0 8px 28px rgba(24,61,47,.08)" }}>
          <div style={{ fontSize: 13, opacity: .72, marginBottom: 8 }}>سناریوی آزمایشی</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {([
              ["unknown", "پاسخ نامشخص"],
              ["received", "فیش دریافت‌شده"],
              ["pending", "هنوز در انتظار"],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => { setScenario(value); setChecked(false); setAttemptedSubmit(false); }} style={{ border: scenario === value ? "2px solid #1d6248" : "1px solid #d6ddda", borderRadius: 999, padding: "9px 12px", background: scenario === value ? "#e6f1e9" : "#fff", color: "#183d2f", font: "inherit", fontSize: 13 }}>
                {label}
              </button>
            ))}
          </div>

          <div role="status" aria-live="polite" style={{ borderRadius: 16, padding: 16, background: scenario === "received" ? "#e6f1e9" : "#fff6e4", border: "1px solid #e0d5bb" }}>
            <strong style={{ display: "block", marginBottom: 8 }}>{current.title}</strong>
            <p style={{ margin: 0, lineHeight: 1.9, fontSize: 14 }}>{current.detail}</p>
          </div>

          {scenario === "received" && <p style={{ color: "#1d6248", fontWeight: 700, margin: "14px 0 0" }}>✓ ثبت رسید در این سناریو تأیید شده؛ از ارسال تکراری جلوگیری می‌شود.</p>}
          {scenario === "pending" && checked && <p style={{ margin: "14px 0 0", fontSize: 13 }}>وضعیت دوباره خوانده شد؛ اطلاعات فرم نمایشی حفظ شده است.</p>}
          {attemptedSubmit && <p role="alert" style={{ color: "#8c3b22", marginTop: 12 }}>ارسال مجدد در وضعیت نامشخص مسدود است.</p>}

          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={checkStatus} style={{ border: 0, borderRadius: 14, padding: 14, background: "#1d6248", color: "white", font: "inherit", fontWeight: 700 }}>بررسی دوبارهٔ وضعیت (نمایشی)</button>
            <button type="button" onClick={() => setAttemptedSubmit(true)} disabled={scenario === "unknown" || scenario === "received"} style={{ border: "1px solid #c8d4cd", borderRadius: 14, padding: 14, background: scenario === "unknown" || scenario === "received" ? "#eef0ed" : "#fff", color: "#183d2f", opacity: scenario === "unknown" || scenario === "received" ? .65 : 1, font: "inherit" }}>آزمایش ارسال مجدد (بدون ارسال واقعی)</button>
          </div>
        </section>
        <p style={{ fontSize: 12, lineHeight: 1.8, opacity: .7, marginTop: 16 }}>این ابزار فقط سناریوهای رابط کاربری را نمایش می‌دهد؛ آزمون یکپارچهٔ بک‌اند نیست و جایگزین تست منطق واقعی برنامه محسوب نمی‌شود.</p>
      </div>
    </main>
  );
}
