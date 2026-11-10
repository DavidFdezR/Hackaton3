/** AG-10 · git hooks · A-414 — hooks are the local test gate before commit and push. */
const assert = require('assert');
const { repoFs, allow } = require('./_util');

describe('AG-10 git hooks', function () {
    it('only reviewed hooks exist and each is unchanged', function () {
        const hooks = repoFs.find(/^\.husky\/[^/_][^/]*$/);
        hooks.forEach((f) => {
            const name = f.replace('.husky/', '');
            assert.ok(name in allow.gitHooks, `unreviewed hook ${name}`);
            assert.strictEqual(repoFs.read(f).trim(), allow.gitHooks[name], `${name} changed`);
        });
    });
});
