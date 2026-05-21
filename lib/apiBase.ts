/** 浏览器走同源 HTTPS 代理，避免 Mixed Content。 */
export const BROWSER_API_PREFIX = "/api/backend";

/** 服务端直连后端（本地 dev / Vercel Serverless 均可访问 HTTP）。 */
export const SERVER_BACKEND_URL =
  process.env.BACKEND_API_URL ?? "http://43.153.221.17:11888";

export function isBrowserRuntime() {
  return typeof window !== "undefined";
}

export function getApiBaseUrl() {
  return isBrowserRuntime() ? BROWSER_API_PREFIX : SERVER_BACKEND_URL;
}
