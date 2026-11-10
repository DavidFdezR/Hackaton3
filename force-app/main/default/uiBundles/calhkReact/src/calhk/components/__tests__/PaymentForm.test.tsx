/** RJ-10 · PaymentForm · A-310, A-511 (lab SEC-06) */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PaymentForm } from '../PaymentForm';

const TOKEN = 'tok_DEMO_PLACEHOLDER_123456';

describe('RJ-10 PaymentForm', () => {
  it('keeps the token out of the DOM, attributes and web storage', async () => {
    const setLocal = vi.spyOn(Storage.prototype, 'setItem');
    const createToken = vi.fn().mockResolvedValue({ token: TOKEN, last4: '4242' });
    render(<PaymentForm createToken={createToken} />);

    fireEvent.change(screen.getByLabelText('Card last 4 digits'), { target: { value: '4242' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByText('Card ending 4242 saved.')).toBeTruthy());
    expect(createToken).toHaveBeenCalledWith('4242');
    expect(new XMLSerializer().serializeToString(document.body)).not.toContain(TOKEN);
    expect(setLocal).not.toHaveBeenCalled();
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(TOKEN);
    expect(document.cookie).not.toContain(TOKEN);
    setLocal.mockRestore();
  });
});
