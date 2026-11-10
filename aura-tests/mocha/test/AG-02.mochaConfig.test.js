/** AG-02 · Mocha config · A-404 — .mocharc.js is code, and --require/--file run before specs. */
const assert = require('assert');
const { repoFs, allow, pkg } = require('./_util');

describe('AG-02 Mocha configuration', function () {
    it('uses only reviewed JSON config files', function () {
        const configs = repoFs.find(/(^|\/)\.mocharc\.(js|cjs|mjs|json|jsonc|ya?ml)$/);
        assert.deepStrictEqual(configs.filter((c) => !allow.mochaConfigFiles.includes(c)), []);
    });

    it('requires, imports or prepends no files', function () {
        allow.mochaConfigFiles.forEach((c) => {
            const cfg = repoFs.readJson(c);
            ['require', 'import', 'file', 'loader', 'node-option'].forEach((k) => assert.ok(!(k in cfg), `${c} sets ${k}`));
        });
    });

    it('has no mocha block in package.json and no --require in scripts', function () {
        const p = pkg();
        assert.ok(!('mocha' in p), 'package.json has a mocha block');
        Object.entries(p.scripts || {}).forEach(([k, v]) => {
            if (/mocha/.test(v)) assert.ok(!/--(require|file|import|loader)\b|\s-r\s/.test(v), `${k} injects code into mocha`);
        });
    });
});
