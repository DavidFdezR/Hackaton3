// Types for the shared CalHack test helpers that live outside the bundle (calhack/lib).
declare module '@calhack/lib/repoFs.js' {
  const repoFs: { read(rel: string): string; exists(rel: string): boolean; find(re: RegExp): string[] };
  export default repoFs;
}
