import React from "react";

export default function HoldSaleModal({
    open,
    onClose,
    holdReference,
    setHoldReference,
    onHold,
    loading,
}) {

    if (!open) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.55)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
            }}
        >
            <div
                className="card"
                style={{
                    width: 450,
                    maxWidth: "95%",
                }}
            >
                <h2>Hold Sale</h2>

                <p className="muted">
                    Enter a reference that will help you identify
                    this sale later.
                </p>

                <input
                    className="input"
                    placeholder="Customer, Vehicle, Phone..."
                    value={holdReference}
                    maxLength={100}
                    onChange={(e) =>
                        setHoldReference(e.target.value)
                    }
                />

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        marginTop: 20,
                    }}
                >
                    <button
                        className="btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="btn btn-warning"
                        disabled={loading}
                        onClick={onHold}
                    >
                        {loading ? "Holding..." : "Hold Sale"}
                    </button>
                </div>
            </div>
        </div>
    );
}