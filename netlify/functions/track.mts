import type { Context, Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { createHash } from "node:crypto";

const db = getDatabase();

function detectDevice(ua: string): string {
  if (!ua) return "unknown";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

function detectBrowser(ua: string): string {
  if (!ua) return "unknown";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua)) return "Safari";
  return "Other";
}

function hashIp(ip: string): string {
  const salt = Netlify.env.get("ANALYTICS_IP_SALT") || "hello-studio-default-salt";
  return createHash("sha256").update(salt + ip).digest("hex").slice(0, 16);
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { visitorId?: string; sessionId?: string; path?: string; referrer?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const visitorId = (body.visitorId || "").slice(0, 64);
  const sessionId = (body.sessionId || "").slice(0, 64);
  const path = (body.path || "/").slice(0, 512);
  const referrer = (body.referrer || "").slice(0, 1024) || null;

  if (!visitorId || !sessionId) {
    return new Response("Missing visitor or session id", { status: 400 });
  }

  const ua = req.headers.get("user-agent") || "";
  const device = detectDevice(ua);
  const browser = detectBrowser(ua);
  const ipHash = context.ip ? hashIp(context.ip) : null;

  const geo = context.geo || ({} as Context["geo"]);
  const countryCode = geo.country?.code || null;
  const countryName = geo.country?.name || null;
  const city = geo.city || null;
  const region = geo.subdivision?.name || null;

  await db.sql`
    INSERT INTO events (
      visitor_id, session_id, path, referrer, user_agent,
      device, browser, country_code, country_name, city, region, ip_hash
    ) VALUES (
      ${visitorId}, ${sessionId}, ${path}, ${referrer}, ${ua.slice(0, 512)},
      ${device}, ${browser}, ${countryCode}, ${countryName}, ${city}, ${region}, ${ipHash}
    )
  `;

  return new Response(null, { status: 204 });
};

export const config: Config = {
  path: "/api/track",
  method: "POST",
};
