/**
 * J-01 · c-calhk-case-notes · A-302, A-214
 * Notes__c is portal-editable. It must reach lightning-formatted-rich-text as a value
 * and never be written into the DOM by component code.
 */
import { createElement } from 'lwc';
import CalhkCaseNotes from 'c/calhkCaseNotes';
import { getRecord } from 'lightning/uiRecordApi';

const { untrusted, MARKUP } = require('calhack/lib/cases');
const { flushPromises, activeMarkup } = require('calhack/lib/dom');

const PAYLOADS = [
    ['A-302 comment', untrusted('A-302')],
    ['A-214 comment', untrusted('A-214')],
    ['A-313 hidden span', untrusted('A-313')],
    ['img onerror', MARKUP.imgOnerror],
    ['script tag', MARKUP.scriptTag],
    ['script-scheme link', MARKUP.jsLink],
    ['hidden span', MARKUP.hiddenSpan]
];

const record = (value) => ({
    apiName: 'Case',
    id: '500xx0000000001AAA',
    fields: { Notes__c: { value, displayValue: null } }
});

function mount() {
    const el = createElement('c-calhk-case-notes', { is: CalhkCaseNotes });
    el.recordId = '500xx0000000001AAA';
    document.body.appendChild(el);
    return el;
}

describe('J-01 c-calhk-case-notes', () => {
    afterEach(() => {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        delete window.__calhackMarker;
        jest.clearAllMocks();
    });

    it.each(PAYLOADS)('passes %s to lightning-formatted-rich-text and renders no active markup', async (_label, payload) => {
        const el = mount();
        getRecord.emit(record(payload));
        await flushPromises();

        const rich = el.shadowRoot.querySelector('lightning-formatted-rich-text');
        expect(rich).not.toBeNull();
        expect(rich.value).toBe(payload);
        expect(activeMarkup(el.shadowRoot)).toEqual([]);
        expect(el.shadowRoot.querySelectorAll('img, a').length).toBe(0);
        expect(window.__calhackMarker).toBeUndefined();
    });

    it('shows a generic error when the record cannot load', async () => {
        const el = mount();
        getRecord.error({ body: { message: 'SELECT Id FROM Case WHERE ... token=DEMO_TOKEN_PLACEHOLDER' } });
        await flushPromises();
        const error = el.shadowRoot.querySelector('.error');
        expect(error.textContent).toBe('Notes could not be loaded.');
        expect(el.shadowRoot.textContent).not.toContain('DEMO_TOKEN_PLACEHOLDER');
    });
});
