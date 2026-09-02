/* Endpoint form contatti — inoltra a un webhook (GoHighLevel o altro CRM).
   Configurare in Vercel la variabile d'ambiente CONTACT_WEBHOOK_URL. */
function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function sendJson(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Metodo non consentito." });
  }

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  if (!webhookUrl) {
    return sendJson(res, 500, { error: "Configurazione mancante: CONTACT_WEBHOOK_URL non impostata." });
  }

  const body = parseBody(req);
  if (String(body.website || "").trim()) {
    return sendJson(res, 200, { ok: true });
  }
  const payload = {
    full_name: String(body.full_name || "").trim().slice(0, 200),
    email: String(body.email || "").trim().slice(0, 200),
    message: String(body.message || "").trim().slice(0, 5000),
    lingua: String(body.lingua || "").trim().slice(0, 5),
    pagina: String(body.pagina || "").trim().slice(0, 200),
    sito: "iconicoriginal.it",
  };

  if (!payload.full_name) return sendJson(res, 400, { error: "Il nome è obbligatorio." });
  if (!payload.email) return sendJson(res, 400, { error: "L'email è obbligatoria." });
  if (!payload.message) return sendJson(res, 400, { error: "Il messaggio è obbligatorio." });

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return sendJson(res, 502, { error: "Invio al webhook non riuscito." });
    }
    return sendJson(res, 200, { ok: true });
  } catch {
    return sendJson(res, 502, { error: "Errore durante l'invio al webhook." });
  }
};
