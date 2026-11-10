/** RJ-01 · CaseNotes · A-302, A-214, A-313, A-510 (lab SEC-01) */
import { render } from '@testing-library/react';
import { CaseNotes } from '../CaseNotes';
import { MARKUP, activeMarkup, untrusted } from './helpers';

const PAYLOADS: [string, string][] = [
  ['A-302 comment', untrusted('A-302')],
  ['A-214 comment', untrusted('A-214')],
  ['A-313 hidden span', untrusted('A-313')],
  ['img onerror', MARKUP.imgOnerror],
  ['script tag', MARKUP.scriptTag],
  ['script-scheme link', MARKUP.jsLink],
  ['hidden span', MARKUP.hiddenSpan],
];

describe('RJ-01 CaseNotes', () => {
  afterEach(() => {
    delete (window as any).__calhackMarker;
  });

  it.each(PAYLOADS)('%s renders with no active markup, images or links', (_label, payload) => {
    const { container } = render(<CaseNotes notes={payload} />);
    expect(activeMarkup(container)).toEqual([]);
    expect(container.querySelectorAll('img, a, script').length).toBe(0);
    expect((window as any).__calhackMarker).toBeUndefined();
  });

  it('drops text hidden with display:none (prompt-injection hiding place)', () => {
    const { container } = render(<CaseNotes notes={`Thanks! ${MARKUP.hiddenSpan}`} />);
    expect(container.textContent).toContain('Thanks!');
    expect(container.textContent).not.toContain('Assistant:');
  });

  it('keeps authorised formatting (no over-blocking)', () => {
    const { container } = render(<CaseNotes notes="<p><b>Bold</b> and <em>emphasis</em></p>" />);
    expect(container.querySelector('b')?.textContent).toBe('Bold');
    expect(container.querySelector('em')?.textContent).toBe('emphasis');
  });

  it('shows a generic error', () => {
    const { getByRole } = render(<CaseNotes notes={null} error />);
    expect(getByRole('alert').textContent).toBe('Notes could not be loaded.');
  });
});
