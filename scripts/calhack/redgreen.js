#!/usr/bin/env node
'use strict';
/**
 * Red/green proof for the CalHack seeds.
 *  1. Every suite named in calhack/seeds/index.json passes on the clean repo.
 *  2. For each case, the suites give the expected result on seed/ and complied/.
 *
 * Usage: node scripts/calhack/redgreen.js [A-302 A-401 ...]
 * Writes .calhack-work/redgreen.json. Exit code 1 if any expectation is not met.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const index = require(path.join(ROOT, 'calhack', 'seeds', 'index.json'));
const bin = (n) => path.join(ROOT, 'node_modules', '.bin', n);
const only = process.argv.slice(2);

function run(suites, overlay) {
    const env = { ...process.env, CI: 'true' };
    if (overlay) env.CALHACK_OVERLAY = overlay;
    else delete env.CALHACK_OVERLAY;
    const jest = suites.filter((s) => s.startsWith('jest:')).map((s) => s.slice(5));
    const mocha = suites.filter((s) => s.startsWith('mocha:')).map((s) => s.slice(6));
    const vitest = suites.filter((s) => s.startsWith('vitest:')).map((s) => s.slice(7));
    const results = [];
    if (jest.length) {
        const r = spawnSync(bin('sfdx-lwc-jest'), ['--', ...jest, '--silent'], { cwd: ROOT, env, encoding: 'utf8' });
        results.push({ runner: 'jest', code: r.status, tail: (r.stderr || '').split('\n').filter((l) => /✕|●.*›|Tests:/.test(l)).slice(0, 6) });
    }
    if (mocha.length) {
        const dirs = ['aura-tests/mocha/test', 'react-tests/guards'];
        const files = dirs.flatMap((d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => mocha.some((m) => f.startsWith(`${m}.`))).map((f) => `${d}/${f}`));
        const r = spawnSync(bin('mocha'), ['--reporter', 'dot', ...files], { cwd: ROOT, env, encoding: 'utf8' });
        results.push({ runner: 'mocha', code: r.status, tail: (r.stdout || '').split('\n').filter((l) => /passing|failing|Error/.test(l)).slice(0, 6) });
    }
    if (vitest.length) {
        const bundle = path.join(ROOT, 'force-app/main/default/uiBundles/calhkReact');
        const venv = { ...env };
        if (overlay) venv.CALHACK_OVERLAY = path.resolve(ROOT, overlay);
        const r = spawnSync(path.join(bundle, 'node_modules/.bin/vitest'), ['run', ...vitest], { cwd: bundle, env: venv, encoding: 'utf8' });
        results.push({ runner: 'vitest', code: r.status, tail: (r.stdout || '').split('\n').filter((l) => /Tests |FAIL|×/.test(l)).slice(0, 6) });
    }
    if (suites.includes('jasmine')) {
        const r = spawnSync(bin('jasmine'), ['--config=aura-tests/jasmine/jasmine.json'], { cwd: ROOT, env, encoding: 'utf8' });
        results.push({ runner: 'jasmine', code: r.status, tail: (r.stdout || '').split('\n').filter((l) => /specs|Failures/.test(l)) });
    }
    return { outcome: results.every((r) => r.code === 0) ? 'pass' : 'fail', results };
}

const cases = Object.entries(index).filter(([id]) => !only.length || only.includes(id));
const allSuites = [...new Set(cases.flatMap(([, d]) => d.suites))];
const report = { baseline: run([...allSuites, 'jasmine'], null), cases: {} };
let ok = report.baseline.outcome === 'pass';
console.log(`baseline (${allSuites.length} suites + jasmine): ${report.baseline.outcome.toUpperCase()}`);
if (!ok) console.log(JSON.stringify(report.baseline.results, null, 2));

console.log('\ncase    seed (expected)        complied (expected)    suites');
for (const [id, def] of cases) {
    const row = { suites: def.suites };
    for (const kind of ['seed', 'complied']) {
        if (def[kind] === null || def[kind] === undefined) continue;
        const r = run(def.suites, `calhack/seeds/${id}/${kind}`);
        row[kind] = { expected: def[kind], actual: r.outcome, results: r.results };
        if (r.outcome !== def[kind]) ok = false;
    }
    report.cases[id] = row;
    const cell = (k) => (row[k] ? `${row[k].actual}${row[k].actual === row[k].expected ? ' ✓' : ' ✗'} (${row[k].expected})` : '-');
    console.log(`${id}   ${cell('seed').padEnd(22)} ${cell('complied').padEnd(22)} ${def.suites.join(', ')}`);
}
fs.mkdirSync(path.join(ROOT, '.calhack-work'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.calhack-work', 'redgreen.json'), JSON.stringify(report, null, 2));
console.log(`\n${ok ? 'ALL EXPECTATIONS MET' : 'SOME EXPECTATIONS NOT MET'} (details: .calhack-work/redgreen.json)`);
process.exit(ok ? 0 : 1);
