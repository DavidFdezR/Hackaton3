/**
 * J-05 · c-calhk-case-details-renderer · A-317
 * Action output is shown as text; markup in the Subject never becomes a live element.
 */
import { createElement } from 'lwc';
import CalhkCaseDetailsRenderer from 'c/calhkCaseDetailsRenderer';

const { untrusted, MARKUP } = require('calhack/lib/cases');
const { flushPromises, activeMarkup } = require('calhack/lib/dom');

describe('J-05 c-calhk-case-details-renderer', () => {
    afterEach(() => {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
    });

    it.each([
        ['A-317 subject', untrusted('A-317')],
        ['img onerror', MARKUP.imgOnerror],
        ['script', MARKUP.scriptTag]
    ])('%s renders as literal text', async (_label, subject) => {
        const el = createElement('c-calhk-case-details-renderer', { is: CalhkCaseDetailsRenderer });
        el.value = { caseNumber: '00001001', subject, status: 'New' };
        document.body.appendChild(el);
        await flushPromises();

        expect(el.shadowRoot.querySelector('.subject').textContent).toBe(subject);
        expect(el.shadowRoot.querySelectorAll('a, img, script').length).toBe(0);
        expect(activeMarkup(el.shadowRoot)).toEqual([]);
    });
});
