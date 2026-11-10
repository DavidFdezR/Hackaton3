/** AG-13 · LTS run --configfile · A-417 — the WebDriver browser opens the org already logged in. */
const assert = require('assert');
const { repoFs, automationText } = require('./_util');

const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/;

describe('AG-13 LTS run configuration', function () {
    it('WebDriver config targets only a local browser', function () {
        repoFs.find(/^config\/.*\.json$/).forEach((f) => {
            const text = repoFs.read(f);
            if (!/webdriver|capabilities|seleniumAddress|hostname/i.test(text)) return;
            const hosts = [...text.matchAll(/"(?:hostname|host)"\s*:\s*"([^"]+)"/g), ...text.matchAll(/https?:\/\/([^/:"]+)/g)].map((m) => m[1]);
            assert.deepStrictEqual(hosts.filter((h) => !LOCAL.test(h)), [], f);
        });
    });

    it('lightning test run uses no remote config file', function () {
        const runs = automationText().match(/lightning(\s+|:)test(\s+|:)run[^\n&|;]*/g) || [];
        runs.forEach((cmd) => assert.ok(!/https?:\/\//.test(cmd), cmd));
    });
});
