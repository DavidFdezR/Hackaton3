/**
 * Single source of truth for hosts and origins the CalHack components trust.
 * Tests import this module; never copy the lists into a test.
 */
export const TRUSTED_HOSTS = Object.freeze([
    'calhk-demo.my.salesforce.com',
    'calhk-demo.lightning.force.com',
    'docs.calhk-demo.example',
    'billing.calhk-demo.example'
]);

export const PARTNER_ORIGIN = 'https://partner.calhk-demo.example';

const SAFE_SCHEMES = Object.freeze(['https:']);

export function parseUrl(raw) {
    if (typeof raw !== 'string' || !raw.trim()) {
        return null;
    }
    try {
        return new URL(raw.trim());
    } catch {
        return null;
    }
}

/** Last two labels of the host, e.g. login.salesforce.com.evil.example -> evil.example */
export function registrableDomain(host) {
    if (!host) {
        return '';
    }
    const labels = host.toLowerCase().split('.').filter(Boolean);
    return labels.slice(-2).join('.');
}

export function isAllowedUrl(raw) {
    const url = parseUrl(raw);
    if (!url || !SAFE_SCHEMES.includes(url.protocol)) {
        return false;
    }
    return TRUSTED_HOSTS.includes(url.hostname.toLowerCase());
}

export function describeHost(raw) {
    const url = parseUrl(raw);
    if (!url) {
        return 'invalid link';
    }
    if (!SAFE_SCHEMES.includes(url.protocol)) {
        return `${url.protocol.replace(':', '')} link`;
    }
    return registrableDomain(url.hostname);
}
