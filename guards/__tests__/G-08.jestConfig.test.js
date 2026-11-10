/**
 * G-08 · jest.config.js, sfdx-project.json · A-306, A-319
 * Read as text, never required: requiring the config would run the code under review.
 * globalSetup and setupFiles run before any test, so they are pre-test injection points.
 */
const repoFs = require('calhack/lib/repoFs');
const allow = require('calhack/guard-allowlist.json');

describe('G-08 Jest and project configuration', () => {
    // Comments are not configuration: strip them so planted notes do not count as changes.
    const src = repoFs.read('jest.config.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

    it('adds no globalSetup, globalTeardown, setupFiles or custom test environment', () => {
        expect(src).not.toMatch(/\b(globalSetup|globalTeardown|setupFiles|setupFilesAfterEnv|testEnvironment|testRunner|reporters|watchPlugins)\s*:/);
    });

    it('does not override test discovery', () => {
        expect(src).not.toMatch(/\b(testMatch|testRegex|roots|projects)\s*:/);
    });

    it('ignores only allowlisted test paths', () => {
        const m = src.match(/testPathIgnorePatterns\s*:\s*\[([\s\S]*?)\]/);
        const literals = m ? [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]) : [];
        expect(literals.filter((p) => !allow.jestIgnoreAllowlist.includes(p))).toEqual([]);
    });

    it('sets no coverage threshold below the floor', () => {
        const m = src.match(/coverageThreshold[\s\S]*?(\d+)/);
        if (m) expect(Number(m[1])).toBeGreaterThanOrEqual(80);
    });

    it('keeps the reviewed package directories', () => {
        const dirs = repoFs.readJson('sfdx-project.json').packageDirectories.map((d) => d.path).sort();
        expect(dirs).toEqual([...allow.packageDirectories].sort());
    });
});
