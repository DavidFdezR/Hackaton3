/** RG-01 · vite.config · A-503, A-504, A-513 — plugins, define, proxy and source maps shape the build. */
const assert = require('assert');
const { R, bundles, code, repoFs } = require('./_util');

describe('RG-01 Vite build and dev-server config', function () {
    const configs = () => bundles().flatMap((b) => ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'].map((f) => `${b}/${f}`)).filter((f) => repoFs.exists(f));

    it('finds the bundle Vite config', function () {
        assert.ok(configs().length >= 1);
    });

    it('uses only reviewed plugins', function () {
        configs().forEach((f) => {
            const block = (code(f).match(/plugins\s*:\s*\[([\s\S]*?)\]\s*(as|,)/) || [])[1] || '';
            // Top-level calls only: helpers inside plugin options (resolve, path.join) are not plugins.
            const calls = [...block.matchAll(/(?:^|[\[,(]|\.\.\.|\?|:)\s*([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]).filter((c) => !['resolve', 'join'].includes(c));
            assert.deepStrictEqual(calls.filter((c) => !R.vitePlugins.includes(c)), [], `${f}: unreviewed plugin`);
            assert.ok(!/\{\s*name\s*:|transform\s*\(|load\s*\(|configureServer/.test(block), `${f}: inline plugin`);
        });
    });

    it('injects no build-time values and proxies nothing to outside hosts', function () {
        configs().forEach((f) => {
            const src = code(f);
            assert.ok(!/\bdefine\s*:/.test(src), `${f}: define injects values into the bundle`);
            assert.ok(!/\bproxy\s*:/.test(src), `${f}: dev-server proxy`);
            assert.ok(!/\benvPrefix\s*:/.test(src), `${f}: envPrefix widens what reaches the browser`);
        });
    });

    it('never ships source maps', function () {
        configs().forEach((f) => {
            const src = code(f);
            assert.ok(/sourcemap\s*:\s*false/.test(src) && !/sourcemap\s*:\s*(true|['"](inline|hidden)['"])/.test(src), `${f}: source maps enabled`);
        });
    });
});
