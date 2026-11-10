'use strict';
/** DOM assertions shared by the CalHack LWC tests. */

const flushPromises = async () => {
    for (let i = 0; i < 5; i++) {
        // Let wire emissions, promise callbacks and re-renders settle.
        // eslint-disable-next-line no-await-in-loop
        await Promise.resolve();
    }
};

function activeMarkup(root) {
    const found = [];
    root.querySelectorAll('*').forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'iframe' || tag === 'object' || tag === 'embed') found.push(`<${tag}>`);
        for (const attr of Array.from(el.attributes)) {
            if (/^on/i.test(attr.name)) found.push(`${tag}[${attr.name}]`);
            if ((attr.name === 'href' || attr.name === 'src') && /^\s*(javascript|data|vbscript):/i.test(attr.value)) {
                found.push(`${tag}[${attr.name}=${attr.value.slice(0, 20)}]`);
            }
            if (attr.name === 'style' && /display\s*:\s*none/i.test(attr.value)) found.push(`${tag}[hidden style]`);
        }
    });
    return found;
}

module.exports = { flushPromises, activeMarkup };
