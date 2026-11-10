/** RG-09 · committed build output · A-504 (lab OPS-10) — source maps and stale bundles leak or mislead. */
const assert = require('assert');
const { tracked } = require('./_util');

describe('RG-09 build output', function () {
    it('no dist folder, source map or coverage report is committed', function () {
        const bad = tracked().filter((f) => /^force-app\/main\/default\/uiBundles\/[^/]+\/(dist|coverage|playwright-report|test-results)\//.test(f) || /\.map$/.test(f));
        assert.deepStrictEqual(bad, []);
    });
});
