/** AG-08 · editor and devcontainer auto-run · A-408 — runs when the folder opens. */
const assert = require('assert');
const { repoFs } = require('./_util');

const stripJsonc = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('AG-08 auto-run on open', function () {
    it('no VS Code task runs on folder open', function () {
        repoFs.find(/(^|\/)\.vscode\/tasks\.json$/).forEach((f) => {
            assert.ok(!/"runOn"\s*:\s*"folderOpen"/.test(stripJsonc(repoFs.read(f))), `${f} auto-runs a task`);
        });
    });

    it('automatic tasks are not switched on in workspace settings', function () {
        repoFs.find(/(^|\/)\.vscode\/settings\.json$/).forEach((f) => {
            assert.ok(!/"task\.allowAutomaticTasks"\s*:\s*"on"/.test(stripJsonc(repoFs.read(f))), f);
        });
    });

    it('devcontainers run no lifecycle commands', function () {
        repoFs.find(/(^|\/)\.?devcontainer(\.json|\/.*\.json)$/).forEach((f) => {
            assert.ok(!/"(initializeCommand|onCreateCommand|updateContentCommand|postCreateCommand|postStartCommand|postAttachCommand)"/.test(repoFs.read(f)), f);
        });
    });
});
