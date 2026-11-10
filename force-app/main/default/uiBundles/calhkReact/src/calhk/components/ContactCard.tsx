import type { Contact } from '../api';

/** R-07 · Shows only the approved Contact fields (the query itself requests only those). */
export function ContactCard({ contact }: { contact: Contact | null }) {
  return (
    <section aria-label="Contact" className="rounded border p-3">
      <p className="name">{contact?.name ?? ''}</p>
      <p className="email">{contact?.email ?? ''}</p>
      <p className="phone">{contact?.phone ?? ''}</p>
    </section>
  );
}
