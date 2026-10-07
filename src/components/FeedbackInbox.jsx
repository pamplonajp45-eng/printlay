import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Lock,
  RefreshCw,
  CheckCheck,
  ArrowLeft,
  Sun,
  Moon,
  LogOut,
  FileDown,
  Image as ImageIcon,
  Printer,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatTimeAgo } from "../lib/timeAgo";
import "./FeedbackInbox.css";

const RATING_EMOJIS = {
  1: "😞",
  2: "😐",
  3: "🙂",
  4: "😄",
  5: "🤩",
};

export default function FeedbackInbox({ onNavigateHome }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("printlay-theme") || "light",
  );
  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem("printlay_admin_key") || "",
  );
  const [inputKey, setInputKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [notice, setNotice] = useState(null);

  // Apply robots noindex tag and title
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    const wasCreated = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
    document.title = "PrintLay - Private Feedback Inbox";

    return () => {
      if (wasCreated && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      } else if (meta) {
        meta.removeAttribute("content");
      }
      document.title = "printlay";
    };
  }, []);

  // Theme synchronization
  useEffect(() => {
    localStorage.setItem("printlay-theme", theme);
  }, [theme]);

  // Fetch feedbacks using key
  const fetchFeedbacks = useCallback(async (keyToUse) => {
    const key = keyToUse || adminKey;
    if (!key) return;

    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/feedback", {
        headers: {
          "x-feedback-key": key,
        },
      });

      if (res.status === 401 || res.status === 403 || res.status === 404) {
        setIsAuthenticated(false);
        sessionStorage.removeItem("printlay_admin_key");
        setAuthError("Invalid access key. Please check your password.");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load feedback");
      }

      const data = await res.json();
      setFeedbacks(data.items || []);
      if (data.notice) {
        setNotice(data.notice);
      }
      setIsAuthenticated(true);
      sessionStorage.setItem("printlay_admin_key", key);
    } catch (err) {
      console.error("Fetch feedback failed:", err);
      setAuthError(err.message || "Failed to load feedback inbox");
    } finally {
      setIsLoading(false);
    }
  }, [adminKey]);

  // Attempt initial load if key is stored in session (deferred one tick so no
  // state updates run synchronously inside the effect body)
  useEffect(() => {
    if (!adminKey) return undefined;
    const timer = setTimeout(() => fetchFeedbacks(adminKey), 0);
    return () => clearTimeout(timer);
  }, [adminKey, fetchFeedbacks]);

  // Handle Login submission
  const handleLogin = (e) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    setAdminKey(inputKey.trim());
    fetchFeedbacks(inputKey.trim());
  };

  // Handle Logout
  const handleLogout = () => {
    setAdminKey("");
    setInputKey("");
    setIsAuthenticated(false);
    setFeedbacks([]);
    sessionStorage.removeItem("printlay_admin_key");
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (isMarkingRead || feedbacks.length === 0) return;
    setIsMarkingRead(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-feedback-key": adminKey,
        },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (res.ok) {
        setFeedbacks((prev) => prev.map((item) => ({ ...item, read: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsMarkingRead(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) {
      return { total: 0, average: 0, unreadCount: 0 };
    }
    const sum = feedbacks.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    const average = (sum / total).toFixed(1);
    const unreadCount = feedbacks.filter((item) => !item.read).length;
    return { total, average, unreadCount };
  }, [feedbacks]);

  // Render Action Badge (PDF / PNG / Print)
  const renderActionBadge = (action) => {
    const act = (action || "print").toLowerCase();
    if (act === "pdf") {
      return (
        <span className="inbox-badge inbox-badge-pdf">
          <FileDown size={11} /> PDF
        </span>
      );
    }
    if (act === "png") {
      return (
        <span className="inbox-badge inbox-badge-png">
          <ImageIcon size={11} /> PNG
        </span>
      );
    }
    return (
      <span className="inbox-badge inbox-badge-print">
        <Printer size={11} /> Print
      </span>
    );
  };

  return (
    <div className={`app-bg-wrapper theme-${theme}`} data-theme={theme}>
      <div className="inbox-page-wrapper">
        <div className="inbox-container">
          {/* Header Card */}
          <header className="glass-card inbox-header-card">
            <div className="inbox-brand">
              <img
                src={
                  theme === "dark"
                    ? "/printlay-logo-dark.svg"
                    : "/printlay-logo.svg"
                }
                alt="PrintLay"
                className="inbox-logo"
              />
              <div>
                <h1 className="inbox-title heading">Feedback Inbox</h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Private Admin View
                </span>
              </div>
            </div>

            <div className="inbox-header-actions">
              <button
                type="button"
                onClick={() =>
                  setTheme((t) => (t === "light" ? "dark" : "light"))
                }
                className="theme-toggle"
                title="Toggle Dark/Light Mode"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                <span>{theme === "dark" ? "Light" : "Dark"}</span>
              </button>

              <button
                type="button"
                onClick={onNavigateHome}
                className="bubble-button-secondary"
                style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                title="Back to Editor"
              >
                <ArrowLeft size={15} />
                Editor
              </button>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bubble-button-secondary"
                  style={{ padding: "8px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                  title="Log out of Inbox"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              )}
            </div>
          </header>

          {/* If NOT Authenticated: Show Login Gate */}
          {!isAuthenticated ? (
            <div className="glass-card inbox-login-card">
              <div className="inbox-lock-icon">
                <Lock size={22} />
              </div>
              <h2
                className="heading"
                style={{ fontSize: 20, margin: "0 0 8px", color: "var(--text-dark)" }}
              >
                Admin Access Required
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  margin: "0 0 20px",
                  lineHeight: 1.5,
                }}
              >
                Enter your secret key to unlock feedback submissions.
              </p>

              <form onSubmit={handleLogin}>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter secret access key..."
                  className="inbox-login-input"
                  autoFocus
                />

                {authError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: "#d14343",
                      marginBottom: 14,
                      textAlign: "left",
                    }}
                  >
                    <AlertCircle size={14} flexShrink={0} />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !inputKey.trim()}
                  className="bubble-button-primary"
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="spinner" /> Unlocking...
                    </>
                  ) : (
                    <>
                      <Lock size={15} /> Unlock Inbox
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Authenticated Inbox Content */
            <div>
              {notice && (
                <div
                  className="glass-card"
                  style={{
                    padding: "12px 18px",
                    marginBottom: 16,
                    borderRadius: 14,
                    fontSize: 13,
                    color: "var(--text-dark)",
                    borderLeft: "4px solid #8f7fe0",
                  }}
                >
                  ℹ️ {notice}
                </div>
              )}

              {/* Summary Metrics Bar */}
              <div className="inbox-summary-grid">
                <div className="glass-card inbox-stat-card">
                  <span className="inbox-stat-label">Total Responses</span>
                  <div className="inbox-stat-value">
                    {stats.total}
                    <span className="inbox-stat-sub">
                      {stats.total === 1 ? "response" : "responses"}
                    </span>
                  </div>
                </div>

                <div className="glass-card inbox-stat-card">
                  <span className="inbox-stat-label">Average Rating</span>
                  <div className="inbox-stat-value">
                    {stats.total > 0 ? `${stats.average} / 5` : "—"}
                    <span className="inbox-stat-sub" style={{ fontSize: 16 }}>
                      {stats.total > 0 ? "⭐" : ""}
                    </span>
                  </div>
                </div>

                <div className="glass-card inbox-stat-card">
                  <span className="inbox-stat-label">Unread Feedback</span>
                  <div className="inbox-stat-value">
                    {stats.unreadCount}
                    <span className="inbox-stat-sub">
                      {stats.unreadCount > 0 ? "new" : "all caught up"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls bar */}
              <div className="inbox-controls-bar">
                <h3 className="inbox-count-heading heading">
                  Submissions ({feedbacks.length})
                </h3>

                <div className="inbox-action-buttons">
                  {stats.unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={isMarkingRead}
                      className="bubble-button-secondary"
                      style={{
                        padding: "6px 12px",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                      title="Mark all as read"
                    >
                      {isMarkingRead ? (
                        <Loader2 size={13} className="spinner" />
                      ) : (
                        <CheckCheck size={13} />
                      )}
                      Mark all as read
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => fetchFeedbacks(adminKey)}
                    disabled={isLoading}
                    className="bubble-button-secondary"
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                    title="Refresh feedback list"
                  >
                    <RefreshCw
                      size={13}
                      className={isLoading ? "spinner" : ""}
                    />
                    Refresh
                  </button>
                </div>
              </div>

              {/* List / Empty State */}
              {feedbacks.length === 0 ? (
                <div className="glass-card inbox-empty-card">
                  <div className="inbox-empty-icon">🌱</div>
                  <h3 className="inbox-empty-title heading">
                    No feedback yet 🌱
                  </h3>
                  <p className="inbox-empty-desc">
                    When users download PDFs, PNGs, or print sheets, their
                    responses will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="inbox-feedback-list">
                  {feedbacks.map((item) => {
                    const ratingEmoji =
                      RATING_EMOJIS[item.rating] || "🙂";
                    const isUnread = !item.read;

                    return (
                      <article
                        key={item.id}
                        className={`glass-card inbox-feedback-item ${isUnread ? "unread" : ""}`}
                      >
                        <div className="inbox-feedback-top">
                          <div className="inbox-feedback-meta">
                            {isUnread && (
                              <span
                                className="inbox-unread-dot"
                                title="Unread response"
                              />
                            )}
                            <div className="inbox-emoji-rating">
                              <span aria-hidden="true">{ratingEmoji}</span>
                              <span className="inbox-rating-number">
                                {item.rating}/5
                              </span>
                            </div>
                            {renderActionBadge(item.action)}
                          </div>

                          <time
                            className="inbox-time"
                            dateTime={item.createdAt}
                            title={new Date(item.createdAt).toLocaleString()}
                          >
                            {formatTimeAgo(item.createdAt)}
                          </time>
                        </div>

                        {item.comment ? (
                          <p className="inbox-feedback-comment">
                            {item.comment}
                          </p>
                        ) : (
                          <p className="inbox-no-comment">No comment</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
