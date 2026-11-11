/* The end of the game and the trainer (D13, D19, D28, D41, D43): what a careful player could work out, what the app
   players thought of the person, the review of each play, the notebook and the achievements. Moved out of the judge (D143). */
import { believe, socialMemory, drawOdds } from './ai';
// import { mad, canSteal, steal, itemOf, ITEMS } from './items';
import { sanity, SAN_LOW } from './dice';
// import { attack, cultDice, RANK, roll, ROLL_BONUS, ROLL_NAME, skillForArg, STRONG_ARG, WEAK_ARG, type Roll, type RollLevel } from './dice';
import { DECK_F, DECK_L, LEADER_ZONE, knows, partyOf, SMALL_TABLE } from './game';
import type { Event, Game, Gov, Law, Level, Party, View } from './types';
import { lastIndex, viewOf } from './judge';
/* ---------- the trainer, for the person (D13) ---------- */
export interface Coach {
  /** The chance of the hand the last president said they drew, counting the laws that could still come out. */
  odds: { who: number; said: number; p: number } | null;
  /** The last government's story does not hold together: one of the two lied (or a liberal law was thrown away). */
  clash: boolean;
  /** The last president passed one cultist and one liberal law though he says he drew 2 liberal ones: a chancellor test
   *  (D22), from a liberal testing or from someone hiding behind one. */
  test: boolean;
  /** Who looks most like the hidden side, by what this seat knows: the chance of each, highest first. */
  suspects: { seat: number; f: number; boss: number }[];
  /** How the table sees this seat, from what everyone saw: the chance it is on the hidden side. */
  seen: number;
}
/** What a careful player sitting at `seat` could work out from what that seat knows (its own view, nothing more). */
export function coach(g: Game, seat: number): Coach {
  const i = lastIndex(g, ['gov', 'veto']), e = g.hist[i] as Gov | undefined;
  let odds: Coach['odds'] = null, clash = false, test = false;
  if (e && e.pc !== undefined && e.pc >= 0) {
    const before = g.hist.slice(0, i), F = before.filter(x => (x.k === 'gov' || x.k === 'chaos') && x.law === 'F').length, L = before.filter(x => (x.k === 'gov' || x.k === 'chaos') && x.law === 'L').length;
    odds = { who: e.pres, said: e.pc, p: drawOdds(Math.max(0, DECK_F - F), Math.max(0, DECK_L - L))[e.pc] };
  }
  if (e && e.cc !== undefined && e.cc >= 0) {
    test = e.pc === 1 && e.cc === 1;
    clash = !test && ((e.pc !== undefined && e.pc >= 0 && Math.max(0, e.pc - 1) !== e.cc) || (e.law === 'F' && e.cc < 2));
  }
  const v = { ...viewOf(g, seat, 'vote', [1, 0]), level: 'extremo' as Level }, b = believe(v);
  const suspects = g.players.map((p, j) => ({ seat: j, f: b.pF[j], boss: b.pH[j], alive: p.alive }))
    .filter(x => x.seat !== seat && x.alive && v.known[x.seat] === null).sort((x, y) => y.f - x.f).slice(0, 3).map(({ seat: s, f, boss }) => ({ seat: s, f, boss }));
  return { odds, clash, test, suspects, seen: believe(v, true).pF[seat] };
}
/** At the end: how much each player run by the app that did not know `me` suspected them, from the start and after each
 *  law, investigation or elimination (the same reasoning those players used, from their own seats). */
export function thoughts(g: Game, me: number): { seat: number; series: number[] }[] {
  const marks = g.hist.map((e, i) => (e.k === 'gov' || e.k === 'veto' || e.k === 'chaos' || e.k === 'inv' || e.k === 'exec' ? i : -1)).filter(i => i >= 0);
  return g.players.map((p, seat) => ({ p, seat })).filter(({ p, seat }) => p.ai && seat !== me && viewOf(g, seat, 'vote', [1, 0]).known[me] === null)
    .map(({ seat }) => ({ seat, series: [-1, ...marks].map(i => believe(viewOf({ ...g, hist: g.hist.slice(0, i + 1) }, seat, 'vote', [1, 0])).pF[me]) }));
}

/** Live, during the game (D14): how much each player run by the app suspects `me` right now. One that knows the role
 *  of `me` (a cultist knows everyone) shows the reckoning it would make if it did not, from its own seat, as it would
 *  look to the table: showing its real answer (0 or 100%), or nothing, would give away who knows. */
export function suspicion(g: Game, me: number): { seat: number; f: number }[] {
  return g.players.map((p, seat) => ({ p, seat })).filter(({ p, seat }) => p.ai && p.alive && seat !== me).map(({ seat }) => {
    const v = viewOf(g, seat, 'vote', [1, 0]);
    const blind: View = v.known[me] === null ? v : { ...v, role: 'liberal', known: v.known.map((_, i) => (i === seat ? 'liberal' : null)) };
    return { seat, f: believe(blind).pF[me] };
  });
}

/** The moment that raised the suspicion on `me` the most (D15): the event (an index in the history: a law, a veto,
 *  the chaos, an investigation, an elimination) after which the average suspicion of the players run by the app rose
 *  the most, with that average before and after. 'end' asks the ones that did not know the role of `me` (the end
 *  summary); 'live' asks all of them, the ones that know reckoning as if they did not, as the live suspicion does, so
 *  nothing gives away who knows. Null when nothing raised it. */
export function crux(g: Game, me: number, mode: 'end' | 'live'): { at: number; before: number; after: number } | null {
  const marks = g.hist.map((e, i) => (e.k === 'gov' || e.k === 'veto' || e.k === 'chaos' || e.k === 'inv' || e.k === 'exec' ? i : -1)).filter(i => i >= 0);
  const askers = g.players.map((p, seat) => ({ p, seat })).filter(({ p, seat }) => p.ai && seat !== me && (mode === 'live' ? p.alive : viewOf(g, seat, 'vote', [1, 0]).known[me] === null)).map(x => x.seat);
  if (!marks.length || !askers.length) return null;
  const avg = (upto: number): number => askers.reduce((a, seat) => {
    const v = viewOf({ ...g, hist: g.hist.slice(0, upto + 1) }, seat, 'vote', [1, 0]);
    const blind: View = v.known[me] === null ? v : { ...v, role: 'liberal', known: v.known.map((_, i) => (i === seat ? 'liberal' : null)) };
    return a + believe(blind).pF[me];
  }, 0) / askers.length;
  let prev = avg(-1), top: { at: number; before: number; after: number } | null = null;
  for (const i of marks) {
    const now = avg(i);
    if (now - prev > 0.01 && (!top || now - prev > top.after - top.before)) top = { at: i, before: prev, after: now };
    prev = now;
  }
  return top;
}

/* ---------- the review of a person's plays, at the end (D19) ---------- */
/** One play of a person, judged at the end: good or bad, how much it weighed in the game, and why, in words with {pN}
 *  for the name of seat N and the theme's words. `at` is the index in the history. */
export interface Play { at: number; good: boolean; weight: number; text: string }
/** The plays of seat `me` that were clearly good or clearly bad (D19), judged two ways at once: by what came of them,
 *  now that every role is known, and by what that seat could have known then, reckoned as the extreme level would from
 *  that seat (its own role and team, its own hands and investigations, and what everyone saw). A play that went wrong
 *  without any way of knowing is not called bad; a lucky one is not praised much. Liberals are judged by laws and trust
 *  placed well; the hidden side by laws pushed through without the table catching on. */
export function review(g: Game, me: number): Play[] {
  const out: Play[] = [], P = (i: number): string => `{p${i}}`, pc = (x: number): string => `${Math.round(x * 100)}%`;
  const side = (i: number): Party => partyOf(g.players[i].role), lib = side(me) === 'L';
  const nF = (ls?: Law[]): number => (ls || []).filter(l => l === 'F').length;
  const hand = (n: number, of: number): string => (of === 3 ? ['3 liberais', '1 {f} e 2 liberais', '2 {fs} e 1 liberal', '3 {fs}'] : ['2 liberais', '1 {f} e 1 liberal', '2 {fs}'])[n] ?? '';
  const upTo = (n: number): Game => ({ ...g, hist: g.hist.slice(0, n) });
  const mind = (n: number) => believe({ ...viewOf(upTo(n), me, 'vote', [1, 0]), level: 'extremo' as Level });
  const seen = (n: number): number => believe({ ...viewOf(upTo(n), me, 'vote', [1, 0]), level: 'extremo' as Level }, true).pF[me];
  const alive = (n: number): number[] => g.players.map((_, i) => i).filter(i => !g.hist.slice(0, n).some(e => e.k === 'exec' && e.target === i));
  const lawsF = (n: number): number => g.hist.slice(0, n).filter(e => (e.k === 'gov' || e.k === 'chaos') && e.law === 'F').length;
  const add = (at: number, good: boolean, weight: number, text: string): void => { out.push({ at, good, weight, text }); };
  // who could have been nominated chancellor at that moment: alive, not the president, not barred by the last government
  const eligible = (n: number): number[] => {
    const h = g.hist.slice(0, n), last = [...h].reverse().find((e): e is Gov => e.k === 'gov' || e.k === 'veto'), chaos = h.map(e => e.k).lastIndexOf('chaos') > h.lastIndexOf(last as Event);
    const live = alive(n);
    return live.filter(i => i !== me && (!last || chaos || (i !== last.chanc && (live.length <= SMALL_TABLE || i !== last.pres))));
  };
  // the vote that elected or rejected this government: the one right before it, if votes were taken one by one
  const voteOf = (i: number): number => (g.hist[i - 1]?.k === 'vote' ? i - 1 : i);
  const nominated = (i: number, c: number, made: Law | undefined): void => {
    const at = voteOf(i), b = mind(at), opts = eligible(at), zone = lawsF(at) >= LEADER_ZONE;
    const score = (j: number): number => b.pF[j] + (zone ? 2 * b.pH[j] : 0), top = opts.reduce((a, j) => (score(j) < score(a) ? j : a), opts[0] ?? c);
    if (lib) {
      if (side(c) === 'F' && score(c) - score(top) >= 0.1) add(i, false, made === 'F' ? 2.5 : 2, `Você indicou ${P(c)}, que era {f}${made === 'F' ? ', e saiu lei {f}' : ''}. Com o que você sabia, ${P(c)} tinha ${pc(b.pF[c])} de chance de ser {f}; ${P(top)} era a opção mais limpa (${pc(b.pF[top])}).`);
      else if (side(c) === 'L' && made === 'L' && score(c) - score(top) < 0.05) add(i, true, 1, `Você indicou ${P(c)}, a opção mais limpa pelas contas (${pc(b.pF[c])}), e saiu lei liberal.`);
    } else if (side(c) === 'F' && made === 'F') add(i, true, 1, `Você indicou um aliado, ${P(c)}, e saiu lei {f}.`);
  };
  g.hist.forEach((e, i) => {
    if (e.k === 'vote' && e.ja !== undefined && alive(i).includes(me)) {
      const next = g.hist[i + 1], elected = next ? next.k !== 'rej' : g.phase === 'over', gov = [e.pres, e.chanc], dirty = gov.some(j => side(j) === 'F');
      const ja = e.ja.includes(me), lost = elected && !next && g.winner === 'F' && g.players[e.chanc].role === 'lider' && lawsF(i) >= LEADER_ZONE;
      if (!lib) { if (lost && ja) add(i, true, 3, e.chanc === me ? `A mesa elegeu você, o {boss}, chanceler com ${LEADER_ZONE} leis {fs} na mesa: vitória.` : `Você votou {ja} no {boss}, ${P(e.chanc)}, para chanceler com ${LEADER_ZONE} leis {fs} na mesa: vitória.`); return; }
      if (gov.includes(me)) return;
      const b = mind(i), others = alive(i).filter(j => j !== me), f = others.reduce((a, j) => a + b.pF[j], 0) / Math.max(1, others.length);
      const risk = 1 - gov.reduce((a, j) => a * (1 - b.pF[j]), 1), base = 1 - (1 - f) ** 2, bad = gov.filter(j => side(j) === 'F');
      const who = `${bad.map(j => (g.players[j].role === 'lider' ? `${P(j)} (o {boss})` : P(j))).join(' e ')} ${bad.length > 1 ? 'eram {fs}' : 'era {f}'}`;
      const law = next && next.k === 'gov' ? next.law : undefined;
      if (ja && dirty && elected && risk >= base + 0.03) add(i, false, lost ? 5 : law === 'F' ? 2 : 1.5, `Você votou {ja} em ${P(e.pres)} + ${P(e.chanc)}, e ${who}${lost ? ': o {boss} virou chanceler e os {fs} ganharam' : law === 'F' ? ', e saiu lei {f}' : ''}. Com o que você sabia, o risco desse governo era ${pc(risk)}, mais que o de um par qualquer (${pc(base)}).`);
      else if (!ja && lost) add(i, true, 1, `Você votou {nein} no {boss}, ${P(e.chanc)}, para chanceler, mas a mesa elegeu: ${e.ja.map(P).join(', ')} votaram {ja}.`);
      else if (!ja && dirty) add(i, true, elected ? 0.5 : 1, `Você votou {nein} em ${P(e.pres)} + ${P(e.chanc)}${elected ? '' : ', e o governo caiu'}: ${who}.`);
      else if (!ja && !dirty && !elected && risk < base - 0.03) add(i, false, 0.5, `Você votou {nein} em ${P(e.pres)} + ${P(e.chanc)}, dois liberais, e o governo caiu. Pelas contas o risco era baixo (${pc(risk)}, contra ${pc(base)} de um par qualquer).`);
      return;
    }
    if (e.k === 'gov' || e.k === 'veto') {
      const law = e.k === 'gov' ? e.law : undefined;
      if (e.pres === me) nominated(i, e.chanc, law);
      if (e.pres !== me && e.chanc !== me) return;
      const pres = e.pres === me, mate = pres ? e.chanc : e.pres;
      if (lib) {
        if (pres && e.drew && e.got) {
          if (e.drew.includes('L') && !e.got.includes('L')) add(i, false, 3, `Presidente com ${P(mate)}: você tirou ${hand(nF(e.drew), 3)} e passou ${hand(nF(e.got), 2)}, jogando fora a liberal.`);
          else if (nF(e.drew) === 1 && nF(e.got) === 1) {         // the chancellor test (D22): judged by what it cost and what it showed
            if (law === 'F') add(i, false, 2, `Você testou ${P(mate)} passando uma {f} e uma liberal, e ${P(mate)} aprovou a {f}: o teste mostrou um {f}, mas custou uma lei.`);
            else if (law === 'L') add(i, true, 0.5, `Você testou ${P(mate)} passando uma {f} e uma liberal, e ${P(mate)} aprovou a liberal${side(mate) === 'L' ? ': era liberal mesmo' : ', mas era {f} jogando limpo'}.`);
            if (e.pc !== undefined && e.pc >= 0 && e.pc !== 1) add(i, false, 1, `No teste, você não contou que tinha tirado 2 liberais: quem ouve acha que você é {f}. Teste se conta.`);
          }
          else if (e.drew.includes('F') && e.drew.includes('L')) add(i, true, 1, `Presidente com ${P(mate)}: você tirou ${hand(nF(e.drew), 3)} e jogou fora uma {f}.`);
          if (e.pc !== undefined && e.pc >= 0 && e.pc !== nF(e.drew) && !(nF(e.drew) === 1 && nF(e.got) === 1)) add(i, false, 1.5, `Você disse que tirou ${hand(e.pc, 3)}, mas tirou ${hand(nF(e.drew), 3)}. Liberal que mente confunde a mesa e vira suspeito.`);
        }
        if (!pres && e.got) {
          if (law === 'F' && e.got.includes('L')) add(i, false, 3, `Chanceler de ${P(mate)}: você recebeu ${hand(nF(e.got), 2)} e aprovou a {f}.`);
          else if (law === 'L' && e.got.includes('F')) add(i, true, 1, `Chanceler de ${P(mate)}: você recebeu ${hand(nF(e.got), 2)} e aprovou a liberal.`);
          else if (e.k === 'veto') add(i, !e.got.includes('L'), e.got.includes('L') ? 2 : 1, e.got.includes('L') ? `Você vetou e jogou fora uma liberal (recebeu ${hand(nF(e.got), 2)}).` : `Você recebeu 2 {fs} e conseguiu o veto: nenhuma lei {f}.`);
          if (e.cc !== undefined && e.cc >= 0 && e.cc !== nF(e.got)) add(i, false, 1.5, `Você disse que recebeu ${hand(e.cc, 2)}, mas recebeu ${hand(nF(e.got), 2)}. Liberal que mente confunde a mesa e vira suspeito.`);
        }
        return;
      }
      // the hidden side: a law pushed through is good, unless the table caught on
      const before = seen(voteOf(i)), after = seen(i + 1), up = after - before;
      const couldF = (pres ? e.drew : e.got)?.includes('F');
      if (law === 'F') {
        if (up >= 0.15) add(i, false, 2, `Saiu lei {f} do seu governo com ${P(mate)}, mas a mesa percebeu: a chance de você ser {f}, pelo que todos viram, subiu (${pc(before)} → ${pc(after)}).`);
        else add(i, true, 1.5, `Saiu lei {f} do seu governo com ${P(mate)}, e a mesa quase não desconfiou mais de você (${pc(before)} → ${pc(after)}).`);
      } else if (law === 'L' && couldF) {
        if (up <= -0.1) add(i, true, 1, `Você deixou passar uma liberal com ${P(mate)} e limpou a sua barra (${pc(before)} → ${pc(after)}).`);
        else add(i, false, 1, `Você deixou passar uma liberal com ${P(mate)} sem ganhar confiança (${pc(before)} → ${pc(after)}).`);
      }
      const mine = pres ? e.pc : e.cc, truth = nF(pres ? e.drew : e.got);
      if (pres && law === 'L' && nF(e.drew) === 1 && nF(e.got) === 1 && e.pc === 1) add(i, true, 0.5, `Você passou uma {f} e uma liberal e contou a verdade, como num teste: ${P(mate)} aprovou a liberal e a sua história fecha.`);
      if (e.pc !== undefined && e.cc !== undefined && e.pc >= 0 && e.cc >= 0 && Math.max(0, e.pc - 1) !== e.cc && !(e.pc === 1 && e.cc === 1) && mine !== truth) add(i, false, 1.5, `A sua história não fechou com a de ${P(mate)}: o presidente disse ${hand(e.pc, 3)} e o chanceler disse ${hand(e.cc, 2)}. Quem ouviu soube que alguém mentiu.`);
      return;
    }
    if (e.k === 'inv' && e.by === me) {
      const t = e.target, said = e.said && e.said !== '-' ? e.said : null;
      if (lib) {
        const b = mind(i), done = g.hist.slice(0, i).filter((x): x is Extract<Event, { k: 'inv' }> => x.k === 'inv').map(x => x.target);
        const opts = alive(i).filter(j => j !== me && !done.includes(j)), doubt = (j: number): number => b.pF[j] * (1 - b.pF[j]);
        const alt = opts.reduce((a, j) => (doubt(j) > doubt(a) ? j : a), opts[0] ?? t);
        if (side(t) === 'F') add(i, true, 2, `Você investigou ${P(t)} e achou um {f}.`);
        else if ((b.pF[t] < 0.15 || b.pF[t] > 0.85) && alt !== t) add(i, false, 1, `Você investigou ${P(t)}, de quem já dava para ter quase certeza (${pc(b.pF[t])} de ser {f}). ${P(alt)} era a maior dúvida (${pc(b.pF[alt])}).`);
        if (said && said !== e.party) add(i, false, 1.5, `Você disse que ${P(t)} é ${said === 'L' ? 'liberal' : '{f}'}, mas viu ${e.party === 'L' ? 'liberal' : '{f}'}. Liberal que mente confunde a mesa.`);
      } else if (said && side(t) === 'F' && said === 'L') add(i, true, 1, `Você investigou um aliado, ${P(t)}, e disse que é liberal: cobriu o time.`);
      else if (said && side(t) === 'L' && said === 'F') add(i, true, 1, `Você investigou ${P(t)}, liberal, e disse que é {f}: jogou a desconfiança nele.`);
      else if (said && side(t) === 'F' && said === 'F') add(i, false, 2, `Você entregou um aliado: disse que ${P(t)} é {f}.`);
      return;
    }
    if (e.k === 'exec' && e.by === me) {
      const t = e.target, role = g.players[t].role;
      if (lib && side(t) === 'F') add(i, true, role === 'lider' ? 5 : 3, role === 'lider' ? `Você eliminou o {boss}, ${P(t)}: vitória.` : `Você eliminou ${P(t)}, que era {f}.`);
      else if (lib) {
        const b = mind(i), opts = alive(i).filter(j => j !== me), top = opts.reduce((a, j) => (b.pF[j] > b.pF[a] ? j : a), opts[0] ?? t);
        if (b.pF[top] - b.pF[t] >= 0.1) add(i, false, 3, `Você eliminou ${P(t)}, que era liberal: o seu lado perdeu um voto. Com o que você sabia, ${P(t)} tinha ${pc(b.pF[t])} de chance de ser {f}, e ${P(top)} tinha ${pc(b.pF[top])}.`);
      }
      else add(i, side(t) === 'L', side(t) === 'L' ? 2 : 3, side(t) === 'L' ? `Você eliminou ${P(t)}, um liberal.` : `Você eliminou ${P(t)}, que era do seu time.`);
      return;
    }
    if (e.k === 'special' && e.by === me) {
      const t = e.target;
      if (lib && side(t) === 'L') add(i, true, 1, `Na eleição especial, você deu a presidência a ${P(t)}, um liberal.`);
      else if (lib) {
        const b = mind(i), opts = alive(i).filter(j => j !== me), top = opts.reduce((a, j) => (b.pF[j] < b.pF[a] ? j : a), opts[0] ?? t);
        if (b.pF[t] - b.pF[top] >= 0.1) add(i, false, 2, `Na eleição especial, você deu a presidência a ${P(t)}, que era {f}. Com o que você sabia, ${P(t)} tinha ${pc(b.pF[t])} de chance de ser {f}; ${P(top)} tinha ${pc(b.pF[top])}.`);
      }
      else if (side(t) === 'F') add(i, true, 1, `Na eleição especial, você deu a presidência a um aliado, ${P(t)}.`);
    }
  });
  // the accusations (D45): judged by who the accused turned out to be, and by whether the record backed them then
  g.hist.forEach((e, i) => {
    if (e.k !== 'talk' || e.by !== me || e.say !== 'acc' || e.about < 0) return;
    const hidden = side(e.about) === 'F', who = P(e.about);
    if (lib && e.hit && hidden) add(i, true, 2, `Você acusou ${who} com uma prova que a ata sustentava, e era {f}: CONTRADIÇÃO! na hora certa.`);
    else if (lib && hidden) add(i, true, 1, `Você acusou ${who}, e era {f}.`);
    else if (lib && (e.tone === 'firm' || e.tone === 'proof') && !e.hit) add(i, false, 1.5, `Você acusou ${who} com firmeza sem prova que segurasse, e era liberal: queimou a sua credibilidade e jogou a mesa contra um aliado.`);
    else if (lib) add(i, false, 1, `Você acusou ${who}, que era liberal.`);
    else if (!hidden && e.hit) add(i, true, 2, `Você acusou ${who}, um liberal, com uma prova que a ata sustentava: a mesa comprou.`);
    else if (!hidden) add(i, (e.tone === 'firm' || e.tone === 'proof') ? false : true, 1, (e.tone === 'firm' || e.tone === 'proof') ? `Você acusou ${who}, um liberal, com firmeza e sem prova: a mesa pode ter desconfiado de você.` : `Você jogou a desconfiança em ${who}, um liberal.`);
    else add(i, false, 2, `Você acusou ${who}, que era do seu time.`);
  });
  g.hist.forEach((e, i) => {
    if (e.k !== 'talk' || e.about !== me || !e.def) return;
    if (e.ok) add(i, true, 1.5, `Acusado por ${P(e.by)}, você se defendeu com o que a ata sustentava, e a acusação perdeu o peso.`);
    else if (e.def !== 'quiet') add(i, false, 1, `Acusado por ${P(e.by)}, você deu uma defesa que a ata não sustentava.`);
  });
  // the notebook (D28): every seat marked right, that this seat did not know for sure, is a deduction well made
  const notes = notesScore(g, me);
  for (const i of notes.right) add(g.hist.length - 1, true, 1, `Nas anotações, você marcou ${P(i)} como ${side(i) === 'L' ? 'liberal' : g.players[i].role === 'lider' ? '{f} (era o {boss})' : '{f}'}, e acertou.`);
  // the hidden leader elected chancellor at the end, nominated by this seat
  if (g.phase === 'over' && g.winner === 'F' && g.chanc !== null && g.pres === me && g.players[g.chanc].role === 'lider' && g.why.includes('eleito chanceler')) {
    const at = g.hist.length - 1;
    if (lib) add(at, false, 5, `Você indicou ${P(g.chanc)} para chanceler com ${LEADER_ZONE} leis {fs} na mesa. Era o {boss}, e os {fs} ganharam.`);
    else add(at, true, 3, `Você indicou o {boss}, ${P(g.chanc)}, para chanceler com ${LEADER_ZONE} leis {fs} na mesa, e a mesa elegeu: vitória.`);
  }
  return out;
}

/** How the notebook of seat `me` did (D28), once the roles are open: the seats it marked right and wrong. What it knew
 *  for sure (its team by rule 3, what its own investigations showed) does not count: that was no deduction. */
export function notesScore(g: Game, me: number): { right: number[]; wrong: number[] } {
  const sure = new Set<number>([...knows(g, me).map(k => g.players.findIndex(p => p.name === k.name)), ...g.hist.flatMap(e => (e.k === 'inv' && e.by === me ? [e.target] : []))]);
  const right: number[] = [], wrong: number[] = [];
  for (const [k, mark] of Object.entries(g.notes || {})) {
    const i = Number(k);
    if (i === me || sure.has(i) || !g.players[i]) continue;
    (partyOf(g.players[i].role) === mark ? right : wrong).push(i);
  }
  return { right, wrong };
}

/* ---------- achievements (D41) ---------- */
/** The achievements there are, with a name and how to earn them. */
export const ACHIEVEMENTS: Record<string, [string, string]> = {
  win: ['Primeira vitória', 'Vencer uma partida'],
  boss: ['Líder invisível', 'Vencer sendo o líder escondido'],
  hunter: ['Caçador', 'Eliminar o líder escondido'],
  perfect: ['Caderno perfeito', 'Acertar todas as anotações, com pelo menos 3'],
  contra: ['CONTRADIÇÃO!', 'Acusar com uma prova que bate'],
  hard: ['Mesa dura', 'Vencer contra a IA no difícil ou no extremo'],
  ghost: ['Sem rastro', 'Vencer do lado escondido sem nenhuma prova que bata contra você'],
  // D120: Secret Cultist's own
  sealed: ['Selou o deus', 'Vencer como investigador no Secret Cultist'],
  sane: ['Mente sã', 'Terminar uma partida do Secret Cultist sem ficar abalado'],
  thief: ['Mão leve', 'Roubar um item sem ser pego'],
  finder: ['Achado raro', 'Encontrar uma relíquia do velho mundo numa armadilha']
};
/** What the person in seat `me` earned in this finished game (D41). Only from what happened. */
export function achievements(g: Game, me: number): string[] {
  if (g.phase !== 'over' || !g.winner || !g.players[me]) return [];
  const role = g.players[me].role, won = partyOf(role) === g.winner, out: string[] = [];
  if (won) out.push('win');
  if (won && role === 'lider') out.push('boss');
  if (g.hist.some(e => e.k === 'exec' && e.by === me && g.players[e.target]?.role === 'lider')) out.push('hunter');
  const sc = notesScore(g, me);
  if (sc.right.length >= 3 && !sc.wrong.length) out.push('perfect');
  if (g.hist.some(e => e.k === 'talk' && e.by === me && e.hit)) out.push('contra');
  if (won && (g.level === 'dificil' || g.level === 'extremo') && g.players.some(p => p.ai)) out.push('hard');
  if (won && role !== 'liberal' && !g.hist.some(e => e.k === 'talk' && e.about === me && e.hit)) out.push('ghost');
  if (g.pack === 'culto' && won && role === 'liberal') out.push('sealed');
  const san = sanity(g, me);
  if (san !== undefined && san >= SAN_LOW) out.push('sane');
  if (g.hist.some(e => e.k === 'steal' && e.by === me && e.ok)) out.push('thief');
  if (g.hist.some(e => e.k === 'find' && e.seat === me)) out.push('finder');
  return out;
}

/** Reputation at the table (D43): 1 to 3 stars, from what everyone saw: stories that did not add up, firm accusations
 *  the record did not back, and changing one's mind about someone with nothing new in between. Never a role. */
export function reputation(g: Game, seat: number): 1 | 2 | 3 {
  const m = socialMemory(viewOf(g, seat, 'vote', [1, 0]), seat), bad = m.contradictions + 0.5 * m.reversals;
  return bad < 1 ? 3 : bad < 2 ? 2 : 1;
}

