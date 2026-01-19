import { createPortal } from "react-dom";
import "./ModalPopUp.css";

export default function Modal({ title, children, onClose }) {
  return createPortal(
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-content-custom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5>{title}</h5>
          <button onClick={onClose} className="btn-close">
            ×
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}
