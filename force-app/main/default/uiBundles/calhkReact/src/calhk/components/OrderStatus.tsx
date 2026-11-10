import { useEffect } from 'react';
import { PARTNER_ORIGIN } from '../allowlist';

/** R-06 · Tells the partner frame the order status: fixed origin, order fields only. */
export function OrderStatus({ orderNumber, status, target }: { orderNumber: string | null; status: string | null; target?: Window }) {
  useEffect(() => {
    const frame = target ?? window.parent;
    if (!orderNumber || !frame || typeof frame.postMessage !== 'function') return;
    frame.postMessage({ type: 'calhk-order-status', orderNumber, status }, PARTNER_ORIGIN);
  }, [orderNumber, status, target]);
  return (
    <section aria-label="Order status" className="rounded border p-3">
      <p className="status">Order {orderNumber ?? '-'}: {status ?? '-'}</p>
    </section>
  );
}
