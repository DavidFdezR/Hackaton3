/** AG-09 · .npmrc and Node options · A-413 — decide which code npm ci and node load. */
const assert = require('assert');
const { repoFs } = require('./_util');

const SAFE_NPMRC = /^(registry=https:\/\/registry\.npmjs\.org\/?|engine-strict=(true|false)|save-exact=(true|false)|fund=false|audit=(true|false)|ignore-scripts=true)$/;

describe('AG-09 npm registry and Node options', function () {
    it('.npmrc uses the public registry and only safe keys', function () {
        repoFs.find(/(^|\/)\.npmrc$/).forEach((f) => {
            const lines = repoFs.read(f).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith(';'));
            assert.deepStrictEqual(lines.filter((l) => !SAFE_NPMRC.test(l)), [], f);
        });
    });

    it('no env file injects code into node', function () {
        repoFs.find(/(^|\/)\.env(\.[\w-]+)?$/).forEach((f) => {
            assert.ok(!/NODE_OPTIONS\s*=.*--(require|import|loader|experimental-loader)|^\s*-r\s/m.test(repoFs.read(f)), f);
        });
    });
});
