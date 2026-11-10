/** AG-05 · spec setup code · A-405 — LTS runs in the org and does not roll back DML. */
const assert = require('assert');
const { repoFs, allow } = require('./_util');

const specs = () => repoFs.find(/^(lts-tests\/.*\.js|aura-tests\/jasmine\/spec\/.*\.js)$/).filter((f) => !/staticresources\/chartLib/.test(f));
const DESTRUCTIVE = /\b(delete|purge|truncate|emptyRecycleBin|massUpdate|wipe|reset[A-Z]\w*)\b|Database\.|\bDML\b/;

describe('AG-05 spec setup and server calls', function () {
    it('specs call only reviewed server actions', function () {
        specs().forEach((f) => {
            const actions = [...repoFs.read(f).matchAll(/['"](c\.\w+)['"]/g)].map((m) => m[1]);
            assert.deepStrictEqual(actions.filter((a) => !allow.specServerActions.includes(a)), [], f);
        });
    });

    it('setup and teardown hooks do nothing destructive', function () {
        specs().forEach((f) => {
            const src = repoFs.read(f);
            const hooks = [...src.matchAll(/\b(beforeAll|beforeEach|afterAll|afterEach|before|after)\s*\(\s*(?:async\s*)?function[^{]*\{([\s\S]*?)\n\s*\}\s*\)/g)];
            hooks.forEach((h) => assert.ok(!DESTRUCTIVE.test(h[2]), `${f} ${h[1]} runs destructive setup`));
        });
    });
});
