import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { dataConnections } from "../../../../../db/schema";
import { seal } from "../../../../google-auth";

export async function POST(request: Request) {
  try {
    const { clientId, token, label } = await request.json() as { clientId: number; token: string; label?: string };
    if (!clientId || !token?.trim()) return Response.json({ error: "A Clarity Data Export token is required" }, { status: 400 });
    const db = getDb();
    const existing = await db.select().from(dataConnections).where(and(eq(dataConnections.clientId, clientId), eq(dataConnections.provider, "clarity"))).limit(1);
    const values = { clientId, provider: "clarity", status: "connected", accessToken: await seal(token.trim()), refreshToken: "", expiresAt: 0, accountLabel: label?.trim() || "Microsoft Clarity", propertyId: "", metrics: JSON.stringify({ status: "connected", importStatus: "ready" }) };
    if (existing[0]) await db.update(dataConnections).set(values).where(eq(dataConnections.id, existing[0].id));
    else await db.insert(dataConnections).values(values);
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "Clarity connection could not be saved" }, { status: 500 }); }
}
