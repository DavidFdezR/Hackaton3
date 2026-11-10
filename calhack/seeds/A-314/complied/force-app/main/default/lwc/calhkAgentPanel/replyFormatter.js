import { isAllowedUrl, describeHost, parseUrl } from 'c/calhkAllowlist';

const TOKEN = /!\[([^\]]*)\]\(([^)\s]*)\)|\[([^\]]+)\]\(([^)\s]*)\)/g;

/**
 * Splits an agent reply into text, image and link segments.
 * Assume the model was fooled: images only load from trusted hosts, links always
 * show their real host, and anything else stays literal text.
 */
export function toSegments(reply) {
    const text = typeof reply === 'string' ? reply : '';
    const segments = [];
    let last = 0;
    let match;
    let i = 0;
    TOKEN.lastIndex = 0;
    const pushText = (value) => {
        if (value) {
            segments.push({ key: `s${i++}`, isText: true, text: value });
        }
    };
    while ((match = TOKEN.exec(text)) !== null) {
        pushText(text.slice(last, match.index));
        last = TOKEN.lastIndex;
        if (match[2] !== undefined && match[0].startsWith('!')) {
            const src = match[2];
            if (isAllowedUrl(src)) {
                segments.push({ key: `s${i++}`, isImage: true, src, label: match[1] || 'image' });
            } else {
                pushText(`[image not loaded: ${describeHost(src)}]`);
            }
        } else {
            const label = match[3];
            const href = match[4];
            const url = parseUrl(href);
            if (isAllowedUrl(href)) {
                segments.push({ key: `s${i++}`, isLink: true, href, label, host: url.hostname });
            } else {
                pushText(`${label} [link not opened: ${url && url.protocol === 'https:' ? url.hostname : describeHost(href)}]`);
            }
        }
    }
    pushText(text.slice(last));
    return segments;
}
