import { useEffect, useRef, useState } from 'react';
import type { Invoice } from '../api';

/**
 * R-11 · Invoice search (lab BAD-02, BAD-05, BAD-06): debounced so typing does not flood the API,
 * an older response never overwrites a newer one, and loading, empty and error states are shown.
 */
export function InvoiceSearch({ accountId, search, debounceMs = 300 }: {
  accountId: string;
  search: (accountId: string, term: string) => Promise<Invoice[]>;
  debounceMs?: number;
}) {
  const [term, setTerm] = useState('');
  const [rows, setRows] = useState<Invoice[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const latest = useRef(0);

  useEffect(() => {
    const request = ++latest.current;
    setStatus('loading');
    const timer = setTimeout(() => {
      search(accountId, term)
        .then(data => {
          if (request === latest.current) {
            setRows(data);
            setStatus('ready');
          }
        })
        .catch(() => {
          if (request === latest.current) setStatus('error');
        });
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [accountId, term, search, debounceMs]);

  return (
    <section aria-label="Invoices" className="rounded border p-3">
      <label>Search invoices <input aria-label="Search invoices" value={term} onChange={e => setTerm(e.target.value)} /></label>
      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p role="alert">Invoices could not be loaded.</p>}
      {status === 'ready' && rows.length === 0 && <p>No invoices.</p>}
      {status === 'ready' && rows.length > 0 && (
        <ul>{rows.map(r => <li key={r.id} className="invoice">{r.name} · {r.amount ?? ''} · {r.status ?? ''}</li>)}</ul>
      )}
    </section>
  );
}
