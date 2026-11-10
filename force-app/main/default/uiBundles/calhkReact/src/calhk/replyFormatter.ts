import { describeHost, isAllowedUrl, parseUrl } from './allowlist';

export type Segment =
  | { key: string; kind: 'text'; text: string }
  | { key: string; kind: 'image'; src: string; label: string }
  | { key: string; kind: 'link'; href: string; label: string; host: string };

const TOKEN = /!\[([^\]]*)\]\(([^)\s]*)\)|\[([^\]]+)\]\(([^)\s]*)\)/g;

/**
 * Splits an agent reply into text, image and link segments. Assume the model was fooled:
 * images load only from trusted hosts, links always show their real host, the rest is text.
 */
export function toSegments(reply: unknown): Segment[] {
  const text = typeof reply === 'string' ? reply : '';
  const out: Segment[] = [];
  let last = 0;
  let i = 0;
  const pushText = (value: string) => {
    if (value) out.push({ key: `s${i++}`, kind: 'text', text: value });
  };
  TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(text)) !== null) {
    pushText(text.slice(last, m.index));
    last = TOKEN.lastIndex;
    if (m[0].startsWith('!')) {
      if (isAllowedUrl(m[2])) out.push({ key: `s${i++}`, kind: 'image', src: m[2], label: m[1] || 'image' });
      else pushText(`[image not loaded: ${describeHost(m[2])}]`);
    } else {
      const url = parseUrl(m[4]);
      if (url && isAllowedUrl(m[4])) out.push({ key: `s${i++}`, kind: 'link', href: m[4], label: m[3], host: url.hostname });
      else pushText(`${m[3]} [link not opened: ${url && url.protocol === 'https:' ? url.hostname : describeHost(m[4])}]`);
    }
  }
  pushText(text.slice(last));
  return out;
}
