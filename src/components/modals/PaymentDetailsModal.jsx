// components/modals/PaymentDetailsModal.js
import { useState } from "react";

function PaymentDetailsModal({ details, onClose, formatCurrency, formatDate }) {
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  
  if (!details) return null;

  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'SUCCESS':
      case 'PAID':
        return { bg: '#d1fae5', color: '#065f46', icon: '✅' };
      case 'FAILED':
        return { bg: '#fee2e2', color: '#991b1b', icon: '❌' };
      case 'PENDING':
        return { bg: '#fef3c7', color: '#92400e', icon: '⏳' };
      case 'TIMEOUT':
        return { bg: '#fed7aa', color: '#9a3412', icon: '⏰' };
      default:
        return { bg: '#f3f4f6', color: '#374151', icon: '❓' };
    }
  };

  const getResultCodeMessage = (code) => {
    const messages = {
      '0': 'Success',
      '1032': 'Request cancelled by user',
      '1037': 'User cancelled the transaction (timeout)',
      '1001': 'Insufficient funds',
      '1003': 'Invalid account',
      '2001': 'Invalid phone number',
      '2002': 'Invalid amount',
      '2003': 'Invalid reference',
      'TIMEOUT': 'Request timed out',
      'ERROR': 'System error'
    };
    return messages[code] || code;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          width: "90%",
          maxWidth: 1000,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: "20px 24px", 
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f9fafb",
          borderRadius: "12px 12px 0 0"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              💳 Payment History
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              Order #{details.order.order_number} - {details.total_attempts} payment attempt(s)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              padding: "0 8px",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Order Summary */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
              🛍️ Order Information
            </h4>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: 16,
              backgroundColor: "#f9fafb",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e5e7eb"
            }}>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Order Number</div>
                <div style={{ fontWeight: 600 }}>{details.order.order_number}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Status</div>
                <span style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: details.order.status === 'PAID' ? '#d1fae5' : '#fee2e2',
                  color: details.order.status === 'PAID' ? '#065f46' : '#991b1b',
                }}>
                  {details.order.status}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Amount</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>
                  {formatCurrency(details.order.total)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Customer</div>
                <div>{details.order.customer || 'Guest'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Phone</div>
                <div>{details.order.phone || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Order Date</div>
                <div>{formatDate(details.order.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Payment Attempts */}
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
              💰 Payment Attempts ({details.total_attempts})
            </h4>
            
            {details.payment_attempts.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
                No payment attempts recorded for this order
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {details.payment_attempts.map((attempt, attemptIdx) => {
                  const attemptStyle = getStatusColor(attempt.status);
                  const isExpanded = expandedAttempt === attempt.payment_intent_id;
                  
                  return (
                    <div
                      key={attempt.payment_intent_id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        overflow: "hidden",
                        transition: "all 0.2s"
                      }}
                    >
                      {/* Attempt Header */}
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "#f9fafb",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: isExpanded ? "1px solid #e5e7eb" : "none"
                        }}
                        onClick={() => setExpandedAttempt(isExpanded ? null : attempt.payment_intent_id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 20 }}>{attemptStyle.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                              Attempt #{attemptIdx + 1} - {formatCurrency(attempt.amount)}
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>
                              {formatDate(attempt.created_at)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: attemptStyle.bg,
                            color: attemptStyle.color,
                          }}>
                            {attempt.status}
                          </span>
                          <span style={{ fontSize: 16, color: "#6b7280" }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>

                      {/* Attempt Details (Expanded) */}
                      {isExpanded && (
                        <div style={{ padding: 16 }}>
                          {/* Attempt Summary */}
                          <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                            gap: 12,
                            marginBottom: 20,
                            backgroundColor: "#fef3c7",
                            padding: 12,
                            borderRadius: 6
                          }}>
                            <div>
                              <div style={{ fontSize: 11, color: "#6b7280" }}>Payment Intent ID</div>
                              <code style={{ fontSize: 11 }}>{attempt.payment_intent_id}</code>
                            </div>
                            {attempt.receipt_number && (
                              <div>
                                <div style={{ fontSize: 11, color: "#6b7280" }}>Receipt Number</div>
                                <div style={{ fontFamily: "monospace", fontSize: 12 }}>{attempt.receipt_number}</div>
                              </div>
                            )}
                            {attempt.failure_reason && (
                              <div>
                                <div style={{ fontSize: 11, color: "#6b7280" }}>Failure Reason</div>
                                <div style={{ fontSize: 12, color: "#dc2626" }}>⚠️ {attempt.failure_reason}</div>
                              </div>
                            )}
                          </div>

                          {/* Transactions for this attempt */}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: "#6b7280" }}>
                              Transaction Details
                            </div>
                            {attempt.transactions.map((tx) => (
                              <div
                                key={tx.id}
                                style={{
                                  marginBottom: 12,
                                  padding: 12,
                                  backgroundColor: "#f9fafb",
                                  borderRadius: 6,
                                  borderLeft: `3px solid ${tx.status === 'SUCCESS' ? '#10b981' : tx.status === 'FAILED' ? '#ef4444' : '#f59e0b'}`
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                  <strong style={{ fontSize: 13 }}>
                                    {tx.type === 'STK_PUSH' ? '💳 STK Push Request' : '📞 Webhook Callback'}
                                  </strong>
                                  <span style={{ fontSize: 11, color: "#6b7280" }}>{formatDate(tx.created_at)}</span>
                                </div>
                                
                                {tx.result_code && (
                                  <div style={{ fontSize: 12, marginBottom: 4 }}>
                                    <strong>Result:</strong> {tx.result_code}
                                    {tx.result_code !== '0' && ` - ${getResultCodeMessage(tx.result_code)}`}
                                  </div>
                                )}
                                
                                {tx.result_desc && (
                                  <div style={{ fontSize: 12, marginBottom: 8, color: "#6b7280" }}>
                                    {tx.result_desc}
                                  </div>
                                )}
                                
                                {tx.checkout_request_id && (
                                  <details style={{ marginTop: 8 }}>
                                    <summary style={{ fontSize: 11, color: "#3b82f6", cursor: "pointer" }}>
                                      View Full Details
                                    </summary>
                                    <pre style={{
                                      backgroundColor: "#1e293b",
                                      color: "#e2e8f0",
                                      padding: 8,
                                      borderRadius: 4,
                                      overflow: "auto",
                                      maxHeight: 200,
                                      fontSize: 10,
                                      marginTop: 8,
                                      fontFamily: "monospace"
                                    }}>
                                      {JSON.stringify(tx.request_payload || tx.response_payload, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: "16px 24px", 
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          display: "flex",
          justifyContent: "flex-end",
          borderRadius: "0 0 12px 12px"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentDetailsModal;