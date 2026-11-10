/*
 * Overlay-aware file access for the CalHack guards and Aura specs.
 *
 * Every guard and spec reads repository files through this module instead of
 * `fs` directly. When CALHACK_OVERLAY points at a folder (for example
 * calhack/seeds/A-302/complied), files in that folder replace the repo file at
 * the same relative path. That lets scripts/calhack/redgreen.js prove each test
 * goes red on the "agent complied" version without touching the real tree.
 *
 * Overlay files outside force-app/**\/lwc are stored with a `.calhack` suffix
 * (AGENTS.md.calhack, .npmrc.calhack, tasks.json.calhack ...) so editors, npm, git
 * and coding agents never pick them up. This module maps them back to real names.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SUFFIX = '.calhack';
// dist/ holds local UI-bundle builds (gitignored); RG-09 checks git for committed build output.
const SKIP_DIRS = new Set(['node_modules', '.git', '.sf', '.sfdx', '.localdevserver', 'coverage', '.calhack-work', 'dist']);

function overlayRoot() {
    const o = process.env.CALHACK_OVERLAY;
    return o ? path.resolve(REPO_ROOT, o) : null;
}

function walk(base, rel, out, stripSuffix) {
    const abs = path.join(base, rel);
    let entries;
    try {
        entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch (e) {
        return;
    }
    for (const ent of entries) {
        const childRel = rel ? `${rel}/${ent.name}` : ent.name;
        if (ent.isDirectory()) {
            if (SKIP_DIRS.has(ent.name)) continue;
            // The seed overlays are fixtures, not part of the repo under test.
            if (base === REPO_ROOT && childRel === 'calhack/seeds') continue;
            walk(base, childRel, out, stripSuffix);
        } else if (ent.isFile()) {
            out.add(stripSuffix && childRel.endsWith(SUFFIX) ? childRel.slice(0, -SUFFIX.length) : childRel);
        }
    }
}

/** All repo-relative file paths (POSIX separators), overlay files included. */
function listFiles() {
    const out = new Set();
    walk(REPO_ROOT, '', out);
    const o = overlayRoot();
    if (o) walk(o, '', out, true);
    return [...out].sort();
}

function resolve(rel) {
    const o = overlayRoot();
    if (o) {
        for (const candidate of [path.join(o, rel + SUFFIX), path.join(o, rel)]) {
            if (fs.existsSync(candidate)) return candidate;
        }
    }
    return path.join(REPO_ROOT, rel);
}

function exists(rel) {
    return fs.existsSync(resolve(rel));
}

function read(rel) {
    return fs.readFileSync(resolve(rel), 'utf8');
}

function readJson(rel) {
    return JSON.parse(read(rel));
}

/** Files whose path matches the regular expression. */
function find(regex) {
    return listFiles().filter((f) => regex.test(f));
}

module.exports = { SUFFIX, REPO_ROOT, listFiles, resolve, exists, read, readJson, find, overlayRoot };
