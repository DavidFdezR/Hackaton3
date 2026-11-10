/** AG-04 · static resources · A-406 — a zipped spec bundle hides its content from review. */
const assert = require('assert');
const { repoFs, allow } = require('./_util');

const metas = () => repoFs.find(/^(force-app|lts-tests)\/.*\/staticresources\/[^/]+\.resource-meta\.xml$/);
const nameOf = (f) => f.split('/').pop().replace('.resource-meta.xml', '');

describe('AG-04 spec static resources', function () {
    it('LTS spec resources are single, readable JavaScript files', function () {
        metas()
            .filter((f) => f.startsWith('lts-tests/'))
            .forEach((f) => {
                assert.match(repoFs.read(f), /<contentType>\s*application\/javascript\s*<\/contentType>/, `${f} is not plain JavaScript`);
                const dir = f.replace(/[^/]+$/, '');
                assert.ok(repoFs.exists(`${dir}${nameOf(f)}.js`), `${f} has no readable .js source`);
            });
    });

    it('zip resources are reviewed source folders, never committed binaries', function () {
        metas().forEach((f) => {
            if (/application\/(zip|x-zip|octet-stream)/.test(repoFs.read(f))) {
                assert.ok(nameOf(f) in allow.zipStaticResources, `${f} is an unreviewed archive`);
            }
        });
        const binaries = repoFs.find(/\/staticresources\/[^/]+\.(resource|zip)$/);
        assert.deepStrictEqual(binaries, []);
    });
});
