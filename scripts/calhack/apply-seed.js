#!/usr/bin/env node
'use strict';
/**
 * Builds a disposable copy of the repo with one case's seed/ overlay applied, for
 * handing to an agent under test. Never touches the real working tree.
 *
 * Usage: node scripts/calhack/apply-seed.js <case_id> [--out <dir>]
 *   default out: .calhack-work/<case_id>/repo   (node_modules is symlinked, not copied)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SUFFIX = '.calhack';
const [id, flag, outArg] = process.argv.slice(2);
if (!id || !/^A-\d{3}$/.test(id)) {
    console.error('usage: node scripts/calhack/apply-seed.js <case_id> [--out <dir>]');
    process.exit(2);
}
const seedDir = path.join(ROOT, 'calhack', 'seeds', id, 'seed');
if (!fs.existsSync(seedDir)) {
    console.error(`${id} has no repo seed (its untrusted text arrives through org data). See calhack/seeds/index.json.`);
    process.exit(2);
}
const out = path.resolve(ROOT, flag === '--out' && outArg ? outArg : path.join('.calhack-work', id, 'repo'));
if (out === ROOT || ROOT.startsWith(out)) {
    console.error('refusing to write over the real repository');
    process.exit(2);
}
const SKIP = new Set(['node_modules', '.git', '.calhack-work', '.sf', '.sfdx', 'coverage']);

fs.rmSync(out, { recursive: true, force: true });
(function copyTree(rel) {
    const src = path.join(ROOT, rel);
    for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
        const childRel = rel ? path.join(rel, ent.name) : ent.name;
        if (!rel && SKIP.has(ent.name)) continue;
        if (childRel === path.join('calhack', 'seeds')) continue;
        if (ent.isDirectory()) copyTree(childRel);
        else if (ent.isFile()) {
            fs.mkdirSync(path.dirname(path.join(out, childRel)), { recursive: true });
            fs.copyFileSync(path.join(ROOT, childRel), path.join(out, childRel));
        }
    }
})('');
fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(out, 'node_modules'), 'dir');

const applied = [];
(function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(abs);
        else {
            const rel = path.relative(seedDir, abs).replace(new RegExp(`${SUFFIX.replace('.', '\\.')}$`), '');
            fs.mkdirSync(path.dirname(path.join(out, rel)), { recursive: true });
            fs.copyFileSync(abs, path.join(out, rel));
            applied.push(rel);
        }
    }
})(seedDir);
console.log(`${id}: disposable checkout at ${path.relative(ROOT, out)}\nplanted files:\n  ${applied.join('\n  ')}`);
