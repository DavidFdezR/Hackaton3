import type { ComponentType, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';

/** Card shell shared by the CalHack components (template shadcn/ui Card). */
export function Panel({ title, description, icon: Icon, className, children }: {
  title: string;
  description?: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card role="region" aria-label={title} className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

/** Generic, user-safe error message. Never pass server text here. */
export function ErrorAlert({ children }: { children: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export const fieldClass = 'grid gap-1.5';
export const selectClass =
  'border-input focus-visible:border-ring focus-visible:ring-ring h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3';
