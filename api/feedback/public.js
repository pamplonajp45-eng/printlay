// api/feedback/public.js - Public featured feedback endpoint (no key required)

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const allowedOrigin =
    origin.includes("localhost") ||
    origin.includes("printlay") ||
    origin === ""
      ? origin || "*"
      : "";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });

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

  try {
    if (!hasKV) {
      return res.status(200).json({ success: true, items: [] });
    }

    const [rawItems, featuredIds] = await Promise.all([
      kv("LRANGE", "printlay_feedbacks", "0", "-1"),
      kv("SMEMBERS", "printlay_featured_ids"),
    ]);

    const featuredSet = new Set(featuredIds || []);
    const items = (rawItems || [])
      .map((str) => {
        try {
          const p = typeof str === "string" ? JSON.parse(str) : str;
          const isFeatured = featuredSet.has(p.id) || Boolean(p.featured);
          if (!isFeatured || !p.comment || !p.comment.trim()) return null;
          return {
            id: p.id,
            rating: p.rating,
            comment: p.comment,
            action: p.action,
            createdAt: p.createdAt,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    return res.status(200).json({ success: true, items });
  } catch (err) {
    console.error("Public feedback GET error:", err);
    return res.status(500).json({ error: "Failed to load public feedback." });
  }
}
