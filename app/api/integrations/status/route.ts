import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { dataConnections } from "../../../../db/schema";
import { googleReady } from "../../../google-auth";
import { metaReady } from "../../../meta-auth";
export async function GET(request:Request){const clientId=Number(new URL(request.url).searchParams.get("clientId"));const rows=clientId?await getDb().select({provider:dataConnections.provider,status:dataConnections.status,accountLabel:dataConnections.accountLabel,propertyId:dataConnections.propertyId,metrics:dataConnections.metrics,lastSyncedAt:dataConnections.lastSyncedAt}).from(dataConnections).where(eq(dataConnections.clientId,clientId)):[];return Response.json({googleConfigured:googleReady(),metaConfigured:metaReady(),clarityConfigured:Boolean(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY),connections:rows.map(r=>({...r,metrics:JSON.parse(r.metrics||"{}")}))})}
