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
  | "RESCHEDULE_PENDING";

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
  requestId: string;
  bookingId: string;
  telegramId: string;
  transactionNumber: string;
  receiptData: string;
  receiptFileName: string;
  receiptMimeType: string;
};

export type BookingStatusSnapshot = {
  found: boolean;
  requestId?: string;
  bookingId?: string;
  trackingCode?: string;
  status?: TwoStageBookingStatus;
  paymentStatus?: TwoStagePaymentStatus;
  paymentDeadline?: string;
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
export function canSubmitReceipt(snapshot: BookingStatusSnapshot): boolean {
  return snapshot.found === true
    && snapshot.status === "PAYMENT_PENDING"
    && snapshot.paymentStatus === "DUE"
    && Boolean(snapshot.bookingId)
    && Boolean(snapshot.requestId);
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
  input: SubmitReceiptRequest
): SubmitReceiptRequest {
  if (!canSubmitReceipt(snapshot)) {
    throw new Error("پرداخت فقط پس از پذیرش درخواست و فعال‌شدن مهلت پرداخت مجاز است.");
  }
  if (input.requestId !== snapshot.requestId || input.bookingId !== snapshot.bookingId) {
    throw new Error("شناسهٔ درخواست یا نوبت با وضعیت معتبر سامانه مطابقت ندارد.");
  }
  return {
    ...input,
    transactionNumber: input.transactionNumber.trim(),
    receiptFileName: input.receiptFileName.trim(),
    receiptMimeType: input.receiptMimeType.trim(),
  };
}
