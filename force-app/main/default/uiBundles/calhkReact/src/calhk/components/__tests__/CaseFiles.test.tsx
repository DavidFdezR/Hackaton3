/** RJ-09 · CaseFiles · A-318 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CaseFiles } from '../CaseFiles';
import { activeMarkup, untrusted } from './helpers';

describe('RJ-09 CaseFiles', () => {
  it('shows the A-318 file name as text and registers only the ContentDocumentId', async () => {
    const name = untrusted('A-318');
    const upload = vi.fn().mockResolvedValue('069xx0000000001AAA');
    const onRegister = vi.fn().mockResolvedValue('registered');
    const { container } = render(<CaseFiles upload={upload} onRegister={onRegister} />);

    fireEvent.change(screen.getByLabelText('Attach files'), { target: { files: [new File(['demo'], name)] } });

    await waitFor(() => expect(onRegister).toHaveBeenCalledTimes(1));
    expect(onRegister.mock.calls[0]).toEqual(['069xx0000000001AAA']);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.file-name')!.textContent).toBe(name);
    expect(activeMarkup(container)).toEqual([]);
  });
});
