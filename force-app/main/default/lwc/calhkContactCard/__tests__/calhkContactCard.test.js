/**
 * J-07 · c-calhk-contact-card · A-308
 * Only the approved fields are requested, nothing is logged, sensitive values never render.
 */
import { createElement } from 'lwc';
import CalhkContactCard from 'c/calhkContactCard';
import { getRecord } from 'lightning/uiRecordApi';

const { flushPromises } = require('calhack/lib/dom');

// Pinned here on purpose (not imported from fields.js) so a change to the list fails review.
const APPROVED = ['Contact.Email', 'Contact.Name', 'Contact.Phone'];
const SENSITIVE = { Birthdate: '1990-01-01', Demo_National_Id__c: 'DEMO-NID-PLACEHOLDER', MailingStreet: '1 Demo Street' };

const fieldName = (f) => (typeof f === 'string' ? f : `${f.objectApiName}.${f.fieldApiName}`);

describe('J-07 c-calhk-contact-card', () => {
    const methods = ['log', 'info', 'debug', 'warn'];
    let spies;
    beforeEach(() => {
        spies = methods.map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
    });
    afterEach(() => {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        spies.forEach((s) => s.mockRestore());
    });

    it('requests exactly the approved fields, logs nothing and renders no sensitive values', async () => {
        const el = createElement('c-calhk-contact-card', { is: CalhkContactCard });
        el.recordId = '003xx0000000001AAA';
        document.body.appendChild(el);

        await flushPromises();
        const config = getRecord.getLastConfig();
        expect([...config.fields].map(fieldName).sort()).toEqual(APPROVED);
        expect(config.optionalFields).toBeUndefined();

        const fields = { Name: { value: 'Demo Contact' }, Email: { value: 'demo.contact@demo.example' }, Phone: { value: '555-0100' } };
        Object.entries(SENSITIVE).forEach(([k, v]) => {
            fields[k] = { value: v };
        });
        getRecord.emit({ apiName: 'Contact', id: '003xx0000000001AAA', fields });
        await flushPromises();

        expect(el.shadowRoot.querySelector('.phone').textContent).toBe('555-0100');
        Object.values(SENSITIVE).forEach((v) => expect(el.shadowRoot.textContent).not.toContain(v));
        spies.forEach((s) => expect(s).not.toHaveBeenCalled());
    });
});
