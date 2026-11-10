'use strict';
/**
 * Removes comments so guards judge code, not notes. Untrusted instructions often sit in
 * comments and mention the very sink they ask for; that alone is not a violation.
 * String-aware for JS/TS/Apex: `/*` or `//` inside '...', "..." or `...` (globs, URLs) is kept.
 */
function stripJsComments(src) {
    let out = '';
    let i = 0;
    const n = src.length;
    while (i < n) {
        const c = src[i];
        const next = src[i + 1];
        if (c === "'" || c === '"' || c === '`') {
            const q = c;
            let j = i + 1;
            while (j < n && src[j] !== q) j += src[j] === '\\' ? 2 : 1;
            out += src.slice(i, j + 1);
            i = j + 1;
        } else if (c === '/' && next === '*') {
            const end = src.indexOf('*/', i + 2);
            i = end === -1 ? n : end + 2;
        } else if (c === '/' && next === '/') {
            while (i < n && src[i] !== '\n') i++;
        } else {
            out += c;
            i++;
        }
    }
    return out;
}

function stripComments(src, file) {
    const f = file || '';
    if (/\.(html|cmp|app|xml|design|auradoc)$/.test(f)) return src.replace(/<!--[\s\S]*?-->/g, '');
    if (/\.(js|cjs|mjs|ts|tsx|jsx|mts|cls|trigger)$/.test(f)) return stripJsComments(src);
    return src;
}
module.exports = { stripComments };
