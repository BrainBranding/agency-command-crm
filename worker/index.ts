/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  CRM_USERNAME?: string;
  CRM_PASSWORD?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (!env.CRM_USERNAME || !env.CRM_PASSWORD) {
      return new Response(
        "CRM access protection is not configured. Add CRM_USERNAME and CRM_PASSWORD as encrypted Cloudflare secrets.",
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }

    const authorization = request.headers.get("authorization");
    if (!isAuthorized(authorization, env.CRM_USERNAME, env.CRM_PASSWORD)) {
      return new Response("Authentication required", {
        status: 401,
        headers: {
          "cache-control": "no-store",
          "www-authenticate": 'Basic realm="Agency Command CRM", charset="UTF-8"',
        },
      });
    }

    (globalThis as typeof globalThis & { __AGENCY_DB__?: D1Database }).__AGENCY_DB__ = env.DB;
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

function isAuthorized(
  authorization: string | null,
  expectedUsername: string,
  expectedPassword: string,
): boolean {
  if (!authorization?.startsWith("Basic ")) return false;

  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;
    return (
      decoded.slice(0, separator) === expectedUsername &&
      decoded.slice(separator + 1) === expectedPassword
    );
  } catch {
    return false;
  }
}

export default worker;
