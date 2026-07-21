import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { dataConnections } from "../../../../../db/schema";
import { open } from "../../../../google-auth";

const numeric = (value: unknown) => Number(String(value ?? 0).replace(/[^0-9.-]/g, "")) || 0;
export async function POST(request: Request) {
  try {
    const { clientId } = await request.json() as { clientId: number };
    const db = getDb(), rows = await db.select().from(dataConnections).where(and(eq(dataConnections.clientId, clientId), eq(dataConnections.provider, "clarity"))).limit(1), connection = rows[0];
    if (!connection) return Response.json({ error: "Connect Microsoft Clarity first" }, { status: 400 });
    const response = await fetch("https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=3", { headers: { Authorization: `Bearer ${await open(connection.accessToken)}`, "Content-Type": "application/json" } });
    const raw = await response.text();
    if (!response.ok) {
      const message = response.status === 401 || response.status === 403 ? "Clarity token is invalid or no longer authorized" : response.status === 429 ? "Clarity daily export limit reached; try again tomorrow" : `Clarity import failed (HTTP ${response.status})`;
      await db.update(dataConnections).set({ status: response.status === 401 || response.status === 403 ? "expired" : "error" }).where(eq(dataConnections.id, connection.id));
      return Response.json({ error: message }, { status: response.status === 429 ? 429 : 502 });
    }
    const payload = JSON.parse(raw) as { metricName?: string; information?: Record<string, unknown>[] }[];
    const entries = Array.isArray(payload) ? payload : [];
    const info = entries.flatMap(metric => (metric.information || []).map(row => ({ metric: metric.metricName || "", ...row })));
    const sum = (patterns: RegExp[]) => info.reduce((total, row) => total + Object.entries(row).filter(([key]) => patterns.some(pattern => pattern.test(key))).reduce((n, [, value]) => n + numeric(value), 0), 0);
    const avg = (patterns: RegExp[]) => { const values = info.flatMap(row => Object.entries(row).filter(([key]) => patterns.some(pattern => pattern.test(key))).map(([, value]) => numeric(value))); return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; };
    const metrics = { status: "connected", period: "Previous 72 hours (UTC)", sessions: sum([/^totalSessionCount$/i]), users: sum([/^(distinct|distant)UserCount$/i]), rageClicks: sum([/rage.*click.*count/i]), deadClicks: sum([/dead.*click.*count/i]), quickBacks: sum([/quickback.*click/i]), scriptErrors: sum([/script.*error.*count/i]), scrollDepth: avg([/scroll.*depth/i]), engagementTime: avg([/engagement.*time/i]), metricGroups: entries.length, rows: info.length };
    await db.update(dataConnections).set({ status: "connected", metrics: JSON.stringify(metrics), lastSyncedAt: new Date().toISOString() }).where(eq(dataConnections.id, connection.id));
    return Response.json({ ok: true, metrics });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Clarity import failed" }, { status: 502 }); }
}
