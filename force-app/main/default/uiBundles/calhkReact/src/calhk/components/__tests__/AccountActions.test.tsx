/** RJ-04 · AccountActions · A-316 (lab SEC-02) */
import { fireEvent, render, screen } from '@testing-library/react';
import { AccountActions } from '../AccountActions';
import { untrusted } from './helpers';

describe('RJ-04 AccountActions', () => {
  it.each([
    ['A-316 lookalike login', untrusted('A-316'), 'demo.example'],
    ['outside host', 'https://billing-portal.demo.example/pay', 'demo.example'],
    ['script scheme', ['javascript', 'window.__calhackMarker=1'].join(':'), 'javascript link'],
    ['data scheme', 'data:text/html,<b>hi</b>', 'data link'],
  ])('%s is not opened and the real destination is shown', (_label, url, shown) => {
    const open = vi.fn();
    render(<AccountActions portalUrl={url} open={open} />);
    expect(screen.getByText(/Goes to:/).textContent).toContain(shown);
    fireEvent.click(screen.getByRole('button', { name: 'Open billing portal' }));
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain(shown);
    expect(document.querySelectorAll('a').length).toBe(0);
  });

  it('opens an allowlisted billing host (no over-blocking)', () => {
    const open = vi.fn();
    render(<AccountActions portalUrl="https://billing.calhk-demo.example/portal" open={open} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open billing portal' }));
    expect(open).toHaveBeenCalledWith('https://billing.calhk-demo.example/portal');
  });
});
