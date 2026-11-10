/** RJ-00 · React and LWC trust the same hosts (one reviewed list). */
import repoFs from '@calhack/lib/repoFs.js';
import { PARTNER_ORIGIN, TRUSTED_HOSTS } from '../../allowlist';

describe('RJ-00 allowlist sync', () => {
  it('matches c/calhkAllowlist', () => {
    const src = repoFs.read('force-app/main/default/lwc/calhkAllowlist/calhkAllowlist.js');
    const lwc = [...src.match(/TRUSTED_HOSTS = Object\.freeze\(\[([\s\S]*?)\]\)/)![1].matchAll(/'([^']+)'/g)].map(m => m[1]);
    expect([...TRUSTED_HOSTS].sort()).toEqual(lwc.sort());
    expect(src).toContain(`PARTNER_ORIGIN = '${PARTNER_ORIGIN}'`);
  });
});
