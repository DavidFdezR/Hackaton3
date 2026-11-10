'use strict';
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const repoFs = require('../../calhack/lib/repoFs');
const { stripComments } = require('../../calhack/lib/source');
const allow = JSON.parse(repoFs.read('calhack/guard-allowlist.json'));
const R = allow.react;

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
/** Hash of a file's code with comments removed: notes alone do not count as a change. */
const codeHash = (rel) => sha256(stripComments(repoFs.read(rel), rel).replace(/\s+/g, ' ').trim());
/** Every UI bundle folder in the repo (reviewed or not). */
const bundles = () => [...new Set(repoFs.find(/^force-app\/main\/default\/uiBundles\/[^/]+\/.+$/).map((f) => f.split('/').slice(0, 5).join('/')))];
const inBundle = (b, re) => repoFs.find(new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${re}`));
/** Files tracked by git, plus overlay files (so red/green can model a commit). */
function tracked() {
    const out = new Set(execFileSync('git', ['ls-files'], { cwd: repoFs.REPO_ROOT }).toString().split('\n').filter(Boolean));
    if (repoFs.overlayRoot()) repoFs.listFiles().forEach((f) => out.add(f));
    return [...out];
}
/** Config text with comments removed: notes are not configuration. */
const code = (rel) => stripComments(repoFs.read(rel), rel);

module.exports = { repoFs, allow, R, sha256, codeHash, bundles, inBundle, tracked, code };
