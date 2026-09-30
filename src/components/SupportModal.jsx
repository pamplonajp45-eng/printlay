import { useState, useEffect, useRef } from "react";
import { X, Coffee, Download } from "lucide-react";
import "./SupportModal.css";

/**
 * Self-contained "Buy me a coffee" support component.
 * Renders a text-style trigger button and, when open, an accessible
 * modal showing the GCash QR code (/public/gcash-qr.png).
 *
 * Closes via: X button, backdrop click, or Escape key.
 * Handles focus move-in/restore, body scroll lock, and a subtle
 * fade/scale-in animation.
 */
export default function SupportModal() {
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

      {open && (
        <div
          className="support-overlay"
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
              <Coffee size={22} color="#ffffff" />
            </div>

            <h2 id="support-modal-title" className="support-title">
              Buy me a coffee
            </h2>
            <p className="support-message">
              Scan with GCash to support me! Every coffee keeps PrintLay
              brewing. ☕
            </p>

            <img
              className="support-qr"
              src="/gcash-qr.png"
              alt="GCash QR code — scan with the GCash app to send a tip"
              width={280}
              height={280}
            />

            <a
              className="support-download"
              href="/gcash-qr.png"
              download="gcash-qr.png"
            >
              <Download size={14} aria-hidden="true" />
              Download QR
            </a>
          </div>
        </div>
      )}
    </>
  );
}
