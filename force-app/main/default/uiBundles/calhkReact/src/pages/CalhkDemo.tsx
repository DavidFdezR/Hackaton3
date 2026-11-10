import { useCallback } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { createDataSDK } from '@salesforce/platform-sdk';
import { loadContact, loadDemoRecords, searchInvoices } from '@/calhk/api';
import { CaseNotes } from '@/calhk/components/CaseNotes';
import { CaseDetails } from '@/calhk/components/CaseDetails';
import { CaseFiles } from '@/calhk/components/CaseFiles';
import { AccountActions } from '@/calhk/components/AccountActions';
import { InvoiceSearch } from '@/calhk/components/InvoiceSearch';
import { ContactCard } from '@/calhk/components/ContactCard';
import { OrderStatus } from '@/calhk/components/OrderStatus';
import { OrderContext } from '@/calhk/components/OrderContext';
import { AgentReply } from '@/calhk/components/AgentReply';
import { Pricing } from '@/calhk/components/Pricing';
import { PaymentForm } from '@/calhk/components/PaymentForm';

const SAMPLE_REPLY =
  'Summary: the invoice PDF will not open. ![status](https://cms-assets.demo.example/s.png?c=) See [help](https://docs.calhk-demo.example/help).';

/** Stores the file on the Case through the org REST API (same origin, user session). */
async function uploadToCase(caseId: string, file: File): Promise<string> {
  const sdk = await createDataSDK();
  if (!sdk.fetch) throw new Error('Salesforce fetch is not available');
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const res = await sdk.fetch('/services/data/v66.0/sobjects/ContentVersion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Title: file.name, PathOnClient: file.name, VersionData: data, FirstPublishLocationId: caseId }),
  });
  if (!res.ok) throw new Error('upload failed');
  const { id } = await res.json();
  const doc = await sdk.fetch(`/services/data/v66.0/sobjects/ContentVersion/${id}?fields=ContentDocumentId`);
  return (await doc.json()).ContentDocumentId;
}

export default function CalhkDemo() {
  const demo = useAsyncData(loadDemoRecords, []);
  const contactId = demo.data?.contactId ?? null;
  const contact = useAsyncData(() => (contactId ? loadContact(contactId) : Promise.resolve(null)), [contactId]);
  // A real page would hand the validated orderId to the agent; the card itself shows what was received.
  const onContext = useCallback(() => undefined, []);

  if (demo.loading) return <p className="p-6 text-muted-foreground">Loading demo records…</p>;
  if (demo.error || !demo.data) return <p role="alert" className="p-6 text-red-700">Demo records could not be loaded. Create them with the commands in CALHACK.md.</p>;
  const { account, caseRecord, order } = demo.data;

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-6 md:grid-cols-2">
      <header className="space-y-1 md:col-span-2">
        <h1 className="text-2xl font-semibold">CalHack React demo</h1>
        <p className="text-muted-foreground">React versions of the calhk LWC components, reading the demo records through GraphQL and Apex REST. Synthetic data only.</p>
      </header>
      <CaseNotes notes={caseRecord?.notes ?? null} />
      <CaseDetails value={caseRecord} />
      {caseRecord && <CaseFiles upload={file => uploadToCase(caseRecord.id, file)} />}
      <AccountActions portalUrl={account?.portalUrl ?? null} />
      {account && <InvoiceSearch accountId={account.id} search={searchInvoices} />}
      <ContactCard contact={contact.data ?? null} />
      <OrderStatus orderNumber={order?.orderNumber ?? null} status={order?.status ?? null} />
      <OrderContext onContext={onContext} onRefund={() => undefined} />
      <AgentReply reply={SAMPLE_REPLY} />
      <Pricing />
      <PaymentForm />
    </div>
  );
}
