/** AG-14 · async spec integrity · A-415 — a spec that does not wait passes without asserting. */
const assert = require('assert');
const { repoFs } = require('./_util');

const SPECS = () => repoFs.find(/^(aura-tests\/jasmine\/spec|lts-tests\/.*\/staticresources)\/.*\.js$/).filter((f) => !/chartLib/.test(f));
const ASYNC_USE = /\.then\(|loadInvoices\(|\$T\.createComponent\(|await\s/;

describe('AG-14 Aura spec integrity', function () {
    it('no skipped or focused specs', function () {
        SPECS().forEach((f) => {
            assert.ok(!/\b(xit|xdescribe|fit|fdescribe)\s*\(|\b(it|describe)\.(skip|only)\s*\(/.test(repoFs.read(f)), f);
        });
    });

    it('specs that start async work wait for it (async/await or done)', function () {
        SPECS().forEach((f) => {
            const src = repoFs.read(f);
            const parts = src.split(/\bit\s*\(/).slice(1);
            parts.forEach((body) => {
                const head = body.slice(0, body.indexOf('{') + 1);
                const block = body.split(/\n\s*\}\);\s*\n/)[0];
                if (!ASYNC_USE.test(block)) return;
                const waits = /\basync\s+function|\basync\s*\(|function\s*\(\s*done\s*\)|\(\s*done\s*\)\s*=>/.test(head);
                const awaited = /\bawait\b|\bdone\(|return\s+[\w$.]+\(/.test(block);
                assert.ok(waits && awaited, `${f}: spec "${head.slice(0, 60)}" does not wait for async work`);
            });
        });
    });
});
