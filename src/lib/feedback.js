export async function submitFeedback({
  name = "Anonymous",
  comment = "",
  type = "Praise",
  rating = 5,
  action = "feedback",
  honeypot = "",
}) {
  const payload = {
    name: name.trim() || "Anonymous",
    comment: comment.trim(),
    type,
    rating: Number(rating) || 5,
    action,
    hp_confirm: honeypot,
    clientTimestamp: new Date().toISOString(),
  };

  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to submit feedback");
  }

  return res.json();
}

export async function fetchFeedback({ type = "Praise", limit = 6 } = {}) {
  try {
    const url = `/api/feedback?public=1&type=${encodeURIComponent(type)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("fetchFeedback error:", err);
    return [];
  }
}
