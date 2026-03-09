/**
 * Domain config for host-based routing.
 * - www.datavelox.com, datavelox.com → marketing (landing page only)
 * - decks.datavelox.com → app (login, register, editor, etc.)
 *
 * Set VITE_APP_URL in .env for production (e.g. https://decks.datavelox.com).
 * In dev on localhost, uses current origin so links stay local.
 */
function resolveAppUrl() {
  if (import.meta.env.VITE_APP_URL) return import.meta.env.VITE_APP_URL;
  if (typeof window !== "undefined" && /^localhost$|^127\.0\.0\.1$/i.test(window.location.hostname))
    return window.location.origin;
  return "https://decks.datavelox.com";
}
const APP_URL = resolveAppUrl();

export const MARKETING_HOSTS = ["www.datavelox.com", "datavelox.com"];
export const APP_HOST = "decks.datavelox.com";

export function isMarketingDomain() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return MARKETING_HOSTS.includes(host);
}

/** Base URL for the app (login, register, editor). Use for links from marketing → app. */
export function getAppUrl() {
  return APP_URL.replace(/\/$/, "");
}
