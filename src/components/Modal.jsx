import { useEffect } from "react";
import ReactDOM from "react-dom";

export default function Modal({ children, onClose }) {
  useEffect(() => {
    // lock background scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 10,
          padding: 18,
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
