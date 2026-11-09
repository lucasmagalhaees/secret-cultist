/* D138: login (Supabase Auth, the lore-enhancer project). Nobody plays without logging in; a pedestrian (the demo
   account of the portfolio) sees only Secret Cultist, a driver sees everything: Supabase gives the expansion's key only
   to a driver (table game_secrets, row-level security on the role). The role is read from the session the person got,
   so it only decides what the page shows; what is really kept back is the key. The tests log in with window.__AUTH. */
import { Core } from '../core';
import type { Json } from '../core/types';

export const AUTH_URL = 'https://ydzqrfkcsrochzwegrig.supabase.co';
/** The publishable key: public by design (Supabase's own name for it), given at build time. */
export const AUTH_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
/** The demo account, shown on the login page on purpose (D138): a pedestrian. */
export const DEMO = { email: 'visitante@secretcultist.app', password: 'cthulhu-fhtagn-1928' };
const SESSION = 'secretcultist.session.v1', DLC = 'secretcultist.dlc.v1';
export const AUTH_WAIT = 10000;

export type Role = 'driver' | 'pedestrian';
export interface Session { token: string; refresh: string; exp: number; email: string; role: Role }

const get = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string | null): void => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage may be off */ } };

/** The session on this device (a test's window.__AUTH first), or null. An expired one still opens the game offline. */
export function session(): Session | null {
  const t = (globalThis as { __AUTH?: Partial<Session> }).__AUTH;
  if (t && t.email) return { token: 't', refresh: 'r', exp: Infinity, role: t.role === 'driver' ? 'driver' : 'pedestrian', email: t.email };
  try { return Core.normSession(JSON.parse(get(SESSION) || 'null')); } catch { return null; }
}

async function call(path: string, init: RequestInit, token?: string): Promise<Json> {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), AUTH_WAIT);
  try {
    const r = await fetch(AUTH_URL + path, { ...init, signal: ctl.signal, headers: { apikey: AUTH_KEY, 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) } });
    const body = await r.json().catch(() => null);
    if (!r.ok) throw new Error(r.status === 400 || r.status === 401 ? 'E-mail ou senha errados.' : `O login respondeu ${r.status}.`);
    return body;
  } catch (e) {
    throw new Error(e instanceof Error && e.message.includes('.') ? e.message : 'Sem conexão com o login.');
  } finally { clearTimeout(t); }
}

/** The expansion's key for a driver, kept on the device so the expansion opens offline too. */
async function fetchDlc(s: Session): Promise<void> {
  if (s.role !== 'driver') return;
  const key = Core.normSecret(await call('/rest/v1/game_secrets?name=eq.secret-cultist-dlc&select=value', { method: 'GET' }, s.token));
  if (key && await Core.openDlc(key)) put(DLC, key);
}

export async function login(email: string, password: string): Promise<Session> {
  const s = Core.normSession(await call('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) }));
  if (!s) throw new Error('O login respondeu algo que o app não entende.');
  put(SESSION, JSON.stringify(s));
  await fetchDlc(s).catch(() => undefined);
  return s;
}

/** Leaves: tells Supabase (if it can), forgets the session and the expansion's key, and reloads the page. */
export async function logout(): Promise<void> {
  const s = session();
  if (s && s.token !== 't') await call('/auth/v1/logout', { method: 'POST' }, s.token).catch(() => undefined);
  put(SESSION, null); put(DLC, null);
  location.reload();
}

/** At start: the expansion's key kept by a driver's login (or a test's window.__DLC) opens the expansion. */
export async function openKept(): Promise<boolean> {
  const s = session(), t = (globalThis as { __DLC?: unknown }).__DLC;
  const key = typeof t === 'string' ? t : s?.role === 'driver' ? get(DLC) : null;
  return !!key && !!(await Core.openDlc(key));
}
