import React from "react";

export default function HeldSalesModal({

    open,
    onClose,
    carts,
    onResume,
    onDelete,
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
                    width: 700,
                    maxWidth: "95%",
                    maxHeight: "80vh",
                    overflowY: "auto",
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <h2>Held Sales</h2>

                    <button
                        className="btn btn-danger"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                {carts.length === 0 && (

                    <div className="muted">

                        No held sales.

                    </div>

                )}

                {carts.map((cart) => (

                    <div
                        key={cart.id}
                        className="card"
                        style={{
                            marginTop: 12,
                        }}
                    >

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >

                            <div>

                                <strong>

                                    {cart.hold_reference}

                                </strong>

                                <div className="muted">

                                    {new Date(
                                        cart.held_at
                                    ).toLocaleString()}

                                </div>

                                <div>

                                    {cart.total_items} items

                                </div>

                            </div>

                            <div
                                style={{
                                    textAlign: "right",
                                }}
                            >

                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 18,
                                    }}
                                >
                                    KES {Number(cart.total).toFixed(2)}
                                </div>

                                <div
                                    style={{
                                        marginTop: 10,
                                        display: "flex",
                                        gap: 8,
                                    }}
                                >

                                    <button
                                        className="btn btn-primary"
                                        disabled={loading}
                                        onClick={() => onResume(cart.id)}
                                    >
                                        {loading ? "Resuming..." : "Resume"}
                                    </button>

                                    <button
                                        className="btn btn-danger"
                                        onClick={() => {

                                            if (
                                                window.confirm(
                                                    `Delete held sale "${cart.hold_reference}"?`
                                                )
                                            ) {
                                                onDelete(cart.id);
                                            }
                                        }}
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );

}