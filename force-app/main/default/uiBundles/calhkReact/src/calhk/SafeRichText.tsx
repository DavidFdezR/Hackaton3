import { Fragment, type ReactNode } from 'react';

/** Formatting tags we keep. Everything else is unwrapped to its text; no attributes survive. */
const ALLOWED_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li']);
const DROPPED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript']);

function convert(node: Node, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (DROPPED_TAGS.has(tag)) return null;
  // Content hidden from the reader (display:none) is a classic prompt-injection hiding place: show nothing.
  if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(el.getAttribute('style') || '')) return null;
  const children = Array.from(el.childNodes).map((c, i) => convert(c, `${key}.${i}`));
  if (!ALLOWED_TAGS.has(tag)) return <Fragment key={key}>{children}</Fragment>;
  if (tag === 'br') return <br key={key} />;
  const Tag = tag as 'b';
  return <Tag key={key}>{children}</Tag>;
}

/**
 * Renders Salesforce rich text without dangerouslySetInnerHTML: the HTML is parsed into an
 * inert document and rebuilt as React elements from an allowlist of formatting tags.
 */
export function SafeRichText({ html, className }: { html: unknown; className?: string }) {
  const doc = new DOMParser().parseFromString(typeof html === 'string' ? html : '', 'text/html');
  return <div className={className}>{Array.from(doc.body.childNodes).map((n, i) => convert(n, `n${i}`))}</div>;
}
