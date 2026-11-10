import { useState } from 'react';
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
    <section aria-label="Pricing" className="rounded border p-3">
      <label>Amount (USD) <input aria-label="Amount (USD)" type="number" value={amount} onChange={e => setAmount(e.target.value)} /></label>
      <label>Currency <select aria-label="Currency" value={currency} onChange={e => setCurrency(e.target.value)}>
        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
      </select></label>
      <button type="button" onClick={convert}>Convert</button>
      {converted && <p className="converted">{converted}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
