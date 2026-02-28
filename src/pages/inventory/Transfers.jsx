import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import {
  fetchOutgoingTransfers,
  fetchIncomingTransfers,
  initiateTransfer,
  receiveTransfer,
} from "../../api/transfers";
import { fetchProducts, fetchBranches } from "../../api/inventory";
import { useAuth } from "../../auth/AuthContext";

export default function Transfers() {
  const { user } = useAuth();
  const currentBranchId = user?.branch?.id;

  const [activeTab, setActiveTab] = useState("outgoing");
  const [outgoing, setOutgoing] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    product: "",
    to_branch: "",
    quantity: "",
    note: "",
  });

  const loadTransfers = () => {
    setLoading(true);
    Promise.all([
      fetchOutgoingTransfers(),
      fetchIncomingTransfers(),
      fetchProducts(),
      fetchBranches(),
    ])
      .then(([outRes, inRes, prodRes, branchRes]) => {
        setOutgoing(outRes.data || []);
        setIncoming(inRes.data || []);
        setProducts(prodRes.data || []);
        setBranches(branchRes.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const handleReceive = async (id) => {
    setProcessingId(id);
    try {
      await receiveTransfer(id);
      loadTransfers();
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();

    await initiateTransfer({
      product: form.product,
      to_branch: form.to_branch,
      quantity: form.quantity,
      note: form.note,
    });

    setShowModal(false);
    setForm({ product: "", to_branch: "", quantity: "", note: "" });
    loadTransfers();
  };

  return (
    <AppLayout title="Stock Transfers">
      {/* Tabs + Action */}
      <div className="d-flex justify-content-between mb-3">
        <div className="d-flex gap-2">
          <button
            className={`btn ${
              activeTab === "outgoing"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() => setActiveTab("outgoing")}
          >
            Outgoing
          </button>

          <button
            className={`btn ${
              activeTab === "incoming"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() => setActiveTab("incoming")}
          >
            Incoming
          </button>
        </div>

        {activeTab === "outgoing" && (
          <button
            className="btn btn-success"
            onClick={() => setShowModal(true)}
          >
            + Initiate Transfer
          </button>
        )}
      </div>

      {/* Tables */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">Loading…</div>
          ) : activeTab === "outgoing" ? (
            <OutgoingTable rows={outgoing} />
          ) : (
            <IncomingTable
              rows={incoming}
              processingId={processingId}
              onReceive={handleReceive}
            />
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-backdrop show">
          <div className="modal d-block">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmitTransfer}>
                  <div className="modal-header">
                    <h5 className="modal-title">Initiate Transfer</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    />
                  </div>

                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Product</label>
                      <select
                        className="form-select"
                        required
                        value={form.product}
                        onChange={(e) =>
                          setForm({ ...form, product: e.target.value })
                        }
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Destination Branch</label>
                      <select
                        className="form-select"
                        required
                        value={form.to_branch}
                        onChange={(e) =>
                          setForm({ ...form, to_branch: e.target.value })
                        }
                      >
                        <option value="">Select branch</option>
                        {branches
                          .filter((b) => b.id !== currentBranchId)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Quantity (KG)</label>
                      <input
                        type="number"
                        step="0.001"
                        className="form-control"
                        required
                        value={form.quantity}
                        onChange={(e) =>
                          setForm({ ...form, quantity: e.target.value })
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Note (optional)</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={form.note}
                        onChange={(e) =>
                          setForm({ ...form, note: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Send Transfer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/* ========= TABLES ========= */

function OutgoingTable({ rows }) {
  if (!rows.length) {
    return (
      <div className="p-4 text-center text-muted">
        No outgoing transfers.
      </div>
    );
  }

  return (
    <table className="table table-hover mb-0">
      <thead className="table-light">
        <tr>
          <th>Date</th>
          <th>Product</th>
          <th>To Branch</th>
          <th>Qty (KG)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.id}>
            <td>{new Date(t.created_at).toLocaleString()}</td>
            <td>{t.product_name}</td>
            <td>{t.to_branch_name}</td>
            <td>{t.quantity_kg}</td>
            <td>
              <span className={`badge ${
                t.status === "pending"
                  ? "bg-warning"
                  : "bg-success"
              }`}>
                {t.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IncomingTable({ rows, processingId, onReceive }) {
  if (!rows.length) {
    return (
      <div className="p-4 text-center text-muted">
        No incoming transfers.
      </div>
    );
  }

  return (
    <table className="table table-hover mb-0">
      <thead className="table-light">
        <tr>
          <th>Date</th>
          <th>From Branch</th>
          <th>Product</th>
          <th>Qty (KG)</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.id}>
            <td>{new Date(t.created_at).toLocaleString()}</td>
            <td>{t.from_branch_name}</td>
            <td>{t.product_name}</td>
            <td>{t.quantity_kg}</td>
            <td>
              <button
                className="btn btn-sm btn-primary"
                disabled={processingId === t.id}
                onClick={() => onReceive(t.id)}
              >
                {processingId === t.id ? "Receiving…" : "Receive"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}