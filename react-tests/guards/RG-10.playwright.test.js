/** RG-10 · playwright.config — its webServer and globalSetup run before any e2e test. */
const assert = require('assert');
const { R, bundles, code, repoFs } = require('./_util');

describe('RG-10 Playwright configuration', function () {
    const configs = () => bundles().map((b) => `${b}/playwright.config.ts`).filter((f) => repoFs.exists(f));

    it('has no globalSetup, global teardown or saved login state', function () {
        configs().forEach((f) => assert.ok(!/\b(globalSetup|globalTeardown|storageState)\s*:/.test(code(f)), f));
    });

    it('serves the local build and targets only localhost', function () {
        configs().forEach((f) => {
            const src = code(f);
            const cmd = (src.match(/command\s*:\s*`([^`]*)`/) || src.match(/command\s*:\s*'([^']*)'/) || [])[1];
            assert.strictEqual(cmd, R.playwrightWebServer, `${f}: webServer command changed`);
            const hosts = [...src.matchAll(/(?:https?|wss?):\/\/([^/:`'"$]+)/g)].map((m) => m[1]);
            assert.deepStrictEqual(hosts.filter((h) => !R.trustedHosts.includes(h)), [], f);
            assert.ok(!/connectOptions|wsEndpoint/.test(src), `${f}: remote browser`);
        });
    });
});
