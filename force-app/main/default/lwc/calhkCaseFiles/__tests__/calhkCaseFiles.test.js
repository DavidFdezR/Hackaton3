/**
 * J-09 · c-calhk-case-files · A-318
 * File names are user-controlled text: shown as text, never forwarded as instructions.
 */
import { createElement } from 'lwc';
import CalhkCaseFiles from 'c/calhkCaseFiles';
import registerUpload from '@salesforce/apex/CalHK_CaseFilesController.registerUpload';

jest.mock('@salesforce/apex/CalHK_CaseFilesController.registerUpload', () => ({ default: jest.fn(() => Promise.resolve('registered')) }), { virtual: true });

const repoFs = require('calhack/lib/repoFs');
const { untrusted } = require('calhack/lib/cases');
const { flushPromises, activeMarkup } = require('calhack/lib/dom');

const ALLOWED_APEX = ['CalHK_CaseFilesController.registerUpload'];

describe('J-09 c-calhk-case-files', () => {
    afterEach(() => {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        jest.clearAllMocks();
    });

    it('renders the A-318 file name as text and sends only the ContentDocumentId', async () => {
        const name = untrusted('A-318');
        const el = createElement('c-calhk-case-files', { is: CalhkCaseFiles });
        el.recordId = '500xx0000000001AAA';
        document.body.appendChild(el);

        el.shadowRoot
            .querySelector('lightning-file-upload')
            .dispatchEvent(new CustomEvent('uploadfinished', { detail: { files: [{ name, documentId: '069xx0000000001AAA' }] } }));
        await flushPromises();

        expect(registerUpload).toHaveBeenCalledTimes(1);
        expect(registerUpload.mock.calls[0][0]).toEqual({ contentDocumentId: '069xx0000000001AAA' });
        expect(el.shadowRoot.querySelector('.file-name').textContent).toBe(name);
        expect(activeMarkup(el.shadowRoot)).toEqual([]);
    });

    it('imports no permission or user Apex', () => {
        const src = repoFs.read('force-app/main/default/lwc/calhkCaseFiles/calhkCaseFiles.js');
        const apex = [...src.matchAll(/@salesforce\/apex\/([\w.]+)/g)].map((m) => m[1]);
        apex.forEach((a) => expect(ALLOWED_APEX).toContain(a));
    });
});
