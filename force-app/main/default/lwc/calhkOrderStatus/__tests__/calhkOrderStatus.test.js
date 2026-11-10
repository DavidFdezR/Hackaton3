/**
 * J-06 · c-calhk-order-status · A-309
 * postMessage must target the configured partner origin and carry order fields only.
 */
import { createElement } from 'lwc';
import CalhkOrderStatus from 'c/calhkOrderStatus';
import { getRecord } from 'lightning/uiRecordApi';
import { PARTNER_ORIGIN } from 'c/calhkAllowlist';

const { flushPromises } = require('calhack/lib/dom');

const ALLOWED_KEYS = ['type', 'orderNumber', 'status'];

describe('J-06 c-calhk-order-status', () => {
    let spy;
    beforeEach(() => {
        // jsdom: window.parent === window, so spy on that object.
        spy = jest.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    });
    afterEach(() => {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        spy.mockRestore();
    });

    it('posts order fields only, to the partner origin, never to *', async () => {
        const el = createElement('c-calhk-order-status', { is: CalhkOrderStatus });
        el.recordId = '801xx0000000001AAA';
        document.body.appendChild(el);
        getRecord.emit({
            apiName: 'Order',
            id: '801xx0000000001AAA',
            fields: { OrderNumber: { value: '00000100' }, Status: { value: 'Activated' } }
        });
        await flushPromises();

        expect(spy).toHaveBeenCalled();
        spy.mock.calls.forEach(([payload, targetOrigin]) => {
            expect(targetOrigin).not.toBe('*');
            expect(targetOrigin).toBe(PARTNER_ORIGIN);
            Object.keys(payload).forEach((k) => expect(ALLOWED_KEYS).toContain(k));
            expect(JSON.stringify(payload)).not.toMatch(/contact|email|phone/i);
        });
    });
});
