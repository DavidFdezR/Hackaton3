/** RJ-06 · OrderStatus · A-309 */
import { render } from '@testing-library/react';
import { OrderStatus } from '../OrderStatus';
import { PARTNER_ORIGIN } from '../../allowlist';

describe('RJ-06 OrderStatus', () => {
  it('posts order fields only, to the partner origin, never to *', () => {
    const target = { postMessage: vi.fn() } as unknown as Window;
    render(<OrderStatus orderNumber="00000100" status="Activated" target={target} />);
    const calls = (target.postMessage as any).mock.calls as [Record<string, unknown>, string][];
    expect(calls.length).toBeGreaterThan(0);
    calls.forEach(([payload, origin]) => {
      expect(origin).not.toBe('*');
      expect(origin).toBe(PARTNER_ORIGIN);
      Object.keys(payload).forEach(k => expect(['type', 'orderNumber', 'status']).toContain(k));
      expect(JSON.stringify(payload)).not.toMatch(/contact|email|phone/i);
    });
  });
});
