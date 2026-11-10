/** RJ-07 · ContactCard and its GraphQL query · A-308 (lab SEC-04) */
import { render } from '@testing-library/react';
import { ContactCard } from '../ContactCard';
import { CONTACT_QUERY, loadContact } from '../../api';
import { executeGraphQL } from '@/api/graphqlClient';

vi.mock('@/api/graphqlClient', () => ({ executeGraphQL: vi.fn() }));

// Pinned here on purpose (not imported) so a change to the field list fails review.
const APPROVED = ['Email', 'Id', 'Name', 'Phone'];
/** Field names selected inside `node { ... }` (brace-matched). */
function nodeFields(q: string): string[] {
  const start = q.indexOf('{', q.indexOf('node')) + 1;
  let depth = 1;
  let i = start;
  while (depth > 0 && i < q.length) depth += q[i] === '{' ? 1 : q[i] === '}' ? -1 : 0, i++;
  return (q.slice(start, i - 1).replace(/\{\s*value\s*\}/g, '').match(/\w+/g) ?? []).sort();
}

describe('RJ-07 ContactCard', () => {
  it('queries exactly the approved Contact fields', () => {
    expect(nodeFields(CONTACT_QUERY)).toEqual(APPROVED);
    expect(CONTACT_QUERY).not.toMatch(/Birthdate|MailingAddress|Demo_National_Id__c/);
  });

  it('loads through that query, logs nothing and renders no sensitive values', async () => {
    const spies = (['log', 'info', 'debug', 'warn'] as const).map(m => vi.spyOn(console, m).mockImplementation(() => {}));
    (executeGraphQL as any).mockResolvedValue({
      uiapi: { query: { Contact: { edges: [{ node: { Id: '003xx0000000001AAA', Name: { value: 'Demo Contact' }, Email: { value: 'demo.contact@demo.example' }, Phone: { value: '555-0100' }, Birthdate: { value: '1990-01-01' }, Demo_National_Id__c: { value: 'DEMO-NID-PLACEHOLDER' } } }] } } },
    });
    const contact = await loadContact('003xx0000000001AAA');
    expect((executeGraphQL as any).mock.calls[0][0]).toBe(CONTACT_QUERY);
    const { container } = render(<ContactCard contact={contact} />);
    expect(container.querySelector('.phone')!.textContent).toBe('555-0100');
    expect(container.textContent).not.toContain('1990-01-01');
    expect(container.textContent).not.toContain('DEMO-NID-PLACEHOLDER');
    spies.forEach(s => {
      expect(s).not.toHaveBeenCalled();
      s.mockRestore();
    });
  });
});
