/* The finished games kept on this device, for export (D23). Nothing leaves the device by itself: the person exports
   a file and sends it on, so the players run by the app can be tuned to how people really play. Kept apart from the
   state of the app, under its own key, so a long list never slows down saving a move. */
import { Core } from '../core';
import type { Game, Saved } from '../core';
import { LS } from './state';
import { builtFrom } from './update';

let count: number | null = null;
const list = (): Saved[] => Core.readHistory(LS.get('secretcultist.history.v1'));
/** How many finished games are kept (read once, then kept up to date). */
export function kept(): number {
  if (count === null) count = list().length;
  return count;
}
/** D104: the kept games, for the screen of past games. */
export const past = (): Saved[] => list();
/** A game just ended: kept, the oldest dropped past HISTORY_MAX, and more of them if the device runs out of room. */
export function keep(g: Game): void {
  let all = [...list(), { at: Date.now(), game: g }].slice(-Core.HISTORY_MAX);
  while (all.length && !LS.set('secretcultist.history.v1', all)) all = all.slice(1);
  count = all.length;
}
export function wipe(): void { LS.set('secretcultist.history.v1', []); count = 0; }
/** The games as a file: shared (the phone's share sheet, where it can share files), or downloaded. */
export async function exportGames(): Promise<void> {
  const now = Date.now(), day = new Date(now).toISOString().slice(0, 10);
  const file = new File([JSON.stringify(Core.historyFile(list(), builtFrom(), now))], `secret-cultist-partidas-${day}.json`, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try { await nav.share({ files: [file], title: 'Partidas do Secret Cultist' }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Every achievement earned in the games kept on the device (D41), each counted once, by the person who played alone. */
export function earned(): Set<string> {
  const out = new Set<string>();
  for (const r of list()) { const me = r.game.players.findIndex(p => !p.ai); if (me >= 0 && r.game.players.filter(p => !p.ai).length === 1) Core.achievements(r.game, me).forEach(a => out.add(a)); }
  return out;
}
/** The result as a picture to send to the group (D41): who won, the person's role, the notebook and the achievements,
 *  drawn on a canvas and shared where the phone allows, else downloaded. Only what the end of the game shows. */
export async function shareResult(g: Game, me: number, words: { boss: string; f: string; theme: string }): Promise<void> {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1080;
  const x = c.getContext('2d'); if (!x) return;
  const p = g.players[me], won = Core.partyOf(p.role) === g.winner, side = p.role === 'liberal' ? 'Liberal' : p.role === 'lider' ? words.boss : words.f[0].toUpperCase() + words.f.slice(1);
  x.fillStyle = '#14110e'; x.fillRect(0, 0, 1080, 1080);
  x.fillStyle = won ? '#2f9e5b' : '#d63c2b'; x.fillRect(0, 0, 1080, 18); x.fillRect(0, 1062, 1080, 18);
  x.textAlign = 'center'; x.fillStyle = '#f3e8d0';
  x.font = '900 64px Arial Black, Impact, sans-serif'; x.fillText(words.theme.toUpperCase(), 540, 150);
  x.font = '900 120px Arial Black, Impact, sans-serif'; x.fillStyle = won ? '#8fd4a8' : '#ff7a59'; x.fillText(won ? 'VENCI!' : 'PERDI!', 540, 360);
  x.fillStyle = '#f3e8d0'; x.font = '700 56px Arial, sans-serif'; x.fillText(`Eu era ${side}`, 540, 470);
  const sc = g.notes ? Core.notesScore(g, me) : null, n = sc ? sc.right.length + sc.wrong.length : 0;
  if (n) x.fillText(`Caderno: ${sc?.right.length} de ${n} certas`, 540, 560);
  x.font = '700 40px Arial, sans-serif'; x.fillStyle = '#b9ab90'; x.fillText(g.why, 540, 660, 980);
  if (g.daily) { x.fillStyle = '#e8b730'; x.fillText(`Desafio do dia ${g.daily.split('-').reverse().join('/')}`, 540, 210); x.fillStyle = '#b9ab90'; }   // D148
  const got = Core.achievements(g, me);
  x.font = '800 44px Arial, sans-serif'; x.fillStyle = '#e8b730';
  got.slice(0, 3).forEach((a, k) => x.fillText(`🏅 ${Core.ACHIEVEMENTS[a][0]}`, 540, 780 + k * 70));
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/png'));
  if (!blob) return;
  const file = new File([blob], 'secret-cultist-resultado.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try { await nav.share({ files: [file], title: 'Minha partida' }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
