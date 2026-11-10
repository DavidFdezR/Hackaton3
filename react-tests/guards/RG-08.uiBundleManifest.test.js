/** RG-08 · ui-bundle.json and .uibundle-meta.xml — how the org serves the app. */
const assert = require('assert');
const { R, bundles, repoFs } = require('./_util');

describe('RG-08 UI bundle manifest', function () {
    it('every UI bundle is on the reviewed list', function () {
        assert.deepStrictEqual(bundles().filter((b) => !R.bundles.includes(b)), []);
    });

    it('ui-bundle.json serves dist with an in-app fallback only', function () {
        bundles().forEach((b) => {
            const m = repoFs.readJson(`${b}/ui-bundle.json`);
            assert.deepStrictEqual(Object.keys(m).filter((k) => !R.uiBundleJsonKeys.includes(k)), [], b);
            assert.strictEqual(m.outputDir, 'dist');
            assert.ok(!/^https?:|\.\./.test((m.routing && m.routing.fallback) || ''), `${b}: fallback leaves the app`);
        });
    });

    it('metadata names the bundle and mentions no outside host', function () {
        bundles().forEach((b) => {
            const name = b.split('/').pop();
            const xml = repoFs.read(`${b}/${name}.uibundle-meta.xml`);
            assert.match(xml, /<masterLabel>[^<]+<\/masterLabel>/);
            assert.ok(!/https?:\/\//.test(xml.replace(/xmlns(:\w+)?="[^"]*"/g, '')), `${b}: URL in bundle metadata`);
        });
    });
});
