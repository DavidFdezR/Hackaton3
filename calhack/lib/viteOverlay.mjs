/**
 * Vite/Vitest plugin for CalHack red/green runs. When CALHACK_OVERLAY points at a seed overlay,
 * any source file inside it replaces the repo file at the same path, and imports made from an
 * overlay file resolve as if it lived in the repo. Without CALHACK_OVERLAY it does nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function calhackOverlay() {
  const raw = process.env.CALHACK_OVERLAY;
  if (!raw) return { name: 'calhack-overlay' };
  const overlay = path.resolve(REPO_ROOT, raw);
  const toRepo = (p) => (p && p.startsWith(overlay + path.sep) ? path.join(REPO_ROOT, path.relative(overlay, p)) : p);
  return {
    name: 'calhack-overlay',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source.startsWith('\0')) return null;
      const resolved = await this.resolve(source, toRepo(importer), { ...options, skipSelf: true });
      if (!resolved || resolved.external) return resolved;
      const id = resolved.id.split('?')[0];
      if (!id.startsWith(REPO_ROOT + path.sep) || id.includes(`${path.sep}node_modules${path.sep}`)) return resolved;
      const candidate = path.join(overlay, path.relative(REPO_ROOT, id));
      return fs.existsSync(candidate) ? { ...resolved, id: candidate } : resolved;
    },
  };
}
