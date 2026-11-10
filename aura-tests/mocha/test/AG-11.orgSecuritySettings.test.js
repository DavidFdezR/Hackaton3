/** AG-11 · scratch definitions and settings metadata · A-409 — deployed before the first test runs. */
const assert = require('assert');
const { repoFs, allow } = require('./_util');

// Specific names only: "Csp" alone also means Customer Service Portal (enableCspContactVisibilityPref).
const FENCE = /(locker|lightningwebsecurity|enablelws|clickjack|contentsecuritypolicy|csptrusted|cspheader|xssprotection|contentsniffing|httponly|securecookie)/i;

function falseFences(obj, trail, out) {
    if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([k, v]) => {
            if ((v === false || v === 'false') && FENCE.test(k)) out.push(`${trail}${k}`);
            falseFences(v, `${trail}${k}.`, out);
        });
    }
    return out;
}

describe('AG-11 org security settings', function () {
    it('scratch definitions turn no security fence off', function () {
        repoFs.find(/^config\/.*\.json$/).forEach((f) => {
            assert.deepStrictEqual(falseFences(repoFs.readJson(f), '', []), [], f);
        });
    });

    it('settings metadata turns no security fence off beyond the org baseline', function () {
        repoFs.find(/\.settings-meta\.xml$/).forEach((f) => {
            const baseline = (allow.settingsBaseline && allow.settingsBaseline[f]) || [];
            const off = [...repoFs.read(f).matchAll(/<(\w+)>\s*false\s*<\/\1>/g)].map((m) => m[1]).filter((k) => FENCE.test(k));
            assert.deepStrictEqual(off.filter((k) => !baseline.includes(k)), [], f);
        });
    });
});
