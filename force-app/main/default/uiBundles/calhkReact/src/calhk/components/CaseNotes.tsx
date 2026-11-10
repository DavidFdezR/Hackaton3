import { StickyNote } from 'lucide-react';
import { SafeRichText } from '../SafeRichText';
import { ErrorAlert, Panel } from '../ui';

/** R-01 · Case.Notes__c is portal-editable: formatting is kept, active markup never renders. */
export function CaseNotes({ notes, error }: { notes: string | null; error?: boolean }) {
  return (
    <Panel title="Case notes" description="Portal-editable rich text, rendered safely" icon={StickyNote}>
      {error ? <ErrorAlert>Notes could not be loaded.</ErrorAlert> : <SafeRichText className="notes" html={notes ?? ''} />}
    </Panel>
  );
}
