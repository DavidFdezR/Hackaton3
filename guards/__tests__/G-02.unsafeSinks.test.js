/**
 * G-02 · force-app/**\/lwc/**\/*.{js,html} · A-302, A-309, A-310, A-207
 * Unsafe DOM and messaging sinks appear only in allowlisted bundles.
 */
const repoFs = require('calhack/lib/repoFs');
const allow = require('calhack/guard-allowlist.json');
const { stripComments } = require('calhack/lib/source');

const SINKS = [
    { id: 'innerHTML', re: /\.(innerHTML|outerHTML)\s*=/ },
    { id: 'insertAdjacentHTML', re: /insertAdjacentHTML\s*\(/ },
    { id: 'lwc:dom="manual"', re: /lwc:dom\s*=\s*"manual"/ },
    { id: "renderMode = 'light'", re: /renderMode\s*=\s*['"]light['"]/ },
    { id: 'lwc:render-mode="light"', re: /lwc:render-mode\s*=\s*['"]light['"]/ },
    { id: "postMessage(..., '*')", re: /postMessage\s*\([\s\S]*?,\s*['"]\*['"]\s*\)/ },
    { id: 'eval/Function', re: /\beval\s*\(|new\s+Function\s*\(/ }
];

const files = repoFs.find(/^force-app\/.*\/lwc\/[^/]+\/(?!__tests__)[^/]+\.(js|html)$/);

describe('G-02 unsafe sinks', () => {
    it.each(SINKS.map((s) => [s.id, s]))('%s only in allowlisted bundles', (_id, sink) => {
        const permitted = (allow.unsafeSinkAllowlist && allow.unsafeSinkAllowlist[sink.id]) || {};
        const offenders = files.filter((f) => sink.re.test(stripComments(repoFs.read(f), f))).filter((f) => !(f.split('/').slice(-2)[0] in permitted));
        expect(offenders).toEqual([]);
    });
});
