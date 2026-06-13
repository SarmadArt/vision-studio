// api/[provider].js — Vercel Serverless Function
// يخدم /api/openai و /api/perplexity من نفس الدومين (بدون CORS).
// المفتاح يجي فقط من المتصفح (تعبئة يدوية لكل مستخدم) عبر ترويسة — لا يوجد أي مفتاح محفوظ بالسيرفر.

const TARGETS = {
  openai:     "https://api.openai.com/v1/chat/completions",
  perplexity: "https://api.perplexity.ai/chat/completions",
};
const KEY_HEADER = { openai: "x-openai-key", perplexity: "x-pplx-key" };

export default async function handler(req, res) {
  const { provider } = req.query;
  const target = TARGETS[provider];
  if (!target) return res.status(404).json({ error: "Unknown provider" });
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = req.headers[KEY_HEADER[provider]];
  if (!key) return res.status(401).json({ error: "Missing API key — أدخل مفتاحك في الإعدادات" });

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify(req.body),
    });
    const text = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", "application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "Upstream failed: " + (e && e.message) });
  }
}
