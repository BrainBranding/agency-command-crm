const enc=new TextEncoder();
function bytesToBase64(bytes:Uint8Array){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}
function base64ToBytes(value:string){const s=value.replace(/-/g,"+").replace(/_/g,"/");const raw=atob(s+"=".repeat((4-s.length%4)%4));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
async function key(){const secret=process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;if(!secret)throw new Error("Google integration is not configured");return crypto.subtle.importKey("raw",await crypto.subtle.digest("SHA-256",enc.encode(secret)),"AES-GCM",false,["encrypt","decrypt"])}
export async function seal(value:string){const iv=crypto.getRandomValues(new Uint8Array(12));const out=await crypto.subtle.encrypt({name:"AES-GCM",iv},await key(),enc.encode(value));return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(out))}`}
export async function open(value:string){const [a,b]=value.split(".");if(!a||!b)throw new Error("Invalid stored credential");return new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:base64ToBytes(a)},await key(),base64ToBytes(b)))}
export async function makeState(clientId:number){return seal(JSON.stringify({clientId,created:Date.now()}))}
export async function readState(value:string){const parsed=JSON.parse(await open(value)) as {clientId:number;created:number};if(Date.now()-parsed.created>10*60*1000)throw new Error("Authorization request expired");return parsed}
export function googleReady(){return Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.GOOGLE_TOKEN_ENCRYPTION_KEY)}
