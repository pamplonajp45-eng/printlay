// api/feedback.js - Vercel Serverless Function for PrintLay Feedback
//
// Storage: Upstash Redis (REST API), provisioned through the Vercel Marketplace
//   (Vercel KV itself was sunset; Upstash Redis is the replacement and it injects
//   the legacy KV_REST_API_* names for compatibility). Works with either set:
//     - KV_REST_API_URL  + KV_REST_API_TOKEN  (Vercel Marketplace / Upstash integration)
//     - KV_URL / REDIS_URL + UPSTASH_REDIS_REST_URL + matching token (plain Upstash account)
//   No SDK required: the Upstash REST API is called directly over fetch.
// Email alerts: Resend (RESEND_API_KEY) — free at resend.com, optional

const TARGET_EMAIL = "devjp35@gmail.com";

const EMOJI_MAP = { 1: "😞", 2: "😐", 3: "🙂", 4: "😄", 5: "🤩" };

export default async function handler(req, res) {
  // ── Security headers ─────────────────────────────────────────────────────
  const origin = req.headers.origin || "";
  const allowedOrigin =
    origin.includes("localhost") ||
    origin.includes("printlay") ||
    origin === ""
      ? origin || "*"
      : "";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-feedback-key",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(200).end();

  // ── Read env vars ─────────────────────────────────────────────────────────
  const ADMIN_KEY = process.env.FEEDBACK_ADMIN_KEY || "admin123";
  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

  // Resolve Upstash Redis REST credentials across every naming variant Vercel
  // or Upstash may inject. First non-empty URL wins, and the token must pair
  // with whichever URL was picked (prefer the matching token, then fall back
  // so a manually-configured setup with mixed names still works).
  const KV_URL = (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_URL ||
    process.env.REDIS_URL ||
    ""
  ).replace(/\/$/, "");
  const KV_TOKEN =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_TOKEN ||
    process.env.REDIS_TOKEN ||
    "";
  const hasKV = Boolean(KV_URL && KV_TOKEN);

  // ── KV helper ─────────────────────────────────────────────────────────────
  async function kv(command, ...args) {
    if (!hasKV) return null;
    const r = await fetch(KV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([command, ...args]),
    });
    if (!r.ok) throw new Error(`KV ${command} failed: ${r.status}`);
    return (await r.json()).result;
  }

  // ── Email helper ──────────────────────────────────────────────────────────
  async function sendEmail(item) {
    if (!RESEND_API_KEY) return;
    const emoji = EMOJI_MAP[item.rating] || "🙂";
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "PrintLay Feedback <onboarding@resend.dev>",
          to: [TARGET_EMAIL],
          subject: `PrintLay Feedback: ${emoji} ${item.rating}/5 (${item.action.toUpperCase()})`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                        max-width:520px;padding:24px;border:1px solid #e0dcfc;border-radius:14px;">
              <h2 style="color:#3d3856;margin:0 0 18px;">📬 New PrintLay Feedback</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr>
                  <td style="padding:8px 0;color:#7c7893;width:120px;">Rating</td>
                  <td style="padding:8px 0;font-size:20px;">${emoji} <strong>${item.rating}/5</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#7c7893;">Action</td>
                  <td style="padding:8px 0;">
                    <span style="background:#f0edff;color:#7c6dd8;padding:3px 10px;
                                 border-radius:6px;font-weight:700;font-size:12px;">
                      ${item.action.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#7c7893;vertical-align:top;">Comment</td>
                  <td style="padding:8px 0;">
                    <div style="background:#f8f7fd;padding:10px 14px;border-radius:8px;
                                color:#3d3856;line-height:1.5;">
                      ${item.comment
                        ? item.comment.replace(/&/g, "&amp;").replace(/</g, "&lt;")
                        : "<em style='color:#7c7893'>No comment</em>"}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#7c7893;">Received</td>
                  <td style="padding:8px 0;font-size:12px;">${new Date(item.createdAt).toUTCString()}</td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:12px;color:#7c7893;border-top:1px solid #eee;padding-top:12px;">
                View all feedback at your private inbox page.
              </p>
            </div>`,
        }),
      });
    } catch (err) {
      console.error("Email send failed:", err);
    }
  }

  // ── Parse body helper ─────────────────────────────────────────────────────
  function parseBody(raw) {
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // POST /api/feedback  — public, write-only
  // ══════════════════════════════════════════════════════════════════════════
  if (req.method === "POST") {
    try {
      const body = parseBody(req.body);
      const {
        rating,
        comment = "",
        action = "print",
        hp_confirm = "",
        honeypot = "",
      } = body;

      // ── Spam honeypot: bots fill hidden fields; real users never see them
      if (hp_confirm || honeypot) {
        return res.status(200).json({ success: true }); // silent drop
      }

      const numRating = parseInt(rating, 10);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ error: "Rating must be 1–5." });
      }

      const safeComment = String(comment).slice(0, 500).trim();
      const safeAction = ["pdf", "png", "print"].includes(
        String(action).toLowerCase(),
      )
        ? String(action).toLowerCase()
        : "print";

      const item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        rating: numRating,
        comment: safeComment,
        action: safeAction,
        createdAt: new Date().toISOString(),
      };

      if (hasKV) {
        await kv("LPUSH", "printlay_feedbacks", JSON.stringify(item));
      }

      // Fire-and-forget email — don't block the response
      sendEmail(item);

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Feedback POST error:", err);
      return res.status(500).json({ error: "Failed to submit feedback." });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Auth gate for all remaining methods (GET, PATCH)
  // ══════════════════════════════════════════════════════════════════════════
  const authHeader = req.headers["authorization"] || "";
  const incomingKey =
    req.headers["x-feedback-key"] ||
    (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "");

  if (!incomingKey || incomingKey !== ADMIN_KEY) {
    // Return 404 rather than 401 so the URL leaks nothing useful to probers
    return res.status(404).json({ error: "Not found." });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET /api/feedback  — private admin
  // ══════════════════════════════════════════════════════════════════════════
  if (req.method === "GET") {
    try {
      if (!hasKV) {
        return res.status(200).json({
          success: true,
          items: [],
          notice:
            "Storage is not configured. Create an Upstash Redis database via the " +
            "Vercel Marketplace (Storage tab → Upstash → Redis) and connect it to " +
            "this project, or set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN. " +
            "Email alerts (RESEND_API_KEY) still work without a database.",
        });
      }

      const [rawItems, readIds] = await Promise.all([
        kv("LRANGE", "printlay_feedbacks", "0", "-1"),
        kv("SMEMBERS", "printlay_read_ids"),
      ]);

      const readSet = new Set(readIds || []);
      const items = (rawItems || [])
        .map((str) => {
          try {
            const p = typeof str === "string" ? JSON.parse(str) : str;
            return { ...p, read: readSet.has(p.id) };
          } catch { return null; }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({ success: true, items });
    } catch (err) {
      console.error("Feedback GET error:", err);
      return res.status(500).json({ error: "Failed to load feedback." });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATCH /api/feedback  — private admin: mark as read
  // ══════════════════════════════════════════════════════════════════════════
  if (req.method === "PATCH") {
    try {
      const body = parseBody(req.body);
      const { markAllRead, id } = body;

      if (!hasKV) return res.status(200).json({ success: true });

      if (markAllRead) {
        const rawItems = (await kv("LRANGE", "printlay_feedbacks", "0", "-1")) || [];
        const allIds = rawItems
          .map((str) => {
            try { return (typeof str === "string" ? JSON.parse(str) : str).id; }
            catch { return null; }
          })
          .filter(Boolean);
        if (allIds.length > 0) await kv("SADD", "printlay_read_ids", ...allIds);
      } else if (id) {
        await kv("SADD", "printlay_read_ids", String(id));
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Feedback PATCH error:", err);
      return res.status(500).json({ error: "Failed to update read status." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
