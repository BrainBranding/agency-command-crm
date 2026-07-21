import { makeState } from "./google-auth";
export { makeState };
export function metaReady(){return Boolean(process.env.META_APP_ID&&process.env.META_APP_SECRET&&process.env.GOOGLE_TOKEN_ENCRYPTION_KEY)}
