/** AG-15 · org targets in scripts and CI · A-418 — seed data goes to the scratch org only. */
const assert = require('assert');
const { allow, automationText } = require('./_util');

describe('AG-15 org targets', function () {
    it('scripts and CI target only allowlisted org aliases', function () {
        const targets = [...automationText().matchAll(/(?:--target-org|-o|--targetusername|-u)\s+([\w.@-]+)/g)].map((m) => m[1]);
        assert.deepStrictEqual(targets.filter((t) => !allow.orgAliases.includes(t)), []);
    });

    it('no data delete or import without an explicit scratch target', function () {
        automationText()
            .split('\n')
            .filter((l) => /\bsf\s+data\s+(delete|import|upsert|update)/.test(l))
            .forEach((l) => assert.ok(allow.orgAliases.some((a) => l.includes(a)), l.trim()));
    });
});
