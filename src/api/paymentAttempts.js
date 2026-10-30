import { api } from "./client";

export const TERMINAL_PAYMENT_STATUSES = new Set([
  "succeeded",
  "failed",
  "cancelled",
  "expired",
]);

/**
 * Retrieve the current state of a payment attempt.
 * This checks payment status; it does not initiate a payment.
 */
export async function getPaymentAttemptStatus(attemptId) {
  if (!attemptId || typeof attemptId !== "string") {
    throw new TypeError("A valid payment attempt ID is required.");
  }

  const response = await api.get(
    `/api/payments/attempts/${encodeURIComponent(attemptId)}/`
  );

  const data = response?.data;

  if (!data || typeof data !== "object" || !data.id) {
    throw new Error(
      "The payment status endpoint returned an invalid response."
    );
  }

  return {
    ...data,
    status: String(data.status || "unknown").toLowerCase(),
  };
}