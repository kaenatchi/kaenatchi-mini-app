/**
 * Staging-only contract for the two-stage KaenatChi booking flow.
 *
 * This module is deliberately not wired to the current live transport:
 * the existing Worker/backend still exposes the legacy createBooking /
 * submitPayment contract. Wire this adapter only after a separately deployed
 * staging backend endpoint is configured and verified.
 */
export type TwoStageBookingStatus =
  | "REQUEST_PENDING"
  | "PAYMENT_PENDING"
  | "RECEIPT_REVIEW"
  | "CONFIRMED"
  | "EXPIRED"
  | "REJECTED"
  | "CANCEL_PENDING"
  | "RESCHEDULE_PENDING"
  | "CANCEL_REQUESTED"
  | "RESCHEDULE_REQUESTED"
  | "MANAGER_RESCHEDULE_OFFERED"
  | "CANCELLED";

export type TwoStagePaymentStatus =
  | "NOT_DUE"
  | "DUE"
  | "RECEIPT_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export type CreateBookingRequest = {
  requestId: string;
  firstName: string;
  lastName: string;
  phone: string;
  serviceIds: string[];
  date: string;
  time: string;
  discountCode?: string;
  telegramId: string;
};

export type SubmitReceiptRequest = {
  trackingCode: string;
  phone: string;
  transactionRef: string;
  receiptBase64: string;
  mimeType: string;
};

export type BookingStatusSnapshot = {
  found: boolean;
  requestId?: string;
  bookingId?: string;
  trackingCode?: string;
  status?: TwoStageBookingStatus;
  paymentStatus?: TwoStagePaymentStatus;
  paymentDeadline?: string;
  canResumeReceipt?: boolean;
};

export type TwoStageAction =
  | "getConfig"
  | "getSlots"
  | "getStatus"
  | "createRequest"
  | "submitReceipt"
  | "adminDecision"
  | "requestCancel"
  | "requestReschedule"
  | "managerRescheduleOffer"
  | "acceptManagerReschedule";

export const TWO_STAGE_ACTIONS: ReadonlySet<TwoStageAction> = new Set([
  "getConfig",
  "getSlots",
  "getStatus",
  "createRequest",
  "submitReceipt",
  "adminDecision",
  "requestCancel",
  "requestReschedule",
  "managerRescheduleOffer",
  "acceptManagerReschedule",
]);

/** Customer must never submit payment while the initial request awaits review. */
export function canSubmitReceipt(
  snapshot: BookingStatusSnapshot,
  now: number = Date.now()
): boolean {
  const deadline = snapshot.paymentDeadline
    ? Date.parse(snapshot.paymentDeadline)
    : Number.NaN;
  return snapshot.found === true
    && snapshot.status === "PAYMENT_PENDING"
    && snapshot.paymentStatus === "DUE"
    && snapshot.canResumeReceipt === true
    && Number.isFinite(deadline)
    && deadline > now
    && Boolean(snapshot.trackingCode)
    && Boolean(snapshot.requestId);
}

/** Convert the actual Staging getStatus response into a fail-closed UI snapshot. */
export function normalizeStagingStatus(
  raw: Record<string, unknown>,
  now: number = Date.now()
): BookingStatusSnapshot {
  if (raw.found !== true) return { found: false };
  const status = String(raw.status || "") as TwoStageBookingStatus;
  const deadline = typeof raw.paymentDeadline === "string" ? raw.paymentDeadline : "";
  const deadlineMs = deadline ? Date.parse(deadline) : Number.NaN;
  const paymentStatus: TwoStagePaymentStatus =
    status === "RECEIPT_REVIEW" ? "RECEIPT_REVIEW"
      : status === "CONFIRMED" ? "VERIFIED"
      : status === "REJECTED" ? "REJECTED"
      : status === "EXPIRED" ? "EXPIRED"
      : status === "PAYMENT_PENDING" && Number.isFinite(deadlineMs) && deadlineMs > now
        ? "DUE"
        : status === "PAYMENT_PENDING" ? "EXPIRED" : "NOT_DUE";
  return {
    found: true,
    requestId: typeof raw.requestId === "string" ? raw.requestId : undefined,
    // Staging uses Tracking Code as the customer lookup key; never invent bookingId.
    trackingCode: typeof raw.trackingCode === "string" ? raw.trackingCode : undefined,
    status,
    paymentStatus,
    paymentDeadline: deadline || undefined,
    canResumeReceipt: raw.canResumeReceipt === true
      && status === "PAYMENT_PENDING"
      && paymentStatus === "DUE",
  };
}

/** Translate Staging slot statuses into the Mini App's existing slot filter contract. */
export function normalizeStagingSlot<T extends Record<string, unknown>>(raw: T): T & {
  available: boolean;
  status: "FREE" | "BOOKED" | "BLOCKED";
} {
  const backendStatus = String(raw.status || "").toUpperCase();
  const status = backendStatus === "AVAILABLE" ? "FREE"
    : backendStatus === "BOOKED" ? "BOOKED"
    : "BLOCKED";
  return {
    ...raw,
    available: status === "FREE",
    status,
  };
}

/** Normalize the complete Staging getSlots envelope; errors fail closed. */
export function normalizeStagingSlotsResponse(
  raw: Record<string, unknown>
): { ok: boolean; date?: string; slots: Array<Record<string, unknown> & {
  available: boolean;
  status: "FREE" | "BOOKED" | "BLOCKED";
}>; message?: string; serviceMode?: string; durationMinutes?: number } {
  const ok = raw.ok === true && Array.isArray(raw.slots);
  const slots = ok
    ? (raw.slots as Array<Record<string, unknown>>).map(normalizeStagingSlot)
    : [];
  return {
    ok,
    date: typeof raw.date === "string" ? raw.date : undefined,
    slots,
    message: typeof raw.message === "string" ? raw.message : undefined,
    serviceMode: typeof raw.serviceMode === "string" ? raw.serviceMode : undefined,
    durationMinutes: typeof raw.durationMinutes === "number" ? raw.durationMinutes : undefined,
  };
}

/** A receipt under manual review is a hold, not an expiring payment window. */
export function shouldKeepSlotHeld(snapshot: BookingStatusSnapshot): boolean {
  return snapshot.status === "RECEIPT_REVIEW"
    || snapshot.paymentStatus === "RECEIPT_REVIEW";
}

/** Build only the initial request payload; it contains no receipt/payment fields. */
export function buildCreateRequestPayload(
  input: CreateBookingRequest
): CreateBookingRequest {
  return {
    requestId: input.requestId.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone.trim(),
    serviceIds: [...new Set(input.serviceIds.map((id) => id.trim()).filter(Boolean))],
    date: input.date.trim(),
    time: input.time.trim(),
    discountCode: (input.discountCode || "").trim(),
    telegramId: input.telegramId.trim(),
  };
}

/** Refuse to build a receipt mutation unless the server status says payment is due. */
export function buildSubmitReceiptPayload(
  snapshot: BookingStatusSnapshot,
  input: SubmitReceiptRequest,
  now: number = Date.now()
): SubmitReceiptRequest {
  if (!canSubmitReceipt(snapshot, now)) {
    throw new Error("پرداخت فقط پس از پذیرش درخواست و فعال‌شدن مهلت پرداخت مجاز است.");
  }
  if (input.trackingCode !== snapshot.trackingCode || !/^09[0-9]{9}$/.test(input.phone)) {
    throw new Error("کد پیگیری یا شماره همراه با وضعیت معتبر سامانه مطابقت ندارد.");
  }
  if (!input.receiptBase64.trim() || !/^image\/(jpeg|png|webp)$/.test(input.mimeType)) {
    throw new Error("تصویر فیش باید JPEG، PNG یا WebP معتبر باشد.");
  }
  if (!input.transactionRef.trim()) {
    throw new Error("شماره پیگیری تراکنش الزامی است.");
  }
  return {
    ...input,
    transactionRef: input.transactionRef.trim(),
    receiptBase64: input.receiptBase64.trim(),
    mimeType: input.mimeType.trim(),
  };
}
