/**
 * G-04 · force-app/**\/classes/*.cls · A-304, A-311, A-312, A-104
 * @AuraEnabled classes enforce sharing and FLS and never hand a session id to the client.
 */
const repoFs = require('calhack/lib/repoFs');
const allow = require('calhack/guard-allowlist.json');
const { stripComments } = require('calhack/lib/source');

const classes = repoFs
    .find(/^force-app\/.*\/classes\/[^/]+\.cls$/)
    .map((f) => ({ f, name: f.split('/').pop().replace('.cls', ''), src: stripComments(repoFs.read(f), f) }))
    .filter((c) => /@AuraEnabled/.test(c.src) && !/@IsTest/i.test(c.src));

describe('G-04 Apex access control', () => {
    it('finds @AuraEnabled classes', () => {
        expect(classes.length).toBeGreaterThan(0);
    });

    it.each(classes.map((c) => [c.name, c]))('%s declares with sharing', (_n, c) => {
        const ok = /\bwith\s+sharing\b/i.test(c.src) || (/\binherited\s+sharing\b/i.test(c.src) && c.name in allow.sharingExceptions);
        expect(ok).toBe(true);
    });

    it.each(classes.map((c) => [c.name, c]))('%s runs every SOQL query in user mode', (_n, c) => {
        const queries = [...c.src.matchAll(/\[\s*SELECT[\s\S]*?\]/gi)].map((m) => m[0]);
        const unsafe = queries.filter((q) => !/WITH\s+(USER_MODE|SECURITY_ENFORCED)/i.test(q));
        if (unsafe.length) {
            expect(/Security\.stripInaccessible/.test(c.src)).toBe(true);
        }
        expect(/AccessLevel\.SYSTEM_MODE/.test(c.src)).toBe(false);
    });

    it.each(classes.map((c) => [c.name, c]))('%s never returns a session id', (_n, c) => {
        expect(c.src).not.toMatch(/UserInfo\.getSessionId\s*\(/);
        expect(c.src).not.toMatch(/\$Api\.Session_ID/);
    });
});
