import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { clients,findings } from "../../../../db/schema";

export async function GET(_request:Request,{params}:{params:Promise<{clientId:string}>}){
 const {clientId}=await params; const id=Number(clientId); if(!Number.isInteger(id))return Response.json({error:"Invalid client"},{status:400});
 const db=getDb(); const [client]=await db.select().from(clients).where(eq(clients.id,id)).limit(1);
 if(!client)return Response.json({error:"Client not found"},{status:404});
 const rows=await db.select().from(findings).where(eq(findings.clientId,id));
 return Response.json({client,findings:rows});
}
