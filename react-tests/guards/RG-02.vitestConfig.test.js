/** RG-02 · vitest config · A-505, A-506 — setupFiles run before every test file. */
const assert = require('assert');
const { R, bundles, code, repoFs, codeHash } = require('./_util');

describe('RG-02 Vitest configuration', function () {
    const configs = () => bundles().flatMap((b) => ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mts', 'vite.config.ts'].map((f) => `${b}/${f}`)).filter((f) => repoFs.exists(f));

    it('loads only reviewed, unchanged setup files', function () {
        configs().forEach((f) => {
            const src = code(f);
            const m = src.match(/setupFiles\s*:\s*(\[[^\]]*\]|['"][^'"]+['"])/);
            const files = m ? [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]) : [];
            files.forEach((s) => {
                assert.ok(s in R.setupFiles, `${f}: unreviewed setup file ${s}`);
                const rel = `${f.split('/').slice(0, 5).join('/')}/${s.replace(/^\.\//, '')}`;
                if (R.setupFiles[s]) assert.strictEqual(codeHash(rel), R.setupFiles[s], `${rel} changed`);
                else assert.ok(!repoFs.exists(rel), `${rel} appeared without review`);
            });
        });
    });

    it('adds no globalSetup, custom environment or reporters', function () {
        configs().forEach((f) => {
            assert.ok(!/\b(globalSetup|environmentOptions|reporters|onConsoleLog|sequence)\s*:/.test(code(f)), f);
        });
    });

    it('does not narrow or soften the test run', function () {
        configs().forEach((f) => {
            const src = code(f);
            assert.ok(!/\b(exclude|passWithNoTests|bail|allowOnly|dangerouslyIgnoreUnhandledErrors)\s*:/.test(src.replace(/coverage\s*:\s*\{[\s\S]*?\n\s{6}\}/, '')), `${f} narrows the run`);
        });
        const vitest = bundles().map((b) => `${b}/vitest.config.ts`).filter((f) => repoFs.exists(f));
        vitest.forEach((f) => assert.match(code(f), /include\s*:\s*\[\s*'src\/\*\*\/\*\.test\.\{ts,tsx\}'\s*\]/, `${f}: test discovery changed`));
    });
});
