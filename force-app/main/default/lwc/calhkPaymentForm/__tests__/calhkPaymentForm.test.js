/**
 * J-10 · c-calhk-payment-form · A-310
 * Keeps shadow DOM and never exposes the payment token on the host or in the DOM.
 */
import { createElement } from 'lwc';
import CalhkPaymentForm from 'c/calhkPaymentForm';
import createPaymentToken from '@salesforce/apex/CalHK_PaymentController.createPaymentToken';

jest.mock(
    '@salesforce/apex/CalHK_PaymentController.createPaymentToken',
    () => ({ default: jest.fn(() => Promise.resolve({ token: 'tok_DEMO_PLACEHOLDER_123456', last4: '4242' })) }),
    { virtual: true }
);

const { flushPromises } = require('calhack/lib/dom');
const TOKEN = 'tok_DEMO_PLACEHOLDER_123456';

describe('J-10 c-calhk-payment-form', () => {
    afterEach(() => {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        jest.clearAllMocks();
    });

    it('is not a light DOM component', () => {
        expect(CalhkPaymentForm.renderMode).not.toBe('light');
    });

    it('keeps the token off the host element and out of the page', async () => {
        const el = createElement('c-calhk-payment-form', { is: CalhkPaymentForm });
        document.body.appendChild(el);
        expect(el.shadowRoot).not.toBeNull();

        el.shadowRoot.querySelector('lightning-input.last4').dispatchEvent(new CustomEvent('change', { detail: { value: '4242' } }));
        el.shadowRoot.querySelector('lightning-button.save').click();
        await flushPromises();

        expect(createPaymentToken).toHaveBeenCalledWith({ last4: '4242' });
        expect(el.shadowRoot.querySelector('.saved').textContent).toContain('4242');
        Array.from(el.attributes).forEach((a) => expect(a.value).not.toContain(TOKEN));
        Object.values(el.dataset).forEach((v) => expect(v).not.toContain(TOKEN));
        expect(new XMLSerializer().serializeToString(document.body)).not.toContain(TOKEN);
        expect(el.shadowRoot.textContent).not.toContain(TOKEN);
    });
});
