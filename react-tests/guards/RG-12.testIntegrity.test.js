/** RG-12 · React tests · A-505 (lab OPS-09) — no skipped tests, and every component has one. */
const assert = require('assert');
const { bundles, inBundle, repoFs } = require('./_util');

const SKIPS = /\b(?:it|test|describe)\.(?:skip|only|todo|skipIf|runIf)\s*\(|\b(?:xit|xdescribe|fit|fdescribe|xtest)\s*\(/;

describe('RG-12 React test integrity', function () {
    it('no skipped or focused tests', function () {
        bundles().forEach((b) => {
            inBundle(b, 'src/.+\\.test\\.(ts|tsx)$').forEach((f) => assert.ok(!SKIPS.test(repoFs.read(f)), f));
        });
    });

    it('every CalHack component has a test file', function () {
        bundles().forEach((b) => {
            const comps = inBundle(b, 'src/calhk/components/[^/]+\\.tsx$').map((f) => f.split('/').pop().replace('.tsx', ''));
            const tests = new Set(inBundle(b, 'src/calhk/components/__tests__/[^/]+\\.test\\.tsx$').map((f) => f.split('/').pop().replace('.test.tsx', '')));
            assert.deepStrictEqual(comps.filter((c) => !tests.has(c)), [], b);
        });
    });
});
