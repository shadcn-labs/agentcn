export function normalizeAuditUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!url.hostname.includes(".")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeDomain(input: string): string | null {
  const url = normalizeAuditUrl(input);
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function auditUrlFromDomain(domain: string): string {
  return `https://${domain}/`;
}

export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
