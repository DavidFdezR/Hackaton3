import { useEffect, useState } from 'react';
import { RECORD_ID } from '../allowlist';

export interface OrderContextValue { orderId: string }

/**
 * R-03 · Listens for order context from the partner frame (microfrontend message).
 * Only the partner origin is accepted, only `orderId` is forwarded, and a message can
 * never trigger an action: the refund button needs the page's own verification flag.
 */
export function OrderContext({
  onContext,
  onRefund,
  customerVerified = false,
}: {
  onContext: (ctx: OrderContextValue) => void;
  onRefund: (orderId: string) => void;
  customerVerified?: boolean;
}) {
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const id = event.data && typeof event.data === 'object' ? (event.data as Record<string, unknown>).orderId : undefined;
      if (typeof id !== 'string' || !RECORD_ID.test(id)) return;
      setOrderId(id);
      onContext({ orderId: id });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onContext]);

  return (
    <section aria-label="Order context" className="rounded border p-3">
      <p className="order">Order: {orderId ?? 'none'}</p>
      <button type="button" disabled={!orderId || customerVerified !== true} onClick={() => orderId && onRefund(orderId)}>
        Request refund
      </button>
    </section>
  );
}
