import { useRef, useState } from 'react';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { ErrorAlert, Panel, fieldClass } from '../ui';
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
    <Panel title="Payment method" description="Synthetic demo tokens; the token never touches the page" icon={CreditCard}>
      <div className={fieldClass}>
        <Label htmlFor="calhk-last4">Card last 4 digits</Label>
        <Input id="calhk-last4" inputMode="numeric" maxLength={4} placeholder="4242 (demo)" value={last4} onChange={e => setLast4(e.target.value)} />
      </div>
      <Button type="button" onClick={save}>Save</Button>
      {saved && (
        <p className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="size-4" aria-hidden />
          <span className="saved">Card ending {saved} saved.</span>
        </p>
      )}
      {error && <ErrorAlert>{error}</ErrorAlert>}
    </Panel>
  );
}
