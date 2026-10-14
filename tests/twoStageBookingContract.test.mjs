import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCreateRequestPayload,
  buildSubmitReceiptPayload,
  canSubmitReceipt,
  normalizeStagingSlot,
  normalizeStagingStatus,
  shouldKeepSlotHeld,
} from "../src/booking/twoStageBookingContract.ts";

const NOW = Date.parse("2026-10-14T10:00:00.000Z");
const status = (overrides = {}) => normalizeStagingStatus({
  ok: true,
  found: true,
  requestId: "REQ-123",
  trackingCode: "TRACK-123",
  status: "PAYMENT_PENDING",
  paymentDeadline: "2026-10-14T10:30:00.000Z",
  canResumeReceipt: true,
  ...overrides,
}, NOW);

test("REQUEST_PENDING is not a payment invitation", () => {
  const result = status({ status: "REQUEST_PENDING", paymentDeadline: null, canResumeReceipt: false });
  assert.equal(result.paymentStatus, "NOT_DUE");
  assert.equal(result.canResumeReceipt, false);
  assert.equal(canSubmitReceipt(result, NOW), false);
});

test("only server-authorized, unexpired PAYMENT_PENDING permits receipt submission", () => {
  const result = status();
  assert.equal(result.paymentStatus, "DUE");
  assert.equal(result.canResumeReceipt, true);
  assert.equal(canSubmitReceipt(result, NOW), true);
});

test("expired or missing payment deadline fails closed", () => {
  assert.equal(canSubmitReceipt(status({ paymentDeadline: "2026-10-14T09:59:59.000Z" }), NOW), false);
  assert.equal(canSubmitReceipt(status({ paymentDeadline: null }), NOW), false);
  assert.equal(canSubmitReceipt(status({ canResumeReceipt: false }), NOW), false);
});

test("receipt review keeps the slot held and cannot accept another receipt", () => {
  const result = status({ status: "RECEIPT_REVIEW", canResumeReceipt: false });
  assert.equal(shouldKeepSlotHeld(result), true);
  assert.equal(canSubmitReceipt(result, NOW), false);
});

test("unknown and not-found status never enables receipt submission", () => {
  assert.deepEqual(normalizeStagingStatus({ ok: true, found: false }, NOW), { found: false });
  assert.equal(canSubmitReceipt(status({ status: "UNKNOWN" }), NOW), false);
});

test("Staging AVAILABLE/BOOKED/BLOCKED slots map to the Mini App contract", () => {
  assert.deepEqual(normalizeStagingSlot({ time: "11:00", status: "AVAILABLE" }), {
    time: "11:00", status: "FREE", available: true,
  });
  assert.equal(normalizeStagingSlot({ status: "BOOKED" }).available, false);
  assert.equal(normalizeStagingSlot({ status: "BLOCKED" }).available, false);
  assert.equal(normalizeStagingSlot({ status: "unrecognized" }).status, "BLOCKED");
});

test("initial request payload trims and deduplicates services without receipt data", () => {
  const payload = buildCreateRequestPayload({
    requestId: " REQ-1 ",
    firstName: " مایا ",
    lastName: " آزمایشی ",
    phone: "09371234567",
    serviceIds: [" coffee ", "coffee", ""],
    date: " 1405/07/23 ",
    time: " 11:00 ",
    discountCode: "",
    telegramId: " 123 ",
  });
  assert.deepEqual(payload.serviceIds, ["coffee"]);
  assert.equal(payload.requestId, "REQ-1");
  assert.equal("receiptData" in payload, false);
  assert.equal("transactionNumber" in payload, false);
});

test("receipt payload must match the verified tracking code and phone format", () => {
  const snapshot = status();
  const input = {
    trackingCode: "TRACK-123",
    phone: "09371234567",
    transactionNumber: " 9988 ",
    receiptData: "base64",
    receiptFileName: " receipt.jpg ",
    receiptMimeType: " image/jpeg ",
  };
  const built = buildSubmitReceiptPayload(snapshot, input, NOW);
  assert.equal(built.transactionNumber, "9988");
  assert.equal(built.receiptFileName, "receipt.jpg");
  assert.throws(() => buildSubmitReceiptPayload(snapshot, { ...input, trackingCode: "WRONG" }, NOW));
  assert.throws(() => buildSubmitReceiptPayload(snapshot, { ...input, phone: "۰۹۳۷۱۲۳۴۵۶۷" }, NOW));
});

test("getSlots envelope preserves blocked/booked slots and fails closed on API errors", async () => {
  const { normalizeStagingSlotsResponse } = await import("../src/booking/twoStageBookingContract.ts");
  const response = normalizeStagingSlotsResponse({
    ok: true,
    date: "1405/07/23",
    serviceMode: "energy",
    durationMinutes: 30,
    slots: [
      { time: "11:00", status: "AVAILABLE", label: "11:00" },
      { time: "12:00", status: "BOOKED", label: "رزرو شده" },
      { time: "13:00", status: "BLOCKED", label: "تعطیل" },
    ],
  });
  assert.equal(response.ok, true);
  assert.equal(response.slots.length, 3);
  assert.equal(response.slots[0].available, true);
  assert.equal(response.slots[1].available, false);
  assert.equal(response.slots[1].status, "BOOKED");
  assert.equal(response.slots[2].available, false);
  assert.equal(response.slots[2].status, "BLOCKED");
  assert.deepEqual(normalizeStagingSlotsResponse({ ok: false, message: "error" }).slots, []);
});
