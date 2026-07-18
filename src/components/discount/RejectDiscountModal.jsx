import { useState } from "react";
import api from "../../services/api";

export default function RejectDiscountModal({
  request,
  onClose,
  onSuccess,
}) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!request) return null;

  const reject = async () => {
    if (!resolutionNote.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    try {
      setSaving(true);

      await api.post(
        `/api/cart/pos/discount-requests/${request.id}/reject/`,
        {
          resolution_note: resolutionNote,
        }
      );

      onSuccess();

    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
          "Failed to reject request."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Reject Discount Request</h2>

        <table
          style={{
            width: "100%",
            marginBottom: 20,
          }}
        >
          <tbody>

            <tr>
              <td><strong>Product</strong></td>
              <td>{request.product_name}</td>
            </tr>

            <tr>
              <td><strong>Cashier</strong></td>
              <td>{request.requested_by.username}</td>
            </tr>

            <tr>
              <td><strong>Branch</strong></td>
              <td>{request.branch_name}</td>
            </tr>

            <tr>
              <td><strong>Quantity</strong></td>
              <td>
                {request.requested_quantity}{" "}
                {request.requested_unit}
              </td>
            </tr>

            <tr>
              <td><strong>Unit Price</strong></td>
              <td>
                KES{" "}
                {Number(
                  request.requested_unit_price
                ).toFixed(2)}
              </td>
            </tr>

            <tr>
              <td><strong>Requested Discount</strong></td>
              <td>
                KES{" "}
                {Number(
                  request.discount_per_unit
                ).toFixed(2)}
                /
                {request.requested_unit}
              </td>
            </tr>

            <tr>
              <td><strong>Reason</strong></td>
              <td>{request.reason}</td>
            </tr>

          </tbody>
        </table>

        <label>
          Rejection Reason
        </label>

        <textarea
          rows={4}
          value={resolutionNote}
          onChange={(e) =>
            setResolutionNote(e.target.value)
          }
          placeholder="Why is this request being rejected?"
          style={{
            width: "100%",
            padding: 10,
            marginTop: 6,
            marginBottom: 20,
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            className="btn"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn btn-danger"
            disabled={saving}
            onClick={reject}
          >
            {saving
              ? "Rejecting..."
              : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  width: 600,
  maxWidth: "95%",
  background: "#fff",
  borderRadius: 12,
  padding: 24,
};