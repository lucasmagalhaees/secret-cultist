import { Core } from '../core';
import { ARAB, CLERIC, RUSSIAN } from './art';
import type { Breaker, Entry, Game, Json, Region, Sheet } from '../core';

/* ================= the outside source =================
   Every call goes through getJSON. What comes back is read only by the normalisers of src/core/source.ts. The entries
   source is still empty (SOURCE): nothing is asked for it. D94: the character sheets come from the cthulhu-caracter-
   sheet API (SHEETS). */
export const SOURCE = '';
export const SHEETS = 'https://cthulhu-char-golang.vercel.app/char-generator/random-char';
/** D99: the health check of the sheets API: answers without building a sheet. */
export const HEALTH = 'https://cthulhu-char-golang.vercel.app/char-generator/health';
/** D99: how many sheets of each region are kept on the device, to play Secret Cultist while the API is down. */
export const POOL_MAX = 10;
/** D108: the API sleeps when idle and takes about 10 s to wake (a Java container starting cold): every call waits this long. */
export const COLD = 20000;
/** How long a call may take before it is given up. */
export const TIMEOUT = 12000;
export async function getJSON(url: string, ms?: number): Promise<Json> {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms || TIMEOUT);
  try { const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
/** The entries the source lists, read; with no source, none. */
export async function loadEntries(): Promise<Entry[]> { return SOURCE ? Core.normEntries(await getJSON(SOURCE)) : []; }

/** D94: the region of the API a seat's sheet is asked in: the continent of the game, and for the names with a country of
 *  their own, that country's (the Russians, the Arab leaders). The whole world and Oceania ask for any. */
export function sheetRegion(name: string, region: Region | undefined): string {
  if (RUSSIAN.has(name)) return 'EASTERN_EUROPE';
  if (ARAB.has(name) || CLERIC.has(name)) return 'MIDDLE_EAST';
  return ({ americas: 'AMERICA', brasil: 'AMERICA', europa: 'WESTERN_EUROPE', asia: 'ASIA', africa: 'AFRICA' } as Record<string, string>)[region || ''] || '';
}
/** D95: the breaker of the sheets API, kept on the device so a closed app does not knock on a dead server again. */
const BREAKER_KEY = 'secretcultist.sheets.v1';
const readB = (): Breaker => { try { return Core.readBreaker(JSON.parse(localStorage.getItem(BREAKER_KEY) || 'null')); } catch { return Core.readBreaker(null); } };
const keepB = (b: Breaker): void => { try { localStorage.setItem(BREAKER_KEY, JSON.stringify(b)); } catch { /* storage may be off: the breaker lives for this page only */ } };
let breakerMem: Breaker | null = null;   // read on first use: nothing runs while the modules load
const getB = (): Breaker => (breakerMem ??= readB());
/** The feature toggle of the sheets: on while the API answers, off while the breaker is open. */
export const sheetsOn = (): boolean => Core.breakerAllows(getB(), Date.now());
const askSheet = async (name: string, g: Game): Promise<Sheet | null> => { const r = sheetRegion(name, g.region); return Core.normSheet(await getJSON(`${SHEETS}${r ? `?nativeLanguageRegion=${r}` : ''}`, COLD)); };
/** D99: is the API up? The health check first; a server without it (older deploy) is asked for one sheet instead. */
export async function healthy(): Promise<boolean> {
  try { const j = await getJSON(HEALTH, COLD); if (j && j.status === 'UP') return true; } catch { /* no health route: try a sheet */ }
  try { return !!Core.normSheet(await getJSON(SHEETS, COLD)); } catch { return false; }
}
/* D99: sheets kept on the device, by region ('' = any), the newest last. While the API answers, games use fresh sheets
   and the pool is topped up; while it is down, a game draws its sheets from the pool. */
const POOL_KEY = 'secretcultist.sheets.pool.v1';
type Pool = Record<string, Sheet[]>;
const okSheet = (x: Json): boolean => !!x && typeof x === 'object' && !!x.vals && typeof x.native === 'string' && ['Persuade', 'Fast Talk', 'Charm', 'Psychology'].every(k => Number.isFinite(x.vals[k]));
const readPool = (): Pool => { try { const j = JSON.parse(localStorage.getItem(POOL_KEY) || '{}'), out: Pool = {}; for (const k of Object.keys(j || {})) if (Array.isArray(j[k])) out[k] = j[k].filter(okSheet).slice(-POOL_MAX); return out; } catch { return {}; } };
const keepPool = (p: Pool): void => { try { localStorage.setItem(POOL_KEY, JSON.stringify(p)); } catch { /* storage full or off: the pool is a bonus */ } };
export const poolSize = (): number => Object.values(readPool()).reduce((n, l) => n + l.length, 0);
function addToPool(region: string, sheets: Sheet[]): void {
  const p = readPool(); p[region] = [...(p[region] || []), ...sheets].slice(-POOL_MAX); keepPool(p);
}
/** D99: a table's sheets from the pool: the seat's region first, then any; a sheet may serve two seats. */
function fromPool(g: Game, rand: () => number): Record<number, Sheet> | null {
  const p = readPool(), any = Object.values(p).flat();
  if (!any.length) return null;
  const out: Record<number, Sheet> = {};
  g.players.forEach((pl, i) => { const l = p[sheetRegion(pl.name, g.region)]?.length ? p[sheetRegion(pl.name, g.region)] : any; out[i] = l[Math.floor(rand() * l.length)]; });
  return out;
}
/** D99: with the API up, sheets are fetched for later (on opening the app, and when it comes back to the front). */
/** D105: with a full pool, a few new sheets replace the oldest, at most once every WARM_EVERY. */
export const ROTATE = 3, WARM_EVERY = 30 * 60 * 1000;
let warmAt = 0;
export async function warmSheets(region: Region | undefined, now = Date.now()): Promise<void> {
  if (!sheetsOn() || now - warmAt < WARM_EVERY) return;
  warmAt = now;
  if (!(await healthy())) { breakerMem = Core.breakerFail(getB(), Date.now()); keepB(breakerMem); return; }
  breakerMem = Core.breakerOk(); keepB(breakerMem);
  const r = sheetRegion('', region), want = (readPool()[r]?.length ?? 0) >= POOL_MAX ? ROTATE : POOL_MAX, got = await Promise.all(Array.from({ length: want }, () => getJSON(`${SHEETS}${r ? `?nativeLanguageRegion=${r}` : ''}`, COLD).then(j => Core.normSheet(j)).catch(() => null)));
  addToPool(r, got.filter((s): s is Sheet => !!s));
}
/** D94, D95: one sheet for each seat. The first call is a probe: if it fails (or the breaker is open) no other goes out
 *  and the game plays without sheets, as before. If it answers, the others are asked at once; what fails then is left
 *  without a sheet, and the whole table goes without (half a table rolling would be unfair). */
export async function loadSheets(g: Game, rand: () => number): Promise<Record<number, Sheet> | null> {
  const live = await (async (): Promise<Record<number, Sheet> | null> => {
    if (!sheetsOn()) return null;
    let first: Sheet | null = null;
    try { first = await askSheet(g.players[0].name, g); } catch { first = null; }
    if (!first) { breakerMem = Core.breakerFail(getB(), Date.now()); keepB(breakerMem); return null; }
    breakerMem = Core.breakerOk(); keepB(breakerMem);
    const rest = await Promise.all(g.players.slice(1).map(p => askSheet(p.name, g).catch(() => null)));
    if (rest.some(s => !s)) return null;
    const out: Record<number, Sheet> = { 0: first };
    rest.forEach((s, k) => { out[k + 1] = s as Sheet; });
    return out;
  })();
  if (live) { g.players.forEach((p, i) => addToPool(sheetRegion(p.name, g.region), [live[i]])); return live; }   // D99: the fresh ones go to the pool
  return fromPool(g, rand);
}
