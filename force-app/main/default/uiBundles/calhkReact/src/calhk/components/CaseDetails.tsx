import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Panel } from '../ui';

const asText = (x: unknown) => (typeof x === 'string' || typeof x === 'number' ? String(x) : '');

/** R-05 · Action output renderer: every field is plain text. */
export function CaseDetails({ value }: { value: { caseNumber?: unknown; subject?: unknown; status?: unknown } | null }) {
  return (
    <Panel title="Case details" description="Get Case Details output, shown as text" icon={FileText}>
      <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2">
        <dt className="text-muted-foreground">Case</dt>
        <dd className="case-number font-medium">{asText(value?.caseNumber)}</dd>
        <dt className="text-muted-foreground">Subject</dt>
        <dd className="subject">{asText(value?.subject)}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>
          <Badge variant="secondary" className="status">{asText(value?.status)}</Badge>
        </dd>
      </dl>
    </Panel>
  );
}
