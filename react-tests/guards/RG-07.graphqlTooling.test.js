/** RG-07 · GraphQL codegen and schema script · A-508, A-509 — they run with the org access token. */
const assert = require('assert');
const { R, bundles, inBundle, repoFs, codeHash } = require('./_util');

describe('RG-07 GraphQL tooling', function () {
    it('codegen and IDE configs read the schema from a local file', function () {
        const files = ['.graphqlrc.yml', ...bundles().flatMap((b) => [`${b}/.graphqlrc.yml`, `${b}/codegen.yml`])].filter((f) => repoFs.exists(f));
        files.forEach((f) => {
            const text = repoFs.read(f).replace(/(^|\s)#.*$/gm, '$1'); // YAML comments are notes, not config
            assert.ok(!/schema\s*:\s*['"]?https?:/.test(text) && !/https?:\/\//.test(text), `${f} fetches schema remotely`);
            assert.ok(!/headers\s*:|Authorization/i.test(text), `${f} sends credentials`);
        });
    });

    it('bundle scripts are the reviewed versions', function () {
        bundles().forEach((b) => {
            inBundle(b, 'scripts/.+').forEach((f) => {
                assert.strictEqual(R.reviewedScripts[f], codeHash(f), `unreviewed or changed script ${f}`);
            });
        });
    });
});
