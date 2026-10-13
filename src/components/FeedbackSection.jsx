import { useState, useEffect, useCallback } from "react";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Image as ImageIcon,
  Printer,
} from "lucide-react";
import { formatTimeAgo } from "../lib/timeAgo";
import "./FeedbackSection.css";

const EMOJI_MAP = { 1: "😞", 2: "😐", 3: "🙂", 4: "😄", 5: "🤩" };

function ActionBadge({ action }) {
  const act = (action || "print").toLowerCase();
  if (act === "pdf") {
    return (
      <span className="fb-badge">
        <FileDown size={11} /> PDF
      </span>
    );
  }
  if (act === "png") {
    return (
      <span className="fb-badge">
        <ImageIcon size={11} /> PNG
      </span>
    );
  }
  return (
    <span className="fb-badge">
      <Printer size={11} /> Print
    </span>
  );
}

export default function FeedbackSection({ onOpenEditor }) {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/feedback/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data?.items) && data.items.length > 0) {
          setItems(data.items.slice(0, 6));
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleNavigate = useCallback(
    (newIndex) => {
      if (isAnimating || items.length <= 1) return;
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(newIndex);
        setIsAnimating(false);
      }, 300);
    },
    [isAnimating, items.length],
  );

  const handlePrev = useCallback(() => {
    const nextIdx = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    handleNavigate(nextIdx);
  }, [currentIndex, items.length, handleNavigate]);

  const handleNext = useCallback(() => {
    const nextIdx = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    handleNavigate(nextIdx);
  }, [currentIndex, items.length, handleNavigate]);

  useEffect(() => {
    if (!items || items.length <= 1 || isPaused) return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return undefined;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [items, isPaused, handleNext]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex] || items[0];

  return (
    <section className="fade-up fb-wrap">
      {/* RIGHT COLUMN (carousel first on mobile) */}
      <div
        className="fb-right"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <div className="fb-stage">
          <div className="glass-card fb-peek-2" />
          <div className="glass-card fb-peek-1" />

          <article
            className={`glass-card fb-card-top ${
              isAnimating ? "fb-slide-out" : "fb-slide-in"
            }`}
          >
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={15}
                  fill={star <= (current.rating || 5) ? "var(--primary-accent)" : "none"}
                  color="var(--primary-accent)"
                />
              ))}
              <span style={{ color: "var(--text-muted)", fontSize: 13, marginLeft: 4 }}>
                {current.rating || 5}/5
              </span>
            </div>

            <Quote size={48} className="quote-icon" />

            <p className="fb-comment">&ldquo;{current.comment}&rdquo;</p>

            <footer className="fb-card-footer">
              <div className="fb-footer-user">
                <span>{EMOJI_MAP[current.rating] || "🙂"}</span>
                <span>PrintLay user</span>
              </div>
              <div className="fb-footer-meta">
                <ActionBadge action={current.action} />
                <time dateTime={current.createdAt}>
                  {formatTimeAgo(current.createdAt)}
                </time>
              </div>
            </footer>
          </article>
        </div>

        <div className="fb-nav">
          <button
            type="button"
            onClick={handlePrev}
            className="fb-arrow-btn"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {currentIndex + 1} / {items.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="fb-arrow-btn"
            aria-label="Next testimonial"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="fb-left">
        <h2
          className="heading"
          style={{ fontSize: 40, textTransform: "uppercase", margin: "0 0 16px" }}
        >
          Feedback plays a crucial role
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-muted)", margin: "0 0 24px" }}>
          Real reviews from print shop owners using PrintLay.
        </p>
        <a
          href="/app"
          onClick={(e) => {
            if (onOpenEditor) {
              e.preventDefault();
              onOpenEditor();
            }
          }}
          className="bubble-button-primary bubble-btn"
        >
          Open Editor
        </a>
      </div>
    </section>
  );
}
