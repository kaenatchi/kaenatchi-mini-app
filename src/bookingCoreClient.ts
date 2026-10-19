/**
 * KaenatChi Booking Core — staging-only API client.
 *
 * Deliberately isolated from App.tsx until the end-to-end contract is verified.
 * Never point this module at production. Do not submit a receipt until an HTTPS
 * receipt-storage flow is implemented and tested.
 */
export const BOOKING_CORE_STAGING_ENDPOINT =
  "https://kaenatchi-booking-core-staging-v2.mayanaz-oriflame.workers.dev/";

export type BookingCoreService = {
  id: string;
  name: string;
  category: "energy" | "therapy";
  price: number;
};

export type BookingCoreDate = {
  date: string; // ISO YYYY-MM-DD
  weekday: string;
  jalaliDate: string;
  label: string;
};

export type BookingCoreSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  status: "AVAILABLE" | "BOOKED" | "CLOSED";
  label: string;
};

export type BookingCoreAvailability = {
  date: string;
  weekday: string;
  jalaliDate: string;
  slotMinutes: 60;
  services: BookingCoreService[];
  totalPrice: number;
  slots: BookingCoreSlot[];
};

export type BookingCorePublicBooking = {
  bookingId: string;
  trackingId?: string;
  appointmentCode?: string;
  status: string;
  customerAccessToken?: string;
  paymentDeadlineAt?: string;
  totalPrice?: number;
  [key: string]: unknown;
};

type ApiEnvelope<T> = { ok: true; result: T } | { ok: false; error?: string };

async function post<T>(action: string, fields: Record<string, unknown> = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(BOOKING_CORE_STAGING_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ action, ...fields }),
    });
  } catch {
    throw new Error("ارتباط با سامانه آزمایشی رزرو برقرار نشد.");
  }

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error("پاسخ سامانه آزمایشی قابل‌خواندن نیست.");
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const message = payload && payload.ok === false ? payload.error : undefined;
    throw new Error(message || `خطای ارتباط با سامانه رزرو (${response.status}).`);
  }
  return payload.result;
}

export async function getBookingCoreServices(): Promise<BookingCoreService[]> {
  const result = await post<unknown>("getServiceCatalog");
  if (!Array.isArray(result)) throw new Error("فهرست خدمات سامانه رزرو معتبر نیست.");
  return result.map((item) => {
    const service = item as Partial<BookingCoreService>;
    if (
      typeof service.id !== "string" ||
      typeof service.name !== "string" ||
      (service.category !== "energy" && service.category !== "therapy") ||
      !Number.isFinite(Number(service.price))
    ) {
      throw new Error("یکی از خدمات دریافتی ساختار نامعتبر دارد.");
    }
    return {
      id: service.id,
      name: service.name,
      category: service.category,
      price: Number(service.price),
    };
  });
}

export async function getBookingCoreDates(
  serviceIds: string[] = [],
): Promise<BookingCoreDate[]> {
  const result = await post<{ dates?: BookingCoreDate[] }>(
    "getBookableDates",
    serviceIds.length ? { services: serviceIds } : {},
  );
  if (!Array.isArray(result?.dates)) {
    throw new Error("تاریخ‌های قابل رزرو در پاسخ سامانه وجود ندارد.");
  }
  return result.dates;
}

export async function getBookingCoreAvailability(
  date: string,
  serviceIds: string[],
): Promise<BookingCoreAvailability> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("تاریخ انتخاب‌شده معتبر نیست.");
  }
  if (!serviceIds.length) throw new Error("ابتدا دست‌کم یک خدمت را انتخاب کن.");
  const result = await post<BookingCoreAvailability>("getAvailability", {
    date,
    services: serviceIds,
  });
  if (!Array.isArray(result?.slots) || result.slotMinutes !== 60) {
    throw new Error("ساختار ساعت‌های رزرو معتبر نیست.");
  }
  return result;
}

export function createBookingCoreRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  const randomPart = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return (`KC${Date.now().toString(36)}${randomPart}`).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
}

export async function submitBookingCoreRequest(input: {
  clientRequestId: string;
  customer: { name: string; contact: string };
  services: string[];
  date: string;
  startTime: string;
  deliveryMethod?: string;
}): Promise<BookingCorePublicBooking> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(input.clientRequestId)) {
    throw new Error("شناسه امن درخواست رزرو معتبر نیست.");
  }
  return post<BookingCorePublicBooking>("submitRequest", input);
}

export async function getBookingCoreStatus(input: {
  bookingId: string;
  customerAccessToken: string;
}): Promise<BookingCorePublicBooking> {
  return post<BookingCorePublicBooking>("getBookingStatus", input);
}

/**
 * The staging core currently requires a previously uploaded HTTPS URL.
 * This client intentionally does not upload files or call this method itself:
 * receipt storage must be designed before this action is exposed in the UI.
 */
export async function submitBookingCoreReceipt(input: {
  bookingId: string;
  customerAccessToken: string;
  receiptUrl: string;
  claimedTrackingNumber?: string;
}): Promise<BookingCorePublicBooking> {
  if (!/^https:\/\//i.test(input.receiptUrl)) {
    throw new Error("رسید باید ابتدا در فضای امن بارگذاری شود.");
  }
  return post<BookingCorePublicBooking>("submitReceipt", input);
}
