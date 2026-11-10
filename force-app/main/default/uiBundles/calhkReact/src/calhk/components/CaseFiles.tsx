import { useState, type ChangeEvent } from 'react';

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
    <section aria-label="Case files" className="rounded border p-3">
      <label>Attach files <input aria-label="Attach files" type="file" multiple onChange={handleChange} /></label>
      <ul>{files.map(f => <li key={f.documentId} className="file-name">{f.name}</li>)}</ul>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
