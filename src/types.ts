/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  name: string;
  emoji: string;
}

export interface Match {
  id: string;
  group: string; // "A" to "L" for Group Stage, or "16avos" | "8vos" | "4tos" | "semis" | "third_place" | "final"
  team1: string; // Team ID or placeholder
  team2: string; // Team ID or placeholder
  team1Goals: number | null; // Null means not played yet
  team2Goals: number | null; // Null means not played yet
  team1Penalties?: number | null; // Null means no penalties or not played yet
  team2Penalties?: number | null; // Null means no penalties or not played yet
  date: string; // e.g. "2026-06-11"
  time: string; // e.g. "13:00"
  type: 'group' | 'knockout';
  nextMatchId?: string; // For auto bracket progression
  placeholderName1?: string; // If team1 is a placeholder, e.g. "1º Gpo A"
  placeholderName2?: string;
}

export interface ExtrasPrediction {
  championTeamId: string;
  topScorer: string;
  mvp: string;
  surpriseTeamId: string;
  disappointmentTeamId: string;
}

export interface MatchPrediction {
  team1Goals: number | null;
  team2Goals: number | null;
  team1Penalties?: number | null;
  team2Penalties?: number | null;
}

export interface GroupPredictionStore {
  // Key: matchId -> Game score prediction
  matches: Record<string, MatchPrediction>;
  extras: ExtrasPrediction;
}

export interface User {
  id: string; // Email as unique ID
  name: string;
  email: string;
  registerDate: string; // ISO String
  isAdmin: boolean;
  scoreByGroup: Record<string, number>; // GroupId -> score
  verified?: boolean;
  verificationCode?: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  memberIds: string[];
  requiresApproval?: boolean;
  pendingMemberIds?: string[];
}

export interface GroupStandingRow {
  teamId: string;
  teamName: string;
  emoji: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  dg: number;
  pts: number;
}

export interface UserRankRow {
  userId: string;
  userName: string;
  email: string;
  totalPoints: number;
  matchPoints: number;
  extraPoints: number;
  groupStagePoints: number;
  registerDate: string;
  rank: number;
}

export interface TestSimulationReport {
  timestamp: string;
  userCount: number;
  groupCount: number;
  matchesPlayed: number;
  predictionsCount: number;
  topPlayers: Array<{ name: string; points: number; groupName: string }>;
  errorsFound: string[];
  statusMessage: string;
}
