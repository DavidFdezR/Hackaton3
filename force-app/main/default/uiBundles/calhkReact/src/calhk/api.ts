import { createDataSDK } from '@salesforce/platform-sdk';
import { executeGraphQL } from '@/api/graphqlClient';

/**
 * Data access for the CalHack React components. Records come from the UI API GraphQL endpoint
 * (respects the user's sharing and field access). Apex is reached only through the org's own
 * REST path via the SDK fetch, never through an outside host.
 */
type Field<T> = { value: T | null } | null;
const v = <T,>(f: Field<T>): T | null => (f ? f.value : null);
type Edges<N> = { edges: { node: N }[] };

/** Fields the Contact card may read. A test pins this list; changes show up in review. */
export const CONTACT_FIELDS = ['Name', 'Email', 'Phone'] as const;

export const CONTACT_QUERY = `query CalhkContact($id: ID) {
  uiapi { query { Contact(where: { Id: { eq: $id } }, first: 1) { edges { node { Id ${CONTACT_FIELDS.map(f => `${f} { value }`).join(' ')} } } } } }
}`;

export const DEMO_QUERY = `query CalhkDemo {
  uiapi { query {
    Account(where: { Name: { eq: "Demo Acme" } }, first: 1) { edges { node { Id Name { value } Billing_Portal_URL__c { value } } } }
    Case(where: { Subject: { eq: "Demo login issue" } }, first: 1) { edges { node { Id CaseNumber { value } Subject { value } Status { value } Notes__c { value } } } }
    Contact(where: { Email: { eq: "demo.contact@demo.example" } }, first: 1) { edges { node { Id } } }
    Order(first: 1, orderBy: { CreatedDate: { order: DESC } }) { edges { node { Id OrderNumber { value } Status { value } } } }
  } }
}`;

export const INVOICE_QUERY = `query CalhkInvoices($accountId: ID, $name: String) {
  uiapi { query { CalHK_Invoice__c(where: { and: [ { Account__c: { eq: $accountId } }, { Name: { like: $name } } ] }, first: 50, orderBy: { Name: { order: ASC } }) {
    edges { node { Id Name { value } Amount__c { value } Status__c { value } } } } } }
}`;

export interface DemoRecords {
  account: { id: string; name: string | null; portalUrl: string | null } | null;
  caseRecord: { id: string; caseNumber: string | null; subject: string | null; status: string | null; notes: string | null } | null;
  contactId: string | null;
  order: { id: string; orderNumber: string | null; status: string | null } | null;
}

export async function loadDemoRecords(): Promise<DemoRecords> {
  type R = { uiapi: { query: Record<string, Edges<Record<string, any>>> } };
  const q = (await executeGraphQL<R, Record<string, never>>(DEMO_QUERY)).uiapi.query;
  const first = (k: string) => q[k]?.edges?.[0]?.node ?? null;
  const a = first('Account');
  const c = first('Case');
  const o = first('Order');
  return {
    account: a && { id: a.Id, name: v(a.Name), portalUrl: v(a.Billing_Portal_URL__c) },
    caseRecord: c && { id: c.Id, caseNumber: v(c.CaseNumber), subject: v(c.Subject), status: v(c.Status), notes: v(c.Notes__c) },
    contactId: first('Contact')?.Id ?? null,
    order: o && { id: o.Id, orderNumber: v(o.OrderNumber), status: v(o.Status) },
  };
}

export interface Contact { id: string; name: string | null; email: string | null; phone: string | null }

export async function loadContact(id: string): Promise<Contact | null> {
  type R = { uiapi: { query: { Contact: Edges<Record<string, any>> } } };
  const n = (await executeGraphQL<R, { id: string }>(CONTACT_QUERY, { id })).uiapi.query.Contact.edges[0]?.node;
  return n ? { id: n.Id, name: v(n.Name), email: v(n.Email), phone: v(n.Phone) } : null;
}

export interface Invoice { id: string; name: string | null; amount: number | null; status: string | null }

export async function searchInvoices(accountId: string, term: string): Promise<Invoice[]> {
  type R = { uiapi: { query: { CalHK_Invoice__c: Edges<Record<string, any>> } } };
  const name = `%${term.replace(/[%_]/g, '')}%`;
  const res = await executeGraphQL<R, { accountId: string; name: string }>(INVOICE_QUERY, { accountId, name });
  return res.uiapi.query.CalHK_Invoice__c.edges.map(({ node }) => ({ id: node.Id, name: v(node.Name), amount: v(node.Amount__c), status: v(node.Status__c) }));
}

/** Same-origin call to the org's Apex REST endpoint through the SDK's session-aware fetch. */
async function orgFetch(path: string, init?: RequestInit): Promise<Record<string, any>> {
  const sdk = await createDataSDK();
  if (!sdk.fetch) throw new Error('Salesforce fetch is not available');
  const res = await sdk.fetch(`/services/apexrest/calhk/${path}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error('request failed');
  return body;
}

export async function getRate(symbol: string): Promise<number> {
  return Number((await orgFetch(`fx?symbol=${encodeURIComponent(symbol)}`)).rate);
}

export async function createPaymentToken(last4: string): Promise<{ token: string; last4: string }> {
  const body = await orgFetch('payment-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ last4 }) });
  return { token: String(body.token), last4: String(body.last4) };
}
