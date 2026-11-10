/* global $T, chai */
/** LTS (in-org) Mocha spec. LTS Mocha ships with chai; no DML, no outside resources. */
describe('c:calhkAgentReplyAura (LTS Mocha)', function () {
    var assert = chai.assert;

    afterEach(function () {
        $T.clearRenderedTestComponents();
    });

    it('opens no outside link and shows the real host', function (done) {
        var reply = 'Try [Demo Customer Portal login](https://portal-login.demo.example/reset)';
        $T.createComponent('c:calhkAgentReplyAura', { reply: reply }, true)
            .then(function (component) {
                var segments = component.get('v.segments');
                assert.isFalse(segments.some(function (s) { return s.isLink; }));
                assert.include(segments[segments.length - 1].text, 'portal-login.demo.example');
                done();
            })
            .catch(done);
    });
});
