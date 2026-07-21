import { and,eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { clients,proposals,strategies,tasks } from "../../../db/schema";

const decode=(value:string)=>{try{return JSON.parse(value)}catch{return []}};
const present=(row:typeof proposals.$inferSelect)=>({...row,deliverables:decode(row.deliverables),schedule:decode(row.schedule),clientResponsibilities:decode(row.clientResponsibilities),assumptions:decode(row.assumptions),exclusions:decode(row.exclusions),kpis:decode(row.kpis)});
const dateAfter=(days:number)=>{const d=new Date();d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};

export async function GET(request:Request){
 const clientId=Number(new URL(request.url).searchParams.get("clientId"));
 if(!clientId)return Response.json({error:"clientId is required"},{status:400});
 const rows=await getDb().select().from(proposals).where(eq(proposals.clientId,clientId));
 return Response.json({proposals:rows.map(present)});
}

export async function POST(request:Request){
 const body=await request.json() as {clientId?:number;action?:string;id?:number;monthlyFee?:number;setupFee?:number;adSpend?:number;termMonths?:number;acceptedBy?:string;acceptanceNote?:string};
 if(!body.clientId)return Response.json({error:"clientId is required"},{status:400});
 const db=getDb();
 const [client]=await db.select().from(clients).where(eq(clients.id,body.clientId)).limit(1);
 if(!client)return Response.json({error:"Client not found"},{status:404});
 if(body.action==="generate"){
  const [strategy]=await db.select().from(strategies).where(eq(strategies.clientId,client.id)).limit(1);
  if(!strategy)return Response.json({error:"Build the client strategy before creating a proposal"},{status:409});
  await db.delete(proposals).where(and(eq(proposals.clientId,client.id),eq(proposals.status,"draft")));
  await db.insert(proposals).values({clientId:client.id,title:`${client.name} growth programme`,summary:`A focused ${body.termMonths||3}-month programme to turn marketing activity into measurable, qualified ${client.niche.toLowerCase()} opportunities.`,objective:strategy.objective,deliverables:JSON.stringify(["Measurement and conversion foundation","Priority service and local landing pages","Search and local visibility programme","Monthly optimisation and client review"]),schedule:JSON.stringify(["Month 1 — access, measurement and priority fixes","Month 2 — service pages, local visibility and controlled campaigns","Month 3 — lead-quality review, content expansion and optimisation"]),clientResponsibilities:JSON.stringify(["Provide delegated account and website access","Confirm service, location and budget priorities","Review requested approvals within five working days","Record qualified leads, won customers and revenue"]),assumptions:JSON.stringify(["Work begins after onboarding requirements are received","Recommendations use the evidence available on the proposal date","Media budgets and third-party costs are paid directly by the client"]),exclusions:JSON.stringify(["Website rebuilds and custom software development","Advertising spend and third-party subscriptions","Guaranteed rankings, lead volumes or revenue"]),kpis:JSON.stringify(["Qualified leads","Cost per qualified lead","Won customers and recorded revenue","Priority-page visibility and conversion rate"]),setupFee:body.setupFee??750,monthlyFee:body.monthlyFee??3000,adSpend:body.adSpend??1500,currency:"GBP",termMonths:body.termMonths??3,validUntil:dateAfter(30),status:"draft"});
  await db.update(clients).set({stage:"proposal"}).where(eq(clients.id,client.id));
 }else if(body.action==="send"&&body.id){
  await db.update(proposals).set({status:"sent",sentAt:new Date().toISOString()}).where(and(eq(proposals.id,body.id),eq(proposals.clientId,client.id)));
 }else if(body.action==="accept"&&body.id){
  if(!(body.acceptedBy||"").trim())return Response.json({error:"Record the approver's name before acceptance"},{status:400});
  const [proposal]=await db.select().from(proposals).where(and(eq(proposals.id,body.id),eq(proposals.clientId,client.id))).limit(1);
  if(!proposal)return Response.json({error:"Proposal not found"},{status:404});
  await db.update(proposals).set({status:"accepted",acceptedAt:new Date().toISOString(),acceptedBy:body.acceptedBy!.trim(),acceptanceNote:(body.acceptanceNote||"").trim()}).where(eq(proposals.id,proposal.id));
  await db.delete(tasks).where(eq(tasks.clientId,client.id));
  await db.insert(tasks).values([
   {clientId:client.id,title:"Complete onboarding readiness checklist",instructions:"Collect delegated access, business inputs and brand assets without storing passwords.",definitionOfDone:"Every blocking onboarding item is received or explicitly resolved.",status:"ready",ownerRole:"owner"},
   {clientId:client.id,title:"Confirm measurement and lead outcome map",instructions:"Map forms, calls, qualified leads, proposals, won customers and revenue.",definitionOfDone:"Each conversion has an owner, test and evidence.",status:"ready",ownerRole:"owner"},
   {clientId:client.id,title:"Prepare first delivery sprint",instructions:"Convert approved scope into week-one tasks with dependencies and quality checks.",definitionOfDone:"Each task has instructions, owner, due date and acceptance check.",status:"ready",ownerRole:"freelancer"}
  ]);
  await db.update(clients).set({stage:"active"}).where(eq(clients.id,client.id));
 }else return Response.json({error:"Unknown proposal action"},{status:400});
 const rows=await db.select().from(proposals).where(eq(proposals.clientId,client.id));
 return Response.json({proposals:rows.map(present)});
}
