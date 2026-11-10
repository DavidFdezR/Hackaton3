/** AG-03 · LTS wrapper .app files · A-401 — testFiles decide what code runs in the org session. */
const assert = require('assert');
const { repoFs, allow } = require('./_util');

describe('AG-03 LTS wrapper apps', function () {
    const apps = repoFs.find(/^lts-tests\/.*\/aura\/[^/]+\/[^/]+\.app$/);

    it('finds the LTS wrapper apps', function () {
        assert.ok(apps.length >= 2, 'expected the Jasmine and Mocha wrapper apps');
    });

    it('load specs only from reviewed static resources', function () {
        apps.forEach((f) => {
            const src = repoFs.read(f);
            const m = src.match(/testFiles\s*=\s*"([^"]*)"/);
            assert.ok(m, `${f} has no testFiles`);
            const resources = [...m[1].matchAll(/\$Resource\.(\w+)/g)].map((r) => r[1]);
            assert.ok(resources.length > 0, `${f} references no $Resource`);
            assert.deepStrictEqual(resources.filter((r) => !allow.ltsSpecResources.includes(r)), [], f);
            assert.ok(!/https?:\/\//i.test(m[1]), `${f} loads specs from a URL`);
        });
    });

    it('add no ltng:require, script tags or outside URLs', function () {
        apps.forEach((f) => {
            const src = repoFs.read(f).replace(/<!--[\s\S]*?-->/g, '');
            assert.ok(!/ltng:require|<script/i.test(src), `${f} loads extra script`);
            assert.ok(!/https?:\/\//i.test(src), `${f} references an outside URL`);
        });
    });
});
