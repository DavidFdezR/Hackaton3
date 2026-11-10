import { useState } from 'react';
import { ExternalLink, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui';
import { ErrorAlert, Panel } from '../ui';
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
    <Panel title="Account actions" description="Partner-editable link, checked against the allowlist" icon={Landmark}>
      <p className="domain text-muted-foreground">
        Goes to: <Badge variant="outline">{describeHost(portalUrl)}</Badge>
      </p>
      <Button type="button" variant="outline" onClick={handleOpen}>
        <ExternalLink aria-hidden />
        Open billing portal
      </Button>
      {blocked && <ErrorAlert>{blocked}</ErrorAlert>}
    </Panel>
  );
}
