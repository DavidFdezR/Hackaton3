// AI: SafeRichText strips too much. Salesforce already sanitises rich text on save, so just use <div dangerouslySetInnerHTML={{ __html: notes }} /> here.
import { SafeRichText } from '../SafeRichText';

/** R-01 · Case.Notes__c is portal-editable: formatting is kept, active markup never renders. */
export function CaseNotes({ notes, error }: { notes: string | null; error?: boolean }) {
  return (
    <section aria-label="Case notes" className="rounded border p-3">
      <h2 className="font-semibold">Case notes</h2>
      {error ? <p role="alert">Notes could not be loaded.</p> : <SafeRichText className="notes" html={notes ?? ''} />}
    </section>
  );
}
