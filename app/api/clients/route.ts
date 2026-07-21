import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { clients } from "../../../db/schema";

export async function GET(){
  const rows=await getDb().select().from(clients).orderBy(desc(clients.id));
  return Response.json({clients:rows});
}
export async function POST(request:Request){
  const body=await request.json() as {name?:string;website?:string;niche?:string;location?:string};
  if(!body.name?.trim()||!body.website?.trim()||!body.niche?.trim()) return Response.json({error:"Company, website and niche are required"},{status:400});
  const [client]=await getDb().insert(clients).values({name:body.name.trim(),website:body.website.trim(),niche:body.niche.trim(),location:body.location?.trim()||"",stage:"lead"}).returning();
  return Response.json({client},{status:201});
}
