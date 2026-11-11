/* D148: what the table can read at a glance, and the daily challenge. All of it from what the whole table saw: the
   laws, the governments and what each app player said out loud. Nothing of a role, a hand or a private reckoning. */
import type { Event, Game, Law, Talk } from './types';
import { partyOf } from './game';
import { words } from './words';

/** The seed of the day's challenge: the same date gives the same table, roles and deck to everyone. */
export function dailySeed(date: string): number {
  let h = 2166136261;
  for (const ch of `secret-daily-${date}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** How an app player stands toward `me`, by the last thing it said about `me` out loud: an accusation, trust, or
 *  nothing yet. It says nothing of its role, and it is what everyone heard. */
export function moodOf(g: Game, i: number, me: number): 'acc' | 'trust' | '' {
  if (i === me || !g.players[i]?.ai) return '';
  for (let k = g.hist.length - 1; k >= 0; k--) {
    const e = g.hist[k];
    if (e.k === 'talk' && e.by === i && e.about === me && e.say !== 'quiet') return (e as Talk).say as 'acc' | 'trust';
  }
  return '';
}

/** The turning point of a finished game: the law after which the winning side was ahead for good, with who passed it
 *  and how `me` voted on that government, when the vote was taken one by one. */
export function turning(g: Game, me: number): string {
  if (g.phase !== 'over' || !g.winner) return '';
  const w = words(g.pack, g.region), won = g.winner, lead = { L: 0, F: 0 };
  let at = -1;
  g.hist.forEach((e: Event, k) => {
    const law: Law | undefined = e.k === 'gov' || e.k === 'chaos' ? e.law : undefined;
    if (!law) return;
    const before = lead[won] > lead[won === 'L' ? 'F' : 'L'];
    lead[law]++;
    const after = lead[won] > lead[won === 'L' ? 'F' : 'L'];
    if (after && !before) at = k;
  });
  if (at < 0) return '';
  const e = g.hist[at], name = (i: number): string => (i === me ? 'você' : g.players[i].name);
  const kind = (l: Law): string => (l === 'L' ? 'lei liberal' : `lei ${w.f}`);
  if (e.k === 'chaos') return `A partida virou no caos: a lei do topo entrou sozinha, ${kind(e.law)}.`;
  if (e.k !== 'gov' || !e.law) return '';
  const v = [...g.hist.slice(0, at)].reverse().find(x => x.k === 'vote' && x.pres === e.pres && x.chanc === e.chanc) as Extract<Event, { k: 'vote' }> | undefined;
  const inGov = me === e.pres || me === e.chanc;
  const mine = inGov ? ' Você estava nesse governo.' : v && g.players[me].alive !== undefined && g.players.some(p => p.ai) ? ` Você votou ${v.ja.includes(me) ? w.ja : w.nein} nesse governo.` : '';
  const good = partyOf(g.players[me].role) === won;
  return `A partida virou quando ${name(e.pres)} e ${name(e.chanc)} aprovaram ${kind(e.law)}: dali em diante ${won === 'L' ? 'os liberais' : `os ${w.fs}`} ficaram na frente.${mine}${good ? '' : ' Foi ali que escapou.'}`;
}
