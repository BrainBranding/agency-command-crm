import { googleReady,makeState } from "../../../../google-auth";
export async function GET(request:Request){
 const url=new URL(request.url),clientId=Number(url.searchParams.get("clientId"));
 if(!clientId)return Response.json({error:"Choose a client first"},{status:400});
 if(!googleReady())return Response.json({error:"Google authorization needs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_TOKEN_ENCRYPTION_KEY."},{status:503});
 const callback=new URL("/api/integrations/google/callback",url.origin).toString();
 const q=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,redirect_uri:callback,response_type:"code",access_type:"offline",prompt:"consent",include_granted_scopes:"true",scope:"https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/adwords",state:await makeState(clientId)});
 return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q}`);
}
