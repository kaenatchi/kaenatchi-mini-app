import { useEffect, useMemo, useState } from "react";
import {
  getBookingCoreAvailability,
  getBookingCoreDates,
  getBookingCoreServices,
  type BookingCoreAvailability,
  type BookingCoreDate,
  type BookingCoreService,
} from "./bookingCoreClient";

/**
 * Isolated, read-only staging preview. Not imported by App.tsx intentionally.
 * This component does not create requests, upload receipts, or touch production.
 */
export default function BookingCoreStagingPanel() {
  const [services, setServices] = useState<BookingCoreService[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dates, setDates] = useState<BookingCoreDate[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availability, setAvailability] = useState<BookingCoreAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("حالت آزمایشی فقط اطلاعات خدمات، تاریخ و ساعت را می‌خواند؛ هیچ درخواستی ثبت نمی‌شود.");

  const selectedServices = useMemo(
    () => services.filter((service) => selectedIds.includes(service.id)),
    [services, selectedIds],
  );
  const selectedCategory = selectedServices[0]?.category || "";

  useEffect(() => {
    let active = true;
    setLoading(true);
    getBookingCoreServices()
      .then((catalog) => {
        if (!active) return;
        setServices(catalog);
        setError("");
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "دریافت فهرست خدمات ناموفق بود.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setDates([]);
    setSelectedDate("");
    setAvailability(null);
    if (!selectedIds.length) return;
    setBusy(true);
    getBookingCoreDates(selectedIds)
      .then((nextDates) => {
        if (!active) return;
        setDates(nextDates);
        setSelectedDate(nextDates[0]?.date || "");
        setError(nextDates.length ? "" : "برای این خدمت در بازهٔ مجاز تاریخ قابل رزروی پیدا نشد.");
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "دریافت تاریخ‌ها ناموفق بود.");
      })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [selectedIds]);

  useEffect(() => {
    let active = true;
    setAvailability(null);
    if (!selectedDate || !selectedIds.length) return;
    setBusy(true);
    getBookingCoreAvailability(selectedDate, selectedIds)
      .then((result) => {
        if (!active) return;
        setAvailability(result);
        setError("");
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "دریافت ساعت‌ها ناموفق بود.");
      })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [selectedDate, selectedIds]);

  function toggleService(service: BookingCoreService) {
    setSelectedIds((current) => {
      const currentCategory = services.find((item) => current.includes(item.id))?.category;
      if (current.includes(service.id)) return current.filter((id) => id !== service.id);
      // The API currently validates all selected services as one category.
      if (currentCategory && currentCategory !== service.category) {
        setNote("برای بررسی ساعت‌ها، خدمات انرژی و تراپی را با هم انتخاب نکن؛ هر گروه را جداگانه بررسی کن.");
        return [service.id];
      }
      setNote("حالت آزمایشی فقط اطلاعات خدمات، تاریخ و ساعت را می‌خواند؛ هیچ درخواستی ثبت نمی‌شود.");
      return [...current, service.id];
    });
  }

  const energyServices = services.filter((service) => service.category === "energy");
  const therapyServices = services.filter((service) => service.category === "therapy");

  return (
    <main dir="rtl" lang="fa" style={{ maxWidth: 720, margin: "0 auto", padding: 16, color: "#173b2d", fontFamily: "inherit" }}>
      <header style={{ marginBottom: 16 }}>
        <p style={{ margin: "0 0 6px", fontSize: 12, color: "#66756d" }}>نسخهٔ آزمایشی — فقط خواندن</p>
        <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>بررسی سامانهٔ جدید دریافت نوبت</h2>
        <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14 }}>این صفحه از Worker آزمایشی اطلاعات واقعیِ قابل‌نمایش را می‌خواند؛ هیچ رزرو، پرداخت، پیام یا تغییری در داده‌ها ایجاد نمی‌کند.</p>
      </header>

      {loading && <p role="status">در حال دریافت فهرست خدمات…</p>}
      {!!error && <p role="alert" style={{ border: "1px solid #d7a39b", padding: 12, borderRadius: 10, color: "#8d3028" }}>{error}</p>}

      {!loading && !error && (
        <>
          <section style={{ border: "1px solid #d9e1db", borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <h3 style={{ marginTop: 0 }}>۱. انتخاب خدمت</h3>
            <h4>انرژی‌خوانی</h4>
            {energyServices.length ? energyServices.map((service) => (
              <label key={service.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #edf0ed" }}>
                <input type="checkbox" checked={selectedIds.includes(service.id)} onChange={() => toggleService(service)} />
                <span style={{ flex: 1 }}>{service.name}</span>
                <strong>{service.price.toLocaleString("fa-IR")} تومان</strong>
              </label>
            )) : <p>خدمت انرژی در فهرست عمومی نیست.</p>}
            <h4>تراپی</h4>
            {therapyServices.length ? therapyServices.map((service) => (
              <label key={service.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #edf0ed" }}>
                <input type="radio" name="therapy-service" checked={selectedIds.includes(service.id)} onChange={() => setSelectedIds([service.id])} />
                <span style={{ flex: 1 }}>{service.name}</span>
                <strong>{service.price.toLocaleString("fa-IR")} تومان</strong>
              </label>
            )) : <p>خدمت تراپی در فهرست عمومی نیست.</p>}
            <p style={{ marginBottom: 0, fontWeight: 600 }}>جمع خدمات انتخاب‌شده: {selectedServices.reduce((sum, item) => sum + item.price, 0).toLocaleString("fa-IR")} تومان</p>
          </section>

          {selectedCategory === "energy" && (
            <section style={{ border: "1px solid #d9e1db", borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <h3 style={{ marginTop: 0 }}>روش دریافت انرژی‌خوانی</h3>
              <p style={{ marginBottom: 0 }}>این بخش تا اتصال نهایی در نظر گرفته شده؛ در این مرحله فقط اطلاعات عمومی و ساعت‌ها بررسی می‌شود.</p>
            </section>
          )}

          {!!selectedIds.length && (
            <section style={{ border: "1px solid #d9e1db", borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <h3 style={{ marginTop: 0 }}>۲. نزدیک‌ترین تاریخ قابل رزرو</h3>
              {busy && <p role="status">در حال بررسی تاریخ و ساعت…</p>}
              {dates.length > 0 && (
                <select aria-label="تاریخ رزرو" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8 }}>
                  {dates.map((item) => <option key={item.date} value={item.date}>{item.label}</option>)}
                </select>
              )}
              {availability && (
                <>
                  <p>{availability.weekday} — {availability.jalaliDate}</p>
                  <p>مدت هر نوبت: {availability.slotMinutes} دقیقه</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                    {availability.slots.map((slot) => (
                      <div key={slot.startTime} style={{ border: "1px solid #d9e1db", borderRadius: 9, padding: 10, background: slot.status === "AVAILABLE" ? "#f3f7f3" : "#f7f5f1" }}>
                        <strong>{slot.startTime}</strong>
                        <div style={{ fontSize: 12, marginTop: 5 }}>{slot.status === "AVAILABLE" ? "قابل انتخاب (نمایشی)" : slot.label || "غیرقابل انتخاب"}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}

      <aside style={{ background: "#f7f5ee", borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.8 }}>
        <strong>مرحلهٔ اتصال:</strong> {note}
        <br />
        ثبت درخواست تا زمان اضافه‌شدن ذخیرهٔ دلیل مراجعه و مسیر امن بارگذاری رسید عمداً غیرفعال است؛ پرداخت پیش از تأیید مایا نمایش داده نمی‌شود.
      </aside>
    </main>
  );
}
