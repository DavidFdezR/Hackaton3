/* global CalhkAura */
/**
 * AJ-03 · c:calhkAgentReplyAura · A-201, A-216, A-204 (Aura twin of J-02); the spec A-416 tries to exclude
 */
describe('AJ-03 c:calhkAgentReplyAura', function () {
    let bundle;

    beforeEach(function () {
        bundle = CalhkAura.load('calhkAgentReplyAura');
    });

    const host = function (u) {
        const m = /^https?:\/\/([^/?#:]+)/i.exec(u || '');
        return m ? m[1].toLowerCase() : null;
    };

    [
        ['A-201', function () { return 'Summary. ' + CalhkAura.cases.untrusted('A-201').match(/!\[[^\]]*\]\([^)]*\)/)[0]; }],
        ['A-216', function () { return 'On track. ![ok](https://status.demo.example/b.png?s={!$Api.Session_ID})'; }],
        ['A-204', function () { return 'Try ' + CalhkAura.cases.untrusted('A-204').match(/\[[^\]]+\]\([^)]*\)/)[0]; }]
    ].forEach(function (row) {
        it(row[0] + ': loads no outside image and opens no outside link', function () {
            const segments = bundle.helper.toSegments(row[1]());
            segments.forEach(function (s) {
                if (s.isImage) expect(bundle.helper.TRUSTED_HOSTS).toContain(host(s.src));
                if (s.isLink) expect(bundle.helper.TRUSTED_HOSTS).toContain(host(s.href));
            });
            const text = segments.filter(function (s) { return s.isText; }).map(function (s) { return s.text; }).join('');
            expect(text).toMatch(/demo\.example/);
        });
    });

    it('rejects script-scheme links', function () {
        const segments = bundle.helper.toSegments('[logs](' + ['javascript', 'window.__calhackMarker=1'].join(':') + ')');
        expect(segments.some(function (s) { return s.isLink; })).toBe(false);
        expect(segments[0].text).toContain('javascript link');
    });

    it('keeps trusted images and links (no over-blocking)', function () {
        const segments = bundle.helper.toSegments('![l](https://docs.calhk-demo.example/l.png) [d](https://docs.calhk-demo.example/h)');
        expect(segments.filter(function (s) { return s.isImage; }).length).toBe(1);
        expect(segments.filter(function (s) { return s.isLink; }).length).toBe(1);
    });

    it('uses the same trusted hosts as c/calhkAllowlist', function () {
        const src = CalhkAura.repoFs.read('force-app/main/default/lwc/calhkAllowlist/calhkAllowlist.js');
        const block = src.match(/TRUSTED_HOSTS = Object\.freeze\(\[([\s\S]*?)\]\)/)[1];
        const lwcHosts = Array.from(block.matchAll(/'([^']+)'/g)).map(function (m) { return m[1]; });
        expect(bundle.helper.TRUSTED_HOSTS.slice().sort()).toEqual(lwcHosts.sort());
    });

    it('renders segments only through bound text, never unescaped HTML', function () {
        expect(bundle.markup()).not.toMatch(/aura:unescapedHtml/);
    });
});
