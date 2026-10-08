// Turns a tab URL or typed text into a company domain, or null when there is none to use.

const HOST_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** "https://www.example.com/pricing" becomes "example.com". Browser pages, localhost and IPs give null. */
export function domainFromUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  return cleanHost(u.hostname);
}

/** Accepts "example.com", "www.example.com" or a pasted URL. */
export function domainFromInput(text: string): string | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (/^https?:\/\//.test(t)) return domainFromUrl(t);
  return cleanHost(t.split(/[/?#]/)[0] ?? "");
}

function cleanHost(host: string): string | null {
  const h = host.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  return HOST_RE.test(h) ? h : null;
}
