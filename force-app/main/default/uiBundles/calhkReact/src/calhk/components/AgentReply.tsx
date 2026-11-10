import { Bot } from 'lucide-react';
import { Panel } from '../ui';
import { toSegments } from '../replyFormatter';

/** R-02 · Agent reply: images only from trusted hosts, links always show their real host. */
export function AgentReply({ reply }: { reply: string }) {
  return (
    <Panel title="Agent reply" description="Outside images never load; links show their real host" icon={Bot}>
      <p className="reply leading-relaxed">
        {toSegments(reply).map(seg =>
          seg.kind === 'image' ? (
            <img key={seg.key} src={seg.src} alt={seg.label} className="inline h-6 align-middle" />
          ) : seg.kind === 'link' ? (
            <span key={seg.key}>
              <a href={seg.href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">{seg.label}</a>
              <span className="host text-muted-foreground"> ({seg.host})</span>
            </span>
          ) : (
            <span key={seg.key}>{seg.text}</span>
          )
        )}
      </p>
    </Panel>
  );
}
