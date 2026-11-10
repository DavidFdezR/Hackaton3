/**
 * G-05 · LWC JS, static resources, CSP Trusted Sites · A-305, A-307, A-207
 * No outside script sources, no unreviewed CSP entries, no secret-looking strings.
 */
const repoFs = require('calhack/lib/repoFs');
const allow = require('calhack/guard-allowlist.json');
const { stripComments } = require('calhack/lib/source');

const ALLOWLIST_SRC = repoFs.read('force-app/main/default/lwc/calhkAllowlist/calhkAllowlist.js');
const TRUSTED = new Set([...[...ALLOWLIST_SRC.matchAll(/'([a-z0-9.-]+\.(?:example|com))'/g)].map((m) => m[1]), ...allow.trustedHostsExtra]);
const SECRET_PATTERNS = [
    /x-api-key\s*[:=]\s*['"]?[A-Za-z0-9_-]{6,}/i,
    /api[_-]?key\s*[:=]\s*['"][^'"]{8,}['"]/i,
    /\b(?:sk|pk|rk|demo)_live_[A-Za-z0-9]{4,}/,
    /Bearer\s+(?!\$\{)[A-Za-z0-9._-]{16,}/,
    /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
    /force:\/\/[A-Za-z0-9._-]+:[A-Za-z0-9._-]+/
];

const lwcJs = repoFs.find(/^force-app\/.*\/lwc\/[^/]+\/(?!__tests__)[^/]+\.js$/);
const scanned = repoFs.find(/^(force-app|lts-tests)\/.*\.(js|cls|html|cmp|xml|json)$/).filter((f) => !/__tests__/.test(f));

describe('G-05 hosts, script sources and secrets', () => {
    it.each(lwcJs)('%s references only trusted hosts', (f) => {
        const hosts = [...stripComments(repoFs.read(f), f).matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1].toLowerCase());
        expect(hosts.filter((h) => !TRUSTED.has(h))).toEqual([]);
    });

    it.each(lwcJs)('%s loads scripts and styles only from imported static resources', (f) => {
        const src = stripComments(repoFs.read(f), f);
        const resources = new Set([...src.matchAll(/import\s+(\w+)\s+from\s+['"]@salesforce\/resourceUrl\/[\w]+['"]/g)].map((m) => m[1]));
        const calls = [...src.matchAll(/load(?:Script|Style)\s*\(\s*this\s*,\s*([^)]*)\)/g)].map((m) => m[1].trim());
        calls.forEach((arg) => {
            const head = arg.split(/\s*\+\s*/)[0];
            expect({ file: f, arg, fromStaticResource: resources.has(head) }).toMatchObject({ fromStaticResource: true });
        });
    });

    it('adds no CSP Trusted Site that is not allowlisted', () => {
        const csp = repoFs.find(/\.cspTrustedSite-meta\.xml$/).map((f) => f.split('/').pop().replace('.cspTrustedSite-meta.xml', ''));
        expect(csp.filter((n) => !(n in allow.cspTrustedSites))).toEqual([]);
    });

    it('contains no secret-looking strings', () => {
        const hits = [];
        scanned.forEach((f) => {
            const src = repoFs.read(f);
            SECRET_PATTERNS.forEach((p) => {
                const m = src.match(p);
                if (m && !/PLACEHOLDER/.test(m[0])) hits.push(`${f}: ${m[0].slice(0, 30)}`);
            });
        });
        expect(hits).toEqual([]);
    });
});
