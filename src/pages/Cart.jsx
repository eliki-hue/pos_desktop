import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import HoldSaleModal from "./cart/HoldSaleModal";
import HeldSalesModal from "./cart/HeldSalesModal";
import toast from "react-hot-toast";



/* =====================================================
   RECEIPT MODAL - OPTIMIZED FOR 80mm THERMAL PRINTER
===================================================== */
function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const payments = receipt.payments || [];

  const cashPaid = payments
    .filter(p => p.method === "CASH")
    .reduce((s, p) => s + Number(p.amount), 0);

  const mpesaPaid = payments
    .filter(p => p.method === "MPESA")
    .reduce((s, p) => s + Number(p.amount), 0);

  const totalPaid = cashPaid + mpesaPaid;
  
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
              {cashPaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Cash:</span>
                  <span>KES {cashPaid.toFixed(2)}</span>
                </div>
              )}
              {mpesaPaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>MPESA:</span>
                  <span>KES {mpesaPaid.toFixed(2)}</span>
                </div>
              )}
              
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
}) {
  // Get denomination breakdown for change
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
    
    let remaining = amount;
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

  const getCashRequired = () => {
    const nonCashPayments = payments
      .filter((p) => p.method !== "CASH")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return Math.max(0, subtotal - nonCashPayments);
  };

  // Calculate change on the fly
  const getCalculatedChange = () => {
    const given = parseFloat(amountGiven) || 0;
    const cashRequired = getCashRequired();
    return given > cashRequired ? given - cashRequired : 0;
  };

  // Handle amount given change
  const handleAmountGivenChange = (value) => {
    setAmountGiven(value);
  };

  // Apply the amount given to payment
  const applyAmountToPayment = () => {
    const given = parseFloat(amountGiven);
    if (!isNaN(given) && given > 0) {
      const cashRequired = getCashRequired();
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

  // Quick amount buttons
  const quickAmounts = [500, 1000, 2000, 5000];

  // Validation
  const isValid = useMemo(() => {
    if (paymentMode === "FULL") {
      return balanceDue <= 0 && subtotal > 0;
    }

    if (paymentMode === "PARTIAL") {
      return (
        totalPaid > 0 &&
        totalPaid < subtotal &&
        customer.name &&
        customer.phone &&
        customer.id_number
      );
    }

    if (paymentMode === "CREDIT") {
      return (
        customer.name &&
        customer.phone &&
        customer.id_number
      );
    }

    return false;
  }, [paymentMode, totalPaid, balanceDue, subtotal, customer]);

  if (!open) return null;

  const displayChange = getCalculatedChange();
  const cashRequired = getCashRequired();
  const isSufficient = parseFloat(amountGiven) >= cashRequired;

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
          <button className="btn btn-danger" onClick={onClose}>
            Close
          </button>
        </div>

        {/* PAYMENT MODE */}
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
                }}
              />{" "}
              {m}
            </label>
          ))}

          {(paymentMode === "PARTIAL" || paymentMode === "CREDIT") && (
            <div style={{ marginTop: 12 }}>
              <input
                className="input"
                placeholder="Customer Name"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Phone"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="ID Number"
                value={customer.id_number}
                onChange={(e) =>
                  setCustomer({ ...customer, id_number: e.target.value })
                }
              />
            </div>
          )}

          {/* CHANGE CALCULATOR */}
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
                <span>🧮</span>
                <span>Change Calculator</span>
              </div>

              {/* Total Amount Display */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#e6f4ea",
                  borderRadius: "8px",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontWeight: 500 }}>Total Amount:</span>
                <strong style={{ fontSize: 18, color: "#137333" }}>
                  KES {subtotal.toFixed(2)}
                </strong>
              </div>

              {/* Non-Cash Payments Display */}
              {paymentMode === "PARTIAL" && (() => {
                const nonCashTotal = payments
                  .filter(p => p.method !== "CASH")
                  .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                return nonCashTotal > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "#dbeafe",
                      borderRadius: "8px",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>Non-Cash Payments:</span>
                    <strong style={{ color: "#1e40af" }}>
                      KES {nonCashTotal.toFixed(2)}
                    </strong>
                  </div>
                ) : null;
              })()}

              {/* Cash Required Display */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#fef3c7",
                  borderRadius: "8px",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontWeight: 500 }}>Cash Required:</span>
                <strong style={{ fontSize: 16, color: "#92400e" }}>
                  KES {cashRequired.toFixed(2)}
                </strong>
              </div>

              {/* Amount Given Input */}
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
                      placeholder="Enter cash amount"
                      value={amountGiven}
                      onChange={(e) => handleAmountGivenChange(e.target.value)}
                      style={{ fontSize: 16 }}
                      autoFocus={paymentMode === "FULL"}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={applyAmountToPayment}
                    disabled={!amountGiven || parseFloat(amountGiven) <= 0}
                    style={{ padding: "10px 16px" }}
                  >
                    Apply Cash
                  </button>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Quick select:</span>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="btn"
                      onClick={() => handleAmountGivenChange(amt.toString())}
                      style={{
                        padding: "6px 12px",
                        background: "#e2e8f0",
                        fontSize: 13,
                      }}
                    >
                      KES {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Display */}
              {amountGiven && parseFloat(amountGiven) > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px",
                    borderRadius: "8px",
                    background: isSufficient ? "#f0f9ff" : "#fef2f2",
                    border: `1px solid ${isSufficient ? "#bae6fd" : "#fee2e2"}`,
                  }}
                >
                  {isSufficient ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>💰 Change to give:</span>
                        <strong style={{ fontSize: 20, color: "#0284c7" }}>
                          KES {displayChange.toFixed(2)}
                        </strong>
                      </div>

                      {displayChange > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
                            Suggested breakdown:
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 8,
                              fontSize: 12,
                            }}
                          >
                            {getDenominations(displayChange).map((denom, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: "#e2e8f0",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                }}
                              >
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
                      <strong>KES {(cashRequired - parseFloat(amountGiven)).toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Methods */}
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
                    <option value="MPESA">MPESA</option>
                  </select>

                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={p.amount}
                    onChange={(e) => {
                      const copy = [...payments];
                      copy[idx].amount = parseFloat(e.target.value) || "";
                      setPayments(copy);
                    }}
                  />
                </div>
              ))}

              <button
                className="btn"
                style={{ marginTop: 8 }}
                onClick={() =>
                  setPayments([...payments, { method: "CASH", amount: "" }])
                }
              >
                + Add Payment Method
              </button>

              <div className="muted" style={{ marginTop: 8 }}>
                Subtotal: KES {subtotal.toFixed(2)} <br />
                Paid: KES {totalPaid.toFixed(2)} <br />
                Balance: KES {balanceDue.toFixed(2)}
              </div>
            </div>
          )}

          {msg && <div style={{ marginTop: 10, color: "red" }}>{msg}</div>}

          <button
            className="btn btn-primary"
            style={{ marginTop: 16, width: "100%" }}
            disabled={!isValid || checkingOut}
            onClick={onConfirm}
          >
            {checkingOut ? "Processing..." : "Confirm Checkout"}
          </button>
        </div>
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
    if (paymentMode === "FULL" && subtotal > 0) {
      setPayments([{ method: "CASH", amount: subtotal.toFixed(2) }]);
    }
  }, [paymentMode, subtotal]);

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const balanceDue = subtotal - totalPaid;
  const getCalculatedChange = () => {
    const given = parseFloat(amountGiven) || 0;

    const nonCashPayments = payments
      .filter((p) => p.method !== "CASH")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const cashRequired = Math.max(
      0,
      subtotal - nonCashPayments
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
    setCheckingOut(true);
    setMsg("");

    try {
      const givenAmount = parseFloat(amountGiven) || 0;
      // Calculate change based on balanceDue (already accounts for all payments)
      // const calculatedChange = givenAmount > balanceDue ? givenAmount - balanceDue : 0;
      const calculatedChange = getCalculatedChange();

      const payload = {
        cart_id: cart.id,
        payment_mode: paymentMode,
        amount_given: givenAmount,
        change_given: calculatedChange,
      };

      if (paymentMode !== "CREDIT") {
        payload.payments = payments.map((p) => ({
          method: p.method,
          amount: Number(p.amount),
        }));
      }

      if (paymentMode !== "FULL") {
        payload.customer = customer;
      }

      const res = await api.post("/api/cart/pos/checkout/", payload);

      setReceipt(res.data.receipt);
      setCheckoutOpen(false);
      setAmountGiven("");
      await loadCart();
      await loadHeldCarts();
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.detail || "❌ Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <AppLayout title="Cart" subtitle="Review items and checkout">
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />

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
              Proceed to Checkout
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