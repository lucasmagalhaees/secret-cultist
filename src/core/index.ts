// The pure core, as one object: what the page uses and what the tests exercise (tests/unit.cases.mjs).
import { openDlc, dlcData } from './dlc';
import { BOT_NAMES, NAMES_BY, PERSONAS, REGIONS, REGION_NAMES, botName, freshPick, REPEAT_KEEP, LEVELS, boardOf, LEADER_KNOWS_UPTO, powerAt, specialElect, addName, answerVeto, askVeto, canNominate, canVeto, SMALL_TABLE, VETO_FROM, canTarget, chancellorDiscard, checkNames, CULTISTS, DECK_F, DECK_L, endPower, execute, investigate, investigated, knows, lawName, MAX_PLAYERS, MIN_PLAYERS, NAME_MAX, newGame, nominate, partyOf, POWERS, presidentDiscard, revealNext, seeded, shuffle, LEADER_ZONE, TRACKER_MAX, vote, WIN } from './game';
import { BOSS_STYLE, AI, socialMemory, governmentPlan, believe, decide, decideWhy, drawOdds, QUIET, TALK_W, backed, ZONE_SURE, ZONE_DIRTY, LATE_FROM, EARLY_CLEAN, PERSONA, REACT, temper } from './ai';
import { intimidate, sense, SENSE_MAX, READ_MAX, reputation, ACHIEVEMENTS, achievements, pendingAccusation, defend, usedProofs, sharpness, comboPower, comboText, threeOdds, stack, canSelfClaim, selfClaim, canPlea, plea, canAsk, askTable, killReasons,  selfClaimProof, selfProofs, swayReasons, sway, tallyVotes, commitVotes, canWhy, askWhy, blocOf, formBloc, BLOC_ROUNDS, evidence, proofEarly, execReason, ELOQ, eloq, debateNext, debateArgs, debateSay, debateBot, debateVerdict, accuse, reputationNotice, accusationFeedback, highlights, reply, answer, notesScore, canDenounce, denounce, botStep, botTurn, castVotes, claims, coach, crux, suspicion, hasAi, humansAlive, say, talk, review, talker, TALKS, thoughts, trail, turn, viewOf } from './judge';
import { HISTORY_MAX, historyFile, pastGames, readGame, readHistory, readState } from './save';
import { PACKS, VOTES, WORDS, words, cultSpeak, speakAs } from './words';
import { normEntries, normEntry, normSheet, normLore, normSession, normSecret } from './source';
import { CHAPTERS, MANIAS, maniaOf, mythosOf, MYTHOS_PAGE, MYTHOS_SEES, DOCS, PASTS, NPCS, NPC_SAN, RARES, RARE_IDS, HORROR, horrorOf } from './horror';
import { chronicle, giveStake, loreAsk, retell, OMENS, STAKES } from './chronicle';
import { GODS, SCENES, sceneOf, godOf, setScene, narrate, actOf } from './story';
import { ITEMS, ITEM_IDS, TRAPS, TRAP_IDS, itemOf, dealItems, canSteal, steal, springTrap, trapsDue, mad, statesOf, tend, STATE_NAME, poisonedRounds, chapterAfter } from './items';
import { cultDice, canFaith, faith, aiFaith, HEALERS, FAITH_SAN, RANK, levelOf, roll, ROLL_BONUS, ROLL_NAME, SKILLS, SKILL_USE, STRONG_ARG, WEAK_ARG, EASE, EASE_CAP, SUPPORT, SUPPORT_AT, CHAR_NAME, STEREOTYPES, LUCK_MAX, luckLeft, rollsBy, attack, sheetOf, skillForArg, sanity, SAN_LOSS, SAN_LOW, SHAKEN } from './dice';
import { BREAK_AFTER, BREAK_MAX, BREAK_WAIT, breakerAllows, breakerFail, breakerOk, breakerState, readBreaker } from './breaker';

export const Core = {
  BOSS_STYLE,
  MIN_PLAYERS, MAX_PLAYERS, NAME_MAX, DECK_F, DECK_L, WIN, TRACKER_MAX, LEADER_ZONE, VETO_FROM, SMALL_TABLE, CULTISTS, POWERS, LEADER_KNOWS_UPTO, boardOf, powerAt,
  seeded, shuffle, partyOf, lawName, addName, checkNames, newGame, knows, revealNext, canNominate, nominate, vote,
  presidentDiscard, chancellorDiscard, canVeto, askVeto, answerVeto, canTarget, specialElect, investigate, investigated, endPower, execute,
  openDlc, dlcData, intimidate, sense, reputation, ACHIEVEMENTS, achievements, pendingAccusation, defend, usedProofs, sharpness, comboPower, comboText, threeOdds, stack, canSelfClaim, selfClaim, canPlea, plea, canAsk, askTable, killReasons, selfClaimProof, selfProofs, swayReasons, sway, tallyVotes, commitVotes, canWhy, askWhy, blocOf, formBloc, BLOC_ROUNDS, evidence, proofEarly, execReason, ELOQ, eloq, debateNext, debateArgs, debateSay, debateBot, debateVerdict, accuse, reputationNotice, accusationFeedback, highlights, reply, answer, notesScore, canDenounce, denounce, TALK_W, backed, ZONE_SURE, ZONE_DIRTY, LATE_FROM, EARLY_CLEAN, PERSONA, PERSONAS, REACT, temper, LEVELS, BOT_NAMES, NAMES_BY, REGIONS, REGION_NAMES, botName, freshPick, REPEAT_KEEP, AI, socialMemory, governmentPlan, believe, decide, decideWhy, drawOdds, QUIET, TALKS, trail, review, talker, talk, coach, thoughts, suspicion, crux, viewOf, turn, botTurn, botStep, castVotes, claims, say, hasAi, humansAlive,
  PACKS, VOTES, WORDS, words, cultSpeak, speakAs,
  readGame, readState, readHistory, historyFile, pastGames, HISTORY_MAX, normEntry, normEntries, normSheet, normLore, normSession, normSecret, cultDice, chronicle, giveStake, loreAsk, retell, OMENS, STAKES, SENSE_MAX, READ_MAX, canFaith, faith, aiFaith, HEALERS, FAITH_SAN, RANK, levelOf, roll, ROLL_BONUS, ROLL_NAME, SKILLS, SKILL_USE, STRONG_ARG, WEAK_ARG, EASE, EASE_CAP, SUPPORT, SUPPORT_AT, CHAR_NAME, STEREOTYPES, LUCK_MAX, luckLeft, rollsBy, attack, ITEMS, ITEM_IDS, TRAPS, TRAP_IDS, itemOf, dealItems, canSteal, steal, springTrap, trapsDue, mad, statesOf, tend, STATE_NAME, poisonedRounds, chapterAfter, CHAPTERS, MANIAS, maniaOf, mythosOf, MYTHOS_PAGE, MYTHOS_SEES, DOCS, PASTS, NPCS, NPC_SAN, RARES, RARE_IDS, HORROR, horrorOf, GODS, SCENES, sceneOf, godOf, setScene, narrate, actOf, sheetOf, skillForArg, sanity, SAN_LOSS, SAN_LOW, SHAKEN, BREAK_AFTER, BREAK_MAX, BREAK_WAIT, breakerAllows, breakerFail, breakerOk, breakerState, readBreaker
};
export type * from './types';
export type * from './breaker';

export type { ItemId as ItemKey, TrapId as TrapKey } from './items';
