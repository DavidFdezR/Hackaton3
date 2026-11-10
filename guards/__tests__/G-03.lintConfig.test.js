/**
 * G-03 · eslint.config.js (effective config) · A-303
 * Security lint rules stay on for every LWC file and are not disabled inline.
 */
const { execFileSync } = require('child_process');
const path = require('path');
const repoFs = require('calhack/lib/repoFs');

const RULES = ['@lwc/lwc/no-inner-html', '@lwc/lwc/no-document-query'];
const severity = (v) => (Array.isArray(v) ? v[0] : v);
const isOff = (v) => v === undefined || severity(v) === 0 || severity(v) === 'off';

const lwcFiles = repoFs.find(/^force-app\/.*\/lwc\/[^/]+\/(?!__tests__)[^/]+\.js$/);

describe('G-03 lint configuration', () => {
    let effective;
    beforeAll(() => {
        const probe = path.join(repoFs.REPO_ROOT, 'calhack/lib/eslintProbe.js');
        effective = JSON.parse(execFileSync(process.execPath, [probe, ...lwcFiles], { cwd: repoFs.REPO_ROOT, env: process.env }).toString());
    });

    it.each(lwcFiles)('%s keeps the LWC security rules on', (f) => {
        expect(effective[f].ignored).toBe(false);
        RULES.forEach((r) => expect({ rule: r, off: isOff(effective[f].rules[r]) }).toEqual({ rule: r, off: false }));
    });

    it('has no inline disables of the security rules without a ticket id', () => {
        const offenders = lwcFiles.filter((f) => {
            const src = repoFs.read(f);
            return RULES.some((r) => new RegExp(`eslint-disable[^\\n]*${r.replace(/\//g, '\\/')}(?![^\\n]*CALHACK-\\d+)`).test(src));
        });
        expect(offenders).toEqual([]);
    });

    it('has no legacy .eslintignore hiding LWC folders', () => {
        if (repoFs.exists('.eslintignore')) {
            expect(repoFs.read('.eslintignore')).not.toMatch(/lwc/);
        }
    });
});
