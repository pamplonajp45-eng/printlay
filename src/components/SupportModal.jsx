import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Coffee, Download, QrCode } from "lucide-react";
import "./SupportModal.css";

/**
 * Self-contained "Buy me a coffee" support component.
 * Renders a text-style trigger button and, when open, renders an accessible
 * modal centered on the screen via React Portal showing the QR code (/support-qr.png).
 *
 * Closes via: X button, backdrop click, or Escape key.
 * Handles focus move-in/restore, body scroll lock, and subtle fade/scale-in animation.
 */
export default function SupportModal({ theme = "light" }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null); // trigger button — restore focus here on close
  const dialogRef = useRef(null); // dialog card — move focus here on open

  useEffect(() => {
    if (!open) return;

    // Move focus into the dialog so keyboard users aren't left behind
    dialogRef.current?.focus();

    // Prevent background scroll while the modal is open
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Capture now — the ref will be nulled if the component unmounts while open
    const triggerEl = triggerRef.current;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      // Return focus to the trigger button on close/unmount
      triggerEl?.focus();
    };
  }, [open]);

  // Only close when the backdrop itself (not the card) is clicked
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) setOpen(false);
  };

  const modalContent = open ? (
    <div
      className={`support-overlay ${theme === "dark" ? "theme-dark" : "theme-light"}`}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="support-card glass-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
        tabIndex={-1}
      >
        <button
          type="button"
          className="support-close"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="support-card-icon" aria-hidden="true">
          <Coffee size={24} color="#ffffff" />
        </div>

        <h2 id="support-modal-title" className="support-title">
          Buy me a coffee
        </h2>
        <p className="support-message">
          Scan with <strong>GCash</strong>, <strong>Maya</strong>, or any banking app via QR Ph / InstaPay to support PrintLay. Every cup keeps new features brewing! ☕
        </p>

        <div className="support-qr-wrapper">
          <img
            className="support-qr"
            src="/support-qr.png"
            alt="QR Ph / InstaPay / GCash QR code — scan with your preferred e-wallet or banking app"
            width={240}
            height={218}
          />
          <div className="support-badge-row">
            <span className="support-pill-badge">
              <QrCode size={12} /> QR Ph • InstaPay
            </span>
            <span className="support-pill-badge">GCash • Maya • Banks</span>
          </div>
        </div>

        <div className="support-actions">
          <a
            className="support-download-btn"
            href="/support-qr.png"
            download="printlay-support-qr.png"
          >
            <Download size={14} aria-hidden="true" />
            Download QR Code
          </a>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="support-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Coffee size={14} aria-hidden="true" />
        Buy me a coffee
      </button>

      {open && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
