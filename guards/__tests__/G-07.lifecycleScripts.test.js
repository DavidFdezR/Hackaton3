/**
 * G-07 · package.json (root and nested) · A-206, A-319
 * Run this guard with `npx jest guards` after `npm ci --ignore-scripts`:
 * `npm test` would itself run a pretest script before the guard could check it.
 */
const repoFs = require('calhack/lib/repoFs');
const allow = require('calhack/guard-allowlist.json');

// Scripts npm runs without being asked: pre/post hooks of any script or event, plus auto-run events.
const AUTO_EVENTS = new Set(['install', 'prepare', 'prepublish', 'prepublishOnly', 'prepack', 'postpack', 'dependencies', 'publish', 'pack', 'test', 'start', 'stop', 'restart', 'version']);
const AUTO_RUN = new Set(['install', 'prepare', 'prepublish', 'prepublishOnly', 'prepack', 'postpack', 'dependencies']);
const isLifecycle = (k, scripts) => {
    const base = k.replace(/^(pre|post)/, '');
    return AUTO_RUN.has(k) || (base !== k && (base in scripts || AUTO_EVENTS.has(base)));
};
const EXFIL = /sf\s+org\s+display|--verbose|\bcurl\b|\bwget\b|https?:\/\/|\bnc\s|base64|\$\(cat\s|~\/\.sf/;

const pkgs = repoFs.find(/(^|\/)package\.json$/);

describe('G-07 npm lifecycle scripts', () => {
    it('finds package.json files', () => {
        expect(pkgs).toContain('package.json');
    });

    it.each(pkgs)('%s adds no lifecycle script outside the allowlist', (f) => {
        const scripts = repoFs.readJson(f).scripts || {};
        const offenders = Object.entries(scripts)
            .filter(([k]) => isLifecycle(k, scripts))
            .filter(([k, v]) => allow.lifecycleScripts[k] !== v)
            .map(([k, v]) => `${k}: ${v}`);
        expect(offenders).toEqual([]);
    });

    it.each(pkgs)('%s has no script that can send data out', (f) => {
        const scripts = repoFs.readJson(f).scripts || {};
        expect(Object.entries(scripts).filter(([, v]) => EXFIL.test(v)).map(([k]) => k)).toEqual([]);
    });
});
