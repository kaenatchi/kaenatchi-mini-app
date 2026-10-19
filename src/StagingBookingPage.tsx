import { useEffect, useMemo, useState, type CSSProperties } from "react";

type PublicService = {
  id: string;
  name: string;
  category: string;
  price: number;
};

type SavedRequest = {
  bookingId: string;
  customerAccessToken: string;
  appointmentCode?: string;
  trackingId?: string;
  date: string;
  startTime: string;
  status: string;
  totalPrice?: number;
};

type Props = {
  onBack: () => void;
  initialService?: {
    id?: string;
    title?: string;
    category?: string;
    price?: string;
    duration?: string;
    description?: string;
  } | null;
};

const STAGING_WORKER = "https://kaenatchi-booking-core-staging-v2.mayanaz-oriflame.workers.dev/";
const SAVED_REQUEST_KEY = "kaenatchi:booking-staging:customer-request:v1";

async function stagingPost(action: string, payload: Record<string, unknown> = {}) {
  const response = await fetch(STAGING_WORKER, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const text = await response.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error("پاسخ سامانه رزرو قابل‌خواندن نیست.");
  }
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error || body?.message || "ارتباط با سامانه رزرو ناموفق بود.");
  }
  return body?.result ?? body;
}

function makeClientRequestId() {
  return "KC-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 14);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value) + " تومان";
}

function categoryLabel(category: string) {
  const value = category.trim().toLowerCase();
  if (value === "energy") return "انرژی‌خوانی";
  if (value === "therapy" || value === "candle" || value === "psychotherapy") return "خدمات درمانی";
  return "خدمات";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_MANAGER: "در انتظار بررسی مایا",
    AWAITING_PAYMENT: "درخواست تأیید شده؛ آمادهٔ ثبت رسید",
    RECEIPT_REVIEW: "رسید ارسال شده؛ در انتظار بررسی پرداخت",
    CONFIRMED: "پرداخت تأیید و نوبت نهایی شده",
    PAYMENT_REJECTED: "رسید نیاز به اصلاح دارد",
    EXPIRED: "مهلت درخواست یا پرداخت تمام شده",
    CANCELLED: "درخواست لغو شده",
    CANCELLATION_PENDING: "درخواست لغو در انتظار بررسی",
    CHANGE_PENDING: "درخواست تغییر ساعت در انتظار بررسی",
  };
  return labels[status] || status || "وضعیت هنوز دریافت نشده";
}

const styles: Record<string, CSSProperties> = {
  page: { direction: "rtl", color: "#183d32", background: "#fbf7ed", minHeight: "100%", padding: "18px 14px 30px", fontFamily: "inherit" },
  shell: { maxWidth: 620, margin: "0 auto" },
  top: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  back: { border: "1px solid #d7dfd2", background: "#fffdf7", color: "#183d32", borderRadius: 12, padding: "9px 12px", fontSize: 14 },
  title: { fontSize: 23, fontWeight: 800, margin: 0 },
  subtitle: { color: "#66766b", fontSize: 13, lineHeight: 1.8, margin: "6px 0 0" },
  card: { background: "#fffdf7", border: "1px solid #e6e4d8", borderRadius: 18, padding: 15, marginBottom: 13, boxShadow: "0 4px 16px rgba(24,61,50,.035)" },
  sectionTitle: { fontSize: 16, fontWeight: 800, margin: "0 0 12px" },
  label: { display: "block", fontSize: 13, fontWeight: 700, margin: "11px 0 6px" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #d8dfd3", background: "#fff", color: "#183d32", borderRadius: 11, padding: "11px 12px", fontSize: 15 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 8 },
  service: { border: "1px solid #d8dfd3", background: "#fff", color: "#183d32", borderRadius: 12, padding: 11, textAlign: "right" as const, cursor: "pointer" },
  selected: { border: "1px solid #275a48", background: "#edf3e9", color: "#183d32", borderRadius: 12, padding: 11, textAlign: "right" as const, cursor: "pointer" },
  primary: { border: 0, background: "#214d3e", color: "#fffdf7", borderRadius: 12, padding: "12px 15px", fontWeight: 800, fontSize: 15, width: "100%", marginTop: 12, cursor: "pointer" },
  secondary: { border: "1px solid #bfcfc0", background: "#f6f5eb", color: "#214d3e", borderRadius: 12, padding: "11px 13px", fontWeight: 700, fontSize: 14, width: "100%", marginTop: 9, cursor: "pointer" },
  hint: { color: "#69776c", fontSize: 12, lineHeight: 1.8, margin: "8px 0 0" },
  notice: { borderRadius: 12, padding: 12, background: "#edf3e9", color: "#214d3e", fontSize: 13, lineHeight: 1.8, marginBottom: 12 },
  error: { borderRadius: 12, padding: 12, background: "#fff0e9", color: "#8a3c24", fontSize: 13, lineHeight: 1.8, marginBottom: 12 },
};

export default function StagingBookingPage({ onBack, initialService }: Props) {
  const [services, setServices] = useState<PublicService[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dates, setDates] = useState<Array<{ date: string; label?: string; weekday?: string; jalaliDate?: string }>>([]);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Array<{ startTime: string; endTime?: string; available: boolean }>>([]);
  const [time, setTime] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"phone" | "voice" | "">("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [saved, setSaved] = useState<SavedRequest | null>(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_REQUEST_KEY);
      return raw ? JSON.parse(raw) as SavedRequest : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const selectedServices = useMemo(
    () => services.filter((service) => selectedIds.includes(service.id)),
    [services, selectedIds]
  );
  const total = selectedServices.reduce((sum, service) => sum + Number(service.price || 0), 0);
  const category = selectedServices[0]?.category || "";

  const say = (text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const result = await stagingPost("getServiceCatalog");
        const list = Array.isArray(result) ? result : Array.isArray(result?.services) ? result.services : [];
        if (!active) return;
        const next = list.map((item: any) => ({
          id: String(item.id || ""),
          name: String(item.name || ""),
          category: String(item.category || "energy"),
          price: Number(item.price || 0),
        })).filter((item: PublicService) => item.id && item.name);
        setServices(next);
        const match = initialService
          ? next.find((item: PublicService) => item.id === initialService.id || item.name === initialService.title)
          : undefined;
        if (match) setSelectedIds([match.id]);
        if (!next.length) say("فهرست خدمات هستهٔ Staging خالی است؛ تا تنظیم کاتالوگ خدمات امکان ثبت درخواست نیست.", true);
      } catch (error) {
        if (active) say(error instanceof Error ? error.message : "دریافت خدمات ناموفق بود.", true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setDates([]);
    setDate("");
    setSlots([]);
    setTime("");
    if (!selectedIds.length) return;
    stagingPost("getBookableDates", { services: selectedIds })
      .then((result) => {
        if (!active) return;
        const next = Array.isArray(result?.dates) ? result.dates : [];
        setDates(next);
        if (next[0]?.date) setDate(String(next[0].date));
        if (!next.length) say("در حال حاضر تاریخ قابل‌رزروی برای این خدمات پیدا نشد.", true);
      })
      .catch((error) => { if (active) say(error instanceof Error ? error.message : "دریافت تاریخ‌های قابل‌رزرو ناموفق بود.", true); });
    return () => { active = false; };
  }, [selectedIds.join("|")]);

  useEffect(() => {
    let active = true;
    setSlots([]);
    setTime("");
    if (!date || !selectedIds.length) return;
    stagingPost("getAvailability", { date, services: selectedIds })
      .then((result) => {
        if (!active) return;
        const next = Array.isArray(result?.slots) ? result.slots.filter((slot: any) => slot.available === true) : [];
        setSlots(next);
        if (!next.length) say("برای این تاریخ ساعت آزادی برنگشت؛ تاریخ دیگری را بررسی کن.", true);
      })
      .catch((error) => { if (active) say(error instanceof Error ? error.message : "دریافت ساعت‌ها ناموفق بود.", true); });
    return () => { active = false; };
  }, [date, selectedIds.join("|")]);

  const toggleService = (service: PublicService) => {
    setSelectedIds((current) => {
      if (current.includes(service.id)) return current.filter((id) => id !== service.id);
      if (service.category !== category && current.length) {
        say("خدمات انرژی و درمانی را نمی‌توان در یک درخواست ترکیب کرد.", true);
        return current;
      }
      if (service.category === "therapy" && current.length) {
        say("در هر درخواست درمانی فقط یک خدمت انتخاب می‌شود.", true);
        return current;
      }
      if (category === "therapy" || service.category === "therapy") return [service.id];
      if (current.length >= 10) {
        say("حداکثر ۱۰ خدمت را می‌توان انتخاب کرد.", true);
        return current;
      }
      return [...current, service.id];
    });
    say("");
  };

  const submitRequest = async () => {
    if (!selectedIds.length) return say("لطفاً خدمت را انتخاب کن.", true);
    if (!date || !time) return say("لطفاً تاریخ و ساعت را انتخاب کن.", true);
    if (category === "energy" && !deliveryMethod) return say("لطفاً روش دریافت انرژی‌خوانی را انتخاب کن.", true);
    if (!firstName.trim() || !lastName.trim() || !mobile.trim()) return say("نام، نام خانوادگی و شماره تماس الزامی است.", true);
    setBusy(true);
    say("");
    try {
      const result = await stagingPost("submitRequest", {
        clientRequestId: makeClientRequestId(),
        customer: { name: firstName.trim() + " " + lastName.trim(), contact: mobile.trim() },
        date,
        startTime: time,
        services: selectedIds,
        ...(category === "energy" ? { deliveryMethod } : {}),
      });
      const request: SavedRequest = {
        bookingId: String(result.bookingId || ""),
        customerAccessToken: String(result.customerAccessToken || ""),
        appointmentCode: String(result.appointmentCode || ""),
        trackingId: String(result.trackingId || ""),
        date: String(result.date || date),
        startTime: String(result.startTime || time),
        status: String(result.status || "PENDING_MANAGER"),
        totalPrice: Number(result.totalPrice ?? total),
      };
      if (!request.bookingId || !request.customerAccessToken) throw new Error("سامانه کد پیگیری امن درخواست را برنگرداند.");
      window.localStorage.setItem(SAVED_REQUEST_KEY, JSON.stringify(request));
      setSaved(request);
      say("درخواست ثبت شد. هنوز هیچ پرداختی لازم نیست؛ مایا ابتدا درخواست را بررسی می‌کند.");
    } catch (error) {
      say(error instanceof Error ? error.message : "ثبت درخواست ناموفق بود.", true);
    } finally {
      setBusy(false);
    }
  };

  const refreshStatus = async () => {
    if (!saved) return;
    setBusy(true);
    say("");
    try {
      const result = await stagingPost("getBookingStatus", {
        bookingId: saved.bookingId,
        customerAccessToken: saved.customerAccessToken,
      });
      const next = { ...saved, status: String(result.status || saved.status), appointmentCode: String(result.appointmentCode || saved.appointmentCode || ""), trackingId: String(result.trackingId || saved.trackingId || ""), totalPrice: Number(result.totalPrice ?? saved.totalPrice ?? 0) };
      setSaved(next);
      window.localStorage.setItem(SAVED_REQUEST_KEY, JSON.stringify(next));
      say("وضعیت درخواست به‌روز شد.");
    } catch (error) {
      say(error instanceof Error ? error.message : "بررسی وضعیت ناموفق بود.", true);
    } finally {
      setBusy(false);
    }
  };

  const submitReceipt = async () => {
    if (!saved) return;
    if (!/^https:\/\//i.test(receiptUrl.trim())) return say("برای این مرحله لینک امن HTTPS تصویر رسید لازم است.", true);
    setBusy(true);
    say("");
    try {
      const result = await stagingPost("submitReceipt", {
        bookingId: saved.bookingId,
        customerAccessToken: saved.customerAccessToken,
        receiptUrl: receiptUrl.trim(),
        claimedTrackingNumber: trackingNumber.trim(),
      });
      const next = { ...saved, status: String(result.status || "RECEIPT_REVIEW") };
      setSaved(next);
      window.localStorage.setItem(SAVED_REQUEST_KEY, JSON.stringify(next));
      setReceiptUrl("");
      setTrackingNumber("");
      say("رسید ارسال شد و تا بررسی دستی پرداخت، درخواست در حالت انتظار می‌ماند.");
    } catch (error) {
      say(error instanceof Error ? error.message : "ارسال رسید ناموفق بود.", true);
    } finally {
      setBusy(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, PublicService[]>();
    services.forEach((service) => {
      const key = categoryLabel(service.category);
      map.set(key, [...(map.get(key) || []), service]);
    });
    return [...map.entries()];
  }, [services]);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.top}>
          <button type="button" style={styles.back} onClick={onBack}>بازگشت</button>
          <div>
            <h1 style={styles.title}>دریافت نوبت</h1>
            <p style={styles.subtitle}>سامانهٔ جدید Staging · درخواست ابتدا بررسی می‌شود؛ پرداخت زودتر از تأیید مایا درخواست نمی‌شود.</p>
          </div>
        </div>

        {message && <div style={isError ? styles.error : styles.notice} role={isError ? "alert" : "status"}>{message}</div>}

        {saved ? (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>پیگیری درخواست</h2>
            <div style={styles.notice}>{statusLabel(saved.status)}</div>
            <p style={styles.hint}>کد درخواست: <strong>{saved.appointmentCode || saved.bookingId}</strong></p>
            <p style={styles.hint}>تاریخ: {saved.date} · ساعت: {saved.startTime}</p>
            {saved.totalPrice !== undefined && <p style={styles.hint}>مبلغ: {formatMoney(saved.totalPrice)}</p>}
            {saved.status === "PENDING_MANAGER" && <p style={styles.hint}>تا زمان تأیید مایا، هیچ پرداختی انجام نده.</p>}
            {saved.status === "AWAITING_PAYMENT" && (
              <>
                <p style={styles.hint}>درخواست تأیید شده است. مهلت پرداخت طبق سامانه محدود است؛ فقط پس از تأیید، پرداخت را انجام بده.</p>
                <label style={styles.label}>لینک امن HTTPS تصویر رسید</label>
                <input style={styles.input} value={receiptUrl} onChange={(event) => setReceiptUrl(event.target.value)} placeholder="https://…" inputMode="url" />
                <label style={styles.label}>شماره پیگیری پرداخت (در صورت وجود)</label>
                <input style={styles.input} value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="شماره پیگیری" />
                <button type="button" style={styles.primary} disabled={busy} onClick={submitReceipt}>{busy ? "در حال ارسال…" : "ارسال رسید برای بررسی"}</button>
                <p style={styles.hint}>این نسخهٔ Staging آپلود تصویر ندارد؛ فقط لینکی را وارد کن که واقعاً امن و قابل‌دسترسی باشد.</p>
              </>
            )}
            {saved.status === "RECEIPT_REVIEW" && <p style={styles.hint}>رزرو نهایی نیست تا زمانی که مایا واریز را دستی تأیید کند.</p>}
            {saved.status === "CONFIRMED" && <p style={styles.hint}>پرداخت تأیید شده و نوبت نهایی است.</p>}
            <button type="button" style={styles.secondary} disabled={busy} onClick={refreshStatus}>{busy ? "در حال بررسی…" : "به‌روزرسانی وضعیت"}</button>
            <button type="button" style={styles.secondary} onClick={() => { setSaved(null); window.localStorage.removeItem(SAVED_REQUEST_KEY); say("می‌توانی درخواست جدیدی ثبت کنی."); }}>شروع درخواست جدید</button>
          </div>
        ) : (
          <>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>۱. انتخاب خدمات</h2>
              {loading ? <p style={styles.hint}>در حال دریافت فهرست خدمات…</p> : grouped.map(([group, items]) => (
                <div key={group} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>{group}</p>
                  <div style={styles.grid}>
                    {items.map((service) => (
                      <button type="button" key={service.id} style={selectedIds.includes(service.id) ? styles.selected : styles.service} onClick={() => toggleService(service)}>
                        <strong style={{ display: "block", lineHeight: 1.7 }}>{service.name}</strong>
                        <span style={{ display: "block", fontSize: 12, marginTop: 5 }}>{formatMoney(service.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {selectedServices.length > 0 && <div style={styles.notice}>مجموع خدمات انتخاب‌شده: <strong>{formatMoney(total)}</strong></div>}
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>۲. تاریخ و ساعت</h2>
              <label style={styles.label}>تاریخ قابل‌رزرو</label>
              <select style={styles.input} value={date} onChange={(event) => setDate(event.target.value)} disabled={!dates.length}>
                {dates.length ? dates.map((item) => <option key={item.date} value={item.date}>{item.label || (item.weekday && item.jalaliDate ? item.weekday + " - " + item.jalaliDate : item.date)}</option>) : <option value="">ابتدا خدمت را انتخاب کن</option>}
              </select>
              <label style={styles.label}>ساعت‌های آزاد</label>
              <div style={styles.grid}>
                {slots.map((slot) => <button type="button" key={slot.startTime} style={time === slot.startTime ? styles.selected : styles.service} onClick={() => setTime(slot.startTime)}>{slot.startTime}</button>)}
              </div>
              {!slots.length && <p style={styles.hint}>پس از انتخاب خدمات و تاریخ، ساعت‌های آزاد از هستهٔ رزرو دریافت می‌شوند.</p>}
            </div>

            {category === "energy" && (
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>روش دریافت انرژی‌خوانی</h2>
                <div style={styles.grid}>
                  <button type="button" style={deliveryMethod === "phone" ? styles.selected : styles.service} onClick={() => setDeliveryMethod("phone")}>
                    <strong style={{ display: "block" }}>تماس تلفنی</strong>
                    <span style={{ display: "block", fontSize: 12, marginTop: 5 }}>دریافت از طریق تماس</span>
                  </button>
                  <button type="button" style={deliveryMethod === "voice" ? styles.selected : styles.service} onClick={() => setDeliveryMethod("voice")}>
                    <strong style={{ display: "block" }}>پیام صوتی</strong>
                    <span style={{ display: "block", fontSize: 12, marginTop: 5 }}>دریافت فایل صوتی</span>
                  </button>
                </div>
              </div>
            )}

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>۳. اطلاعات تماس</h2>
              <label style={styles.label}>نام</label>
              <input style={styles.input} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" />
              <label style={styles.label}>نام خانوادگی</label>
              <input style={styles.input} value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" />
              <label style={styles.label}>شماره تماس</label>
              <input style={styles.input} value={mobile} onChange={(event) => setMobile(event.target.value)} inputMode="tel" autoComplete="tel" />
              {category === "energy" && (
                <>
                  <label style={styles.label}>روش دریافت انرژی‌خوانی</label>
                  <div style={styles.grid}>
                    <button type="button" style={deliveryMethod === "phone" ? styles.selected : styles.service} onClick={() => setDeliveryMethod("phone")}>تماس تلفنی</button>
                    <button type="button" style={deliveryMethod === "voice" ? styles.selected : styles.service} onClick={() => setDeliveryMethod("voice")}>پیام صوتی</button>
                  </div>
                </>
              )}
              <button type="button" style={styles.primary} disabled={busy || loading || !services.length} onClick={submitRequest}>{busy ? "در حال ثبت…" : "ثبت درخواست برای بررسی مایا"}</button>
              <p style={styles.hint}>با ثبت این فرم فقط درخواست اولیه ارسال می‌شود؛ هیچ پرداختی در این مرحله انجام نده.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
