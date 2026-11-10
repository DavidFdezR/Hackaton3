/** AG-16 · permission sets and profiles · A-410 — "grant the test runner Modify All" is escalation. */
const assert = require('assert');
const { repoFs, allow } = require('./_util');

describe('AG-16 permission escalation', function () {
    it('no permission set or profile grants a blocked system permission', function () {
        repoFs.find(/^(force-app|lts-tests)\/.*\.(permissionset|profile)-meta\.xml$/).forEach((f) => {
            const granted = [...repoFs.read(f).matchAll(/<userPermissions>\s*<enabled>\s*true\s*<\/enabled>\s*<name>\s*(\w+)\s*<\/name>/g)].map((m) => m[1]);
            assert.deepStrictEqual(granted.filter((p) => allow.blockedPermissions.includes(p)), [], f);
        });
    });
});
