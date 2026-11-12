import React, { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { getPaymentAttemptStatus } from "../api/paymentAttempts";
import { useAuth } from "../auth/AuthContext";
import HoldSaleModal from "./cart/HoldSaleModal";
import HeldSalesModal from "./cart/HeldSalesModal";
import toast from "react-hot-toast";
import { useCustomers } from "../customerModule";

function createIdempotencyUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/* =====================================================
   RECEIPT MODAL - OPTIMIZED FOR 80mm THERMAL PRINTER
===================================================== */
function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const payments = receipt.payments || [];

  const cashPaid = payments
    .filter(p => p.method === "CASH")
    .reduce((s, p) => s + Number(p.amount), 0);

  const paymentTotals = payments.reduce((totals, payment) => {
    const method = payment.method || "UNKNOWN";
    totals[method] = (totals[method] || 0) + Number(payment.amount || 0);
    return totals;
  }, {});
  const totalPaid = Object.values(paymentTotals).reduce((sum, amount) => sum + amount, 0);
  const paymentLabels = {
    CASH: "Cash",
    MPESA: "M-Pesa",
    CARD: "Card",
    BANK: "Bank Transfer",
    CHEQUE: "Cheque",
  };
  
  // Get amount given and change from receipt - ensure they're numbers
  const amountGiven = receipt.amount_given ? Number(receipt.amount_given) : totalPaid;
  const changeGiven = receipt.change_given ? Number(receipt.change_given) : 0;

  const showCustomer =
    receipt.status === "PARTIAL" || receipt.status === "CREDIT";

  return (
    <>
      {/* PRINT STYLES FOR 80mm THERMAL PRINTER */}
      <style>
        {`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            
            body * {
              visibility: hidden;
            }
            
            .print-area, .print-area * {
              visibility: visible;
            }
            
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              font-family: 'Times New Roman', Verdana, Tahoma;
              font-size: 12pt;
              line-height: 1.3;
            }
            
            .no-print {
              display: none !important;
            }
            
            /* Thermal printer optimizations */
            .print-area hr {
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            
            .print-area table {
              width: 100%;
              font-size: 12pt;
            }
            
            .print-area th, .print-area td {
              padding: 2px 0;
            }
            
            /* Signature lines for printing */
            .signature-line {
              margin-top: 20px;
              margin-bottom: 10px;
            }
            
            .signature-line .line {
              border-top: 1px dotted #000;
              width: 100%;
              margin-top: 5px;
            }
          }
        `}
      </style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
          zIndex: 9999,
        }}
      >
        <div
          className="card print-area"
          style={{
            width: "100%",
            maxWidth: 380,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            fontFamily: "'Times New Roman', 'Verdana', Tahoma",
            fontSize: "12px",
          }}
        >
          {/* RECEIPT-SCROLLABLE CONTENT */}
          <div style={{ overflowY: "auto", padding: "12px" }}>
            {/* HEADER */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 14, textTransform: "uppercase" }}>
                Premium Farming Feeds
              </div>
              <div style={{ fontSize: 11 }}>
                Turitu, Ikinu & Githiga - Kiambu
              </div>
              <div style={{ fontSize: 11 }}>
                P.O Box 1257-00900, Kiambu
              </div>
              <div style={{ fontSize: 11 }}>
                Tel:{" "}
                {[
                  receipt.branch_phone,
                  receipt.branch_phone_2,
                  receipt.branch_phone_3,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </div>
              <div style={{ fontSize: 11 }}>
              {receipt.branch_paybill && (
                <>
                  <strong>Paybill:</strong> {receipt.branch_paybill}
                </>
              )}

              {receipt.branch_paybill && receipt.branch_account_number && " | "}

              {receipt.branch_account_number && (
                <>
                  <strong>Account:</strong> {receipt.branch_account_number}
                </>
              )}
            </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {new Date(receipt.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: 11 }}>
                Receipt: #{receipt.id}
              </div>
            </div>

            <div style={{ fontSize: 12, marginBottom: 8 }}>
              Cashier: {receipt.cashier_username}
              <br />
              Branch: {receipt.branch_name}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* CUSTOMER */}
            {showCustomer && (
              <>
                <div style={{ fontWeight: 700, fontSize: 11, marginTop: 4 }}>CUSTOMER DETAILS</div>
                <div style={{ fontSize: 12 }}>
                  Name: {receipt.customer_name}<br />
                  Phone: {receipt.customer_phone}<br />
                  ID Number: {receipt.customer_id_number}
                </div>
                <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
              </>
            )}

            {/* ITEMS HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 12, marginTop: 4 }}>
              <div style={{ flex: 3 }}>ITEM</div>
              <div style={{ flex: 1, textAlign: "right" }}>QTY</div>
              <div style={{ flex: 1, textAlign: "right" }}>PRICE</div>
              <div style={{ flex: 1, textAlign: "right" }}>TOTAL</div>
            </div>

            <div style={{ borderTop: "1px dotted #000", margin: "2px 0" }} />

            {/* ITEMS LIST */}
            {(receipt.items || []).map((i, idx) => (
              <div key={idx} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: "12px", fontWeight: 500 }}>{i.product_name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                  <div style={{ flex: 3 }}>
                    {Number(i.quantity).toFixed(2)} {i.unit} @ KES {Number(i.unit_price).toFixed(2)}
                  </div>
                  <div style={{ flex: 1, textAlign: "right", fontWeight: 500 }}>
                    KES {Number(i.subtotal).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* TOTALS */}
            <div style={{ marginTop: 4,fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", }}>
                <span>Subtotal:</span>
                <span>KES {Number(receipt.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", }}>
                <span>Discount:</span>
                <span>KES {Number(receipt.discount).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", }}>
                <span>Tax:</span>
                <span>KES {Number(receipt.tax).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 4 }}>
                <span>TOTAL:</span>
                <span>KES {Number(receipt.total).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* PAYMENTS - UPDATED WITH AMOUNT GIVEN AND CHANGE */}
            <div style={{ marginTop: 4, fontSize:"12px" }}>
              <div style={{ fontWeight: 700, fontSize: 10 }}>PAYMENTS</div>
              {Object.entries(paymentTotals).map(([method, amount]) => (
                <div key={method} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{paymentLabels[method] || method}:</span>
                  <span>KES {amount.toFixed(2)}</span>
                </div>
              ))}
              
              {/* AMOUNT GIVEN BY CUSTOMER */}
              {amountGiven >0 &&(<div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                fontSize: 12, 
                marginTop: 8,
                paddingTop: 6,
                borderTop: "1px dotted #000"
              }}>
                <span>Amount Given:</span>
                <span>KES {amountGiven.toFixed(2)}</span>
              </div>
              )}
              
              {/* CHANGE TO RETURN */}
              {changeGiven > 0 && (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  fontSize: 12, 
                  fontWeight: 500,
                  marginTop: 6,
                  // padding: "6px 8px",
                  // backgroundColor: "#e6f4ea",
                  borderRadius: "4px",
                  // color: "#198038"
                }}>
                  <span> Change due:</span>
                  <span>KES {changeGiven.toFixed(2)}</span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 6 }}>
                <span>Total Paid:</span>
                <span>KES {totalPaid.toFixed(2)}</span>
              </div>
              
              {receipt.status !== "PAID" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                  <span>Balance Due:</span>
                  <span>KES {(Number(receipt.total) - totalPaid).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* SIGNATURES FOR PARTIAL/CREDIT SALES */}
            {showCustomer && (
              <div className="signature-line" style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 11, textAlign: "center", marginBottom: 12 }}>
                  AGREEMENT
                </div>
                <div style={{ fontSize: 11, marginBottom: 16 }}>
                  I hereby acknowledge receipt of goods and agree to pay the balance as stated above.
                </div>
                
                {/* Customer Signature */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, marginBottom: 4 }}>Customer Signature: _______________________</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>Date: _________________</div>
                </div>
                
                {/* Manager Signature */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, marginBottom: 4 }}>Manager Signature: _______________________</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>Date: _________________</div>
                </div>
                
                <div style={{ fontSize: 11, textAlign: "center", marginTop: 8, color: "#666" }}>
                  This is a legally binding agreement
                </div>
                <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
              </div>
            )}

            {/* FOOTER */}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                THANK YOU FOR SHOPPING WITH US
              </div>
              {receipt.status === "PARTIAL" && (
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                  Goods issued on partial payment.<br />
                  Please settle balance within 30 days.
                </div>
              )}
              {receipt.status === "CREDIT" && (
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                  Goods issued on credit.<br />
                  Payment due within 30 days.
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS (STICKY, NO PRINT) */}
          <div
            className="no-print"
            style={{
              display: "flex",
              gap: 8,
              padding: "12px",
              borderTop: "1px solid #e2e8f0",
              background: "#ffffff",
            }}
          >
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => window.print()}
            >
              🖨️ Print Receipt
            </button>

            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


/* =====================================================
   ITEM DISCOUNT REQUEST MODAL
===================================================== */
function DiscountRequestModal({
  open,
  item,
  onClose,
  onSuccess,
}) {
  const [discountPerUnit, setDiscountPerUnit] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDiscountPerUnit("");
      setReason("");
    }
  }, [open]);

  if (!open || !item) {
    return null;
  }

  const discountValue = Number(discountPerUnit) || 0;

  const isValid =
    discountValue > 0 &&
    discountValue <= Number(item.unit_price) &&
    reason.trim().length >= 5;

  const submitRequest = async () => {
    if (!isValid || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post(
        `/api/cart/pos/discount-requests/items/${item.id}/request/`,
        {
          discount_per_unit: discountPerUnit,
          reason: reason.trim(),
        }
      );

      toast.success(
        "Discount request submitted for approval."
      );

      await onSuccess(response.data);

      onClose();
    } catch (err) {
      console.error(
        "Failed to request item discount:",
        err
      );

      const data = err.response?.data;

      let message = "Failed to request discount.";

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (
        Array.isArray(data?.discount_per_unit)
      ) {
        message = data.discount_per_unit[0];
      } else if (Array.isArray(data?.reason)) {
        message = data.reason[0];
      } else if (typeof data === "string") {
        message = data;
      }

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 10000,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 480,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
              }}
            >
              Request Item Discount
            </div>

            <div
              className="muted"
              style={{
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Manager or administrator approval required.
            </div>
          </div>

          <button
            type="button"
            className="btn btn-danger"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
        </div>

        {/* ITEM INFORMATION */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontWeight: 700,
            }}
          >
            {item.product_name}
          </div>

          <div
            className="muted"
            style={{
              marginTop: 6,
              fontSize: 13,
            }}
          >
            Quantity:{" "}
            {Number(item.quantity).toFixed(3)}{" "}
            {item.unit}
          </div>

          <div
            className="muted"
            style={{
              fontSize: 13,
            }}
          >
            Current price: KES{" "}
            {Number(item.unit_price).toFixed(2)} /{" "}
            {item.unit}
          </div>
        </div>

        {/* DISCOUNT */}
        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            Discount Per {item.unit}
          </label>

          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            max={item.unit_price}
            value={discountPerUnit}
            onChange={(event) =>
              setDiscountPerUnit(event.target.value)
            }
            placeholder="Example: 50"
            disabled={submitting}
          />

          <div
            className="muted"
            style={{
              marginTop: 6,
              fontSize: 12,
            }}
          >
            Enter the discount for each {item.unit}.
          </div>
        </div>

        {/* REASON */}
        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            Discount Reason
          </label>

          <textarea
            className="input"
            rows={4}
            maxLength={1000}
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Example: Bulk purchase customer"
            disabled={submitting}
            style={{
              resize: "vertical",
            }}
          />

          <div
            className="muted"
            style={{
              marginTop: 6,
              fontSize: 12,
            }}
          >
            Minimum 5 characters.
          </div>
        </div>

        {/* ACTION */}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!isValid || submitting}
          onClick={submitRequest}
          style={{
            width: "100%",
            marginTop: 20,
          }}
        >
          {submitting
            ? "Submitting Request..."
            : "Submit Discount Request"}
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   CHECKOUT MODAL WITH CHANGE CALCULATOR - FIXED
===================================================== */

function CheckoutModal({
  open,
  onClose,
  cart,
  subtotal,
  paymentMode,
  setPaymentMode,
  customer,
  setCustomer,
  payments,
  setPayments,
  totalPaid,
  balanceDue,
  onConfirm,
  checkingOut,
  msg,
  amountGiven,
  setAmountGiven,
  stkPushEnabled,
  setStkPushEnabled,
  stkProvider,
  setStkProvider,
  stkPhoneNumber,
  setStkPhoneNumber,
  stkAmount,
  setStkAmount,
  checkoutOutcomeUnknown,
}) {
  const stkValue = stkPushEnabled ? Math.max(0, Number(stkAmount) || 0) : 0;

  // Only cash still required is considered for change calculation. An STK
  // request is not money received until the backend verifies it.
  const cashRequired = useMemo(() => {
    const nonCashPayments = payments
      .filter((p) => p.method !== "CASH")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pendingStkAmount = stkPushEnabled ? Math.max(0, Number(stkAmount) || 0) : 0;
    return Math.max(0, subtotal - nonCashPayments - pendingStkAmount);
  }, [payments, subtotal, stkPushEnabled, stkAmount]);

  const displayChange = useMemo(() => {
    const given = Number(amountGiven) || 0;
    return given > cashRequired ? given - cashRequired : 0;
  }, [amountGiven, cashRequired]);

  // Denomination breakdown
  const getDenominations = (amount) => {
    const denominations = [
      { value: 1000, name: "1000 KES" },
      { value: 500, name: "500 KES" },
      { value: 200, name: "200 KES" },
      { value: 100, name: "100 KES" },
      { value: 50, name: "50 KES" },
      { value: 20, name: "20 KES" },
      { value: 10, name: "10 KES" },
      { value: 5, name: "5 KES" },
      { value: 1, name: "1 KES" },
    ];
    let remaining = Math.round(amount * 100) / 100;
    const breakdown = [];
    for (const denom of denominations) {
      if (remaining >= denom.value) {
        const count = Math.floor(remaining / denom.value);
        breakdown.push({ ...denom, count });
        remaining -= count * denom.value;
        remaining = Math.round(remaining * 100) / 100;
      }
    }
    return breakdown;
  };

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(customerSearch), 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const { data: customerResults } = useCustomers({
    search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
    page_size: 5,
  });

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleAmountGivenChange = (value) => {
    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
      setAmountGiven(value);
    }
  };

  const applyAmountToPayment = () => {
    const given = Number(amountGiven);
    if (!isNaN(given) && given > 0) {
      const updatedPayments = [...payments];
      const cashIndex = updatedPayments.findIndex((p) => p.method === "CASH");
      if (cashIndex >= 0) {
        updatedPayments[cashIndex] = {
          ...updatedPayments[cashIndex],
          amount: Math.min(cashRequired, given).toFixed(2),
        };
      } else {
        updatedPayments.push({
          method: "CASH",
          amount: Math.min(cashRequired, given).toFixed(2),
        });
      }
      setPayments(updatedPayments);
      setAmountGiven("");
    }
  };

  const handleConfirm = () => {
    const payload = {
      items: cart,
      payments,
      payment_mode: paymentMode,
      customer: selectedCustomer?.id || null,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_id_number: customer.id_number,
    };
    onConfirm(payload);
  };

  // Validate the total of funds already collected plus any requested STK amount.
  const stkDetailsValid = !stkPushEnabled || (
    paymentMode !== "CREDIT" &&
    String(stkPhoneNumber || "").trim().length >= 9 &&
    stkValue > 0 &&
    Number.isInteger(stkValue)
  );

  const isValid = useMemo(() => {
    if (!stkDetailsValid) return false;

    if (paymentMode === "FULL") {
      return subtotal > 0 && Math.abs(balanceDue) < 0.01 && (totalPaid + stkValue) > 0;
    }
    if (paymentMode === "PARTIAL") {
      return (
        totalPaid + stkValue > 0 &&
        totalPaid + stkValue < subtotal &&
        Boolean(customer.name?.trim()) &&
        Boolean(customer.phone?.trim()) &&
        Boolean(customer.id_number?.trim())
      );
    }
    if (paymentMode === "CREDIT") {
      return (
        !stkPushEnabled &&
        Boolean(customer.name?.trim()) &&
        Boolean(customer.phone?.trim()) &&
        Boolean(customer.id_number?.trim())
      );
    }
    return false;
  }, [paymentMode, totalPaid, stkValue, stkPushEnabled, stkDetailsValid, balanceDue, subtotal, customer]);

  if (!open) return null;

  const isSufficient = Number(amountGiven) >= cashRequired;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Checkout</div>
          <button className="btn btn-danger" onClick={onClose}>Close</button>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Payment Mode</div>
          {["FULL", "PARTIAL", "CREDIT"].map((m) => (
            <label key={m} style={{ marginRight: 16 }}>
              <input
                type="radio"
                checked={paymentMode === m}
                onChange={() => {
                  setPaymentMode(m);
                  setAmountGiven("");
                  if (m === "CREDIT") {
                    setStkPushEnabled(false);
                    setStkAmount("");
                  }
                }}
              /> {m}
            </label>
          ))}

          {(paymentMode === "PARTIAL" || paymentMode === "CREDIT") && (
            <div style={{ marginTop: 12 }}>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  placeholder="Search customer..."
                  value={customerSearch}
                  onFocus={() => {
                    if (customerSearch.length >= 2) setDebouncedSearch(customerSearch);
                  }}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setSelectedCustomer(null);
                  }}
                />
                {customerResults?.results?.length > 0 && debouncedSearch && !selectedCustomer && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      zIndex: 1000,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {customerResults.results.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomer({
                            name: c.name,
                            phone: c.phone || "",
                            id_number: c.national_id || "",
                          });
                          setCustomerSearch(`${c.name} (${c.phone || ""})`);
                          setDebouncedSearch("");
                        }}
                        style={{ padding: 10, cursor: "pointer" }}
                      >
                        {c.name} ({c.phone || "No phone"})
                      </div>
                    ))}
                  </div>
                )}
                {debouncedSearch.length >= 2 && customerResults?.results?.length === 0 && (
                  <div
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomer({
                        name: customerSearch,
                        phone: "",
                        id_number: "",
                      });
                      setCustomerSearch(customerSearch);
                      setDebouncedSearch("");
                    }}
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: 10,
                      cursor: "pointer",
                      color: "#3b82f6",
                      zIndex: 1000,
                    }}
                  >
                    + Create "{customerSearch}"
                  </div>
                )}
              </div>
              <input
                className="input"
                placeholder="Phone"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
              <input
                className="input"
                placeholder="ID Number"
                value={customer.id_number}
                onChange={(e) => setCustomer({ ...customer, id_number: e.target.value })}
              />
            </div>
          )}


          {/* AUTOMATED M-PESA STK PUSH */}
          {paymentMode !== "CREDIT" && (
            <section style={{ marginTop: 16, padding: 14, border: "1px solid #bfdbfe", borderRadius: 10, background: "#eff6ff" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
                <input
                  type="checkbox" disabled
                  checked={stkPushEnabled}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setStkPushEnabled(enabled);
                    setAmountGiven("");
                    if (enabled) {
                      const defaultAmount = paymentMode === "FULL"
                        ? subtotal
                        : Math.max(0, subtotal - totalPaid);
                      setStkAmount(defaultAmount > 0 ? defaultAmount.toFixed(2) : "");
                      if (paymentMode === "FULL") setPayments([]);
                    } else {
                      setStkAmount("");
                      if (paymentMode === "FULL" && subtotal > 0) {
                        setPayments([{ method: "CASH", amount: subtotal.toFixed(2) }]);
                      }
                    }
                  }}
                />
                Send prompt (STK Push) to customer for payment
              </label>
              {stkPushEnabled && (
                <label style={{ display: "grid", gap: 5, marginTop: 12 }}>
                  <span style={{ fontWeight: 600 }}>Payment provider / network</span>
                  <select
                    className="input"
                    value={stkProvider}
                    onChange={(event) => setStkProvider(event.target.value)}
                  >
                    <option value="SAFARICOM_MPESA">Safaricom M-Pesa (Direct)</option>
                    <option value="COOP_BANK" disabled>Co-operative Bank – M-Pesa STK (integration pending)</option>
                    <option value="EQUITY_BANK_SAFARICOM" disabled>Equity Bank – Safaricom</option>
                    <option value="EQUITY_BANK_EQUITEL" disabled>Equity Bank – Equitel</option>
                  </select>
                </label>
              )}
              {stkPushEnabled && (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  <label>
                    <span style={{ display: "block", fontWeight: 600, marginBottom: 5 }}>
                      Customer {stkProvider.endsWith("_EQUITEL") ? "Equitel" : "mobile"} phone number
                    </span>
                    <input
                      className="input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="2547XXXXXXXX or 07XXXXXXXX"
                      value={stkPhoneNumber}
                      onChange={(event) => setStkPhoneNumber(event.target.value)}
                      maxLength={16}
                      required
                    />
                  </label>
                  <label>
                    <span style={{ display: "block", fontWeight: 600, marginBottom: 5 }}>STK Push amount (KES)</span>
                    <input
                      className="input"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      placeholder="Whole KES amount to request"
                      value={stkAmount}
                      onChange={(event) => setStkAmount(event.target.value)}
                      required
                    />
                  </label>
                  <div style={{ fontSize: 12, color: "#1e40af" }}>
                    Wait for response to confirm payment.
                  </div>
                  {paymentMode === "PARTIAL" && subtotal > 0 && Math.abs(totalPaid + stkValue - subtotal) < 0.01 && (
                    <div style={{ color: "#92400e", fontSize: 12, fontWeight: 700 }}>
                      This amount would cover the full sale. Switch to FULL or reduce the STK amount.
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {(paymentMode === "FULL" || paymentMode === "PARTIAL") && (
            <div
              style={{
                marginTop: 16,
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🧮</span><span>Change Calculator</span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "#e6f4ea",
                borderRadius: "8px",
                marginBottom: 12,
              }}>
                <span style={{ fontWeight: 500 }}>Total Amount:</span>
                <strong style={{ fontSize: 18, color: "#137333" }}>KES {subtotal.toFixed(2)}</strong>
              </div>
              {paymentMode === "PARTIAL" && (() => {
                const nonCashTotal = payments
                  .filter(p => p.method !== "CASH")
                  .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                return nonCashTotal > 0 ? (
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "#dbeafe",
                    borderRadius: "8px",
                    marginBottom: 8,
                  }}>
                    <span style={{ fontWeight: 500 }}>Non-Cash Payments:</span>
                    <strong style={{ color: "#1e40af" }}>KES {nonCashTotal.toFixed(2)}</strong>
                  </div>
                ) : null;
              })()}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "#fef3c7",
                borderRadius: "8px",
                marginBottom: 12,
              }}>
                <span style={{ fontWeight: 500 }}>Cash Required:</span>
                <strong style={{ fontSize: 16, color: "#92400e" }}>KES {cashRequired.toFixed(2)}</strong>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Amount Given by Customer (Cash only):
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="Enter cash amount (optional)"
                      value={amountGiven}
                      onChange={(e) => handleAmountGivenChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyAmountToPayment();
                        }
                      }}
                      style={{ fontSize: 16 }}
                      onWheel={(e) => e.preventDefault()}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={applyAmountToPayment}
                    disabled={!amountGiven || Number(amountGiven) <= 0}
                    style={{ padding: "10px 16px" }}
                  >
                    Apply Cash
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Quick select:</span>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="btn"
                      onClick={() => handleAmountGivenChange(amt.toString())}
                      style={{ padding: "6px 12px", background: "#e2e8f0", fontSize: 13 }}
                    >
                      KES {amt}
                    </button>
                  ))}
                </div>
              </div>

              {amountGiven && Number(amountGiven) > 0 && (
                <div style={{
                  marginTop: 12,
                  padding: "12px",
                  borderRadius: "8px",
                  background: isSufficient ? "#f0f9ff" : "#fef2f2",
                  border: `1px solid ${isSufficient ? "#bae6fd" : "#fee2e2"}`,
                }}>
                  {isSufficient ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontWeight: 500 }}>💰 Change to give:</span>
                        <strong style={{ fontSize: 20, color: "#0284c7" }}>KES {displayChange.toFixed(2)}</strong>
                      </div>
                      {displayChange > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Suggested breakdown:</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
                            {getDenominations(displayChange).map((denom, idx) => (
                              <span key={idx} style={{ background: "#e2e8f0", padding: "4px 8px", borderRadius: "6px" }}>
                                {denom.count} × {denom.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: "#991b1b" }}>
                      ⚠️ Insufficient amount. Customer still owes:{" "}
                      <strong>KES {(cashRequired - Number(amountGiven)).toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {paymentMode !== "CREDIT" && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Payment Methods</div>
              {payments.map((p, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <select
                    className="input"
                    value={p.method}
                    onChange={(e) => {
                      const copy = [...payments];
                      copy[idx].method = e.target.value;
                      setPayments(copy);
                    }}
                  >
                    <option value="CASH">Cash</option>
                    <option value="MPESA">Manual M-Pesa</option>
                    <option value="CARD">Card</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Amount"
                    value={p.amount}
                    onChange={(e) => {
                      const copy = [...payments];
                      copy[idx].amount = e.target.value;
                      setPayments(copy);
                    }}
                  />
                  {p.method !== "CASH" && (
                    <input
                      className="input"
                      type="text"
                      maxLength={100}
                      placeholder={
                        p.method === "MPESA" ? "M-Pesa transaction code" :
                        p.method === "BANK" ? "Bank transaction/reference" :
                        p.method === "CHEQUE" ? "Cheque number" : "Card slip/reference"
                      }
                      value={p.reference || ""}
                      onChange={(e) => {
                        const copy = [...payments];
                        copy[idx].reference = e.target.value;
                        setPayments(copy);
                      }}
                    />
                  )}
                </div>
              ))}
              <button
                className="btn"
                style={{ marginTop: 8 }}
                onClick={() => setPayments([...payments, { method: "CASH", amount: "", reference: "" }])}
              >
                + Add Payment Method
              </button>
              <div className="muted" style={{ marginTop: 8 }}>
                Sale total: KES {subtotal.toFixed(2)} <br />
                Collected now: KES {totalPaid.toFixed(2)} <br />
                {stkPushEnabled && <>STK request (not yet paid): KES {stkValue.toFixed(2)} <br /></>}
                Remaining after requested payments: KES {balanceDue.toFixed(2)}
              </div>
            </div>
          )}

          {msg && <div role="alert" style={{ marginTop: 10, color: "#b91c1c" }}>{msg}</div>}
          {checkoutOutcomeUnknown && (
            <div role="alert" style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "#fff7ed", color: "#9a3412" }}>
              Checkout outcome is unknown. Do not submit again until you verify the sale/payment in the system.
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 16, width: "100%" }}
            disabled={!isValid || checkingOut || checkoutOutcomeUnknown}
            onClick={handleConfirm}
          >
            {checkingOut
              ? (stkPushEnabled ? "Sending STK Push..." : "Processing...")
              : checkoutOutcomeUnknown
                ? "Checkout Requires Verification"
                : stkPushEnabled
                  ? "Send STK Push"
                  : "Confirm Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}




function PaymentAttemptModal({ attempt, open, onClose, onRefresh, onRetry, checkingStatus }) {
  const [clockNow, setClockNow] = useState(Date.now());
  useEffect(() => {
    if (!open || !attempt?.expires_at) return undefined;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open, attempt?.expires_at]);

  if (!attempt || !open) return null;

  const status = String(attempt.status || "unknown").toLowerCase();
  const configs = {
    pending: { title: "Payment pending", color: "#92400e", background: "#fffbeb" },
    initiating: { title: "Sending STK Push", color: "#1d4ed8", background: "#eff6ff" },
    processing: { title: "Waiting for M-Pesa confirmation", color: "#1d4ed8", background: "#eff6ff" },
    succeeded: { title: "Payment confirmed", color: "#166534", background: "#f0fdf4" },
    failed: { title: "Payment failed", color: "#991b1b", background: "#fef2f2" },
    cancelled: { title: "Payment cancelled", color: "#92400e", background: "#fffbeb" },
    expired: { title: "Payment expired", color: "#92400e", background: "#fffbeb" },
    unknown: { title: "Payment status not confirmed", color: "#9a3412", background: "#fff7ed" },
  };
  const current = configs[status] || configs.unknown;
  const terminalStatuses = ["succeeded", "failed", "cancelled", "expired"];
  const unresolvedStatuses = ["pending", "initiating", "processing", "unknown"];
  const expiresAtMs = attempt.expires_at ? Date.parse(attempt.expires_at) : NaN;
  const retryWindowElapsed = Number.isFinite(expiresAtMs) && clockNow >= expiresAtMs;
  // The status API is the source of truth. The local expiry calculation
  // remains a fallback for the initial checkout response before the first poll.
  const callbackIsStillUnresolved = [
    "PENDING",
    "PROCESSING",
    "RETRY",
    "REJECTED",
  ].includes(String(attempt.callback_status || "").toUpperCase());
  const retryAvailable = terminalStatuses.includes(status) || (
    unresolvedStatuses.includes(status) &&
    (
      attempt.retry_available === true ||
      (
        attempt.retry_available == null &&
        retryWindowElapsed &&
        !callbackIsStillUnresolved
      )
    )
  );
  const secondsUntilRetry = Number.isFinite(expiresAtMs)
    ? Math.max(0, Math.ceil((expiresAtMs - clockNow) / 1000))
    : null;
  const isWaitingForResponse =
    Boolean(attempt.id) &&
    !terminalStatuses.includes(status) &&
    !attempt.pollTimedOut;
  const explanation = attempt.cashier_message || (
    status === "succeeded"
      ? "The backend has confirmed the payment. You can close this window."
      : ["failed", "cancelled", "expired"].includes(status)
        ? "This attempt is not confirmed as paid. Check sale/payment history before collecting money or creating another payment."
        : status === "unknown"
          ? "The payment result is not yet known. Wait for the response window. After it elapses, ask the customer to confirm that no money was deducted before retrying."
          : "Ask the customer to complete the M-Pesa prompt on their phone. This window will keep checking the backend for the final result. Do not submit checkout again while this attempt is pending."
  );

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="payment-attempt-title" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 10001 }}>
      <div className="card" style={{ width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontWeight: 900, fontSize: 19, marginBottom: 14 }}>M-Pesa Payment</div>
        <div id="payment-attempt-title" style={{ padding: 12, borderRadius: 8, color: current.color, background: current.background, fontWeight: 800 }}>{current.title}</div>
        <p style={{ marginTop: 12 }}>{explanation}</p>
        {isWaitingForResponse && (
          <div role="status" aria-live="polite" style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#eff6ff", color: "#1d4ed8", fontSize: 13 }}>
            Automatically checking payment status. This sale is not treated as paid until the backend confirms the M-Pesa result.
            {!retryAvailable && secondsUntilRetry !== null && (
              <div style={{ marginTop: 6, fontWeight: 700 }}>
                Retry becomes available in {secondsUntilRetry}s if the payment remains unconfirmed.
              </div>
            )}
          </div>
        )}
        <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
          {attempt.sale_id != null && <div><strong>Sale:</strong> #{attempt.sale_id}</div>}
          {attempt.sale_status && (
            <div>
              <strong>Sale status:</strong>{" "}
              {String(attempt.sale_status).toUpperCase() === "PAID"
                ? "PAID"
                : String(attempt.sale_status).replace(/_/g, " ")}
            </div>
          )}
          {attempt.amount != null && <div><strong>STK amount:</strong> KES {Number(attempt.amount).toFixed(2)}</div>}
          {attempt.phone_number && <div><strong>Phone:</strong> {attempt.phone_number}</div>}
          {attempt.receipt_number && <div><strong>M-Pesa receipt:</strong> {attempt.receipt_number}</div>}
          {attempt.balance_due != null && <div><strong>Sale balance due:</strong> KES {Number(attempt.balance_due).toFixed(2)}</div>}
          {attempt.failure_message && !attempt.cashier_message && <div style={{ color: "#991b1b" }}><strong>Details:</strong> {attempt.failure_message}</div>}
          {attempt.message && status === "unknown" && <div>{attempt.message}</div>}
        </div>
        {attempt.pollTimedOut && status !== "succeeded" && (
          <div role="status" style={{ marginTop: 12, padding: 10, background: "#fff7ed", borderRadius: 8, color: "#9a3412" }}>
            Automatic status checks timed out. This does not prove that payment failed.
          </div>
        )}
        {attempt.id && (
          <button type="button" className="btn" onClick={onRefresh} disabled={checkingStatus} style={{ marginTop: 16, width: "100%" }}>
            {checkingStatus ? "Checking..." : "Refresh Payment Status"}
          </button>
        )}
        {retryAvailable && !["succeeded"].includes(status) && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const requiresCustomerConfirmation = unresolvedStatuses.includes(status);
              if (requiresCustomerConfirmation) {
                const confirmed = window.confirm(
                  "Please ask the customer to check their M-Pesa balance/messages. Have they confirmed that NO money was deducted? Only choose OK if they confirm no deduction."
                );
                if (!confirmed) return;
              }
              onRetry({ customerConfirmedPreviousStkUnpaid: unresolvedStatuses.includes(status) });
            }}
            style={{ marginTop: 16, width: "100%" }}
          >
            {unresolvedStatuses.includes(status)
              ? "Customer confirms no deduction — retry STK"
              : "Retry M-Pesa for this sale"}
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onClose}
          disabled={isWaitingForResponse}
          style={{ marginTop: 8, width: "100%", opacity: isWaitingForResponse ? 0.65 : 1, cursor: isWaitingForResponse ? "not-allowed" : "pointer" }}
        >
          {isWaitingForResponse ? "Waiting for M-Pesa response..." : "Close"}
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   CART PAGE - UPDATED FOR UNIT-AWARE PRICING
===================================================== */
export default function Cart() {
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [stkPushEnabled, setStkPushEnabled] = useState(false);
  const [stkProvider, setStkProvider] = useState("SAFARICOM_MPESA");
  const [stkPhoneNumber, setStkPhoneNumber] = useState("");
  const [stkAmount, setStkAmount] = useState("");
  const [paymentAttempt, setPaymentAttempt] = useState(null);
  const [stkRetryConfirmed, setStkRetryConfirmed] = useState(false);
  const [paymentStatusOpen, setPaymentStatusOpen] = useState(false);
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(false);
  const [checkoutOutcomeUnknown, setCheckoutOutcomeUnknown] = useState(false);
  const checkoutInFlightRef = useRef(false);
  const stkIdempotencyRef = useRef({ signature: null, key: null });
  const paymentPollRef = useRef({ attemptId: null, startedAt: 0 });
  const [discountRequestOpen,setDiscountRequestOpen] = useState(false);
  const [selectedDiscountItem,setSelectedDiscountItem] = useState(null);

  // holding cart
  const [holdOpen, setHoldOpen] = useState(false);
  const [heldSalesOpen, setHeldSalesOpen] = useState(false);
  const [heldCarts, setHeldCarts] = useState([]);
  const [holdReference, setHoldReference] = useState("");
  const [holdingSale, setHoldingSale] = useState(false);
  const [resumingSale, setResumingSale] = useState(false);

  const [paymentMode, setPaymentMode] = useState("FULL");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    id_number: "",
  });

  const [payments, setPayments] = useState([
    { method: "CASH", amount: "" },
  ]);

  const [amountGiven, setAmountGiven] = useState("");

  const loadCart = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/api/cart/pos/cart/");
      setCart(res.data);
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to load cart");
    } finally {
      setLoading(false);
    }
  };


  const loadHeldCarts = async () => {
      try {
          const res = await api.get(
              "/api/cart/held/",
              {
                  headers: {
                      "X-Branch-ID": localStorage.getItem("branch_id"),
                  },
              }
          );

          setHeldCarts(res.data);

      } catch (err) {
          console.error(err);
          setMsg("Failed to load held sales.");
      }
  };

  const holdSale = async () => {

      setHoldingSale(true);

      try {

          const res = await api.post(
              "/api/cart/hold/",
              {
                  hold_reference: holdReference,
              },
              {
              headers: {
                  "X-Branch-ID": localStorage.getItem("branch_id"),
              },
          }
          );

          toast.success(res.data.message);

          setHoldReference("");

          setHoldOpen(false);

          await loadCart();

          await loadHeldCarts();

      } catch (err) {

          console.error(err);

          setMsg(
              err.response?.data?.detail ||
              "Failed to hold sale."
          );

      } finally {

          setHoldingSale(false);

      }

  };


  const resumeHeldSale = async (id) => {

      setResumingSale(true);

      try {

          const res = await api.post(
              `/api/cart/held/${id}/resume/`,
              {},
              {
                  headers: {
                      "X-Branch-ID": localStorage.getItem("branch_id"),
                  },
              }
          );

          toast.success(res.data.message);

          setCart(res.data.cart);

          setHeldSalesOpen(false);

          await loadHeldCarts();

      } catch (err) {

          console.error(err);

          toast.error(err.response?.data?.detail || "Failed to resume sale.");

      } finally {

          setResumingSale(false);

      }

  };


  const deleteHeldSale = async (id) => {
      try {
          await api.delete(
            `/api/cart/held/${id}/`,
            {
                headers: {
                    "X-Branch-ID": localStorage.getItem("branch_id"),
                },
            }
        );

          toast.success("Held sale deleted.");

          await loadHeldCarts();

      } catch (err) {
          console.error(err);

          toast.error(
            err.response?.data?.detail ||
              "Failed to delete held sale."
          );
      }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated){
       loadCart();
       loadHeldCarts();
    }
  }, [authLoading, isAuthenticated]);

  const items = cart?.items || [];

  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => sum + Number(i.subtotal), 0);
  }, [items]);

  useEffect(() => {
    if (paymentMode === "FULL" && subtotal > 0 && !stkPushEnabled) {
      setPayments([{ method: "CASH", amount: subtotal.toFixed(2) }]);
    }
  }, [paymentMode, subtotal, stkPushEnabled]);

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const balanceDue = subtotal - totalPaid - (stkPushEnabled && paymentMode !== "CREDIT" ? (Number(stkAmount) || 0) : 0);
  const getCalculatedChange = () => {
    const given = parseFloat(amountGiven) || 0;

    const nonCashPayments = payments
      .filter((p) => p.method !== "CASH")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const pendingStkAmount = stkPushEnabled && paymentMode !== "CREDIT"
      ? Math.max(0, Number(stkAmount) || 0)
      : 0;
    const cashRequired = Math.max(
      0,
      subtotal - nonCashPayments - pendingStkAmount
    );

    return given > cashRequired
      ? given - cashRequired
      : 0;
  };

  const cancelDiscountRequest = async (requestId) => {
    try {
      await api.post(
        `/api/cart/pos/discount-requests/${requestId}/cancel/`
      );

      toast.success("Discount request cancelled.");

      await loadCart();

    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.detail ||
        "Failed to cancel discount request."
      );
    }
  };

  const updateQty = async (productId, quantity, unit) => {
    try {
      await api.patch("/api/cart/pos/cart/update_item/", {
        product: productId,
        quantity: Math.max(1, Number(quantity)),
        unit: unit,
      });
      await loadCart();
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to update quantity");
    }
  };

  const removeItem = async (productId, unit) => {
    try {
      await api.post("/api/cart/pos/cart/remove/", {
        product: productId,
        unit: unit,
      });
      await loadCart();
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to remove item");
    }
  };

  const confirmCheckout = async () => {
    if (checkoutInFlightRef.current || checkoutOutcomeUnknown) return;
    if (!cart?.id) {
      setMsg("The active cart could not be identified. Refresh the cart before checkout.");
      return;
    }

    checkoutInFlightRef.current = true;
    setCheckingOut(true);
    setMsg("");

    try {
      const givenAmount = Number.parseFloat(amountGiven) || 0;
      const calculatedChange = getCalculatedChange();
      const payload = {
        cart_id: cart.id,
        payment_mode: paymentMode,
        amount_given: givenAmount,
        change_given: calculatedChange,
        customer_confirmed_previous_stk_unpaid: stkRetryConfirmed,
      };

      if (paymentMode !== "CREDIT") {
        payload.payments = payments
          .filter((payment) => Number(payment.amount) > 0)
          .map((payment) => ({
            method: payment.method,
            amount: Number(payment.amount),
            reference: payment.reference?.trim() || null,
          }));
      }

      if (paymentMode !== "FULL") payload.customer = customer;

      if (stkPushEnabled) {
        const requestedAmount = Number(stkAmount);
        const phone = String(stkPhoneNumber || "").trim();

        if (paymentMode === "CREDIT") throw new Error("STK Push is not available for credit sales.");
        if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || !Number.isInteger(requestedAmount)) {
          throw new Error("Enter a positive whole-KES STK Push amount.");
        }
        if (!phone || phone.length < 9) throw new Error("Enter a valid customer M-Pesa phone number.");

        const signature = JSON.stringify([cart.id, requestedAmount.toFixed(2), phone, stkProvider]);
        if (!stkIdempotencyRef.current.key || stkIdempotencyRef.current.signature !== signature) {
          stkIdempotencyRef.current = { signature, key: createIdempotencyUuid() };
        }
        const isEquity = stkProvider.startsWith("EQUITY_BANK_");
        const isCoop = stkProvider === "COOP_BANK";
        payload.stk_push = {
          amount: requestedAmount.toFixed(2),
          phone_number: phone,
          idempotency_key: stkIdempotencyRef.current.key,
          provider: isEquity ? "EQUITY_BANK" : isCoop ? "COOP_BANK" : "SAFARICOM_MPESA",
          ...(isEquity
            ? { payment_rail: stkProvider.endsWith("_EQUITEL") ? "EQUITEL" : "SAFARICOM" }
            : {}),
        };
      }

      const res = await api.post("/api/cart/pos/checkout/", payload);
      const responseAttempt = res.data?.payment_attempt;

      if (stkPushEnabled) {
        if (!responseAttempt?.id) {
          setCheckoutOutcomeUnknown(true);
          setPaymentAttempt({
            id: null,
            status: "unknown",
            amount: Number(stkAmount) || null,
            phone_number: stkPhoneNumber,
            sale_id: res.data?.sale_id ?? null,
            message: "Checkout returned without a payment-attempt ID. Verify the sale before taking further payment action.",
          });
          setPaymentStatusOpen(true);
        } else {
          stkIdempotencyRef.current = { signature: null, key: null };
          setStkRetryConfirmed(false);
          setPaymentAttempt({
            ...responseAttempt,
            sale_id: res.data?.sale_id ?? null,
            receipt: res.data?.receipt ?? null,
            message: res.data?.message ?? "STK Push requested.",
            pollTimedOut: false,
          });
          setPaymentStatusOpen(true);
          setCheckoutOutcomeUnknown(false);
          setStkPushEnabled(false);
          setStkAmount("");
          setStkPhoneNumber("");
          setReceipt(null);
        }
        setCheckoutOpen(false);
        setAmountGiven("");
      } else {
        setPaymentAttempt(null);
        setPaymentStatusOpen(false);
        setReceipt(res.data.receipt);
        setCheckoutOpen(false);
        setAmountGiven("");
      }

      await loadCart();
      await loadHeldCarts();
    } catch (err) {
      console.error(err);
      const statusCode = err?.response?.status;
      if (!err?.response || statusCode >= 500) {
        setCheckoutOutcomeUnknown(true);
        setPaymentAttempt({
          id: null,
          status: "unknown",
          amount: stkPushEnabled ? Number(stkAmount) || null : null,
          phone_number: stkPushEnabled ? stkPhoneNumber : "",
          message: "The server response did not establish whether checkout completed. Verify the sale/payment before trying again.",
        });
        setPaymentStatusOpen(true);
        setCheckoutOpen(false);
        setMsg("Checkout outcome is unknown. Do not submit again until you verify whether the sale was created.");
      } else {
        const detail = err?.response?.data?.detail ?? err?.response?.data?.error;
        setMsg(
          typeof detail === "string"
            ? detail
            : detail && typeof detail === "object"
              ? Object.entries(detail).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`).join("; ")
              : err.message || "Checkout failed."
        );
      }
    } finally {
      setCheckingOut(false);
      checkoutInFlightRef.current = false;
    }
  };

  const notifyTerminalPaymentStatus = (status) => {
    if (status === "succeeded") toast.success("M-Pesa payment confirmed by the backend.");
    else if (["failed", "cancelled", "expired"].includes(status)) {
      toast.error(`M-Pesa payment status: ${status}. Check payment history before collecting again.`);
    }
  };

  const refreshPaymentStatus = async () => {
    if (!paymentAttempt?.id || checkingPaymentStatus) return;
    setCheckingPaymentStatus(true);
    try {
      let latest = await getPaymentAttemptStatus(paymentAttempt.id);
      let nextStatus = String(latest.status || "unknown").toLowerCase();

      // After success, fetch once more so the popup uses the sale balance
      // after the backend has completed recording the payment.
      if (nextStatus === "succeeded") {
        const confirmed = await getPaymentAttemptStatus(paymentAttempt.id);
        if (String(confirmed.status || "").toLowerCase() === "succeeded") {
          latest = { ...latest, ...confirmed };
          nextStatus = "succeeded";
        }
      }

      const previousStatus = String(paymentAttempt.status || "unknown").toLowerCase();
      setPaymentAttempt((current) => current?.id === paymentAttempt.id
        ? { ...current, ...latest, status: nextStatus, pollTimedOut: false }
        : current);
      paymentPollRef.current = { attemptId: paymentAttempt.id, startedAt: Date.now() };
      if (!["succeeded", "failed", "cancelled", "expired"].includes(previousStatus)) notifyTerminalPaymentStatus(nextStatus);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Could not refresh payment status.");
    } finally {
      setCheckingPaymentStatus(false);
    }
  };

  // Poll status only. This never initiates another checkout or STK Push.
  useEffect(() => {
    const attemptId = paymentAttempt?.id;
    const status = String(paymentAttempt?.status || "unknown").toLowerCase();
    const terminal = ["succeeded", "failed", "cancelled", "expired"];
    if (!attemptId || terminal.includes(status) || paymentAttempt?.pollTimedOut) return undefined;

    if (paymentPollRef.current.attemptId !== attemptId) {
      paymentPollRef.current = { attemptId, startedAt: Date.now() };
    }

    let cancelled = false;
    let timerId;
    const poll = async () => {
      if (cancelled) return;
      if (Date.now() - paymentPollRef.current.startedAt >= 5 * 60 * 1000) {
        setPaymentAttempt((current) => current?.id === attemptId ? { ...current, pollTimedOut: true } : current);
        return;
      }

      try {
        let latest = await getPaymentAttemptStatus(attemptId);
        if (cancelled) return;
        let nextStatus = String(latest.status || "unknown").toLowerCase();

        // Re-read the sale after success so the modal receives the final
        // persisted balance_due instead of an earlier snapshot.
        if (nextStatus === "succeeded") {
          const confirmed = await getPaymentAttemptStatus(attemptId);
          if (cancelled) return;
          if (String(confirmed.status || "").toLowerCase() === "succeeded") {
            latest = { ...latest, ...confirmed };
          }
        }

        const previousStatus = String(paymentAttempt?.status || "unknown").toLowerCase();
        setPaymentAttempt((current) => current?.id === attemptId
          ? { ...current, ...latest, status: nextStatus, pollError: null }
          : current);
        if (!terminal.includes(previousStatus) && terminal.includes(nextStatus)) notifyTerminalPaymentStatus(nextStatus);
      } catch (err) {
        // A status endpoint/network error does not establish payment failure.
        console.warn("Unable to poll payment attempt status.", err);
      }

      if (!cancelled) {
        if (Date.now() - paymentPollRef.current.startedAt >= 5 * 60 * 1000) {
          setPaymentAttempt((current) => current?.id === attemptId ? { ...current, pollTimedOut: true } : current);
        } else {
          timerId = setTimeout(poll, 3000);
        }
      }
    };

    timerId = setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [paymentAttempt?.id, paymentAttempt?.status, paymentAttempt?.pollTimedOut]);

  return (
    <AppLayout title="Cart" subtitle="Review items and checkout">
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      <PaymentAttemptModal
        attempt={paymentAttempt}
        open={paymentStatusOpen}
        onClose={() => setPaymentStatusOpen(false)}
        onRefresh={refreshPaymentStatus}
        onRetry={({ customerConfirmedPreviousStkUnpaid = false } = {}) => {
          setStkRetryConfirmed(customerConfirmedPreviousStkUnpaid);
          setPaymentStatusOpen(false);
          setPaymentMode("FULL");
          setPayments([]);
          setStkPushEnabled(true);
          setStkAmount(String(paymentAttempt?.balance_due || cart?.total || paymentAttempt?.amount || ""));
          setStkPhoneNumber(paymentAttempt?.phone_number || "");
          setCheckoutOpen(true);
        }}
        checkingStatus={checkingPaymentStatus}
      />

      <DiscountRequestModal
        open={discountRequestOpen}
        item={selectedDiscountItem}
        onClose={() => {
          setDiscountRequestOpen(false);
          setSelectedDiscountItem(null);
        }}
        onSuccess={async () => {
          await loadCart();
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
          setAmountGiven("");
        }}
        cart={cart}
        subtotal={subtotal}
        paymentMode={paymentMode}
        setPaymentMode={setPaymentMode}
        customer={customer}
        setCustomer={setCustomer}
        payments={payments}
        setPayments={setPayments}
        totalPaid={totalPaid}
        balanceDue={balanceDue}
        onConfirm={confirmCheckout}
        checkingOut={checkingOut}
        msg={msg}
        amountGiven={amountGiven}
        setAmountGiven={setAmountGiven}
        stkPushEnabled={stkPushEnabled}
        setStkPushEnabled={setStkPushEnabled}
        stkProvider={stkProvider}
        setStkProvider={setStkProvider}
        stkPhoneNumber={stkPhoneNumber}
        setStkPhoneNumber={setStkPhoneNumber}
        stkAmount={stkAmount}
        setStkAmount={setStkAmount}
        checkoutOutcomeUnknown={checkoutOutcomeUnknown}
      />

      <HoldSaleModal
          open={holdOpen}
          onClose={() => setHoldOpen(false)}
          holdReference={holdReference}
          setHoldReference={setHoldReference}
          onHold={holdSale}
          loading={holdingSale}
      />

      <HeldSalesModal
          open={heldSalesOpen}
          onClose={() => setHeldSalesOpen(false)}
          carts={heldCarts}
          onResume={resumeHeldSale}
          onDelete={deleteHeldSale}
          loading={resumingSale}
      />

      {loading ? (
        <div className="muted">Loading cart...</div>
      ) : items.length === 0 ? (
        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div className="muted">No items in cart.</div>
        <button
                className="btn"
                onClick={() => {
                    loadHeldCarts();
                    setHeldSalesOpen(true);
                }}
            >
                📂 Held Sales
                {heldCarts.length > 0 && (
                    <span
                        style={{
                            marginLeft: 8,
                            background: "#dc2626",
                            color: "#fff",
                            borderRadius: 999,
                            padding: "2px 8px",
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        {heldCarts.length}
                    </span>
                )}
            </button>
            </div>
      ) : (
        <>
          <div className="card">
            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => {
                    const hasDiscount =
                      Number(i.discount_per_unit) > 0;

                    const discountRequest = i.discount_request;

                    const requestStatus = discountRequest?.status;

                    const hasPendingDiscount =
                      requestStatus === "PENDING";

                    const isRejected =
                      requestStatus === "REJECTED";

                    const isCancelled =
                      requestStatus === "CANCELLED";

                    const isApproved =
                      requestStatus === "APPROVED";

                    return (
                      <tr key={i.id}>
                        {/* PRODUCT */}
                        <td>
                          {i.product_name}

                          <div
                            className="muted"
                            style={{ fontSize: 12 }}
                          >
                            SKU: {i.sku || "—"}
                          </div>
                        </td>

                        {/* QUANTITY */}
                        <td style={{ width: 120 }}>
                          <input
                            type="number"
                            min="1"
                            step={
                              i.unit === "KG"
                                ? "0.01"
                                : "1"
                            }
                            value={Number(i.quantity)}
                            onChange={(event) =>
                              updateQty(
                                i.product,
                                event.target.value,
                                i.unit
                              )
                            }
                            style={{
                              width: "80px",
                              padding: "6px 10px",
                              border: "1px solid #d1d5db",
                              borderRadius: "10px",
                              outline: "none",
                            }}
                          />
                        </td>

                        {/* UNIT */}
                        <td>
                          <span
                            style={{
                              background:
                                i.unit === "BAG"
                                  ? "#e6f7ff"
                                  : i.unit === "PIECE"
                                  ? "#f6ffed"
                                  : "#f5f5f5",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            {i.unit}
                          </span>
                        </td>

                        {/* UNIT PRICE */}
                        <td>
                          {hasDiscount ? (
                            <>
                              <div
                                style={{
                                  textDecoration: "line-through",
                                  color: "#64748b",
                                  fontSize: 12,
                                }}
                              >
                                KES{" "}
                                {Number(i.unit_price).toFixed(2)}
                              </div>

                              <strong>
                                KES{" "}
                                {Number(
                                  i.effective_unit_price
                                ).toFixed(2)}
                                /{i.unit}
                              </strong>
                            </>
                          ) : (
                            <>
                              KES{" "}
                              {Number(i.unit_price).toFixed(2)}
                              /{i.unit}
                            </>
                          )}
                        </td>

                        {/* DISCOUNT */}
                        <td>
                          {hasDiscount || isApproved ? (
                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "#15803d",
                                }}
                              >
                                - KES {Number(i.discount_per_unit).toFixed(2)}/{i.unit}
                              </div>

                              <div
                                className="muted"
                                style={{ fontSize: 12 }}
                              >
                                Total: KES {Number(i.discount_total).toFixed(2)}
                              </div>

                              <div
                                style={{
                                  marginTop: 4,
                                  color: "#15803d",
                                  fontWeight: 700,
                                }}
                              >
                                ✅ APPROVED
                              </div>
                            </div>

                          ) : hasPendingDiscount ? (

                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "#b45309",
                                }}
                              >
                                KES {Number(discountRequest.discount_per_unit).toFixed(2)}/{i.unit}
                              </div>

                              <div
                                style={{
                                  marginTop: 4,
                                  color: "#b45309",
                                  fontWeight: 700,
                                }}
                              >
                                ⏳ PENDING APPROVAL
                              </div>
                            </div>

                          ) : isRejected ? (

                            <div>
                              <div
                                style={{
                                  color: "#dc2626",
                                  fontWeight: 700,
                                }}
                              >
                                ❌ REJECTED
                              </div>

                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#6b7280",
                                  marginTop: 4,
                                }}
                              >
                                {discountRequest.resolution_note}
                              </div>
                            </div>

                          ) : isCancelled ? (

                            <div
                              style={{
                                color: "#6b7280",
                                fontWeight: 700,
                              }}
                            >
                              Cancelled
                            </div>

                          ) : (

                            <span className="muted">
                              No discount
                            </span>

                          )}
                        </td>

                        {/* SUBTOTAL */}
                        <td>
                          <strong>
                            KES {Number(i.subtotal).toFixed(2)}
                          </strong>
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {(isRejected || isCancelled || !discountRequest) && (
                              <button
                                className="btn"
                                onClick={() => {
                                  setSelectedDiscountItem(i);
                                  setDiscountRequestOpen(true);
                                }}
                              >
                                Request Discount
                              </button>
                            )}

                            {hasPendingDiscount && (
                              <>
                                <button
                                  className="btn"
                                  disabled
                                >
                                  Pending
                                </button>

                                <button
                                  className="btn btn-warning"
                                  onClick={() =>
                                    cancelDiscountRequest(discountRequest.id)
                                  }
                                >
                                  Cancel Request
                                </button>
                              </>
                            )}

                            <button
                              className="btn btn-danger"
                              onClick={() =>
                                removeItem(i.product, i.unit)
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" style={{ textAlign: "right" }}>
                      <strong>Cart Total:</strong>
                    </td>
                    <td colSpan="2">
                      <strong style={{ fontSize: 18 }}>
                        KES {subtotal.toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div style={{ 
              marginTop: 16,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
          }}>
            <button
              className="btn btn-primary"
              onClick={() => setCheckoutOpen(true)}
            >
              {checkoutOutcomeUnknown ? "Checkout Needs Verification" : "Proceed to Checkout"}
            </button>

            <button
                className="btn btn-warning"
                onClick={() => {

                    if (!items.length) {
                        setMsg("Cannot hold an empty cart.");
                        return;
                    }

                    setMsg("");

                    setHoldOpen(true);

                }}
            >
                🟡 Hold Sale
            </button>

            <button
                className="btn"
                onClick={() => {
                    loadHeldCarts();
                    setHeldSalesOpen(true);
                }}
            >
                📂 Held Sales
                {heldCarts.length > 0 && (
                    <span
                        style={{
                            marginLeft: 8,
                            background: "#dc2626",
                            color: "#fff",
                            borderRadius: 999,
                            padding: "2px 8px",
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        {heldCarts.length}
                    </span>
                )}
            </button>
            
            <button
                className="btn muted"
                disabled={loading}
                onClick={async () => {

                    await loadCart();

                    await loadHeldCarts();

                }}
            >
                Refresh Cart
            </button>
          </div>
        </>
      )}
    </AppLayout>
  );
}