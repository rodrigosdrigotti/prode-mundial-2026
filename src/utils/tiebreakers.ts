/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, GroupStandingRow, User, UserRankRow, GroupPredictionStore, MatchPrediction } from '../types';
import { TEAMS } from '../data/teamsAndMatches';

/**
 * Calculates the score of a single match prediction against actual result.
 * Returns { totalPoints: number, outcomeMatch: boolean, exactMatch: boolean }
 */
export function calculateMatchScore(
  pred: MatchPrediction | undefined,
  actual: Match
): { totalPoints: number; outcomeMatch: boolean; exactMatch: boolean } {
  if (!pred || pred.team1Goals === null || pred.team2Goals === null || pred.team1Goals === undefined || pred.team2Goals === undefined) {
    return { totalPoints: 0, outcomeMatch: false, exactMatch: false };
  }
  if (actual.team1Goals === null || actual.team2Goals === null || actual.team1Goals === undefined || actual.team2Goals === undefined) {
    return { totalPoints: 0, outcomeMatch: false, exactMatch: false };
  }

  const p1 = pred.team1Goals;
  const p2 = pred.team2Goals;
  const a1 = actual.team1Goals;
  const a2 = actual.team2Goals;

  // Actual outcome
  const actualOutcome = a1 > a2 ? '1' : a1 < a2 ? '2' : 'D';
  // Predicted outcome
  const predOutcome = p1 > p2 ? '1' : p1 < p2 ? '2' : 'D';

  const outcomeMatch = actualOutcome === predOutcome;
  const exactMatch = p1 === a1 && p2 === a2;

  let totalPoints = 0;
  if (outcomeMatch) {
    totalPoints += 3;
    if (exactMatch) {
      totalPoints += 2;
    }
  }

  // Knockout stage penalty shootout prediction bonus
  if (actual.type === 'knockout' && a1 === a2 && p1 === p2 && predOutcome === 'D' && actualOutcome === 'D') {
    const p1Pen = pred.team1Penalties;
    const p2Pen = pred.team2Penalties;
    const a1Pen = actual.team1Penalties;
    const a2Pen = actual.team2Penalties;

    if (
      p1Pen !== undefined && p2Pen !== undefined && p1Pen !== null && p2Pen !== null &&
      a1Pen !== undefined && a2Pen !== undefined && a1Pen !== null && a2Pen !== null
    ) {
      const actualPenWinner = a1Pen > a2Pen ? '1' : a1Pen < a2Pen ? '2' : null;
      const predPenWinner = p1Pen > p2Pen ? '1' : p1Pen < p2Pen ? '2' : null;
      if (actualPenWinner && predPenWinner && actualPenWinner === predPenWinner) {
        totalPoints += 1; // Award +1 point for predicting the correct winner of penalty shootout
      }
    }
  }

  return { totalPoints, outcomeMatch, exactMatch };
}

/**
 * Calculates a participant's detailed breakdown of points within a single group.
 */
export function calculateUserPointsInGroup(
  userId: string,
  groupId: string,
  userRegisterDate: string,
  userGroupPrediction: GroupPredictionStore | undefined,
  matches: Match[],
  actualExtras: {
    championTeamId: string;
    topScorer: string;
    mvp: string;
    surpriseTeamId: string;
    disappointmentTeamId: string;
  }
): Omit<UserRankRow, 'rank'> {
  let matchPoints = 0;
  let groupStagePoints = 0;
  let extraPoints = 0;

  if (userGroupPrediction) {
    // 1. Calculate match points
    matches.forEach((match) => {
      const pred = userGroupPrediction.matches[match.id];
      const { totalPoints } = calculateMatchScore(pred, match);
      matchPoints += totalPoints;

      // Classify if it was in group stage ('A' through 'L')
      const isGroupStage = match.type === 'group';
      if (isGroupStage) {
        groupStagePoints += totalPoints;
      }
    });

    // 2. Extra predictions
    const ext = userGroupPrediction.extras;
    if (ext) {
      if (actualExtras.championTeamId && ext.championTeamId === actualExtras.championTeamId) {
        extraPoints += 10;
      }
      if (actualExtras.topScorer && ext.topScorer.trim().toLowerCase() === actualExtras.topScorer.trim().toLowerCase()) {
        extraPoints += 5;
      }
      if (actualExtras.mvp && ext.mvp.trim().toLowerCase() === actualExtras.mvp.trim().toLowerCase()) {
        extraPoints += 5;
      }
      if (actualExtras.surpriseTeamId && ext.surpriseTeamId === actualExtras.surpriseTeamId) {
        extraPoints += 5;
      }
      if (actualExtras.disappointmentTeamId && ext.disappointmentTeamId === actualExtras.disappointmentTeamId) {
        extraPoints += 5;
      }
    }
  }

  const totalPoints = matchPoints + extraPoints;

  return {
    userId,
    userName: '', // populated elsewhere
    email: userId,
    totalPoints,
    matchPoints,
    extraPoints,
    groupStagePoints,
    registerDate: userRegisterDate
  };
}

/**
 * Computes the rankings of all group members according to official tiebreaker rules.
 * 
 * Order of tiebreakers:
 * 1. Total points.
 * 2. Total points in match predictions (outcome + exact).
 * 3. Total points in extras.
 * 4. Total points in group stage matches.
 * 5. Older registration date (chronological sort).
 */
export function getRankedUsersInGroup(
  memberIds: string[],
  usersMap: Record<string, User>,
  groupId: string,
  predictionsStore: Record<string, Record<string, GroupPredictionStore>>,
  matches: Match[],
  actualExtras: {
    championTeamId: string;
    topScorer: string;
    mvp: string;
    surpriseTeamId: string;
    disappointmentTeamId: string;
  }
): UserRankRow[] {
  const usersData = memberIds
    .map((memberId) => {
      const usr = usersMap[memberId];
      if (!usr) return null;
      const userPreds = predictionsStore[memberId]?.[groupId];
      const breakdown = calculateUserPointsInGroup(
        memberId,
        groupId,
        usr.registerDate,
        userPreds,
        matches,
        actualExtras
      );
      breakdown.userName = usr.name;
      return breakdown;
    })
    .filter((x): x is Omit<UserRankRow, 'rank'> => x !== null);

  // Apply tiebreaking sort
  usersData.sort((a, b) => {
    // 1. Total Points desc
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    // 2. Match prediction points desc
    if (b.matchPoints !== a.matchPoints) {
      return b.matchPoints - a.matchPoints;
    }
    // 3. Extra predictions points desc
    if (b.extraPoints !== a.extraPoints) {
      return b.extraPoints - a.extraPoints;
    }
    // 4. Group stage match points desc
    if (b.groupStagePoints !== a.groupStagePoints) {
      return b.groupStagePoints - a.groupStagePoints;
    }
    // 5. Older registration date (earlier date first)
    const dateA = new Date(a.registerDate).getTime();
    const dateB = new Date(b.registerDate).getTime();
    return dateA - dateB;
  });

  return usersData.map((row, idx) => ({
    ...row,
    rank: idx + 1
  }));
}

/**
 * Calculates current standing statistics (PJ, G, E, P, DG, Pts) for a specific group of teams
 */
export function calculateGroupStandings(
  groupLetter: string,
  teamIds: string[],
  matches: Match[]
): GroupStandingRow[] {
  const standings: Record<string, GroupStandingRow> = {};

  // Initialize
  teamIds.forEach((tId) => {
    const t = TEAMS[tId];
    standings[tId] = {
      teamId: tId,
      teamName: t ? t.name : tId,
      emoji: t ? t.emoji : '🏳️',
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      dg: 0,
      pts: 0
    };
  });

  // Process matches played in group stage for requested letter
  const groupMatches = matches.filter(
    (m) => m.type === 'group' && m.group.toUpperCase() === groupLetter.toUpperCase()
  );

  groupMatches.forEach((m) => {
    const { team1, team2, team1Goals, team2Goals } = m;
    if (team1Goals === null || team2Goals === null) return; // not played yet

    const t1Row = standings[team1];
    const t2Row = standings[team2];

    if (!t1Row || !t2Row) return;

    t1Row.pj += 1;
    t2Row.pj += 1;

    const diff1 = team1Goals - team2Goals;
    t1Row.dg += diff1;
    t2Row.dg -= diff1;

    if (team1Goals > team2Goals) {
      t1Row.g += 1;
      t1Row.pts += 3;
      t2Row.p += 1;
    } else if (team1Goals < team2Goals) {
      t2Row.g += 1;
      t2Row.pts += 3;
      t1Row.p += 1;
    } else {
      t1Row.e += 1;
      t1Row.pts += 1;
      t2Row.e += 1;
      t2Row.pts += 1;
    }
  });

  const sortedRows = Object.values(standings);

  // Sorting priorities for group rankings:
  // 1. Points
  // 2. Goal Difference
  // 3. Name alphabetical as fallback
  sortedRows.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    return a.teamName.localeCompare(b.teamName);
  });

  return sortedRows;
}
