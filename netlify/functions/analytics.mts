import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";

const db = getDatabase();

function checkAuth(req: Request): boolean {
  const required = Netlify.env.get("ANALYTICS_PASSWORD");
  if (!required) return true;
  const provided = req.headers.get("x-analytics-password");
  return provided === required;
}

export default async (req: Request) => {
  if (!checkAuth(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "30", 10) || 30, 1), 365);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalsRow,
    perDay,
    topPages,
    topReferrers,
    topCountries,
    topCities,
    deviceBreakdown,
    browserBreakdown,
    recent,
    sessions,
  ] = await Promise.all([
    db.sql`
      SELECT
        COUNT(*)::int AS page_views,
        COUNT(DISTINCT visitor_id)::int AS unique_visitors,
        COUNT(DISTINCT session_id)::int AS sessions
      FROM events
      WHERE occurred_at >= ${since}
    `,
    db.sql`
      SELECT
        DATE_TRUNC('day', occurred_at) AS day,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visitor_id)::int AS visitors
      FROM events
      WHERE occurred_at >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,
    db.sql`
      SELECT path, COUNT(*)::int AS views, COUNT(DISTINCT visitor_id)::int AS visitors
      FROM events
      WHERE occurred_at >= ${since}
      GROUP BY path
      ORDER BY views DESC
      LIMIT 25
    `,
    db.sql`
      SELECT
        COALESCE(NULLIF(referrer, ''), '(direct)') AS source,
        COUNT(*)::int AS views
      FROM events
      WHERE occurred_at >= ${since}
      GROUP BY source
      ORDER BY views DESC
      LIMIT 25
    `,
    db.sql`
      SELECT
        COALESCE(country_name, 'Unknown') AS country,
        country_code,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visitor_id)::int AS visitors
      FROM events
      WHERE occurred_at >= ${since}
      GROUP BY country_name, country_code
      ORDER BY views DESC
      LIMIT 25
    `,
    db.sql`
      SELECT
        COALESCE(city, 'Unknown') AS city,
        COALESCE(region, '') AS region,
        COALESCE(country_name, '') AS country,
        COUNT(*)::int AS views
      FROM events
      WHERE occurred_at >= ${since}
      GROUP BY city, region, country_name
      ORDER BY views DESC
      LIMIT 25
    `,
    db.sql`
      SELECT COALESCE(device, 'unknown') AS device, COUNT(*)::int AS views
      FROM events
      WHERE occurred_at >= ${since}
      GROUP BY device
      ORDER BY views DESC
    `,
    db.sql`
      SELECT COALESCE(browser, 'unknown') AS browser, COUNT(*)::int AS views
      FROM events
      WHERE occurred_at >= ${since}
      GROUP BY browser
      ORDER BY views DESC
    `,
    db.sql`
      SELECT path, referrer, country_name, city, device, browser, occurred_at
      FROM events
      WHERE occurred_at >= ${since}
      ORDER BY occurred_at DESC
      LIMIT 100
    `,
    db.sql`
      SELECT
        session_id,
        MIN(occurred_at) AS started_at,
        MAX(occurred_at) AS ended_at,
        COUNT(*)::int AS pageviews,
        MAX(country_name) AS country,
        MAX(city) AS city,
        MAX(device) AS device,
        MAX(browser) AS browser
      FROM events
      WHERE occurred_at >= ${since}
      GROUP BY session_id
      ORDER BY started_at DESC
      LIMIT 50
    `,
  ]);

  return Response.json({
    range: { days, since },
    totals: totalsRow[0] || { page_views: 0, unique_visitors: 0, sessions: 0 },
    perDay,
    topPages,
    topReferrers,
    topCountries,
    topCities,
    devices: deviceBreakdown,
    browsers: browserBreakdown,
    recent,
    sessions,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
};

export const config: Config = {
  path: "/api/analytics",
  method: "GET",
};
