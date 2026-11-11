/* D144: Secret Leônidas with gods and oracles, a toggle of its own. A patron god watches each game and the narrator
   tells each decree in its voice; once per game, the person playing alone may consult the oracle of Delphi. Like the
   gods of Secret Cultist, none of this changes who dies, which decree passes or who wins: the oracle only tells the
   truth, in a riddle, and only to the one who asked. The narrator says only what the whole table saw. */
import type { Event, Game } from './types';
import { knows, partyOf } from './game';
import { suspicion } from './review';

export type OlympianId = 'atena' | 'ares' | 'apolo' | 'hermes' | 'poseidon' | 'zeus';
/** Each patron: its name, what it favors, an omen for a decree of Athens and one for a decree of Sparta. */
export const OLYMPIANS: Record<OlympianId, { name: string; is: string; L: string; F: string }> = {
  atena: { name: 'Atena', is: 'a deusa da cidade e da razão', L: 'Uma coruja pousa no Pnyx e não sai mais', F: 'A oliveira da Acrópole perde as folhas de uma vez' },
  ares: { name: 'Ares', is: 'o deus da guerra, que não escolhe lado', L: 'Os escudos do templo tremem e ficam quietos', F: 'Ouve-se, ao longe, o passo de uma falange' },
  apolo: { name: 'Apolo', is: 'o deus da verdade e da luz', L: 'O sol rompe as nuvens bem em cima da Assembleia', F: 'A lira do templo arrebenta uma corda sozinha' },
  hermes: { name: 'Hermes', is: 'o deus dos mensageiros e dos mentirosos', L: 'Um mensageiro chega correndo, com boas notícias, e some', F: 'Uma carta lacrada com um lambda aparece no meio dos votos' },
  poseidon: { name: 'Poseidon', is: 'o deus do mar, de quem a frota depende', L: 'O mar fica liso no Pireu, e a frota sai sem medo', F: 'Uma onda alta demais quebra no porto, sem vento' },
  zeus: { name: 'Zeus', is: 'o rei dos deuses, que pesa tudo', L: 'Um trovão rola, longe, e parece um aplauso', F: 'Um raio cai no Areópago, e ninguém se mexe' }
};
const IDS = Object.keys(OLYMPIANS) as OlympianId[];

/** At the start of a Secret Leônidas game with the gods on: the patron is drawn and named. */
export function olympus(g: Game, rand: () => number, on: boolean | undefined): Game {
  if (!on || g.pack !== 'esparta' || g.olymp || g.hist.length) return g;
  const id = IDS[Math.floor(rand() * IDS.length)], o = OLYMPIANS[id];
  return { ...g, olymp: id, chron: g.hist.length, log: [...g.log, `🏛 Esta Assembleia está sob os olhos de ${o.name}, ${o.is}. Uma vez na partida, quem joga sozinho pode consultar o oráculo de Delfos.`] };
}

/** The narrator's line for each decree not told yet, in the voice of the patron. */
export function olympusTell(g: Game): Game {
  const o = g.olymp ? OLYMPIANS[g.olymp as OlympianId] : undefined;
  if (!o) return g;
  const from = g.chron ?? g.hist.length, lines: string[] = [];
  for (let k = from; k < g.hist.length; k++) {
    const e: Event = g.hist[k];
    if ((e.k === 'gov' || e.k === 'chaos') && e.law) lines.push(`🏛 ${e.law === 'L' ? o.L : o.F}.`);
  }
  return from === g.hist.length ? g : { ...g, chron: g.hist.length, log: [...g.log, ...lines] };
}

/** The person playing alone, or -1. */
const soloOf = (g: Game): number => { const p = g.players.map((x, i) => (x.ai ? -1 : i)).filter(i => i >= 0); return p.length === 1 ? p[0] : -1; };
/** The oracle may be consulted once, after the second decree, by the person playing alone and still in the game. */
export function canConsult(g: Game): boolean {
  const me = soloOf(g);
  return !!g.olymp && !g.oracle && me >= 0 && g.players[me].alive && g.phase !== 'over' && g.laws.L + g.laws.F >= 2;
}
/** The answer of the oracle, always true and never whole: to someone who does not know the Spartans, two names of
 *  whom at least one serves Sparta; to someone who knows them, which player of the app trusts them the least. */
export function consult(g: Game, rand: () => number): Game {
  if (!canConsult(g)) return g;
  const me = soloOf(g), name = (i: number): string => g.players[i].name, team = knows(g, me).length > 0;
  let text: string;
  if (team || partyOf(g.players[me].role) === 'F') {
    const s = suspicion(g, me).filter(x => x.seat !== me && g.players[x.seat].alive).sort((a, b) => b.f - a.f)[0];
    text = s ? `A Pítia sussurra: “Os olhos de ${name(s.seat)} estão em você. Cuidado com o que mostra.”` : 'A Pítia fica em silêncio. Ninguém olha para você, por enquanto.';
  } else {
    const alive = g.players.map((_, i) => i).filter(i => i !== me && g.players[i].alive);
    const hid = alive.filter(i => partyOf(g.players[i].role) === 'F'), other = alive.filter(i => !hid.includes(i) || hid.length > 1);
    const a = hid[Math.floor(rand() * hid.length)], rest = other.filter(i => i !== a), b = rest[Math.floor(rand() * rest.length)];
    const pair = rand() < 0.5 ? [a, b] : [b, a];
    text = a === undefined || b === undefined ? 'A Pítia fica em silêncio.' : `A Pítia, entre fumaça: “Entre ${name(pair[0])} e ${name(pair[1])}, ao menos um serve a Esparta.”`;
  }
  return { ...g, oracle: { at: g.hist.length, text }, log: [...g.log, `🏛 ${name(me)} subiu a Delfos e consultou o oráculo.`] };
}
