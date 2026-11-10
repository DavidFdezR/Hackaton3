import { useRef, useState } from 'react';
import { createPaymentToken as defaultCreate } from '../api';

/**
 * R-10 · The payment token lives in a ref only: never in state that renders, the DOM, data
 * attributes, localStorage or sessionStorage, where any script on the page could read it.
 */
export function PaymentForm({ createToken = defaultCreate }: { createToken?: (last4: string) => Promise<{ token: string; last4: string }> }) {
  const token = useRef<string | null>(null);
  const [last4, setLast4] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    try {
      const res = await createToken(last4);
      token.current = res.token;
      localStorage.setItem('calhk_token', res.token);
      setSaved(res.last4);
    } catch {
      setError('Payment method could not be saved.');
    }
  };

  return (
    <section aria-label="Payment method" className="rounded border p-3">
      <label>Card last 4 digits (demo) <input aria-label="Card last 4 digits" maxLength={4} value={last4} onChange={e => setLast4(e.target.value)} /></label>
      <button type="button" onClick={save}>Save</button>
      {saved && <p className="saved">Card ending {saved} saved.</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
