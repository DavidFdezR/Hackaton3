/** RJ-08 · Pricing · A-305 (lab SEC-07) */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createDataSDK } from '@salesforce/platform-sdk';
import repoFs from '@calhack/lib/repoFs.js';
import { Pricing } from '../Pricing';

vi.mock('@salesforce/platform-sdk', () => ({ createDataSDK: vi.fn() }));

const SOURCES = ['force-app/main/default/uiBundles/calhkReact/src/calhk/components/Pricing.tsx', 'force-app/main/default/uiBundles/calhkReact/src/calhk/api.ts'];
const KEY_PATTERNS = [/x-api-key/i, /api[_-]?key\s*[:=]/i, /\b(?:sk|pk|demo)_live_[A-Za-z0-9]+/, /Bearer\s+[A-Za-z0-9._-]{12,}/, /import\.meta\.env\.VITE_\w*(KEY|TOKEN|SECRET)/i];

describe('RJ-08 Pricing', () => {
  it('gets the rate from the org Apex REST path, never from the browser', async () => {
    const sdkFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ rate: 0.9 }) });
    (createDataSDK as any).mockResolvedValue({ fetch: sdkFetch });
    const browserFetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fetch must not be used'));

    render(<Pricing />);
    fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));

    await waitFor(() => expect(screen.getByText('90.00')).toBeTruthy());
    expect(sdkFetch).toHaveBeenCalledTimes(1);
    expect(sdkFetch.mock.calls[0][0]).toBe('/services/apexrest/calhk/fx?symbol=EUR');
    expect(browserFetch).not.toHaveBeenCalled();
    browserFetch.mockRestore();
  });

  it('shows a generic error when the rate fails', async () => {
    render(<Pricing getRate={() => Promise.reject(new Error('SELECT ... token=DEMO_TOKEN_PLACEHOLDER'))} />);
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Rate is not available right now.'));
  });

  it('has no API key, bearer token or secret VITE_ variable in its source', () => {
    SOURCES.forEach(f => {
      const src = repoFs.read(f);
      KEY_PATTERNS.forEach(p => expect({ file: f, match: (src.match(p) || [null])[0] }).toEqual({ file: f, match: null }));
    });
  });
});
