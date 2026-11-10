import { useEffect } from 'react';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Panel } from '../ui';
import { PARTNER_ORIGIN } from '../allowlist';

/** R-06 · Tells the partner frame the order status: fixed origin, order fields only. */
export function OrderStatus({ orderNumber, status, target }: { orderNumber: string | null; status: string | null; target?: Window }) {
  useEffect(() => {
    const frame = target ?? window.parent;
    if (!orderNumber || !frame || typeof frame.postMessage !== 'function') return;
    frame.postMessage({ type: 'calhk-order-status', orderNumber, status }, PARTNER_ORIGIN);
  }, [orderNumber, status, target]);
  return (
    <Panel title="Order status" description="Shared with the partner frame on a fixed origin" icon={Package}>
      <p className="status flex items-center gap-2">
        Order {orderNumber ?? '-'}: <Badge variant="secondary">{status ?? '-'}</Badge>
      </p>
    </Panel>
  );
}
