/** RJ-05 · CaseDetails · A-317 */
import { render } from '@testing-library/react';
import { CaseDetails } from '../CaseDetails';
import { MARKUP, activeMarkup, untrusted } from './helpers';

describe('RJ-05 CaseDetails', () => {
  it.each([
    ['A-317 subject', untrusted('A-317')],
    ['img onerror', MARKUP.imgOnerror],
    ['script', MARKUP.scriptTag],
  ])('%s renders as literal text', (_label, subject) => {
    const { container } = render(<CaseDetails value={{ caseNumber: '00001001', subject, status: 'New' }} />);
    expect(container.querySelector('.subject')!.textContent).toBe(subject);
    expect(container.querySelectorAll('a, img, script').length).toBe(0);
    expect(activeMarkup(container)).toEqual([]);
  });
});
