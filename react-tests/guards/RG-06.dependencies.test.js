/** RG-06 · dependencies, overrides and lockfile · A-507, A-514 (lab SEC-10, OPS-08). */
const assert = require('assert');
const { R, bundles, repoFs } = require('./_util');

const BAD_SPEC = /^(git\+|git:|github:|https?:|file:|link:|npm:|workspace:)|^(latest|\*|x)$|\.tgz$/i;

describe('RG-06 dependencies', function () {
    it('declares registry versions only (no URLs, aliases, tarballs or latest)', function () {
        bundles().forEach((b) => {
            const p = repoFs.readJson(`${b}/package.json`);
            const specs = { ...(p.dependencies || {}), ...(p.devDependencies || {}) };
            assert.deepStrictEqual(Object.entries(specs).filter(([, v]) => BAD_SPEC.test(String(v))).map(([k, v]) => `${k}@${v}`), [], b);
        });
    });

    it('uses only the reviewed Salesforce packages (no lookalikes)', function () {
        bundles().forEach((b) => {
            const p = repoFs.readJson(`${b}/package.json`);
            const names = Object.keys({ ...(p.dependencies || {}), ...(p.devDependencies || {}) });
            const sfLike = names.filter((n) => /salesforce|sfdc|force-?com/i.test(n));
            assert.deepStrictEqual(sfLike.filter((n) => !R.salesforcePackages.includes(n)), [], b);
        });
    });

    it('overrides only reviewed packages, with plain versions', function () {
        bundles().forEach((b) => {
            const o = repoFs.readJson(`${b}/package.json`).overrides || {};
            Object.entries(o).forEach(([k, v]) => {
                assert.ok(R.overrides.includes(k), `${b}: unreviewed override ${k}`);
                assert.ok(!BAD_SPEC.test(String(v)), `${b}: override ${k} -> ${v}`);
            });
        });
    });

    it('commits a lockfile that resolves only from the public registry', function () {
        bundles().forEach((b) => {
            assert.ok(repoFs.exists(`${b}/package-lock.json`), `${b}: no package-lock.json`);
            const lock = repoFs.readJson(`${b}/package-lock.json`);
            const off = Object.entries(lock.packages || {}).filter(([, v]) => v.resolved && !v.resolved.startsWith('https://registry.npmjs.org/')).map(([k]) => k);
            assert.deepStrictEqual(off, [], b);
        });
    });
});
