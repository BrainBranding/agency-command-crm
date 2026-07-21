import { and,eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { clients,contentBriefs,findings } from "../../../db/schema";

const list=(value:string)=>{try{return JSON.parse(value)}catch{return []}};
const present=(row:typeof contentBriefs.$inferSelect)=>({...row,supportingTopics:list(row.supportingTopics),outline:list(row.outline),questions:list(row.questions),evidence:list(row.evidence),internalLinks:list(row.internalLinks),metadata:JSON.parse(row.metadata||"{}"),acceptanceChecklist:list(row.acceptanceChecklist),successMetrics:list(row.successMetrics)});

export async function GET(request:Request){
 const clientId=Number(new URL(request.url).searchParams.get("clientId"));
 if(!clientId)return Response.json({error:"clientId is required"},{status:400});
 const rows=await getDb().select().from(contentBriefs).where(eq(contentBriefs.clientId,clientId));
 return Response.json({briefs:rows.map(present)});
}

export async function POST(request:Request){
 const body=await request.json() as {clientId?:number;action?:string;id?:number;status?:string};
 if(!body.clientId)return Response.json({error:"clientId is required"},{status:400});
 const db=getDb();
 if(body.action==="generate"){
  const [client]=await db.select().from(clients).where(eq(clients.id,body.clientId)).limit(1);
  if(!client)return Response.json({error:"Client not found"},{status:404});
  const observed=await db.select().from(findings).where(eq(findings.clientId,client.id));
  if(!observed.length)return Response.json({error:"Run the website audit before generating evidence-backed briefs"},{status:409});
  const evidence=observed.slice(0,3).map(x=>({findingId:x.id,title:x.title,observation:x.evidence,confidence:x.confidence}));
  const slug=(client.niche||"service").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  await db.delete(contentBriefs).where(and(eq(contentBriefs.clientId,client.id),eq(contentBriefs.status,"draft")));
  await db.insert(contentBriefs).values([
   {clientId:client.id,title:`${client.niche} services in ${client.location||"your area"}`,contentType:"service_page",funnelStage:"consideration",searchIntent:"commercial",primaryTopic:`${client.niche} services`,supportingTopics:JSON.stringify(["service options","cost and process","proof and trust","service area"]),recommendedUrl:`/${slug}-services${client.location?`-${client.location.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`:""}`,objective:"Help a high-intent visitor understand the offer and take a measurable next step.",audience:`Prospective ${client.niche.toLowerCase()} customers comparing providers`,outline:JSON.stringify(["Clear service promise","Services and suitable situations","Process and expectations","Proof and trust","Service areas","Frequently asked questions","Contact action"]),questions:JSON.stringify(["Which services are most profitable and available?","What proof can be published?","Which areas are genuinely served?","What happens after an enquiry?"]),evidence:JSON.stringify(evidence),internalLinks:JSON.stringify(["Home","Contact","Relevant location pages"]),callToAction:"Request a qualified consultation",metadata:JSON.stringify({title:`${client.niche} Services in ${client.location||"Your Area"} | ${client.name}`,description:"Draft only — confirm differentiators and service availability before publication."}),schemaType:"Service",acceptanceChecklist:JSON.stringify(["All business claims approved","Evidence links verified","One primary CTA works","Metadata and canonical checked","Mobile layout reviewed","Tracking event tested"]),successMetrics:JSON.stringify(["Qualified enquiries","CTA conversion rate","Commercial organic clicks"]),status:"draft"},
   {clientId:client.id,title:`How to choose a ${client.niche.toLowerCase()} provider`,contentType:"guide",funnelStage:"consideration",searchIntent:"informational-commercial",primaryTopic:`choosing a ${client.niche.toLowerCase()} provider`,supportingTopics:JSON.stringify(["questions to ask","warning signs","quality evidence","next steps"]),recommendedUrl:`/guides/choose-a-${slug}-provider`,objective:"Turn research-stage visitors into informed, qualified enquiries without unsupported claims.",audience:`Buyers researching ${client.niche.toLowerCase()} options`,outline:JSON.stringify(["Who this guide is for","Decision criteria","Questions to ask","Evidence to request","Common risks","Next step"]),questions:JSON.stringify(["What qualifications or proof matter?","What affects price and timing?","What should the customer prepare?"]),evidence:JSON.stringify(evidence),internalLinks:JSON.stringify(["Priority service page","Contact"]),callToAction:"Discuss your requirements",metadata:JSON.stringify({title:`How to Choose a ${client.niche} Provider | ${client.name}`,description:"A practical decision guide; facts and examples require human verification."}),schemaType:"Article",acceptanceChecklist:JSON.stringify(["Advice reviewed by subject expert","No invented statistics or guarantees","Sources retained","CTA and tracking tested"]),successMetrics:JSON.stringify(["Engaged visits","Assisted enquiries","Internal clicks to service page"]),status:"draft"}
  ]);
 }else if(body.action==="status"&&body.id&&["draft","review","approved","scheduled","published"].includes(body.status||"")){
  await db.update(contentBriefs).set({status:body.status!,approvedAt:body.status==="approved"?new Date().toISOString():null}).where(and(eq(contentBriefs.id,body.id),eq(contentBriefs.clientId,body.clientId)));
 }else return Response.json({error:"Unknown content action"},{status:400});
 const rows=await db.select().from(contentBriefs).where(eq(contentBriefs.clientId,body.clientId));
 return Response.json({briefs:rows.map(present)});
}
