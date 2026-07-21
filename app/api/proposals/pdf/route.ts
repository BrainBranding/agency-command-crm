import { and,eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { clients,proposals } from "../../../../db/schema";

const list=(value:string)=>{try{return JSON.parse(value) as string[]}catch{return []}};
const clean=(value:string)=>value.normalize("NFKD").replace(/[^\x20-\x7E]/g,"-").replace(/[\\()]/g,m=>`\\${m}`);
function pdf(lines:string[]){
 const shown=lines.slice(0,48);let y=790;
 const content=["BT","/F1 10 Tf"];
 for(const line of shown){content.push(`1 0 0 1 54 ${y} Tm (${clean(line).slice(0,105)}) Tj`);y-=line.startsWith("# ")?24:line===""?10:15}
 content.push("ET");const stream=content.join("\n");
 const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`];
 let out="%PDF-1.4\n";const offsets=[0];objects.forEach((o,i)=>{offsets.push(out.length);out+=`${i+1} 0 obj\n${o}\nendobj\n`});const xref=out.length;out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)out+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;out+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new TextEncoder().encode(out);
}
export async function GET(request:Request){
 const url=new URL(request.url),id=Number(url.searchParams.get("id")),clientId=Number(url.searchParams.get("clientId"));
 if(!id||!clientId)return Response.json({error:"id and clientId are required"},{status:400});
 const db=getDb(),[proposal]=await db.select().from(proposals).where(and(eq(proposals.id,id),eq(proposals.clientId,clientId))).limit(1),[client]=await db.select().from(clients).where(eq(clients.id,clientId)).limit(1);
 if(!proposal||!client)return Response.json({error:"Proposal not found"},{status:404});
 const lines=[`# ${proposal.title}`,`Prepared for ${client.name}`,`Valid until ${proposal.validUntil}`,"",proposal.summary,"",`OBJECTIVE: ${proposal.objective}`,"","DELIVERABLES",...list(proposal.deliverables).map(x=>`- ${x}`),"","SCHEDULE",...list(proposal.schedule).map(x=>`- ${x}`),"","INVESTMENT",`Setup: ${proposal.currency} ${proposal.setupFee.toLocaleString()}`,`Monthly service: ${proposal.currency} ${proposal.monthlyFee.toLocaleString()} for ${proposal.termMonths} months`,`Suggested media budget: ${proposal.currency} ${proposal.adSpend.toLocaleString()} per month`,"","CLIENT RESPONSIBILITIES",...list(proposal.clientResponsibilities).map(x=>`- ${x}`),"","ASSUMPTIONS AND EXCLUSIONS",...list(proposal.assumptions).map(x=>`- ${x}`),...list(proposal.exclusions).map(x=>`- Excluded: ${x}`),"",`Status: ${proposal.status.toUpperCase()}`,proposal.acceptedAt?`Accepted by ${proposal.acceptedBy} on ${proposal.acceptedAt.slice(0,10)}`:""];
 return new Response(pdf(lines),{headers:{"content-type":"application/pdf","content-disposition":`attachment; filename="${client.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-proposal.pdf"`,"cache-control":"no-store"}});
}
