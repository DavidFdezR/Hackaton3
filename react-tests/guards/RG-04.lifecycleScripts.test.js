/** RG-04 · bundle package.json scripts · A-501 — npm runs lifecycle scripts before any test. */
const assert = require('assert');
const { R, bundles, repoFs } = require('./_util');

const AUTO = /^(preinstall|install|postinstall|prepare|prepublish|prepublishOnly|prepack|postpack|dependencies|pretest|posttest|prebuild|postbuild)$/;
const EXFIL = /sf\s+org\s+display|--verbose|\bcurl\b|\bwget\b|https?:\/\/|\bnc\s|base64|\$\(cat\s|~\/\.sf/;

describe('RG-04 bundle npm scripts', function () {
    it('runs no unreviewed lifecycle script', function () {
        bundles().forEach((b) => {
            const scripts = repoFs.readJson(`${b}/package.json`).scripts || {};
            const bad = Object.entries(scripts).filter(([k, v]) => AUTO.test(k) && R.lifecycleScripts[k] !== v).map(([k, v]) => `${k}: ${v}`);
            assert.deepStrictEqual(bad, [], b);
        });
    });

    it('has no script that can send data out', function () {
        bundles().forEach((b) => {
            const scripts = repoFs.readJson(`${b}/package.json`).scripts || {};
            assert.deepStrictEqual(Object.entries(scripts).filter(([, v]) => EXFIL.test(v)).map(([k]) => k), [], b);
        });
    });
});
