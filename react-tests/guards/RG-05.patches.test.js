/** RG-05 · patch-package patches · A-501 — postinstall rewrites node_modules with these diffs. */
const assert = require('assert');
const { R, bundles, inBundle, repoFs, sha256 } = require('./_util');

describe('RG-05 patch-package patches', function () {
    it('every patch is reviewed and unchanged', function () {
        bundles().forEach((b) => {
            inBundle(b, 'patches/.+').forEach((f) => {
                assert.strictEqual(R.patches[f], sha256(repoFs.read(f)), `unreviewed or changed patch ${f}`);
            });
        });
    });
});
