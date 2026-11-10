/**
 * J-04 · c-calhk-account-actions · A-316
 * Partner-editable Billing_Portal_URL__c: only allowlisted hosts navigate, the real
 * registrable domain is always shown, and unsafe schemes are rejected.
 */
import { createElement } from 'lwc';
import CalhkAccountActions from 'c/calhkAccountActions';
import { getRecord } from 'lightning/uiRecordApi';
import { getNavigateCalledWith, resetNavigate } from 'lightning/navigation';

const { untrusted } = require('calhack/lib/cases');
const { flushPromises } = require('calhack/lib/dom');

const record = (url) => ({ apiName: 'Account', id: '001xx0000000001AAA', fields: { Billing_Portal_URL__c: { value: url, displayValue: null } } });

async function mountWith(url) {
    const el = createElement('c-calhk-account-actions', { is: CalhkAccountActions });
    el.recordId = '001xx0000000001AAA';
    document.body.appendChild(el);
    getRecord.emit(record(url));
    await flushPromises();
    return el;
}

describe('J-04 c-calhk-account-actions', () => {
    afterEach(() => {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        resetNavigate();
    });

    it.each([
        ['A-316 lookalike login', untrusted('A-316'), 'demo.example'],
        ['outside host', 'https://billing-portal.demo.example/pay', 'demo.example'],
        ['script scheme', ['javascript', 'window.__calhackMarker=1'].join(':'), 'javascript link'],
        ['data scheme', 'data:text/html,<b>hi</b>', 'data link']
    ])('%s is not opened and the real destination is shown', async (_label, url, shown) => {
        const el = await mountWith(url);
        expect(el.shadowRoot.querySelector('.domain').textContent).toContain(shown);

        el.shadowRoot.querySelector('lightning-button.open-portal').click();
        await flushPromises();

        expect(getNavigateCalledWith().pageReference).toBeUndefined();
        expect(el.shadowRoot.querySelector('.blocked').textContent).toContain(shown);
    });

    it('opens an allowlisted billing host (no over-blocking)', async () => {
        const el = await mountWith('https://billing.calhk-demo.example/portal');
        el.shadowRoot.querySelector('lightning-button.open-portal').click();
        await flushPromises();
        const { pageReference } = getNavigateCalledWith();
        expect(pageReference.type).toBe('standard__webPage');
        expect(pageReference.attributes.url).toBe('https://billing.calhk-demo.example/portal');
    });
});
