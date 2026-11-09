/* The readers of the outside source: the one place that knows the shape of what it sends. If the source changes, the
   fix is here. A field is read only after a real answer with it has been recorded in tests/fixtures/source/ and
   checked by tests/contract.py. Until there is a source, this is the pattern to follow. */
import type { Entry, Json, Sheet } from './types';

/** One entry as the source sends it: `{ id, name, value }`. Anything else, or a field missing, reads as null. */
export function normEntry(j: Json): Entry | null {
  if (!j || typeof j !== 'object') return null;
  const id = j.id != null ? String(j.id) : '', name = typeof j.name === 'string' ? j.name.trim() : '', value = Number(j.value);
  return id && name && Number.isFinite(value) ? { id, name, value } : null;
}
/** A list of entries, as `{ items: [...] }`: what cannot be read is left out. */
export const normEntries = (j: Json): Entry[] => (j && Array.isArray(j.items) ? j.items.map(normEntry).filter((e: Entry | null): e is Entry => !!e) : []);

/** D94: a Call of Cthulhu character sheet, as the cthulhu-char-golang API sends it (GET /char-generator/random-char,
 *  recorded in tests/fixtures/source/): every characteristic and skill by its name, with its value (0 to 100), and the
 *  native language. A sheet without the skills the game uses reads as null. */
export function normSheet(j: Json): Sheet | null {
  if (!j || typeof j !== 'object') return null;
  const vals: Record<string, number> = {};
  for (const k of ['charFirst', 'charSecond', 'skillFirst', 'skillSecond']) {
    if (!Array.isArray(j[k])) return null;
    for (const a of j[k]) { const n = a && typeof a.attributeName === 'string' ? a.attributeName.trim() : '', v = Number(a?.mainValue); if (n && Number.isFinite(v)) vals[n] = Math.max(0, Math.min(100, Math.round(v))); }
  }
  const native = j.nativeLanguage && typeof j.nativeLanguage.detail === 'string' ? j.nativeLanguage.detail : '';
  return ['Persuade', 'Fast Talk', 'Charm', 'Psychology'].every(k => k in vals) ? { vals, native } : null;
}

/** D137: a line of the lore API (lore-enhancer): the text, or null when the answer is not one. */
export function normLore(j: Json): { text: string; sources: string[] } | null {
  if (!j || typeof j !== 'object' || typeof j.text !== 'string') return null;
  const text = j.text.trim();
  if (text.length < 3 || text.length > 600) return null;
  return { text, sources: Array.isArray(j.sources) ? j.sources.filter((x: Json) => typeof x === 'string') : [] };
}

/* D138: Supabase Auth. A password login answers the tokens and the user; the role is the user's app_metadata.role, set
   only by the project's owner, and anything else than driver is a pedestrian. */
export function normSession(j: Json): { token: string; refresh: string; exp: number; email: string; role: 'driver' | 'pedestrian' } | null {
  if (!j || typeof j !== 'object') return null;
  const token = j.access_token ?? j.token, refresh = j.refresh_token ?? j.refresh, user = j.user ?? {};
  const email = user.email ?? j.email, exp = typeof j.expires_at === 'number' ? j.expires_at * 1000 : typeof j.exp === 'number' ? j.exp : 0;
  if (typeof token !== 'string' || typeof refresh !== 'string' || typeof email !== 'string' || !email) return null;
  const role = (user.app_metadata?.role ?? j.role) === 'driver' ? 'driver' : 'pedestrian';
  return { token, refresh, exp, email, role };
}
/** D138: the expansion's key from game_secrets ([{ value }]), or null. */
export function normSecret(j: Json): string | null {
  const v = Array.isArray(j) && j[0] && typeof j[0] === 'object' ? j[0].value : null;
  return typeof v === 'string' && v.length >= 40 && v.length <= 60 ? v : null;
}
