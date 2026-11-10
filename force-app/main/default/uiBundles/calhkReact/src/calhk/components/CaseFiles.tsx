import { useState, type ChangeEvent } from 'react';
import { Paperclip } from 'lucide-react';
import { Input, Label } from '@/components/ui';
import { ErrorAlert, Panel, fieldClass } from '../ui';

export interface UploadedFile { documentId: string; name: string }

/**
 * R-09 · File names are user-controlled text: shown as text only. `upload` stores the file and
 * returns its ContentDocumentId; `onRegister` receives only that Id, never the name.
 */
export function CaseFiles({ upload, onRegister }: {
  upload: (file: File) => Promise<string>;
  onRegister?: (contentDocumentId: string) => Promise<unknown>;
}) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    for (const file of Array.from(event.target.files ?? [])) {
      try {
        const documentId = await upload(file);
        setFiles(prev => [...prev, { documentId, name: file.name }]);
        if (onRegister) await onRegister(documentId);
      } catch {
        setError('File could not be uploaded.');
      }
    }
  };

  return (
    <Panel title="Case files" description="File names are shown as text only" icon={Paperclip}>
      <div className={fieldClass}>
        <Label htmlFor="calhk-files">Attach files</Label>
        <Input id="calhk-files" type="file" multiple onChange={handleChange} />
      </div>
      {files.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {files.map(f => <li key={f.documentId} className="file-name">{f.name}</li>)}
        </ul>
      )}
      {error && <ErrorAlert>{error}</ErrorAlert>}
    </Panel>
  );
}
