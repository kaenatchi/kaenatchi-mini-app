import { useEffect, useMemo, useState } from "react";
import {
  getStagingAvailability,
  getStagingBookableDates,
  getStagingBookingStatus,
  getStagingServiceCatalog,
  submitStagingReceipt,
  submitStagingRequest,
  type StagingBooking,
  type StagingService,
} from "./bookingStagingClient";

type Props = {
  onBack?: () => void;
  paymentCardNumber?: string;
  paymentBank?: string;
  paymentHolder?: string;
};

const panel: React.CSSProperties = {
  background: "rgba(255,255,255,.78)",
  border: "1px solid rgba(53,59,50,.12)",
  borderRadius: 20,
  padding: 16,
  marginBottom: 12,
  color: "#26342b",
};
const field: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 13,
  borderRadius: 14,
  border: "1px solid rgba(53,59,50,.18)",
  background: "#fff",
  color: "#26342b",
  font: "inherit",
  marginTop: 8,
};
const primary: React.CSSProperties = {
  width: "100%",
  padding: 15,
  border: 0,
  borderRadius: 16,
  background: "linear-gradient(135deg,#174b38,#2c7658)",
  color: "#fff",
  font: "inherit",
  fontWeight: 700,
  cursor: "pointer",
};

export default function StagingBookingPage({
  onBack,
  paymentCardNumber = "",
  paymentBank = "",
  paymentHolder = "",
}: Props) {
  const [services, setServices] = useState<StagingService[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dates, setDates] = useState<Array<{date:string;label:string;weekday:string;jalaliDate:string}>>([]);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Array<{startTime:string;status:string;available:boolean;label:string}>>([]);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"phone"|"voice">("phone");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File|null>(null);
  const [booking, setBooking] = useState<StagingBooking|null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const chosenServices = useMemo(
    () => services.filter((service) => selectedIds.includes(service.id)),
    [services, selectedIds],
  );
  const category = chosenServices[0]?.category || "";
  const total = chosenServices.reduce((sum, service) => sum + Number(service.price || 0), 0);
  const isEnergy = category === "energy";
  const isTherapy = category === "therapy";
  const canSubmitReceipt = booking?.status === "AWAITING_PAYMENT" || booking?.status === "PAYMENT_REJECTED";

  useEffect(() => {
    let active = true;
    getStagingServiceCatalog()
      .then((items) => { if (active) setServices(items); })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "دریافت خدمات آزمایشی ناموفق بود."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setDate("");
    setTime("");
    setSlots([]);
    if (!selectedIds.length) { setDates([]); return; }
    getStagingBookableDates(selectedIds)
      .then((result) => { if (active) setDates(result.dates || []); })
      .catch((error) => { if (active) { setDates([]); setMessage(error instanceof Error ? error.message : "دریافت تاریخ ممکن نبود."); } });
    return () => { active = false; };
  }, [selectedIds.join("|")]);

  useEffect(() => {
    let active = true;
    setTime("");
    setSlots([]);
    if (!date || !selectedIds.length) return;
    getStagingAvailability(date, selectedIds)
      .then((result) => { if (active) setSlots(result.slots || []); })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "دریافت ساعت‌ها ممکن نبود."); });
    return () => { active = false; };
  }, [date, selectedIds.join("|")]);

  const toggleService = (service: StagingService) => {
    setMessage("");
    setBooking(null);
    setSelectedIds((current) => {
      if (current.includes(service.id)) return current.filter((id) => id !== service.id);
      if (current.length && current[0] && services.find((item) => item.id === current[0])?.category !== service.category) {
        return [service.id];
      }
      if (service.category === "therapy") return [service.id];
      return [...current, service.id];
    });
  };

  const createRequest = async () => {
    setMessage("");
    if (!chosenServices.length) return setMessage("ابتدا خدمت را انتخاب کن.");
    if (!date || !time) return setMessage("تاریخ و ساعت را انتخاب کن.");
    if (!name.trim() || !contact.trim() || !reason.trim()) return setMessage("نام، شماره تماس و دلیل درخواست الزامی است.");
    if (isEnergy && !deliveryMethod) return setMessage("روش دریافت انرژی‌خوانی را انتخاب کن.");
    setBusy(true);
    try {
      const request = await submitStagingRequest({
        clientRequestId: "KCSTAGE_" + crypto.randomUUID().replace(/-/g, ""),
        customer: { name: name.trim(), contact: contact.trim(), reason: reason.trim() },
        services: selectedIds,
        date,
        startTime: time,
        deliveryMethod: isEnergy ? deliveryMethod : "",
      });
      setBooking(request);
      setMessage("درخواست ثبت شد و تا ۱۲ ساعت در انتظار بررسی مایا است. تا زمان تأیید، پرداخت و ارسال فیش فعال نیست.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ثبت درخواست ناموفق بود.");
    } finally {
      setBusy(false);
    }
  };

  const refreshStatus = async () => {
    if (!booking?.bookingId || !booking.customerAccessToken) return;
    setBusy(true);
    setMessage("");
    try {
      const updated = await getStagingBookingStatus({
        bookingId: booking.bookingId,
        customerAccessToken: booking.customerAccessToken,
      });
      setBooking((previous) => previous ? { ...previous, ...updated, customerAccessToken: previous.customerAccessToken } : updated);
      setMessage(
        updated.status === "AWAITING_PAYMENT"
          ? "درخواست تأیید شده است؛ اکنون می‌توانی پرداخت و فیش را ثبت کنی."
          : updated.status === "RECEIPT_REVIEW"
            ? "فیش دریافت شده و تا بررسی دستی پرداخت، نوبت در حالت انتظار می‌ماند."
            : "وضعیت درخواست به‌روزرسانی شد.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "بررسی وضعیت ناموفق بود.");
    } finally {
      setBusy(false);
    }
  };

  const sendReceipt = async () => {
    if (!booking?.bookingId || !booking.customerAccessToken) return setMessage("اطلاعات دسترسی درخواست در دسترس نیست.");
    if (!canSubmitReceipt) return setMessage("ارسال فیش فقط پس از تأیید اولیهٔ درخواست فعال می‌شود.");
    if (!receiptFile && !trackingNumber.trim()) return setMessage("تصویر فیش یا کد پیگیری را وارد کن.");
    if (!receiptFile) return setMessage("برای مسیر دریافت فیش، تصویر فیش را انتخاب کن.");
    setBusy(true);
    setMessage("");
    try {
      const updated = await submitStagingReceipt({
        bookingId: booking.bookingId,
        customerAccessToken: booking.customerAccessToken,
        claimedTrackingNumber: trackingNumber.trim(),
        receiptFile,
      });
      setBooking((previous) => previous ? { ...previous, ...updated, customerAccessToken: previous.customerAccessToken } : updated);
      setMessage(updated.telegramNotificationSent
        ? "تصویر فیش در Drive ذخیره شد و اعلان تلگرام ارسال شد؛ پرداخت تا بررسی دستی نهایی نمی‌شود."
        : "درخواست ارسال فیش ثبت شد، اما اعلان تلگرام تأیید نشد. وضعیت ذخیره‌سازی را از پنل staging بررسی کن.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ارسال فیش ناموفق بود.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" style={{minHeight:"100vh",boxSizing:"border-box",padding:"20px 14px 40px",background:"linear-gradient(160deg,#f6f2e8,#e9eee7)",fontFamily:"inherit",color:"#26342b"}}>
      <div style={{maxWidth:620,margin:"0 auto"}}>
        {onBack && <button type="button" onClick={onBack} style={{...field,width:"auto",marginTop:0,marginBottom:12}}>← بازگشت</button>}
        <header style={{...panel,textAlign:"center"}}>
          <div style={{fontSize:11,letterSpacing:2,color:"#557262"}}>KAENATCHI · STAGING</div>
          <h1 style={{fontSize:24,margin:"8px 0"}}>رزرو آزمایشی</h1>
          <p style={{fontSize:13,lineHeight:1.9,margin:0}}>این مسیر فقط به بک‌اند staging متصل است و نسخهٔ اصلی را تغییر نمی‌دهد.</p>
        </header>

        <section style={panel}>
          <h2 style={{fontSize:17,margin:"0 0 10px"}}>۱. انتخاب خدمت</h2>
          {!services.length && <p style={{fontSize:13}}>در حال دریافت خدمات آزمایشی…</p>}
          {(["energy","therapy"] as const).map((kind) => (
            <div key={kind} style={{marginTop:12}}>
              <strong>{kind === "energy" ? "انرژی‌خوانی" : "شمع‌تراپی / سایکوتراپی"}</strong>
              {services.filter((service) => service.category === kind).map((service) => (
                <label key={service.id} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(53,59,50,.08)",fontSize:14}}>
                  <input type="checkbox" checked={selectedIds.includes(service.id)} onChange={() => toggleService(service)} />
                  <span style={{flex:1}}>{service.name}</span>
                  <strong>{Number(service.price).toLocaleString("fa-IR")} تومان</strong>
                </label>
              ))}
            </div>
          ))}
          {chosenServices.length > 0 && <div style={{marginTop:14,fontWeight:700}}>جمع خدمات: {total.toLocaleString("fa-IR")} تومان</div>}
          {isEnergy && <div style={{marginTop:12}}>
            <strong style={{fontSize:13}}>روش دریافت انرژی‌خوانی</strong>
            <div style={{display:"flex",gap:14,marginTop:8,fontSize:13}}>
              <label><input type="radio" checked={deliveryMethod==="phone"} onChange={()=>setDeliveryMethod("phone")} /> تماس تلفنی</label>
              <label><input type="radio" checked={deliveryMethod==="voice"} onChange={()=>setDeliveryMethod("voice")} /> پیام صوتی</label>
            </div>
          </div>}
        </section>

        <section style={panel}>
          <h2 style={{fontSize:17,margin:"0 0 10px"}}>۲. تاریخ و ساعت</h2>
          <select value={date} onChange={(event)=>setDate(event.target.value)} style={field}>
            <option value="">انتخاب نزدیک‌ترین تاریخ باز</option>
            {dates.map((item) => <option key={item.date} value={item.date}>{item.label || (item.weekday + " - " + item.jalaliDate)}</option>)}
          </select>
          <select value={time} onChange={(event)=>setTime(event.target.value)} style={field} disabled={!date}>
            <option value="">انتخاب ساعت</option>
            {slots.map((slot) => <option key={slot.startTime} value={slot.startTime} disabled={!slot.available}>
              {slot.startTime} {slot.status === "BOOKED" ? "❌ رزرو شده" : slot.status === "CLOSED" ? "⛔️ تعطیل" : ""}
            </option>)}
          </select>
        </section>

        <section style={panel}>
          <h2 style={{fontSize:17,margin:"0 0 10px"}}>۳. اطلاعات درخواست</h2>
          <input value={name} onChange={(event)=>setName(event.target.value)} placeholder="نام و نام خانوادگی" style={field} autoComplete="name" />
          <input value={contact} onChange={(event)=>setContact(event.target.value)} placeholder="شماره موبایل یا راه تماس" style={field} inputMode="tel" autoComplete="tel" />
          <textarea value={reason} onChange={(event)=>setReason(event.target.value)} placeholder="دلیل درخواست / توضیح کوتاه" style={{...field,minHeight:100,resize:"vertical"}} />
          <button type="button" onClick={() => void createRequest()} disabled={busy} style={{...primary,marginTop:12,opacity:busy?.65:1}}>
            {busy ? "در حال ارسال…" : "ثبت درخواست برای بررسی"}
          </button>
        </section>

        {booking && <section style={panel}>
          <h2 style={{fontSize:17,margin:"0 0 10px"}}>وضعیت درخواست</h2>
          <p style={{fontSize:13,lineHeight:1.9}}>کد درخواست: <b dir="ltr">{booking.appointmentCode || booking.bookingId}</b></p>
          <p style={{fontSize:13}}>وضعیت: <b dir="ltr">{booking.status}</b></p>
          <button type="button" onClick={() => void refreshStatus()} disabled={busy} style={{...primary,background:"#52675a",opacity:busy?.65:1}}>بررسی وضعیت از سرور</button>
          {canSubmitReceipt ? <>
            <div style={{marginTop:14,padding:14,borderRadius:14,background:"rgba(36,99,71,.07)"}}>
              <strong>درخواست تأیید شده؛ پرداخت مجاز است</strong>
              <p style={{fontSize:13,lineHeight:1.8}}>مهلت پرداخت: {booking.paymentDeadlineAt || "از وضعیت سرور دریافت نشد"}</p>
              {paymentCardNumber ? <div style={{marginTop:10}}>
                <div style={{fontSize:12,opacity:.7}}>شماره کارت</div><b dir="ltr">{paymentCardNumber}</b>
                {(paymentBank || paymentHolder) && <div style={{fontSize:12,marginTop:5}}>{[paymentBank,paymentHolder].filter(Boolean).join(" · ")}</div>}
              </div> : <p style={{fontSize:12,lineHeight:1.8}}>اطلاعات کارت از CMS staging به این مسیر متصل نشده؛ پیش از پرداخت، شماره کارت را از منبع رسمی تأیید کن.</p>}
              <input value={trackingNumber} onChange={(event)=>setTrackingNumber(event.target.value)} placeholder="کد پیگیری پرداخت (در صورت وجود)" style={field} />
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event)=>setReceiptFile(event.target.files?.[0] || null)} style={{...field,padding:10}} />
              <button type="button" onClick={() => void sendReceipt()} disabled={busy} style={{...primary,marginTop:12,opacity:busy?.65:1}}>
                {busy ? "در حال ارسال فیش…" : "ارسال فیش پرداخت"}
              </button>
            </div>
          </> : <p style={{fontSize:13,lineHeight:1.9}}>تا وقتی وضعیت سرور به AWAITING_PAYMENT نرسیده، امکان پرداخت و ارسال فیش وجود ندارد.</p>}
        </section>}

        {message && <div role="status" aria-live="polite" style={{...panel,background:"rgba(36,99,71,.08)",fontSize:13,lineHeight:1.9,whiteSpace:"pre-line"}}>{message}</div>}
        <p style={{fontSize:11,opacity:.65,textAlign:"center"}}>محیط آزمایشی است؛ تا اعلام آمادگی و تأیید اتصال‌ها از آن برای رزرو واقعی استفاده نکن.</p>
      </div>
    </div>
  );
}
