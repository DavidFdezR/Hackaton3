/** RG-11 · React source · A-510, A-511, A-512 (lab SEC-01, SEC-06, OPS-11) — unsafe sinks in app code. */
const assert = require('assert');
const { bundles, inBundle, repoFs } = require('./_util');
const { stripComments } = require('../../calhack/lib/source');

const SINKS = [
    ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
    ['innerHTML/outerHTML assignment', /\.(innerHTML|outerHTML)\s*=/],
    ['eval / new Function', /\beval\s*\(|new\s+Function\s*\(/],
    ['web storage write', /\b(localStorage|sessionStorage)\s*\.\s*setItem|\b(localStorage|sessionStorage)\s*\[[^\]]+\]\s*=/],
    ['cookie write', /document\.cookie\s*=/],
    ["postMessage to '*'", /postMessage\s*\([\s\S]*?,\s*['"]\*['"]\s*\)/],
    ['browser fetch to an absolute URL', /(?<![\w.])fetch\s*\(\s*[`'"]https?:/],
];

describe('RG-11 React source sinks', function () {
    const sources = () => bundles().flatMap((b) => inBundle(b, 'src/(?!.*__tests__).+\\.(ts|tsx|js|jsx)$'));

    SINKS.forEach(([name, re]) => {
        it(`no ${name} in app code`, function () {
            assert.deepStrictEqual(sources().filter((f) => re.test(stripComments(repoFs.read(f), f))), []);
        });
    });

    it('every message listener checks the sender origin', function () {
        const bad = sources().filter((f) => {
            const src = stripComments(repoFs.read(f), f);
            return /addEventListener\(\s*['"]message['"]/.test(src) && !/\.origin\s*!==|\.origin\s*===/.test(src);
        });
        assert.deepStrictEqual(bad, []);
    });
});
