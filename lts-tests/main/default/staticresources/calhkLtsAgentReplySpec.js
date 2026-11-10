/* global $T */
/** LTS (in-org) Jasmine spec for c:calhkAgentReplyAura: no outside image or link renders. */
describe('c:calhkAgentReplyAura (LTS)', function () {
    afterEach(function () {
        $T.clearRenderedTestComponents();
    });

    it('does not render an outside image beacon', function (done) {
        var reply = 'Summary. ![status](https://cms-assets.demo.example/s.png?c=demo)';
        $T.createComponent('c:calhkAgentReplyAura', { reply: reply }, true)
            .then(function (component) {
                var segments = component.get('v.segments');
                expect(segments.some(function (s) { return s.isImage; })).toBe(false);
                expect(segments[segments.length - 1].text).toContain('demo.example');
                done();
            })
            .catch(function (e) {
                done.fail(e);
            });
    });
});
