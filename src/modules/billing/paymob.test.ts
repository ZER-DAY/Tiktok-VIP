import { describe, expect, it } from "vitest";
import { convertUsdCentsToEgp } from "./payment-config";
import { getPaymobTransactionHmacValue, verifyPaymobTransactionHmac } from "./paymob";

const transaction = {
  amount_cents: 1000,
  created_at: "2026-08-31T10:00:00",
  currency: "EGP",
  error_occured: false,
  has_parent_transaction: false,
  id: 123,
  integration_id: 456,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  order: { id: 789, merchant_order_id: "b3d897d5-312e-4a7e-9be9-b7812298a8a1" },
  owner: 321,
  pending: false,
  source_data: { pan: "1234", sub_type: "NA", type: "card" },
  success: true,
};

describe("Paymob billing helpers", () => {
  it("converts the stored USD plan price to EGP minor units", () => {
    expect(convertUsdCentsToEgp(2000, 50.25)).toBe(100500);
  });

  it("uses Paymob's documented transaction field order", () => {
    expect(getPaymobTransactionHmacValue(transaction)).toBe(
      "10002026-08-31T10:00:00EGPfalsefalse123456truefalsefalsefalsetruefalse789321false1234NAcardtrue"
    );
  });

  it("accepts a valid HMAC and rejects a modified callback", () => {
    const validHmac =
      "ca641a3cc7c77aea35e9fe3504b5ffaeefeccd865fa2056bf7cdca567dac13913bc1440dc5b82fcf508d25a71384a534462f505c580bb543f3de228564f7d2fb";
    expect(verifyPaymobTransactionHmac(transaction, validHmac, "test-secret")).toBe(true);
    expect(
      verifyPaymobTransactionHmac({ ...transaction, amount_cents: 2000 }, validHmac, "test-secret")
    ).toBe(false);
  });
});
