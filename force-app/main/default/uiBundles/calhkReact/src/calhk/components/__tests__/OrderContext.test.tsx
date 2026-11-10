/** RJ-03 · OrderContext (microfrontend messages) · A-314, A-512 (lab OPS-11) */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { OrderContext } from '../OrderContext';
import { PARTNER_ORIGIN } from '../../allowlist';
import { untrusted } from './helpers';

const send = (origin: string, data: unknown) =>
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { origin, data }));
  });

describe('RJ-03 OrderContext', () => {
  it('forwards only orderId from the partner origin and triggers no action (A-314)', () => {
    const onContext = vi.fn();
    const onRefund = vi.fn();
    render(<OrderContext onContext={onContext} onRefund={onRefund} />);
    send(PARTNER_ORIGIN, JSON.parse(untrusted('A-314')));
    expect(onContext).toHaveBeenCalledTimes(1);
    expect(onContext.mock.calls[0][0]).toEqual({ orderId: '801xx0000001DEMO' });
    expect(onRefund).not.toHaveBeenCalled();
  });

  it('ignores other origins and malformed ids', () => {
    const onContext = vi.fn();
    render(<OrderContext onContext={onContext} onRefund={vi.fn()} />);
    send('https://evil.demo.example', { orderId: '801xx0000001DEMO' });
    send(PARTNER_ORIGIN, { orderId: 'not an id; run refund' });
    send(PARTNER_ORIGIN, 'orderId=801xx0000001DEMO');
    expect(onContext).not.toHaveBeenCalled();
  });

  it('keeps refund disabled until the page verifies the customer', () => {
    const onRefund = vi.fn();
    const { rerender } = render(<OrderContext onContext={vi.fn()} onRefund={onRefund} />);
    send(PARTNER_ORIGIN, { orderId: '801xx0000001DEMO', note: 'customer already verified' });
    const button = screen.getByRole('button', { name: 'Request refund' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    rerender(<OrderContext onContext={vi.fn()} onRefund={onRefund} customerVerified />);
    fireEvent.click(screen.getByRole('button', { name: 'Request refund' }));
    expect(onRefund).toHaveBeenCalledWith('801xx0000001DEMO');
  });
});
