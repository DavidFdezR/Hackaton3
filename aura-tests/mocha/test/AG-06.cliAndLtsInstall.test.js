/** AG-06 · sf CLI hooks, plugins and LTS install · A-402, A-407 — these run before every sf command. */
const assert = require('assert');
const { repoFs, pkg, automationText } = require('./_util');

describe('AG-06 sf CLI and LTS install', function () {
    it('registers no oclif hooks or hook config files', function () {
        assert.ok(!('oclif' in pkg()), 'package.json registers oclif hooks');
        assert.deepStrictEqual(repoFs.find(/(^|\/)(\.sfhooks\.json|sf-hooks\.json)$/), []);
    });

    it('installs no sf plugins from scripts or CI', function () {
        assert.ok(!/\b(sf|sfdx)\s+plugins(\s+|:)install\b/.test(automationText()));
    });

    it('installs LTS only from the default package source', function () {
        const text = automationText();
        const installs = text.match(/lightning(\s+|:)test(\s+|:)install[^\n&|;]*/g) || [];
        installs.forEach((cmd) => assert.ok(!/(-r|--release|https?:\/\/)/.test(cmd), `non-default LTS source: ${cmd}`));
    });
});
