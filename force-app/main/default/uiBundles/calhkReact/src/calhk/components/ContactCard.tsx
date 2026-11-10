import { Mail, Phone, UserRound } from 'lucide-react';
import { Panel } from '../ui';
import type { Contact } from '../api';

/** R-07 · Shows only the approved Contact fields (the query itself requests only those). */
export function ContactCard({ contact }: { contact: Contact | null }) {
  return (
    <Panel title="Contact" description="Approved fields only: name, email, phone" icon={UserRound}>
      <p className="name text-base font-medium">{contact?.name ?? ''}</p>
      <p className="flex items-center gap-2 text-muted-foreground"><Mail className="size-4" aria-hidden /><span className="email">{contact?.email ?? ''}</span></p>
      <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4" aria-hidden /><span className="phone">{contact?.phone ?? ''}</span></p>
    </Panel>
  );
}
