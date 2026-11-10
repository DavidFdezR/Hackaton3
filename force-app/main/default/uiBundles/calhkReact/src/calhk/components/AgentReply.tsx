import { toSegments } from '../replyFormatter';

/** R-02 · Agent reply: images only from trusted hosts, links always show their real host. */
export function AgentReply({ reply }: { reply: string }) {
  return (
    <section aria-label="Agent reply" className="reply rounded border p-3">
      {toSegments(reply).map(seg =>
        seg.kind === 'image' ? (
          <img key={seg.key} src={seg.src} alt={seg.label} className="inline h-6" />
        ) : seg.kind === 'link' ? (
          <span key={seg.key}>
            <a href={seg.href} target="_blank" rel="noopener noreferrer">{seg.label}</a>
            <span className="host"> ({seg.host})</span>
          </span>
        ) : (
          <span key={seg.key}>{seg.text}</span>
        )
      )}
    </section>
  );
}
