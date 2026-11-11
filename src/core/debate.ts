/* The talk around the rules (D57, D65, D66, D73): the debate on an accusation, claiming one's side, asking the table,
   turning a vote. Moved out of the judge (D143); it never asks a player run by the app anything. */
import { INV_CRED, believe } from './ai';
// import { mad, canSteal, steal, itemOf, ITEMS } from './items';
// import { sanity, SAN_LOW } from './dice';
import { roll, ROLL_BONUS, skillForArg, STRONG_ARG, WEAK_ARG, type Roll, type RollLevel } from './dice';
import { DECK_F, DECK_L, LEADER_ZONE, partyOf, TRACKER_MAX } from './game';
import { words } from './words';
import type { DebLine, Event, Game, Gov, Persona, Talk } from './types';
import { comboPower, comboText, evidence, handedBy, handedText, lastIndex, lower, proofEarly, stack, usedProofs, viewOf } from './judge';
/* ---------- D57: the debate ----------
   An accusation that involves the person (playing alone with the app) turns into a short debate: the accused answers,
   the accuser replies, the accused has the last word, and the app players who watched give their verdict. Every
   argument is built from what the whole table saw, and its strength is worked out from the record; how well it lands
   also depends on the speaker's way with words (ELOQ, by personality, known to the table). */
export const ELOQ: Record<Persona, number> = { blefador: 3, centrado: 3, certinho: 2, critico: 2, desconfiado: 2, cetico: 2, caotico: 1 };
export const eloq = (g: Game, i: number): number => (g.players[i]?.ai ? ELOQ[g.players[i].persona || 'centrado'] : 2);
export interface DebArg { id: string; label: string; text: string; power: number }
/** Who speaks next in the debate on the accusation at `at`, or -1 when the three answers are in. */
export function debateNext(g: Game, at: number): number {
  const t = g.hist[at];
  if (!t || t.k !== 'talk' || t.say !== 'acc') return -1;
  const n = (t.deb || []).length;
  return n >= 3 ? -1 : n % 2 === 0 ? t.about : t.by;
}
export const clashOf = (e: Event | undefined): boolean => !!e && (e.k === 'gov' || e.k === 'veto') && e.pc !== undefined && e.cc !== undefined && e.pc >= 0 && e.cc >= 0 && Math.max(0, e.pc - 1) !== e.cc && !(e.pc === 1 && e.cc === 1);
/** D82: how many governments that passed a law of the hidden side `i` sat in, before `at`. */
/** D82: how many governments that passed a liberal law `i` sat in, before `at`: an investigator's credibility. */
const libsOf = (g: Game, i: number, at: number): number => g.hist.slice(0, at).filter(e => e.k === 'gov' && e.law === 'L' && (e.pres === i || e.chanc === i)).length;
export const dirtyOf = (g: Game, i: number, at: number): number => g.hist.slice(0, at).filter(e => e.k === 'gov' && e.law === 'F' && (e.pres === i || e.chanc === i)).length;
/** D82: whether `a` and `b` governed together and a law of the hidden side came out, before `at`. */
export const sat = (g: Game, a: number, b: number, at: number): boolean => g.hist.slice(0, at).some(e => e.k === 'gov' && e.law === 'F' && ((e.pres === a && e.chanc === b) || (e.pres === b && e.chanc === a)));
/** D82: the chance of drawing three of the hidden side at the government `at`, from what the table can count: what is
 *  left of the deck once the laws passed before it are taken out. */
export function threeOdds(g: Game, at: number): number {
  let f = DECK_F, l = DECK_L;
  for (const e of g.hist.slice(0, at)) if ((e.k === 'gov' || e.k === 'chaos') && e.law) { if (e.law === 'F') f--; else l--; }
  const n = f + l;
  return n < 3 || f < 3 ? 0 : (f * (f - 1) * (f - 2)) / (n * (n - 1) * (n - 2));
}
/** The arguments the speaker can make now, strongest first. */
export function debateArgs(g: Game, at: number): DebArg[] {
  const t = g.hist[at] as Talk, who = debateNext(g, at);
  if (who < 0) return [];
  const W = words(g.pack), nm = (i: number): string => g.players[i]?.name ?? '?', before = { ...g, hist: g.hist.slice(0, at) };
  const proof = t.proof !== undefined ? evidence(before, t.about, t.by).find(x => x.at === t.proof) : undefined;
  const gov = proof && proof.at < 100000 ? g.hist[proof.at] : undefined, isGov = !!gov && (gov.k === 'gov' || gov.k === 'veto');
  const out: DebArg[] = [];
  const said = (t.deb || []).flatMap(l => l.id.split('+'));
  // D80: the accuser was the president who handed the accused its two laws: its word against the chancellor's, not a
  // government "with itself" to explain; the chancellor who claims two of the hidden side is contradicted, not cleared
  const handed = !!gov && handedBy(gov, t.by, t.about);
  // D81: a combo of proofs: the accused can answer one at a time, never all of them at once
  const combo = t.proofs && t.proofs.length > 1 ? evidence(before, t.about, t.by).filter(x => (t.proofs as number[]).includes(x.at)) : [];
  const clash = clashOf(gov) || !!handed;
  if (who === t.about) {
    if (isGov && (gov.pres === who || gov.chanc === who)) {
      const pres = gov.pres === who, n = pres ? gov.pc : gov.cc;
      if (n !== undefined && n >= 0) out.push({ id: 'hand', label: 'Mostra a sua mão', text: `${pres ? 'Tirei' : 'Recebi'} ${n} ${n === 1 ? W.f : W.fs}, foi o que eu disse e mantenho.`, power: clash ? 0.2 : 0.4 });   // D83: repeating the claim is not an explanation
      // D75: the chancellor who got two of the hidden side had no choice, and the record shows it: checkmate; and if the
      // president's story does not add up, the chancellor turns it on the president
      if (!pres && gov.k === 'gov' && gov.law === 'F' && gov.cc === 2) out.push(clash
        ? { id: 'turnpres', label: `Vira a banca: o presidente ${nm(gov.pres)} mente`, text: `Recebi 2 ${W.fs}, está na ata. ${nm(gov.pres)} disse que tirou ${gov.pc}: quem escolheu passar ${W.fs} foi ele.`, power: handed ? 0.35 : 0.8 }
        : { id: 'nochoice', label: 'Não tive escolha: recebi duas', text: `Recebi 2 ${W.fs}: não tinha o que fazer. ${gov.pc === 3 ? `O presidente ${nm(gov.pres)} confirma que tirou 3.` : `Quem escolheu foi o presidente ${nm(gov.pres)}.`}`, power: 0.75 });
      if (pres && gov.k === 'gov' && gov.law === 'F' && gov.pc === 3 && !clash) { const p3 = threeOdds(g, proof ? proof.at : at); out.push({ id: 'nochoice', label: 'Não tive escolha: tirei três', text: `Tirei 3 ${W.fs} e o chanceler confirma: não havia liberal para passar.`, power: 0.3 + 0.6 * p3 }); }   // D82: as believable as drawing three was
      if (clash) out.push({ id: 'blame', label: `Aponta a história de ${nm(pres ? gov.chanc : gov.pres)}`, text: `As histórias não batem: quem mente é ${nm(pres ? gov.chanc : gov.pres)}.`, power: 0.45 });
      // D90: "the deck came like that" only for one whose own story leaves it no choice (or who said nothing): a chancellor
      // who said it got a liberal had one
      const choseF = pres ? gov.pc !== undefined && gov.pc >= 0 && gov.pc < 3 && gov.cc === 2 : gov.cc !== undefined && gov.cc >= 0 && gov.cc < 2;
      if (gov.k === 'gov' && gov.law === 'F' && !clash && !choseF) out.push({ id: 'deck', label: 'Diz que foi o baralho', text: 'O baralho veio assim, não tive escolha.', power: 0.35 });
    }
    // D76: whatever the proof, a government where the accused had no choice speaks for it
    if (!isGov || (gov && gov.k === 'gov' && gov.law !== 'F')) {
      const nc = g.hist.slice(0, at).filter(e => e.k === 'gov' && e.law === 'F' && !clashOf(e) && ((e.chanc === who && e.cc === 2) || (e.pres === who && e.pc === 3)));
      if (nc.length) out.push({ id: 'nochoice', label: 'Nas minhas leis, não tive escolha', text: `Nas leis ${W.fs} que passaram por mim, eu não tive escolha: ${nc.map(e => (e as Gov).chanc === who ? `recebi 2 de ${nm((e as Gov).pres)}` : 'tirei 3').join('; ')}. Está na ata.`, power: proof?.kind === 'count' ? 0.35 : 0.75 });   // D83: against a count it answers only part of it
    }
    // D60: an accusation built on the first governments jumped the gun: the accused can take its credibility apart
    const govs = g.hist.slice(0, at).filter(e => e.k === 'gov').length;
    if (!combo.some(x => x.hit) && ((proof && proofEarly(before, proof)) || (!proof && govs < 2))) out.push({ id: 'rush', label: `Desmoraliza ${nm(t.by)}: queimou a largada`, text: `Isso foi no ${govs <= 1 ? 'primeiro governo' : 'começo do jogo'}: ninguém sabe de nada ainda. ${nm(t.by)} acusou antes da hora, e quem acusa cedo assim quer é confundir a mesa.`, power: 0.75 });
    const libs = g.hist.slice(0, at).filter(e => e.k === 'gov' && e.law === 'L' && (e.pres === who || e.chanc === who)).length;
    if (libs) out.push({ id: 'record', label: 'Lembra o seu histórico', text: `Estive em ${libs} governo${libs > 1 ? 's que aprovaram' : ' que aprovou'} lei liberal.`, power: 0.25 + 0.15 * Math.min(libs, 2) });
    // D61: a weak accusation (only a vote, or no proof that holds) opens the accuser to a hard counterattack
    const weakAcc = !proof || (!proof.hit && (proof.kind === 'vote' || proof.kind === 'exec' || proof.kind === 'inv'));
    if (weakAcc) out.push({ id: 'counter', label: `Contra-ataca ${nm(t.by)}`, text: proof?.kind === 'vote' ? `Por um voto? Metade da mesa votou igual. ${nm(t.by)} quer um culpado, não a verdade.` : `Acusar sem prova é o que faz quem tem o que esconder, ${nm(t.by)}.`, power: 0.65 });
    // D82: an investigation that said liberal speaks for it, as much as the investigator is clean
    for (const e of g.hist.slice(0, at)) if (e.k === 'inv' && e.target === who && e.said === 'L' && e.by !== who) { const n = dirtyOf(g, e.by, at); out.push({ id: 'inv', label: `Lembra a investigação de ${nm(e.by)}`, text: `${nm(e.by)} me investigou e disse que sou liberal.`, power: sat(g, e.by, who, at) ? 0.1 : libsOf(g, e.by, at) < INV_CRED ? 0.2 : n === 0 ? 0.6 : n === 1 ? 0.35 : 0.15 }); }
    // D82: the accuser's earlier accusations that the table did not buy
    const fell = g.hist.slice(0, at).filter(e => e.k === 'talk' && e.say === 'acc' && e.by === t.by && !!e.verdict && (e.backfire || e.verdict.filter(x => x[1] === 1).length <= e.verdict.filter(x => x[1] === 0).length)).length;
    if (fell) out.push({ id: 'failed', label: `Descredibiliza ${nm(t.by)}`, text: `${nm(t.by)} já acusou ${fell === 1 ? 'uma vez' : `${fell} vezes`} e a mesa não comprou. Acusa por acusar.`, power: 0.3 + 0.15 * Math.min(fell, 2) });
    const vouched = g.hist.slice(0, at).filter(e => e.k === 'talk' && e.say === 'trust' && e.about === who && e.by !== who).map(e => (e as Talk).by);
    if (vouched.length) out.push({ id: 'vouch', label: 'Lembra quem confia em você', text: `${nm(vouched[vouched.length - 1])} já disse que confia em mim.`, power: 0.3 });
    const back = evidence(before, t.by), strong = back.find(x => x.hit) ?? back[0];
    if (strong) out.push({ id: 'turn', label: `Vira contra ${nm(t.by)}`, text: `E você? ${strong.text}.`, power: strong.hit ? 0.5 : 0.3 });
    if (!proof || !proof.hit) out.push({ id: 'noproof', label: 'Cobra uma prova', text: `${nm(t.by)} não tem prova nenhuma, só desconfiança.`, power: 0.4 });
    out.push({ id: 'quiet', label: 'Fica calado', text: '…', power: 0 });
  } else {
    if (combo.length) out.push({ id: 'combo', label: `Joga tudo de uma vez (${combo.length} provas)`, text: comboText(before, combo), power: comboPower(combo, t.sharp ?? 0) });
    else if (handed && gov) out.push({ id: 'myhand', label: 'Diz o que você passou', text: `${handedText(g, gov)}.`, power: 0.75 });
    else if (proof) out.push({ id: 'press', label: 'Insiste na prova', text: `${proof.text}. Isso não se explica.`, power: proof.hit ? 0.55 : 0.3 });
    const spentNow = usedProofs(before, t.about);
    for (const x of evidence(before, t.about)) if (x.at !== t.proof && !(t.proofs || []).includes(x.at) && !spentNow.has(x.at) && x.hit && out.length < 3)   // D83: not one already said, nor one spent (D77)
 out.push({ id: `ev${x.at}`, label: x.kind === 'count' ? 'Faz a conta' : 'Traz outra prova', text: `${x.text}.`, power: 0.5 });
    // D82: the investigation that cleared the accused is only as good as the investigator
    for (const e of g.hist.slice(0, at)) if (e.k === 'inv' && e.target === t.about && e.said === 'L' && e.by !== t.by) { const n = dirtyOf(g, e.by, at), both = sat(g, e.by, t.about, at), libs = libsOf(g, e.by, at); if (n || both || libs < INV_CRED) out.push({ id: 'badinv', label: `Derruba a investigação de ${nm(e.by)}`, text: `Quem disse que ${nm(t.about)} é liberal foi ${nm(e.by)}, ${n || both ? `que esteve em ${n} governo${n === 1 ? ' que aprovou' : 's que aprovaram'} lei ${W.f}${both ? `, um deles com o próprio ${nm(t.about)}` : ''}` : `que ${libs ? 'só aprovou uma lei liberal' : 'nunca aprovou lei liberal'}`}. Essa investigação não vale nada.`, power: Math.min(0.85, (n || both ? 0.45 : 0.35) + 0.1 * Math.min(n, 3) + (both ? 0.15 : 0)) }); }
    const last = (t.deb || [])[(t.deb || []).length - 1];
    out.push({ id: 'weak', label: 'Diz que a explicação não cola', text: 'Essa explicação não cola.', power: last && last.power < 0.3 ? 0.4 : 0.15 });
    const re = t.re || [], agree = re.filter(r => r[1] === 0).length, disagree = re.filter(r => r[1] === 2).length;
    if (agree > disagree) out.push({ id: 'table', label: 'Chama a mesa', text: `${agree} aqui concordaram comigo. Não sou só eu.`, power: 0.35 });
    const noms = g.hist.slice(0, at).filter(e => e.k === 'gov' && e.law === 'F' && e.pres === t.about).length;
    if (noms) out.push({ id: 'pick', label: 'Aponta quem ele escolheu', text: `Quando foi presidente, escolheu um chanceler e saiu lei ${W.f}.`, power: 0.4 });
    const votes = evidence(before, t.about).filter(x => x.kind === 'vote').length;
    if (votes) out.push({ id: 'votes', label: 'Lembra os votos', text: `Votou a favor de ${votes} governo${votes > 1 ? 's que aprovaram' : ' que aprovou'} lei ${W.f}.`, power: votes >= 2 ? 0.4 : 0.2 });
    out.push({ id: 'drop', label: 'Recua', text: 'Pode ser que eu tenha me enganado.', power: 0 });
  }
  if (combo.length && who === t.about) for (const a of out) a.power *= 0.7;
  const seen = new Set<string>();
  // D99: an argument already said can be said again, weaker: a last word with nothing left but "keep quiet" left the person stuck
  const again = (a: DebArg): DebArg => (said.includes(a.id) && a.id !== 'quiet' && a.id !== 'drop' ? { ...a, label: `Insiste: ${a.label[0].toLowerCase()}${a.label.slice(1)}`, power: a.power * 0.4 } : a);
  return out.map(again).filter(a => !seen.has(a.id) && seen.add(a.id)).sort((a, b) => b.power - a.power);
}
/** The speaker makes an argument; an unknown one is not a move. */
export function debateSay(g: Game, at: number, id: string | string[], rand?: () => number): Game {
  const who = debateNext(g, at), all = debateArgs(g, at), ids = Array.isArray(id) ? id : [id];
  // D82: several arguments at once, a combo: each adds what the others left; keeping quiet or backing down goes alone
  const picked = ids.map(x => all.find(a => a.id === x)).filter((a): a is DebArg => !!a && (ids.length === 1 || (a.id !== 'quiet' && a.id !== 'drop')));
  if (who < 0 || !picked.length || picked.length !== ids.length) return g;
  const arg = picked.length === 1 ? picked[0] : { id: picked.map(a => a.id).join('+'), label: '', text: picked.map(a => a.text).join(' '), power: stack(picked.map(a => a.power)) };
  // D94: what is said is rolled against the speaker's sheet (d100): the level of success adds to or takes from it
  const best = picked.reduce((a, b) => (b.power > a.power ? b : a)), sk = rand ? skillForArg(best.id) : null, r = sk && rand ? roll(g, who, sk, rand, best.power >= STRONG_ARG ? 1 : 0, best.power <= WEAK_ARG) : undefined;   // D109, D113: the context sets the test: a strong argument rolls a bonus die, a weak one is a hard test (a shaken speaker rolls a penalty die, in roll)
  const power = r ? Math.max(0, Math.min(0.95, arg.power + ROLL_BONUS[r.level])) : arg.power;
  const t = g.hist[at] as Talk, line: DebLine = { who, id: arg.id, text: arg.text, power, ...(r ? { roll: r } : {}) };
  const hist = [...g.hist]; hist[at] = { ...t, deb: [...(t.deb || []), line] };
  return { ...g, hist, log: [...g.log, `${g.players[who].name}: "${arg.text}"`] };
}
/** An app player picks its argument: the better its way with words, the more often it finds the strongest one. */
export function debateBot(g: Game, at: number, rand: () => number): Game {
  const who = debateNext(g, at);
  if (who < 0 || !g.players[who].ai) return g;
  const args = debateArgs(g, at).filter(a => a.id !== 'quiet' && a.id !== 'drop'), e = eloq(g, who);
  if (!args.length) return debateSay(g, at, who === (g.hist[at] as Talk).about ? 'quiet' : 'drop', rand);
  const k = e >= 3 ? 0 : e === 2 ? (rand() < 0.8 ? 0 : 1) : Math.floor(rand() * args.length);
  return debateSay(g, at, args[Math.min(k, args.length - 1)].id, rand);
}
/** The verdict: each app player who watched says whether the accusation stands (1), falls (0, not sure: 2). Weighed:
 *  the strength of each side's arguments times its way with words, what that player already believed, its temper; the
 *  hidden side covers its own and leans on the others. The accusation that stands holds; the one that falls is taken
 *  back, as a defence that holds (D40). */
export function debateVerdict(g: Game, at: number, rand: () => number): Game {
  const t = g.hist[at] as Talk;
  if (!t || t.k !== 'talk' || debateNext(g, at) >= 0 || t.verdict) return g;
  // D83: each side by its best line, not by how many times it spoke: the accused speaks twice, the accuser once
  const sum = (who: number): number => Math.max(0, ...(t.deb || []).filter(l => l.who === who).map(l => l.power)) * (0.6 + 0.2 * eloq(g, who));
  const base = (t.hit ? 0.25 : 0) + sum(t.by) - sum(t.about);
  const verdict: [number, number][] = [];
  g.players.forEach((p, j) => {
    if (!p.ai || !p.alive || j === t.by || j === t.about) return;
    const hidden = partyOf(p.role) === 'F', ally = hidden && partyOf(g.players[t.about].role) === 'F', foe = hidden && !ally;
    let x = base + (rand() - 0.5) * 0.4 + 0.15 * (p.mood ?? 0);
    if (!hidden) x += (believe(viewOf(g, j, 'vote', [1, 0]), true).pF[t.about] - 0.5) * 0.6;
    if (ally) x -= 0.5; if (foe) x += 0.25;
    verdict.push([j, x > 0.12 ? 1 : x < -0.12 ? 0 : 2]);
  });
  const yes = verdict.filter(v => v[1] === 1).length, no = verdict.filter(v => v[1] === 0).length, stands = yes > no;
  // D61: a weak case that fell turns against the accuser: it loses the table's trust (and with it, votes later)
  const best = Math.max(0, ...(t.deb || []).filter(l => l.who === t.by).map(l => l.power)), backfire = !stands && best < 0.4 && !(t.deb || []).some(l => l.id === 'myhand');
  const hist = [...g.hist]; hist[at] = { ...t, verdict, def: 'debate', ok: !stands, hit: stands || t.hit, ...(backfire ? { backfire: true } : {}) };
  return { ...g, hist, log: [...g.log, `Veredito da mesa: ${yes} acham que a acusação procede, ${no} que não, ${verdict.length - yes - no} não sabem.`, ...(backfire ? [`A acusação de ${g.players[t.by].name} era fraca e virou contra quem acusou: perdeu a confiança da mesa.`] : [])] };
}

/* ---------- D65: claiming one's own side, and asking for a vote ----------
   The person may say out loud that it is liberal (once a round), and in a vote ask an app player to vote Ja or Nein
   (once each, per vote). A self-claim costs nothing and says little (everyone says it); it costs dearly if an
   investigation says otherwise. A plea moves the app player by how much it trusts whoever asks. */
export const sinceRound = (g: Game): number => lastIndex(g, ['vote', 'rej', 'gov', 'veto', 'chaos', 'inv', 'peek', 'special', 'exec']);
export const canSelfClaim = (g: Game, me: number): boolean => g.phase !== 'over' && g.phase !== 'reveal' && !!g.players[me]?.alive && !g.hist.slice(sinceRound(g) + 1).some(e => e.k === 'self' && e.by === me);
export function selfClaim(g: Game, me: number): Game {
  if (!canSelfClaim(g, me)) return g;
  return { ...g, hist: [...g.hist, { k: 'self', by: me }], log: [...g.log, `${g.players[me].name}: "Eu sou liberal."`] };
}
export const canPlea = (g: Game, me: number, to: number): boolean => g.phase === 'vote' && to !== me && !!g.players[to]?.ai && g.players[to].alive && !!g.players[me]?.alive && !g.hist.slice(sinceRound(g) + 1).some(e => e.k === 'plea' && e.by === me && e.about === to);
export function plea(g: Game, me: number, to: number, ja: boolean): Game {
  if (!canPlea(g, me, to)) return g;
  const W = words(g.pack, g.region);
  return { ...g, hist: [...g.hist, { k: 'plea', by: me, about: to, ja }], log: [...g.log, `${g.players[me].name}: "${g.players[to].name}, vota ${ja ? W.ja : W.nein} nesse governo."`] };
}

/* ---------- D66: more ways to talk to the table ----------
   Requests to whoever presides (pick me, do not pick someone, investigate someone) last until the next government and
   weigh by how much that player trusts whoever asks. Asking an app player why it voted as it did gets a public answer
   (what it said it believed of that government, never its private reckoning). A bloc asks up to three app players to vote with you for three rounds: those who trust
   you join; a law of the hidden side passed by a government the bloc elected costs every member. */
const lastGov = (g: Game): number => lastIndex(g, ['gov', 'veto', 'chaos']);
export const canAsk = (g: Game, me: number, what: 'pick' | 'avoid' | 'inv' | 'kill', who: number): boolean =>
  g.phase !== 'over' && g.phase !== 'reveal' && !!g.players[me]?.alive && !!g.players[who]?.alive && (what === 'pick' ? who === me : who !== me) &&
  !g.hist.slice(lastGov(g) + 1).some(e => e.k === 'ask' && e.by === me && e.what === what);
export function askTable(g: Game, me: number, what: 'pick' | 'avoid' | 'inv' | 'kill', who: number): Game {
  if (!canAsk(g, me, what, who)) return g;
  const n = g.players[who].name, why = what === 'kill' ? killReasons(g, me).find(r => r.who === who) : undefined;
  const line = what === 'pick' ? 'Quem for presidente: me indica para chanceler.' : what === 'avoid' ? `Quem for presidente: não indica ${n}.` : what === 'kill' ? `Elimina ${n}. ${why?.text || ''}`.trim() : `Quem tiver o poder de investigar: investiga ${n}.`;
  return { ...g, hist: [...g.hist, { k: 'ask', by: me, what, who, ...(why ? { power: why.power } : {}) }], log: [...g.log, `${g.players[me].name}: "${line}"`] };
}
/** The last vote this seat cast that can be asked about, as an index in the history. */
const lastVote = (g: Game): number => lastIndex(g, ['vote']);
export const canWhy = (g: Game, me: number, about: number): boolean => {
  const at = lastVote(g);
  return at >= 0 && about !== me && !!g.players[about]?.ai && g.players[about].alive && !g.hist.slice(at + 1).some(e => e.k === 'why' && e.by === me && e.about === about);
};
export function askWhy(g: Game, me: number, about: number): Game {
  if (!canWhy(g, me, about)) return g;
  const at = lastVote(g), v = g.hist[at] as Extract<Event, { k: 'vote' }>, ja = v.ja.includes(about), W = words(g.pack, g.region);
  const pub = believe(viewOf({ ...g, hist: g.hist.slice(0, at) }, about, 'vote', [1, 0]), true);
  const r = Math.round(100 * (1 - (1 - pub.pF[v.pres]) * (1 - pub.pF[v.chanc])));
  const say = ja ? `Votei ${W.ja} porque achei esse governo mais limpo que a média: uns ${r}% de chance de ter alguém do lado escondido.` : `Votei ${W.nein} porque achei arriscado: uns ${r}% de chance de ter alguém do lado escondido.`;
  return { ...g, hist: [...g.hist, { k: 'why', by: me, about, say }], log: [...g.log, `${g.players[me].name}: "${g.players[about].name}, por que votou ${ja ? W.ja : W.nein}?"`, `${g.players[about].name}: "${say}"`] };
}
export const BLOC_ROUNDS = 3;
export const blocOf = (g: Game, me: number): Extract<Event, { k: 'bloc' }> | null => {
  for (let i = g.hist.length - 1; i >= 0; i--) {
    const e = g.hist[i];
    if (e.k === 'bloc' && e.by === me) return g.hist.slice(i).filter(x => x.k === 'gov' || x.k === 'veto' || x.k === 'chaos' || x.k === 'rej').length < BLOC_ROUNDS ? e : null;
  }
  return null;
};
export function formBloc(g: Game, me: number, who: number[]): Game {
  const pick = [...new Set(who)].filter(i => i !== me && g.players[i]?.ai && g.players[i].alive).slice(0, 3);
  if (!pick.length || blocOf(g, me) || g.phase === 'over') return g;
  const yes = pick.filter(i => {
    const p = g.players[i];
    if (partyOf(p.role) === 'F') return partyOf(g.players[me].role) === 'F';   // the hidden side joins its own, and keeps away from the others
    return 1 - believe(viewOf(g, i, 'vote', [1, 0]), true).pF[me] > 0.55;
  });
  const nm = (xs: number[]): string => xs.map(i => g.players[i].name).join(', ');
  return { ...g, hist: [...g.hist, { k: 'bloc', by: me, with: pick, yes }], log: [...g.log, `${g.players[me].name}: "${nm(pick)}: vamos votar juntos nas próximas rodadas?"`, yes.length ? `${nm(yes)} topou.` : 'Ninguém topou.', ...(pick.length > yes.length ? [`${nm(pick.filter(i => !yes.includes(i)))} preferiu não.`] : [])] };
}

/* ---------- D73: turning a vote, asking for an elimination, proving one is liberal ---------- */
export interface Reason { id: string; label: string; text: string; power: number }
/** What the person can say to turn `to`'s vote: built from what the whole table saw, each with its strength. */
export function swayReasons(g: Game, me: number, to: number, cast: [number, boolean][]): Reason[] {
  const v = cast.find(([j]) => j === to);
  if (!v || to === me || !g.players[to]?.ai || g.chanc === null) return [];
  const W = words(g.pack, g.region), nm = (i: number): string => g.players[i].name, pres = g.pres, chanc = g.chanc;
  const dirty = (i: number): boolean => g.hist.some(e => e.k === 'gov' && e.law === 'F' && (e.pres === i || e.chanc === i));
  const clean = (i: number): boolean => g.hist.some(e => e.k === 'gov' && e.law === 'L' && (e.pres === i || e.chanc === i));
  const out: Reason[] = [];
  if (v[1]) {   // it voted Ja: talk it into Nein
    for (const i of [chanc, pres]) if (dirty(i)) out.push({ id: `dirty${i}`, label: `${nm(i)} já governou e saiu lei ${W.f}`, text: `${nm(i)} esteve num governo que aprovou lei ${W.f}. Não dá para confiar.`, power: 0.5 });
    if (g.laws.F >= LEADER_ZONE) out.push({ id: 'zone', label: `Já há ${LEADER_ZONE} leis ${W.fs}`, text: `Já há ${LEADER_ZONE} leis ${W.fs}: se ${nm(chanc)} for o ${W.boss}, perdemos agora.`, power: 0.45 });
    if (g.tracker < TRACKER_MAX - 1) out.push({ id: 'wait', label: 'Ainda dá para rejeitar', text: 'Ainda dá para rejeitar sem cair no caos. Melhor esperar um governo mais limpo.', power: 0.25 });
  } else {      // it voted Nein: talk it into Ja
    if (g.tracker === TRACKER_MAX - 1) out.push({ id: 'chaos', label: 'Mais uma rejeição traz o caos', text: 'Se rejeitar de novo, o caos aprova a lei do topo às cegas.', power: 0.5 });
    if (clean(chanc) || clean(pres)) out.push({ id: 'clean', label: 'Esse governo tem histórico limpo', text: `${clean(chanc) ? nm(chanc) : nm(pres)} já esteve num governo que aprovou lei liberal.`, power: 0.4 });
    out.push({ id: 'info', label: 'Vamos ver o que sai', text: 'Elege e a gente vê o que sai: a lei mostra quem é quem.', power: 0.25 });
  }
  out.push({ id: 'trust', label: 'Confia em mim', text: 'Confia em mim nessa.', power: 0.2 });
  return out.sort((a, b) => b.power - a.power);
}
/** The person tries to turn `to`'s vote with a reason. The app player turns by the strength of the reason times how much
 *  it trusts the person; the hidden side turns only when it suits its own side. Returns the new votes, whether it
 *  turned, and what was said. */
export function sway(g: Game, me: number, to: number, cast: [number, boolean][], id: string, rand: () => number): { cast: [number, boolean][]; flipped: boolean; said: string[]; roll?: Roll } {
  const r = swayReasons(g, me, to, cast).find(x => x.id === id), v = cast.find(([j]) => j === to);
  if (!r || !v) return { cast, flipped: false, said: [] };
  const p = g.players[to], trust = 1 - believe(viewOf(g, to, 'vote', [1, 0]), true).pF[me];
  let chance = r.power * (0.4 + trust) * (p.persona === 'cetico' ? 0.5 : p.persona === 'certinho' ? 1.2 : 1);
  if (partyOf(p.role) === 'F') { const ally = (i: number): boolean => partyOf(g.players[i].role) === 'F'; const govAlly = ally(g.pres) || ally(g.chanc as number); chance = v[1] === govAlly ? 0.05 : chance * 1.3; }
  // D94: the person rolls Persuade: a good roll makes the reason land, a bad one sinks it
  const dr = roll(g, me, 'Persuade', rand), mult: Record<RollLevel, number> = { crit: 3, extreme: 1.8, hard: 1.4, ok: 1, fail: 0.5, fumble: 0 };
  const flipped = dr ? dr.level !== 'fumble' && (dr.level === 'crit' || rand() < Math.min(0.9, chance * mult[dr.level])) : rand() < Math.min(0.9, chance);   // D95: no sheet, as before
  const nm = (i: number): string => g.players[i].name;
  return { cast: flipped ? cast.map(([j, x]) => [j, j === to ? !x : x] as [number, boolean]) : cast, flipped, said: [`${nm(me)}: "${nm(to)}, ${lower(g, r.text)}"`, `${nm(to)}: "${flipped ? 'Tá bom, mudo meu voto.' : 'Não, mantenho meu voto.'}"`], ...(dr ? { roll: dr } : {}) };
}
/** What the person can show when it says it is liberal: what the record has for it, each with its strength. */
export function selfProofs(g: Game, me: number): Reason[] {
  const W = words(g.pack), out: Reason[] = [];
  const libs = g.hist.filter(e => e.k === 'gov' && e.law === 'L' && (e.pres === me || e.chanc === me)).length;
  if (libs) out.push({ id: 'laws', label: `Aprovei ${libs} lei${libs > 1 ? 's' : ''} liberal${libs > 1 ? 'is' : ''}`, text: `Estive em ${libs} governo${libs > 1 ? 's que aprovaram' : ' que aprovou'} lei liberal.`, power: Math.min(0.6, 0.3 + 0.15 * libs) });
  const inv = g.hist.filter(e => e.k === 'inv' && e.target === me && e.said === 'L');
  if (inv.length) out.push({ id: 'inv', label: `${g.players[(inv[0] as { by: number }).by].name} me investigou`, text: `${g.players[(inv[0] as { by: number }).by].name} me investigou e disse que sou liberal.`, power: 0.55 });
  const tossed = g.hist.filter(e => e.k === 'gov' && e.pres === me && e.pc !== undefined && e.pc >= 2 && e.law === 'L').length;
  if (tossed) out.push({ id: 'toss', label: `Joguei ${W.f} fora`, text: `Tirei ${W.fs} e mesmo assim saiu liberal: joguei ${W.f} fora.`, power: 0.45 });
  const vouch = g.hist.filter(e => e.k === 'talk' && e.say === 'trust' && e.about === me && e.by !== me).length;
  if (vouch) out.push({ id: 'vouch', label: 'Tem gente que confia em mim', text: `${vouch} já disse${vouch > 1 ? 'ram' : ''} que confia em mim.`, power: 0.25 });
  out.push({ id: 'word', label: 'Só a minha palavra', text: 'Não tenho prova, só a minha palavra.', power: 0.05 });
  return out.sort((a, b) => b.power - a.power);
}

/** D73: who the person could ask the app player presiding to eliminate, each with the strongest reason the record has. */
export function killReasons(g: Game, me: number): { who: number; text: string; power: number }[] {
  return g.players.map((p, i) => i).filter(i => i !== me && i !== g.pres && g.players[i].alive).map(i => {
    const ev = evidence(g, i).filter(x => !proofEarly(g, x)), top = ev.find(x => x.hit) ?? ev[0];
    return { who: i, text: top ? `${top.text}.` : 'Nada na ata contra ele.', power: top ? (top.hit ? 0.5 : 0.2) : 0 };
  }).sort((a, b) => b.power - a.power);
}
/** The person says it is liberal and shows a proof: each app player says whether it believes (0), is not sure (1) or
 *  doubts (2), by what it thought of the person, the strength of the proof and its side. Once a round. */
export function selfClaimProof(g: Game, me: number, id: string): Game {
  if (!canSelfClaim(g, me)) return g;
  const pr = selfProofs(g, me).find(x => x.id === id);
  if (!pr) return g;
  const re: [number, number][] = [];
  g.players.forEach((p, j) => {
    if (!p.ai || !p.alive || j === me) return;
    const hidden = partyOf(p.role) === 'F', ally = hidden && partyOf(g.players[me].role) === 'F';
    const x = hidden ? (ally ? 0.6 : 0.1 + pr.power * 0.4) : (1 - believe(viewOf(g, j, 'vote', [1, 0]), true).pF[me]) - 0.5 + pr.power * 0.6 + 0.1 * (p.mood ?? 0);
    re.push([j, x > 0.3 ? 0 : x < 0.05 ? 2 : 1]);
  });
  const say = ['acredito', 'sei não', 'duvido'];
  return { ...g, hist: [...g.hist, { k: 'self', by: me, proof: id, power: pr.power, re }], log: [...g.log, `${g.players[me].name}: "Eu sou liberal. ${pr.text}"`, ...re.map(([j, a]) => `${g.players[j].name}: "${say[a].charAt(0).toUpperCase()}${say[a].slice(1)}."`)] };
}

