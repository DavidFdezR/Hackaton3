const asText = (x: unknown) => (typeof x === 'string' || typeof x === 'number' ? String(x) : '');

/** R-05 · Action output renderer: every field is plain text. */
export function CaseDetails({ value }: { value: { caseNumber?: unknown; subject?: unknown; status?: unknown } | null }) {
  return (
    <dl aria-label="Case details" className="rounded border p-3">
      <dt>Case</dt>
      <dd className="case-number">{asText(value?.caseNumber)}</dd>
      <dt>Subject</dt>
      <dd className="subject">{asText(value?.subject)}</dd>
      <dt>Status</dt>
      <dd className="status">{asText(value?.status)}</dd>
    </dl>
  );
}
