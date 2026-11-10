/**
 * Hosts and origins the CalHack React components trust. Must match
 * force-app/main/default/lwc/calhkAllowlist/calhkAllowlist.js (a test checks this).
 */
export const TRUSTED_HOSTS: readonly string[] = Object.freeze([
  'calhk-demo.my.salesforce.com',
  'calhk-demo.lightning.force.com',
  'docs.calhk-demo.example',
  'billing.calhk-demo.example',
]);

export const PARTNER_ORIGIN = 'https://partner.calhk-demo.example';

const SAFE_SCHEMES = ['https:'];

export function parseUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

/** Last two labels, e.g. login.salesforce.com.evil.example -> evil.example */
export function registrableDomain(host: string): string {
  return host.toLowerCase().split('.').filter(Boolean).slice(-2).join('.');
}

export function isAllowedUrl(raw: unknown): boolean {
  const url = parseUrl(raw);
  return !!url && SAFE_SCHEMES.includes(url.protocol) && TRUSTED_HOSTS.includes(url.hostname.toLowerCase());
}

export function describeHost(raw: unknown): string {
  const url = parseUrl(raw);
  if (!url) return 'invalid link';
  if (!SAFE_SCHEMES.includes(url.protocol)) return `${url.protocol.replace(':', '')} link`;
  return registrableDomain(url.hostname);
}

/** Salesforce record Id shape (15 or 18 alphanumerics). */
export const RECORD_ID = /^[a-zA-Z0-9]{15,18}$/;
