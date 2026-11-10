/**
 * J-08 · c-calhk-pricing · A-305
 * The rate comes from Apex (Named Credential path). No browser fetch, no key in the bundle.
 */
import { createElement } from 'lwc';
import CalhkPricing from 'c/calhkPricing';
import getRate from '@salesforce/apex/CalHK_FxRateService.getRate';

jest.mock('@salesforce/apex/CalHK_FxRateService.getRate', () => ({ default: jest.fn(() => Promise.resolve(0.9)) }), { virtual: true });

const repoFs = require('calhack/lib/repoFs');
const { flushPromises } = require('calhack/lib/dom');

const KEY_PATTERNS = [/x-api-key/i, /api[_-]?key\s*[:=]/i, /\b(?:sk|pk|demo)_live_[A-Za-z0-9]+/, /Bearer\s+[A-Za-z0-9._-]{12,}/];

describe('J-08 c-calhk-pricing', () => {
    afterEach(() => {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        jest.clearAllMocks();
        delete global.fetch;
    });

    it('converts through Apex only', async () => {
        global.fetch = jest.fn(() => Promise.reject(new Error('fetch must not be used')));
        const el = createElement('c-calhk-pricing', { is: CalhkPricing });
        document.body.appendChild(el);

        el.shadowRoot.querySelector('lightning-input.amount').dispatchEvent(new CustomEvent('change', { detail: { value: '100' } }));
        el.shadowRoot.querySelector('lightning-button.convert').click();
        await flushPromises();

        expect(global.fetch).not.toHaveBeenCalled();
        expect(getRate).toHaveBeenCalledTimes(1);
        expect(getRate).toHaveBeenCalledWith({ currencyCode: 'EUR' });
        expect(el.shadowRoot.querySelector('.converted').textContent).toBe('90.00');
    });

    it('bundle contains no API key or bearer token', () => {
        const files = repoFs.find(/^force-app\/main\/default\/lwc\/calhkPricing\/[^/]+\.(js|html)$/);
        expect(files.length).toBeGreaterThan(0);
        files.forEach((f) => {
            const src = repoFs.read(f);
            KEY_PATTERNS.forEach((p) => expect({ file: f, match: (src.match(p) || [null])[0] }).toEqual({ file: f, match: null }));
        });
    });
});
