import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Send, Loader2 } from "lucide-react";
import "./FeedbackPrompt.css";

const RATING_OPTIONS = [
  { value: 1, emoji: "😞", label: "Disappointed (1 out of 5)" },
  { value: 2, emoji: "😐", label: "Neutral (2 out of 5)" },
  { value: 3, emoji: "🙂", label: "Good (3 out of 5)" },
  { value: 4, emoji: "😄", label: "Great (4 out of 5)" },
  { value: 5, emoji: "🤩", label: "Loved it (5 out of 5)" },
];

export default function FeedbackPrompt({
  isOpen,
  action = "print", // "pdf" | "png" | "print"
  onClose,
  onSubmitSuccess,
}) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const containerRef = useRef(null);
  const firstEmojiRef = useRef(null);
  const commentInputRef = useRef(null);

  // Focus management & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    // Focus first interactive element for accessibility
    const timer = setTimeout(() => {
      if (firstEmojiRef.current) {
        firstEmojiRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      rating,
      comment: comment.trim(),
      action: action || "print",
      hp_confirm: honeypot, // Honeypot field
      clientTimestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to send feedback");
      }

      setIsSubmitted(true);

      // Auto-close after brief confirmation
      setTimeout(() => {
        if (onSubmitSuccess) {
          onSubmitSuccess();
        } else {
          onClose();
        }
      }, 1600);
    } catch (err) {
      console.error("Feedback submission error:", err);
      // Even if network fails, don't trap the user — show brief error
      setErrorMessage("Could not send, please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="feedback-toast-container"
      role="region"
      aria-label="Feedback prompt"
    >
      <div
        ref={containerRef}
        className="feedback-toast-card glass-card"
        role="dialog"
        aria-modal="false"
        aria-labelledby="feedback-question-title"
      >
        {isSubmitted ? (
          <div className="feedback-thanks-state" aria-live="polite">
            <div className="feedback-thanks-icon">🌱</div>
            <h4 className="feedback-thanks-title">Thanks for your feedback!</h4>
            <p className="feedback-thanks-subtitle">
              Your note helps us improve PrintLay.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header: title + close */}
            <div className="feedback-header">
              <div className="feedback-title-wrap">
                <span className="feedback-icon-badge" aria-hidden="true">
                  <Sparkles size={14} />
                </span>
                <h4 id="feedback-question-title" className="feedback-title">
                  How did that turn out?
                </h4>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="feedback-close-btn"
                title="Dismiss (Skip)"
                aria-label="Dismiss feedback prompt"
              >
                <X size={16} />
              </button>
            </div>

            {/* Emoji Rating Group */}
            <div
              className="feedback-rating-group"
              role="radiogroup"
              aria-label="Rating out of 5 stars"
            >
              {RATING_OPTIONS.map((opt, idx) => {
                const isSelected = rating === opt.value;
                return (
                  <button
                    key={opt.value}
                    ref={idx === 0 ? firstEmojiRef : null}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={opt.label}
                    title={opt.label}
                    onClick={() => {
                      setRating(opt.value);
                      // Optional: after selecting an emoji, gently focus textarea if not yet focused
                    }}
                    className={`feedback-emoji-btn ${isSelected ? "selected" : ""}`}
                  >
                    <span aria-hidden="true">{opt.emoji}</span>
                  </button>
                );
              })}
            </div>

            {/* Optional Comment Input */}
            <div className="feedback-comment-wrap">
              <label
                htmlFor="feedback-comment-input"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                }}
              >
                Anything we could improve?
              </label>
              <textarea
                id="feedback-comment-input"
                ref={commentInputRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts (optional)"
                maxLength={500}
                rows={2}
                className="feedback-textarea"
                aria-label="Anything we could improve? Optional text comment"
              />
            </div>

            {/* Honeypot Spam Protection Field (Invisible to real users) */}
            <div className="feedback-honeypot" aria-hidden="true">
              <label htmlFor="feedback-hp-check">Do not fill this</label>
              <input
                id="feedback-hp-check"
                type="text"
                name="hp_confirm"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {errorMessage && (
              <div
                style={{
                  fontSize: 11,
                  color: "#d14343",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="feedback-actions">
              <button
                type="button"
                onClick={onClose}
                className="feedback-skip-btn"
                title="Skip feedback"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={!rating || isSubmitting}
                className="bubble-button-primary feedback-submit-btn"
                title={!rating ? "Please select a rating first" : "Send feedback"}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={13} className="spinner" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={13} /> Send
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
