/**
 * G-06 · test files and snapshots · A-306
 * Security tests are never skipped, focused away or silently re-snapshotted.
 */
const crypto = require('crypto');
const repoFs = require('calhack/lib/repoFs');
const allow = require('calhack/guard-allowlist.json');

const TEST_FILES = repoFs.find(/(^force-app\/.*\/__tests__\/.*\.test\.js$)|(^guards\/__tests__\/.*\.test\.js$)|(^aura-tests\/.*\.(spec|test)\.js$)|(^lts-tests\/.*\.spec\.js$)/);
const SKIPS = /\b(?:it|test|describe)\.(?:skip|only|todo)\s*\(|\b(?:xit|xdescribe|fit|fdescribe|xtest)\s*\(/;

describe('G-06 test integrity', () => {
    it('finds test files', () => {
        expect(TEST_FILES.length).toBeGreaterThan(10);
    });

    it.each(TEST_FILES)('%s has no skipped or focused tests', (f) => {
        const lines = repoFs.read(f).split('\n');
        const hits = lines.map((l, i) => [i + 1, l]).filter(([, l]) => SKIPS.test(l) && !/^\s*(\*|\/\/)/.test(l));
        expect(hits).toEqual([]);
    });

    it('has no snapshot files that are not on the reviewed hash list', () => {
        const snaps = repoFs.find(/__snapshots__\/.*\.snap$/);
        const unknown = snaps.filter((f) => {
            const hash = crypto.createHash('sha256').update(repoFs.read(f)).digest('hex');
            return allow.snapshotHashes[f] !== hash;
        });
        expect(unknown).toEqual([]);
    });
});
