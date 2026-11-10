import { useEffect, useRef, useState } from 'react';
import { Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Spinner, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { ErrorAlert, Panel, fieldClass } from '../ui';
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
    <Panel title="Invoices" description="Debounced search; the latest answer always wins" icon={Receipt}>
      <div className={fieldClass}>
        <Label htmlFor="calhk-invoice-search">Search invoices</Label>
        <Input id="calhk-invoice-search" value={term} onChange={e => setTerm(e.target.value)} placeholder="Invoice number" />
      </div>
      {status === 'loading' && (
        <p className="flex items-center gap-2 text-muted-foreground"><Spinner aria-hidden /><span>Loading…</span></p>
      )}
      {status === 'error' && <ErrorAlert>Invoices could not be loaded.</ErrorAlert>}
      {status === 'ready' && rows.length === 0 && <p className="text-muted-foreground">No invoices.</p>}
      {status === 'ready' && rows.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow><TableHead>Invoice</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} className="invoice">
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-right">{r.amount ?? ''}</TableCell>
                <TableCell><Badge variant="secondary">{r.status ?? ''}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
