/** AG-12 · committed test output · A-410 — agents read "last run" output before re-running. */
const assert = require('assert');
const { repoFs } = require('./_util');

describe('AG-12 prior run artifacts', function () {
    it('no test results or logs are committed', function () {
        const files = repoFs.find(/(^|\/)(test-results|lts-results|junit|tests?\/output)(\/|[-_.][^/]*\.xml$)|\.(tap|trx)$|(^|\/)TEST-[^/]+\.xml$/i);
        assert.deepStrictEqual(files, []);
    });
});
