import { dlcLooks } from './art';
import { Core } from '../core';
import { session } from './auth';
import type { AppState, Game, Speed, Theme, Pack } from '../core';

/* ================= what is kept, and what is on screen =================
   This module is one of the two that run code while loading (the other is src/main.ts): it reads what is saved and
   applies the theme. Nothing else in src/app/ calls another module at the top of the file. */
export const LS = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(k: string): any { try { return JSON.parse(localStorage.getItem(k) as string); } catch (e) { return null; } },
  set(k: string, v: unknown): boolean { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
/** Everything kept on the device: the table and the game in course. Replacing it goes through setS. */
/* D100: the app had another name before; what it kept on the device under that name is read once, with the old words of
   the expansion turned into the new ones, and an old game without a theme gets the one it had then. The old words are
   written scrambled, like the expansion's (src/core/dlc.ts). */
const OLD = (k: string): string => atob(k);
function migrate(key: string, old: string, game: boolean): void {
  try {
    if (localStorage.getItem(key) !== null) return;
    let raw = localStorage.getItem(OLD(old));
    if (raw === null) return;
    for (const [a, z] of [['aGl0bGVy', 'lider'], ['ZmFzY2lzdGE=', 'cultista'], ['ZmFzY2lzbW8=', 'classico'], ['Y29tdW5pc21v', 'vermelho']]) raw = raw.split(`"${OLD(a)}"`).join(`"${z}"`);
    const v = JSON.parse(raw);
    const fix = (g: { pack?: string } | null): void => { if (g && typeof g === 'object' && !g.pack) g.pack = 'classico'; };
    if (game) fix(v && v.game); else if (Array.isArray(v)) v.forEach((x: { game?: { pack?: string } }) => fix(x && x.game ? x.game : null));
    localStorage.setItem(key, JSON.stringify(v));
  } catch { /* storage off or damaged: start fresh */ }
}
migrate('secretcultist.v1', 'c2VjcmV0aGl0bGVyLnYx', true);
migrate('secretcultist.history.v1', 'c2VjcmV0aGl0bGVyLmhpc3RvcnkudjE=', false);
export let S: AppState = Core.readState(LS.get('secretcultist.v1'));
/** D98, D138: the public face of the app is Secret Cultist; the historical themes (Leader, Red Leader) open only with the
 *  expansion's key, which Supabase gives to a driver (src/app/auth.ts). The tests give it with window.__DLC. */
let looked = false;
export const dlcOn = (): boolean => {
  const d = Core.dlcData();
  if (d && !looked) { looked = true; dlcLooks(d); }   // D100: the expansion's faces, once it is open
  return !!d;
};
/** D139: the themes this visitor may play: the public page has only Secret Leônidas; logged in, also Secret Cultist and,
 *  with the expansion's key, the historical themes. */
export const packsOpen = (): Pack[] => (session() ? (['esparta', 'culto', ...(dlcOn() ? ['classico', 'vermelho'] : [])] as Pack[]) : ['esparta']);
export const packNow = (): Pack => { const open = packsOpen(), want = S.pack || (session() ? 'culto' : 'esparta'); return open.includes(want) ? want : open[0]; };
export const saveS = (): boolean => LS.set('secretcultist.v1', S);
export function setS(next: AppState): void { S = next; }

/** What is on screen: nothing here is saved, so a reload always closes whatever secret was open.
 *  `open` is the secret screen being shown (see gateKey in render.ts); `pick` the card or player tapped and not yet
 *  confirmed; `name` the name being typed on the table screen. */
export interface Ui { msg: string; name: string; open: string; pick: number | null; confirmEnd: boolean; help: boolean; undo: Game | null; busy: boolean; votes: Record<number, boolean>; think: number | null; more: boolean; rules: boolean; endTab: EndTab; allPlays: boolean; confirmClear: boolean; confirmWipe: boolean; gallery: boolean; diary: boolean; logFilter?: 'all' | 'talk' | 'gov'; court?: number | null; courtProof?: number[]; sheet?: number | null; evMore?: boolean; dpick?: string[]; dmore?: boolean; pastAll?: boolean; quickMode?: 'culto' | 'mix' | 'esparta'; stereoOpen?: boolean; playMode?: 'avulsa' | 'campanha'; courtTone?: 'soft' | 'firm' | 'proof'; debate?: number | null; frozen?: number; pleaTo?: number | null; talk?: boolean; blocSel?: number[]; seed?: number; proof?: boolean; loginErr?: string; loginBusy?: boolean; loginEmail?: string }
/** The tabs at the end of a game (D18): the result, the whole game, the record. */
export type EndTab = 'res' | 'jogo' | 'log';
/** `help` is the explanation of the phase, open or not; `undo` the game as it was before the last public choice (a
 *  nomination or a vote result), which can be taken back until anything else happens; `busy` holds taps while a
 *  discarded card is still falling; `votes` the votes the people at a table with app players have tapped and not yet
 *  counted; `think`, when set, how long an app player takes to act (the tests set 0); unset, the speed chosen;
 *  `more` the other choices of a game against the app shown, `rules` the rules shown, `endTab` the tab at the end (D18); `allPlays` every play of
 *  the review shown, not only the main ones (D19). */
export const THINK = 1200;
/** How long an app player takes to act at each speed (D13), so a person can follow; normal is THINK. */
export const SPEEDS: Record<Speed, number> = { lenta: 2400, normal: THINK, rapida: 500 };
/** After an app player tells the table what it got (a hand, an investigation, a spying), the next one waits this much
 *  longer at each speed, so the people can read it (D21). */
export const CLAIM_HOLD: Record<Speed, number> = { lenta: 4000, normal: 2500, rapida: 1500 };
export const ui: Ui = { msg: '', name: '', open: '', pick: null, confirmEnd: false, help: false, undo: null, busy: false, votes: {}, think: null, more: false, rules: false, endTab: 'res', allPlays: false, confirmClear: false, confirmWipe: false, gallery: false, diary: false };

/** The theme (the device's, unless one was chosen) and the style. Both go on <html>, and into the colour of the browser bars. */
export function applyTheme(): void {
  const t: Theme | undefined = S.theme, root = document.documentElement, deco = S.look === 'deco';
  if (t) root.dataset.theme = t; else delete root.dataset.theme;
  root.dataset.look = deco ? 'deco' : 'poster';
  const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name=theme-color]')) m.content = deco ? (dark ? '#070a12' : '#121a2e') : dark ? '#0d0b09' : '#1d1a17';
}
applyTheme();
