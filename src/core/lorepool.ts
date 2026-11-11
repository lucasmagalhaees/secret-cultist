/* D149: the lines of the lore API kept on the device, so the narrator still has them when the API is down or slow. A
   line is kept with the names of the move turned into gaps ({pres}, {chanc}, {target}), under its moment and god, and
   filled with the names of the move it is used for. The newest few of each are kept. */
export type LorePool = Record<string, string[]>;
export const LORE_POOL_MAX = 6;
type Ask = { at: number; moment: string; god: string; names: Record<string, string> };
const key = (q: Ask): string => `${q.god}|${q.moment}`;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Keeps a line the API gave for this move, with its names as gaps. A line that names nobody of the move is kept as is. */
export function loreKeep(pool: LorePool, q: Ask, text: string): LorePool {
  let t = text;
  for (const [k, v] of Object.entries(q.names).sort((a, b) => b[1].length - a[1].length)) if (v) t = t.replace(new RegExp(esc(v), 'g'), `{${k}}`);
  const list = [t, ...(pool[key(q)] || []).filter(x => x !== t)].slice(0, LORE_POOL_MAX);
  return { ...pool, [key(q)]: list };
}

/** A kept line for this move, filled with its names; null when none fits (a gap with no name for it). */
export function lorePick(pool: LorePool, q: Ask, rand: () => number): string | null {
  const fits = (pool[key(q)] || []).filter(t => [...t.matchAll(/\{(\w+)\}/g)].every(m => !!q.names[m[1]]));
  if (!fits.length) return null;
  return fits[Math.floor(rand() * fits.length)].replace(/\{(\w+)\}/g, (_, k: string) => q.names[k]);
}

/** What was kept, read back from storage: anything that is not a list of strings is left out. */
export function readLorePool(x: unknown): LorePool {
  if (!x || typeof x !== 'object') return {};
  const out: LorePool = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) if (Array.isArray(v)) out[k] = v.filter((s): s is string => typeof s === 'string').slice(0, LORE_POOL_MAX);
  return out;
}
