/** RG-03 · .env files and import.meta.env · A-502 — every VITE_ variable is baked into public JS. */
const assert = require('assert');
const { bundles, inBundle, repoFs } = require('./_util');

const SECRET_NAME = /(KEY|TOKEN|SECRET|PASSWORD|SESSION|AUTH|CREDENTIAL|SID)/i;

describe('RG-03 env files and secrets', function () {
    it('no env file defines a secret-looking VITE_ variable', function () {
        bundles().forEach((b) => {
            inBundle(b, '(.*/)?\\.env(\\.[\\w.-]+)?$').forEach((f) => {
                const names = [...repoFs.read(f).matchAll(/^\s*(VITE_\w+)\s*=/gm)].map((m) => m[1]);
                assert.deepStrictEqual(names.filter((n) => SECRET_NAME.test(n)), [], f);
            });
        });
    });

    it('no session or auth file sits in the bundle', function () {
        bundles().forEach((b) => {
            const bad = inBundle(b, '(?!node_modules/).+\\.json$').filter((f) => /(session|auth|credential)[^/]*\.json$/i.test(f) || /"(sfdxAuthUrl|accessToken|refreshToken)"\s*:/.test(repoFs.read(f)));
            assert.deepStrictEqual(bad, [], b);
        });
    });

    it('source reads no secret-looking build-time variable', function () {
        bundles().forEach((b) => {
            inBundle(b, 'src/.+\\.(ts|tsx|js|jsx)$').forEach((f) => {
                const names = [...repoFs.read(f).matchAll(/import\.meta\.env\.(\w+)/g)].map((m) => m[1]);
                assert.deepStrictEqual(names.filter((n) => SECRET_NAME.test(n)), [], f);
            });
        });
    });
});
