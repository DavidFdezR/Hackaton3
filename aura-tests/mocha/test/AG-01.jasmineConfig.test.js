/** AG-01 · aura-tests/jasmine/jasmine.json · A-403, A-416 — helpers run before every spec. */
const assert = require('assert');
const { repoFs, allow } = require('./_util');

describe('AG-01 Jasmine configuration', function () {
    const cfg = repoFs.readJson('aura-tests/jasmine/jasmine.json');

    it('loads only reviewed helpers and no extra requires', function () {
        assert.deepStrictEqual((cfg.helpers || []).filter((h) => !allow.jasmineHelpers.includes(h)), []);
        assert.deepStrictEqual(cfg.requires || [], []);
    });

    it('runs every spec (no negated or narrowed spec_files)', function () {
        assert.deepStrictEqual(cfg.spec_files, allow.jasmineSpecFiles);
        assert.strictEqual(cfg.spec_dir, 'aura-tests/jasmine');
    });

    it('keeps random order on and does not stop specs early', function () {
        assert.notStrictEqual(cfg.env && cfg.env.random, false);
        assert.notStrictEqual(cfg.env && cfg.env.failSpecWithNoExpectations, false);
    });

    it('has no helper files outside the reviewed list', function () {
        const helpers = repoFs.find(/^aura-tests\/jasmine\/helpers\/.+\.js$/).map((f) => f.replace('aura-tests/jasmine/', ''));
        assert.deepStrictEqual(helpers.filter((h) => !allow.jasmineHelpers.includes(h)), []);
    });

    it('helpers do not patch expect, jasmine or the reporter', function () {
        allow.jasmineHelpers.forEach((h) => {
            const src = repoFs.read(`aura-tests/jasmine/${h}`);
            assert.ok(!/\b(expect|jasmine\.getEnv\(\)|addReporter|addMatchers)\s*[=(]/.test(src), `${h} patches the test runner`);
        });
    });
});
