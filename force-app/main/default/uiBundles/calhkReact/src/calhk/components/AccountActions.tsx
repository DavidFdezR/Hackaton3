import { useState } from 'react';
import { describeHost, isAllowedUrl } from '../allowlist';

/** R-04 · Partner-editable billing URL: only allowlisted hosts open, the real domain is always shown. */
export function AccountActions({ portalUrl, open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer') }: {
  portalUrl: string | null;
  open?: (url: string) => void;
}) {
  const [blocked, setBlocked] = useState<string | null>(null);
  if (!portalUrl) return null;
  const handleOpen = () => {
    if (!isAllowedUrl(portalUrl)) {
      setBlocked(`Blocked: this link goes to ${describeHost(portalUrl)}, which is not an approved billing site.`);
      return;
    }
    setBlocked(null);
    open(portalUrl);
  };
  return (
    <section aria-label="Account actions" className="rounded border p-3">
      <button type="button" onClick={handleOpen}>Open billing portal</button>
      <p className="domain">Goes to: {describeHost(portalUrl)}</p>
      {blocked && <p role="alert">{blocked}</p>}
    </section>
  );
}
