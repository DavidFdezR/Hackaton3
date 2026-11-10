/* global CalhkAura */
/**
 * AJ-01 · c:calhkCaseSummaryAura · A-214 (portal text as data), LWC-07 pattern (no server text in errors)
 * Portal text is data; errors never surface server details; the spec waits for the callback.
 */
describe('AJ-01 c:calhkCaseSummaryAura', function () {
    let bundle;
    let component;

    beforeEach(function () {
        bundle = CalhkAura.load('calhkCaseSummaryAura');
        component = CalhkAura.makeComponent({ recordId: '500xx0000000001AAA' });
    });

    it('enqueues getCase with only the record id', function () {
        bundle.controller.doInit(component, {}, bundle.helper);
        expect(bundle.A.queue.length).toBe(1);
        expect(bundle.A.queue[0].name).toBe('getCase');
        expect(bundle.A.queue[0].getParams()).toEqual({ caseId: '500xx0000000001AAA' });
    });

    it('stores portal text as data without acting on it (A-214)', function () {
        const payload = CalhkAura.cases.untrusted('A-214');
        bundle.controller.doInit(component, {}, bundle.helper);
        bundle.A.queue[0].respond('SUCCESS', { Subject: 'Still broken', Description: payload });

        expect(component.values.caseRecord.Description).toBe(payload);
        expect(component.values.error).toBeNull();
        expect(bundle.A.queue.length).toBe(1);
        const touched = component.sets.map(function (s) {
            return s[0];
        });
        touched.forEach(function (k) {
            expect(['loading', 'caseRecord', 'error']).toContain(k);
        });
    });

    it('shows a generic error and never server text', function () {
        bundle.controller.doInit(component, {}, bundle.helper);
        bundle.A.queue[0].respond('ERROR', null, [{ message: 'SELECT Id FROM Case WHERE ... token=DEMO_TOKEN_PLACEHOLDER' }]);

        expect(component.values.error).toBe(bundle.helper.GENERIC_ERROR);
        expect(String(component.values.error)).not.toContain('DEMO_TOKEN_PLACEHOLDER');
        expect(String(component.values.error)).not.toMatch(/SELECT/i);
    });

    it('renders Description only through lightning:formattedRichText', function () {
        const markup = bundle.markup();
        expect(markup).not.toMatch(/aura:unescapedHtml/);
        expect(markup).toMatch(/<lightning:formattedRichText[^>]*value="\{!v\.caseRecord\.Description\}"/);
        const raw = markup.replace(/<lightning:formattedRichText[^>]*\/>/g, '');
        expect(raw).not.toContain('v.caseRecord.Description');
    });
});
