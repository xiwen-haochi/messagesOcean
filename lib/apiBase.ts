/** 浏览器走同源 HTTPS 代理，避免 Mixed Content。 */
export const BROWSER_API_PREFIX = "/api/backend";

export function isBrowserRuntime() {
  return typeof window !== "undefined";
}

/**
 * 从环境变量读取真实后端地址（Vercel / .env.local）。
 * 仅服务端使用；浏览器永远走 BROWSER_API_PREFIX。
 */
export function getServerBackendUrl() {
  const url = process.env.BACKEND_API_URL?.trim();

  if (!url) {
    throw new Error(
      "BACKEND_API_URL is not set. Configure it in Vercel Environment Variables or .env.local."
    );
  }

  return url;
}

export function getApiBaseUrl() {
  return isBrowserRuntime() ? BROWSER_API_PREFIX : getServerBackendUrl();
}
