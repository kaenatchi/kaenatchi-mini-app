/**
 * KaenatChi Booking Core — isolated staging client.
 *
 * This module intentionally targets ONLY the staging Worker. It does not
 * replace the existing production transport; the isolated page imports it
 * only when the explicit bookingStaging=1 route is opened.
 */
export const BOOKING_STAGING_ENDPOINT =
  "https://kaenatchi-booking-staging-transport.mayanaz-oriflame.workers.dev/";

export type StagingService = {
  id: string;
  name: string;
  category: "energy" | "therapy";
  price: number;
};

export type StagingBooking = {
  bookingId: string;
  trackingId: string;
  appointmentCode: string;
  date: string;
  startTime: string;
  totalPrice: number;
  status: string;
  requestExpiresAt?: string;
  paymentDeadlineAt?: string;
  customerAccessToken?: string;
};

type StagingEnvelope<T> = {
  ok: boolean;
  result?: T;
  error?: string;
  message?: string;
};

async function stagingPost<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(BOOKING_STAGING_ENDPOINT, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
    redirect: "follow",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    },
    body: JSON.stringify({ action, ...payload }),
  });

  let envelope: StagingEnvelope<T>;
  try {
    envelope = (await response.json()) as StagingEnvelope<T>;
  } catch {
    throw new Error("پاسخ سامانه رزرو آزمایشی قابل خواندن نیست.");
  }

  if (!response.ok || envelope.ok !== true || envelope.result === undefined) {
    throw new Error(
      envelope.error ||
        envelope.message ||
        "در ارتباط با سامانه رزرو آزمایشی خطایی رخ داد.",
    );
  }

  return envelope.result;
}

export function getStagingServiceCatalog(): Promise<StagingService[]> {
  return stagingPost<StagingService[]>("getServiceCatalog");
}

export function getStagingBookableDates(
  services?: string[],
): Promise<{
  dates: Array<{ date: string; weekday: string; jalaliDate: string; label: string }>;
  bookingHorizonDays: number;
  timezone: string;
}> {
  return stagingPost("getBookableDates", services ? { services } : {});
}

export function getStagingAvailability(
  date: string,
  services: string[],
): Promise<{
  date: string;
  weekday: string;
  jalaliDate: string;
  totalPrice: number;
  slots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
    status: "CLOSED" | "BOOKED" | "AVAILABLE";
    label: string;
  }>;
}> {
  return stagingPost("getAvailability", { date, services });
}

export function submitStagingRequest(input: {
  clientRequestId: string;
  customer: { name: string; contact: string; reason: string };
  services: string[];
  date: string;
  startTime: string;
  deliveryMethod?: "phone" | "voice" | "";
}): Promise<StagingBooking> {
  return stagingPost("submitRequest", input);
}

export function getStagingBookingStatus(input: {
  bookingId: string;
  customerAccessToken: string;
}): Promise<StagingBooking> {
  return stagingPost("getBookingStatus", input);
}

export async function submitStagingReceipt(input: {
  bookingId: string;
  customerAccessToken: string;
  claimedTrackingNumber?: string;
  receiptFile: File;
}): Promise<StagingBooking & {
  receiptStored: boolean;
  telegramNotificationSent: boolean;
}> {
  const file = input.receiptFile;
  if (!file.type.startsWith("image/")) {
    throw new Error("فقط تصویر فیش پرداخت قابل ارسال است.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("حجم تصویر فیش باید حداکثر ۸ مگابایت باشد.");
  }

  const receiptData = await fileToDataUrl(file);
  return stagingPost("submitReceipt", {
    bookingId: input.bookingId,
    customerAccessToken: input.customerAccessToken,
    claimedTrackingNumber: input.claimedTrackingNumber || "",
    receiptData,
    receiptFileName: file.name,
    receiptMimeType: file.type,
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("خواندن تصویر فیش ناموفق بود."));
    reader.onload = () => {
      const value = String(reader.result || "");
      if (!value.startsWith("data:image/")) {
        reject(new Error("محتوای تصویر فیش معتبر نیست."));
        return;
      }
      resolve(value);
    };
    reader.readAsDataURL(file);
  });
}
