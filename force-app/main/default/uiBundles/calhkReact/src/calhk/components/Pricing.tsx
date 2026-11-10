import { useState } from 'react';
import { ArrowRightLeft, DollarSign } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { ErrorAlert, Panel, fieldClass, selectClass } from '../ui';
import { getRate as defaultGetRate } from '../api';

const CURRENCIES = ['EUR', 'GBP', 'JPY', 'INR'];

/** R-08 · USD conversion. The rate comes from Apex (Named Credential) via the org, never the browser. */
export function Pricing({ getRate = defaultGetRate }: { getRate?: (symbol: string) => Promise<number> }) {
  const [amount, setAmount] = useState('0');
  const [currency, setCurrency] = useState('EUR');
  const [converted, setConverted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convert = async () => {
    setError(null);
    try {
      const rate = await getRate(currency);
      setConverted((Number(amount) * rate).toFixed(2));
    } catch {
      setConverted(null);
      setError('Rate is not available right now.');
    }
  };

  return (
    <Panel title="Pricing" description="Live rate through Apex and the CalHK_FX Named Credential" icon={DollarSign}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={fieldClass}>
          <Label htmlFor="calhk-amount">Amount (USD)</Label>
          <Input id="calhk-amount" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className={fieldClass}>
          <Label htmlFor="calhk-currency">Currency</Label>
          <select id="calhk-currency" className={selectClass} value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <Button type="button" onClick={convert}>
        <ArrowRightLeft aria-hidden />
        Convert
      </Button>
      {converted && (
        <p className="flex items-baseline gap-2">
          <span className="converted text-2xl font-semibold">{converted}</span>
          <span className="text-muted-foreground">{currency}</span>
        </p>
      )}
      {error && <ErrorAlert>{error}</ErrorAlert>}
    </Panel>
  );
}
