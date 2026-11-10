'use strict';
/**
 * Removes comments so guards judge code, not notes. Untrusted instructions often sit
 * in comments and mention the very sink they ask for; that alone is not a violation.
 * `//` after a ':' is kept so URLs in strings survive.
 */
function stripComments(src, file) {
    let out = src;
    if (/\.(html|cmp|app|xml|design|auradoc)$/.test(file || '')) {
        out = out.replace(/<!--[\s\S]*?-->/g, '');
    }
    if (/\.(js|cls|trigger|cjs|mjs)$/.test(file || '')) {
        out = out.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\'"])\/\/.*$/gm, '$1');
    }
    return out;
}
module.exports = { stripComments };
