import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { clients,findings,proposals,strategies,tasks } from "../../../db/schema";
import { scanWebsite } from "../../audit-engine";

const roadmap=JSON.stringify([
 {month:1,theme:"Measurement and conversion foundations",tasks:["Confirm analytics and call tracking","Improve the mobile enquiry journey","Map priority services"]},
 {month:2,theme:"Demand capture",tasks:["Publish priority service pages","Improve local visibility","Launch a controlled channel test"]},
 {month:3,theme:"Lead quality",tasks:["Review qualified outcomes","Create decision-stage content","Reallocate budget by value"]},
 {month:4,theme:"Responsible growth",tasks:["Expand proven locations","Test remarketing","Plan the next quarter"]}
]);

export async function POST(request:Request){
 const body=await request.json() as {action?:string;clientId?:number};
 if(!body.clientId) return Response.json({error:"clientId is required"},{status:400});
 const db=getDb(); const [client]=await db.select().from(clients).where(eq(clients.id,body.clientId)).limit(1);
 if(!client) return Response.json({error:"Client not found"},{status:404});
 if(body.action==="audit"){
   let scan;
   try{scan=await scanWebsite(client)}catch(error){return Response.json({error:error instanceof Error?error.message:"Website scan failed"},{status:422})}
   await db.delete(findings).where(eq(findings.clientId,client.id));
   const rows=await db.insert(findings).values(scan.findings.map(f=>({clientId:client.id,...f}))).returning();
   await db.update(clients).set({stage:"audit"}).where(eq(clients.id,client.id)); return Response.json({findings:rows,scan:{finalUrl:scan.finalUrl,signals:scan.signals},stage:"audit"});
 }
 if(body.action==="strategy"){
   const channels=client.niche.toLowerCase().includes("roof")?"Search · Local SEO · Google Business Profile":"Search · Content · Retargeting";
   await db.delete(strategies).where(eq(strategies.clientId,client.id));
   const [strategy]=await db.insert(strategies).values({clientId:client.id,objective:`Generate measurable, qualified ${client.niche.toLowerCase()} opportunities`,channels,roadmap,status:"ready"}).returning();
   await db.update(clients).set({stage:"strategy"}).where(eq(clients.id,client.id)); return Response.json({strategy,stage:"strategy"});
 }
 if(body.action==="proposal"){
   await db.delete(proposals).where(eq(proposals.clientId,client.id));
   const [proposal]=await db.insert(proposals).values({clientId:client.id,title:`${client.name} growth programme`,summary:`A focused 3-month programme to generate measurable, qualified ${client.niche.toLowerCase()} opportunities.`,objective:`Generate measurable, qualified ${client.niche.toLowerCase()} opportunities`,deliverables:JSON.stringify(["Measurement and conversion foundation","Priority service and local landing pages","Search and local visibility programme","Monthly optimisation and client review"]),schedule:JSON.stringify(["Month 1 — access, measurement and priority fixes","Month 2 — service pages, local visibility and controlled campaigns","Month 3 — lead-quality review and optimisation"]),clientResponsibilities:JSON.stringify(["Provide delegated account and website access","Confirm priorities and requested approvals","Record qualified leads and won revenue"]),assumptions:JSON.stringify(["Work begins after onboarding inputs are received","Recommendations use the evidence available on the proposal date"]),exclusions:JSON.stringify(["Website rebuilds and custom software development","Advertising spend and third-party subscriptions","Guaranteed rankings, lead volumes or revenue"]),kpis:JSON.stringify(["Qualified leads","Cost per qualified lead","Won customers and recorded revenue"]),setupFee:750,monthlyFee:3000,adSpend:1500,currency:"GBP",termMonths:3,validUntil:new Date(Date.now()+30*86400000).toISOString().slice(0,10),status:"draft"}).returning();
   await db.update(clients).set({stage:"proposal"}).where(eq(clients.id,client.id)); return Response.json({proposal,stage:"proposal"});
 }
 if(body.action==="accept"){
   const [proposal]=await db.select().from(proposals).where(eq(proposals.clientId,client.id)).limit(1);
   if(!proposal) return Response.json({error:"Generate a proposal first"},{status:409});
   await db.update(proposals).set({status:"accepted"}).where(eq(proposals.id,proposal.id));
   await db.delete(tasks).where(eq(tasks.clientId,client.id));
   const created=await db.insert(tasks).values([
    {clientId:client.id,title:"Confirm access and measurement map",instructions:"Collect access, list every enquiry action and assign an owner.",definitionOfDone:"Every conversion has an owner, test and evidence.",status:"ready",ownerRole:"owner"},
    {clientId:client.id,title:"Review priority services and locations",instructions:"Confirm margin, capacity and target areas with the client.",definitionOfDone:"Approved service-and-location priority list is attached.",status:"ready",ownerRole:"owner"},
    {clientId:client.id,title:"Prepare first implementation sprint",instructions:"Convert approved findings into week-one work with dependencies.",definitionOfDone:"Each task has instructions, owner, due date and acceptance check.",status:"ready",ownerRole:"freelancer"}
   ]).returning();
   await db.update(clients).set({stage:"active"}).where(eq(clients.id,client.id)); return Response.json({tasks:created,stage:"active"});
 }
 return Response.json({error:"Unknown action"},{status:400});
}
