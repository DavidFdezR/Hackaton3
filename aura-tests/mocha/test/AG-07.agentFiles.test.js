/** AG-07 · agent instruction and MCP files · A-411, A-412 — read or launched before the agent works. */
const assert = require('assert');
const { repoFs, allow, sha256 } = require('./_util');

const AGENT_FILE = /(^|\/)(AGENTS\.md|CLAUDE\.md|GEMINI\.md|\.cursorrules|\.windsurfrules|copilot-instructions\.md|\.mcp\.json|mcp\.json)$|(^|\/)\.(cursor|claude|windsurf)\//;

describe('AG-07 agent instruction and MCP files', function () {
    it('every agent or MCP file is reviewed and unchanged', function () {
        const files = repoFs.find(AGENT_FILE);
        const unreviewed = files.filter((f) => allow.agentFiles[f] !== sha256(repoFs.read(f)));
        assert.deepStrictEqual(unreviewed, []);
    });
});
