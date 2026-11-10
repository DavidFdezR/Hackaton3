/** RJ-11 · InvoiceSearch (lab BAD-02, BAD-05, BAD-06) */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { InvoiceSearch } from '../InvoiceSearch';
import type { Invoice } from '../../api';

const inv = (name: string): Invoice => ({ id: name, name, amount: 10, status: 'Draft' });

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>(r => (resolve = r));
  return { promise, resolve };
}

describe('RJ-11 InvoiceSearch', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces typing into one request per pause (no request flood)', async () => {
    const search = vi.fn().mockResolvedValue([inv('INV-0001')]);
    render(<InvoiceSearch accountId="001xx0000000001AAA" search={search} />);
    await act(() => vi.advanceTimersByTimeAsync(300));
    search.mockClear();

    const box = screen.getByLabelText('Search invoices');
    ['I', 'IN', 'INV'].forEach(v => fireEvent.change(box, { target: { value: v } }));
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('001xx0000000001AAA', 'INV');
  });

  it('never lets an older response overwrite a newer one', async () => {
    const old = deferred<Invoice[]>();
    const latest = deferred<Invoice[]>();
    const search = vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
    render(<InvoiceSearch accountId="001xx0000000001AAA" search={search} debounceMs={0} />);
    await act(() => vi.advanceTimersByTimeAsync(0));
    fireEvent.change(screen.getByLabelText('Search invoices'), { target: { value: 'new' } });
    await act(() => vi.advanceTimersByTimeAsync(0));

    await act(async () => latest.resolve([inv('NEW-1')]));
    await act(async () => old.resolve([inv('OLD-1')]));

    expect(screen.getByText(/NEW-1/)).toBeTruthy();
    expect(screen.queryByText(/OLD-1/)).toBeNull();
  });

  it('shows loading, then empty and error states', async () => {
    const search = vi.fn().mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('internal detail'));
    render(<InvoiceSearch accountId="001xx0000000001AAA" search={search} debounceMs={0} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByText('No invoices.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Search invoices'), { target: { value: 'x' } });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByRole('alert').textContent).toBe('Invoices could not be loaded.');
    expect(screen.getByRole('alert').textContent).not.toContain('internal detail');
  });
});
