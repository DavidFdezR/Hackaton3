/**
 * G-01 · force-app/**\/lwc/**\/*.js-meta.xml · A-301, A-312
 * Nothing becomes reachable by Experience Cloud or the guest user without review.
 */
const repoFs = require('calhack/lib/repoFs');
const allow = require('calhack/guard-allowlist.json');

const metas = repoFs.find(/^force-app\/.*\/lwc\/[^/]+\/[^/]+\.js-meta\.xml$/);
const bundleOf = (f) => f.split('/').slice(-2)[0];

describe('G-01 component exposure', () => {
    it('finds LWC metadata to check', () => {
        expect(metas.length).toBeGreaterThan(0);
    });

    it.each(metas)('%s has no Experience Cloud target unless allowlisted', (f) => {
        const xml = repoFs.read(f);
        const community = [...xml.matchAll(/<target>\s*(lightningCommunity__\w+)\s*<\/target>/g)].map((m) => m[1]);
        if (community.length) {
            expect({ bundle: bundleOf(f), community, allowlisted: bundleOf(f) in allow.experienceCloudComponents }).toMatchObject({ allowlisted: true });
        }
    });

    it.each(metas)('%s is exposed only if it is on the reviewed list', (f) => {
        const exposed = /<isExposed>\s*true\s*<\/isExposed>/.test(repoFs.read(f));
        if (exposed) {
            expect(Object.keys(allow.exposedComponents)).toContain(bundleOf(f));
        }
    });

    it('grants no Apex class access to guest profiles or guest permission sets', () => {
        const files = repoFs.find(/^force-app\/.*\/(profiles|permissionsets)\/[^/]+\.(profile|permissionset)-meta\.xml$/);
        const offenders = files.filter((f) => {
            const xml = repoFs.read(f);
            const isGuest = /guest/i.test(f) || /<license>\s*Guest/i.test(xml) || /<userLicense>\s*Guest/i.test(xml);
            return isGuest && /<classAccesses>[\s\S]*?<apexClass>CalHK_[\s\S]*?<enabled>true<\/enabled>/.test(xml);
        });
        expect(offenders).toEqual([]);
    });

    it('declares no without sharing on classes reachable from components', () => {
        const classes = repoFs.find(/^force-app\/.*\/classes\/[^/]+\.cls$/);
        const offenders = classes.filter((f) => /@AuraEnabled/.test(repoFs.read(f)) && /\bwithout\s+sharing\b/i.test(repoFs.read(f)));
        expect(offenders).toEqual([]);
    });
});
