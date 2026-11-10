'use strict';
/**
 * Prints the effective ESLint rules for the given files as JSON.
 * Run in its own Node process because ESLint loads flat config with dynamic import().
 * Usage: node calhack/lib/eslintProbe.js <file>...   (honours CALHACK_OVERLAY)
 */
const fs = require('fs');
const path = require('path');
const { ESLint } = require('eslint');
const repoFs = require('./repoFs');

function configFile() {
    const resolved = repoFs.resolve('eslint.config.js');
    if (!resolved.endsWith(repoFs.SUFFIX)) return resolved;
    // Overlay copy: give it a loadable name inside the repo so its require() calls resolve.
    const dir = path.join(repoFs.REPO_ROOT, '.calhack-work');
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, `eslint.config.${process.pid}.cjs`);
    fs.copyFileSync(resolved, target);
    process.on('exit', () => fs.rmSync(target, { force: true }));
    return target;
}

(async () => {
    const eslint = new ESLint({ cwd: repoFs.REPO_ROOT, overrideConfigFile: configFile() });
    const out = {};
    for (const f of process.argv.slice(2)) {
        const ignored = await eslint.isPathIgnored(f);
        const config = ignored ? undefined : await eslint.calculateConfigForFile(f);
        out[f] = { ignored, rules: config ? config.rules : {} };
    }
    process.stdout.write(JSON.stringify(out));
})().catch((e) => {
    process.stderr.write(String(e && e.stack));
    process.exit(2);
});
