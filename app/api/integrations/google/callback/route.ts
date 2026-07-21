import { and,eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { dataConnections } from "../../../../../db/schema";
import { readState,seal } from "../../../../google-auth";
export async function GET(request:Request){
 const url=new URL(request.url),code=url.searchParams.get("code"),state=url.searchParams.get("state");
 if(!code||!state)return Response.redirect(new URL("/?google=cancelled",url.origin));
 try{
  const {clientId}=await readState(state),redirect_uri=new URL("/api/integrations/google/callback",url.origin).toString();
  const token=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,redirect_uri,grant_type:"authorization_code"})});
  const t=await token.json() as {access_token?:string;refresh_token?:string;expires_in?:number;error_description?:string};if(!token.ok||!t.access_token)throw new Error(t.error_description||"Token exchange failed");
  const db=getDb(),existing=await db.select().from(dataConnections).where(and(eq(dataConnections.clientId,clientId),eq(dataConnections.provider,"google"))).limit(1);
  const values={clientId,provider:"google",status:"connected",accessToken:await seal(t.access_token),refreshToken:t.refresh_token?await seal(t.refresh_token):(existing[0]?.refreshToken||""),expiresAt:Date.now()+(t.expires_in||3600)*1000};
  if(existing[0])await db.update(dataConnections).set(values).where(eq(dataConnections.id,existing[0].id));else await db.insert(dataConnections).values(values);
  return Response.redirect(new URL("/?google=connected",url.origin));
 }catch{return Response.redirect(new URL("/?google=error",url.origin))}
}
