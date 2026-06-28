/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, Match } from '../types';

export const TEAMS: Record<string, Team> = {
  // Group A
  mex: { id: 'mex', name: 'México', emoji: '🇲🇽' },
  rsa: { id: 'rsa', name: 'Sudáfrica', emoji: '🇿🇦' },
  kor: { id: 'kor', name: 'Corea del Sur', emoji: '🇰🇷' },
  cze: { id: 'cze', name: 'República Checa', emoji: '🇨🇿' },
  // Group B
  can: { id: 'can', name: 'Canadá', emoji: '🇨🇦' },
  bih: { id: 'bih', name: 'Bosnia-Herzegovina', emoji: '🇧🇦' },
  qat: { id: 'qat', name: 'Qatar', emoji: '🇶🇦' },
  sui: { id: 'sui', name: 'Suiza', emoji: '🇨🇭' },
  // Group C
  bra: { id: 'bra', name: 'Brasil', emoji: '🇧🇷' },
  mar: { id: 'mar', name: 'Marruecos', emoji: '🇲🇦' },
  hai: { id: 'hai', name: 'Haití', emoji: '🇭🇹' },
  sco: { id: 'sco', name: 'Escocia', emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  // Group D
  usa: { id: 'usa', name: 'Estados Unidos', emoji: '🇺🇸' },
  par: { id: 'par', name: 'Paraguay', emoji: '🇵🇾' },
  aus: { id: 'aus', name: 'Australia', emoji: '🇦🇺' },
  tur: { id: 'tur', name: 'Turquía', emoji: '🇹🇷' },
  // Group E
  ger: { id: 'ger', name: 'Alemania', emoji: '🇩🇪' },
  cuw: { id: 'cuw', name: 'Curazao', emoji: '🇨🇼' },
  civ: { id: 'civ', name: 'Costa de Marfil', emoji: '🇨🇮' },
  ecu: { id: 'ecu', name: 'Ecuador', emoji: '🇪🇨' },
  // Group F
  ned: { id: 'ned', name: 'Países Bajos', emoji: '🇳🇱' },
  jpn: { id: 'jpn', name: 'Japón', emoji: '🇯🇵' },
  swe: { id: 'swe', name: 'Suecia', emoji: '🇸🇪' },
  tun: { id: 'tun', name: 'Túnez', emoji: '🇹🇳' },
  // Group G
  bel: { id: 'bel', name: 'Bélgica', emoji: '🇧🇪' },
  egy: { id: 'egy', name: 'Egipto', emoji: '🇪🇬' },
  irn: { id: 'irn', name: 'Irán', emoji: '🇮🇷' },
  nzl: { id: 'nzl', name: 'Nueva Zelanda', emoji: '🇳🇿' },
  // Group H
  esp: { id: 'esp', name: 'España', emoji: '🇪🇸' },
  cpv: { id: 'cpv', name: 'Cabo Verde', emoji: '🇨🇻' },
  ksa: { id: 'ksa', name: 'Arabia Saudita', emoji: '🇸🇦' },
  uru: { id: 'uru', name: 'Uruguay', emoji: '🇺🇾' },
  // Group I
  fra: { id: 'fra', name: 'Francia', emoji: '🇫🇷' },
  sen: { id: 'sen', name: 'Senegal', emoji: '🇸🇳' },
  irq: { id: 'irq', name: 'Irak', emoji: '🇮🇶' },
  nor: { id: 'nor', name: 'Noruega', emoji: '🇳🇴' },
  // Group J
  arg: { id: 'arg', name: 'Argentina', emoji: '🇦🇷' },
  alg: { id: 'alg', name: 'Argelia', emoji: '🇩🇿' },
  aut: { id: 'aut', name: 'Austria', emoji: '🇦🇹' },
  jor: { id: 'jor', name: 'Jordania', emoji: '🇯🇴' },
  // Group K
  por: { id: 'por', name: 'Portugal', emoji: '🇵🇹' },
  cod: { id: 'cod', name: 'RD Congo', emoji: '🇨🇩' },
  uzb: { id: 'uzb', name: 'Uzbekistán', emoji: '🇺🇿' },
  col: { id: 'col', name: 'Colombia', emoji: '🇨🇴' },
  // Group L
  eng: { id: 'eng', name: 'Inglaterra', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  cro: { id: 'cro', name: 'Croacia', emoji: '🇭🇷' },
  gha: { id: 'gha', name: 'Ghana', emoji: '🇬🇭' },
  pan: { id: 'pan', name: 'Panamá', emoji: '🇵🇦' }
};

export const GROUP_ALPHABETS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const GROUP_TEAMS: Record<string, string[]> = {
  A: ['mex', 'rsa', 'kor', 'cze'],
  B: ['can', 'bih', 'qat', 'sui'],
  C: ['bra', 'mar', 'hai', 'sco'],
  D: ['usa', 'par', 'aus', 'tur'],
  E: ['ger', 'cuw', 'civ', 'ecu'],
  F: ['ned', 'jpn', 'swe', 'tun'],
  G: ['bel', 'egy', 'irn', 'nzl'],
  H: ['esp', 'cpv', 'ksa', 'uru'],
  I: ['fra', 'sen', 'irq', 'nor'],
  J: ['arg', 'alg', 'aut', 'jor'],
  K: ['por', 'cod', 'uzb', 'col'],
  L: ['eng', 'cro', 'gha', 'pan']
};

export const INITIAL_GROUP_MATCHES: Match[] = [
  // --- Grupo A ---
  { id: 'a_m1', group: 'A', team1: 'mex', team2: 'rsa', team1Goals: null, team2Goals: null, date: '2026-06-11', time: '16:00', type: 'group' },
  { id: 'a_m2', group: 'A', team1: 'kor', team2: 'cze', team1Goals: null, team2Goals: null, date: '2026-06-11', time: '23:00', type: 'group' },
  { id: 'a_m3', group: 'A', team1: 'cze', team2: 'rsa', team1Goals: null, team2Goals: null, date: '2026-06-18', time: '13:00', type: 'group' },
  { id: 'a_m4', group: 'A', team1: 'mex', team2: 'kor', team1Goals: null, team2Goals: null, date: '2026-06-18', time: '22:00', type: 'group' },
  { id: 'a_m5', group: 'A', team1: 'rsa', team2: 'kor', team1Goals: null, team2Goals: null, date: '2026-06-24', time: '22:00', type: 'group' }, // Sudáfrica vs Corea
  { id: 'a_m6', group: 'A', team1: 'mex', team2: 'cze', team1Goals: null, team2Goals: null, date: '2026-06-24', time: '22:00', type: 'group' }, // México vs Rep Checa

  // --- Grupo B ---
  { id: 'b_m1', group: 'B', team1: 'can', team2: 'bih', team1Goals: null, team2Goals: null, date: '2026-06-12', time: '16:00', type: 'group' },
  { id: 'b_m2', group: 'B', team1: 'qat', team2: 'sui', team1Goals: null, team2Goals: null, date: '2026-06-13', time: '16:00', type: 'group' },
  { id: 'b_m3', group: 'B', team1: 'sui', team2: 'bih', team1Goals: null, team2Goals: null, date: '2026-06-18', time: '16:00', type: 'group' },
  { id: 'b_m4', group: 'B', team1: 'can', team2: 'qat', team1Goals: null, team2Goals: null, date: '2026-06-18', time: '19:00', type: 'group' },
  { id: 'b_m5', group: 'B', team1: 'sui', team2: 'can', team1Goals: null, team2Goals: null, date: '2026-06-24', time: '16:00', type: 'group' },
  { id: 'b_m6', group: 'B', team1: 'bih', team2: 'qat', team1Goals: null, team2Goals: null, date: '2026-06-24', time: '16:00', type: 'group' },

  // --- Grupo C ---
  { id: 'c_m1', group: 'C', team1: 'bra', team2: 'mar', team1Goals: null, team2Goals: null, date: '2026-06-13', time: '19:00', type: 'group' },
  { id: 'c_m2', group: 'C', team1: 'hai', team2: 'sco', team1Goals: null, team2Goals: null, date: '2026-06-13', time: '22:00', type: 'group' },
  { id: 'c_m3', group: 'C', team1: 'sco', team2: 'mar', team1Goals: null, team2Goals: null, date: '2026-06-19', time: '19:00', type: 'group' },
  { id: 'c_m4', group: 'C', team1: 'bra', team2: 'hai', team1Goals: null, team2Goals: null, date: '2026-06-19', time: '21:30', type: 'group' },
  { id: 'c_m5', group: 'C', team1: 'sco', team2: 'bra', team1Goals: null, team2Goals: null, date: '2026-06-24', time: '19:00', type: 'group' },
  { id: 'c_m6', group: 'C', team1: 'mar', team2: 'hai', team1Goals: null, team2Goals: null, date: '2026-06-24', time: '19:00', type: 'group' },

  // --- Grupo D ---
  { id: 'd_m1', group: 'D', team1: 'usa', team2: 'par', team1Goals: null, team2Goals: null, date: '2026-06-12', time: '22:00', type: 'group' },
  { id: 'd_m2', group: 'D', team1: 'aus', team2: 'tur', team1Goals: null, team2Goals: null, date: '2026-06-14', time: '01:00', type: 'group' },
  { id: 'd_m3', group: 'D', team1: 'usa', team2: 'aus', team1Goals: null, team2Goals: null, date: '2026-06-19', time: '16:00', type: 'group' },
  { id: 'd_m4', group: 'D', team1: 'tur', team2: 'par', team1Goals: null, team2Goals: null, date: '2026-06-20', time: '00:00', type: 'group' },
  { id: 'd_m5', group: 'D', team1: 'tur', team2: 'usa', team1Goals: null, team2Goals: null, date: '2026-06-25', time: '23:00', type: 'group' },
  { id: 'd_m6', group: 'D', team1: 'par', team2: 'aus', team1Goals: null, team2Goals: null, date: '2026-06-25', time: '23:00', type: 'group' },

  // --- Grupo E ---
  { id: 'e_m1', group: 'E', team1: 'ger', team2: 'cuw', team1Goals: null, team2Goals: null, date: '2026-06-14', time: '14:00', type: 'group' },
  { id: 'e_m2', group: 'E', team1: 'civ', team2: 'ecu', team1Goals: null, team2Goals: null, date: '2026-06-14', time: '20:00', type: 'group' },
  { id: 'e_m3', group: 'E', team1: 'ger', team2: 'civ', team1Goals: null, team2Goals: null, date: '2026-06-20', time: '17:00', type: 'group' },
  { id: 'e_m4', group: 'E', team1: 'ecu', team2: 'cuw', team1Goals: null, team2Goals: null, date: '2026-06-20', time: '21:00', type: 'group' },
  { id: 'e_m5', group: 'E', team1: 'cuw', team2: 'civ', team1Goals: null, team2Goals: null, date: '2026-06-25', time: '17:00', type: 'group' },
  { id: 'e_m6', group: 'E', team1: 'ecu', team2: 'ger', team1Goals: null, team2Goals: null, date: '2026-06-25', time: '17:00', type: 'group' },

  // --- Grupo F ---
  { id: 'f_m1', group: 'F', team1: 'ned', team2: 'jpn', team1Goals: null, team2Goals: null, date: '2026-06-14', time: '17:00', type: 'group' },
  { id: 'f_m2', group: 'F', team1: 'swe', team2: 'tun', team1Goals: null, team2Goals: null, date: '2026-06-14', time: '23:00', type: 'group' },
  { id: 'f_m3', group: 'F', team1: 'ned', team2: 'swe', team1Goals: null, team2Goals: null, date: '2026-06-20', time: '14:00', type: 'group' },
  { id: 'f_m4', group: 'F', team1: 'tun', team2: 'jpn', team1Goals: null, team2Goals: null, date: '2026-06-21', time: '01:00', type: 'group' },
  { id: 'f_m5', group: 'F', team1: 'jpn', team2: 'swe', team1Goals: null, team2Goals: null, date: '2026-06-25', time: '20:00', type: 'group' },
  { id: 'f_m6', group: 'F', team1: 'tun', team2: 'ned', team1Goals: null, team2Goals: null, date: '2026-06-25', time: '20:00', type: 'group' },

  // --- Grupo G ---
  { id: 'g_m1', group: 'G', team1: 'bel', team2: 'egy', team1Goals: null, team2Goals: null, date: '2026-06-15', time: '16:00', type: 'group' },
  { id: 'g_m2', group: 'G', team1: 'irn', team2: 'nzl', team1Goals: null, team2Goals: null, date: '2026-06-15', time: '22:00', type: 'group' },
  { id: 'g_m3', group: 'G', team1: 'bel', team2: 'irn', team1Goals: null, team2Goals: null, date: '2026-06-21', time: '16:00', type: 'group' },
  { id: 'g_m4', group: 'G', team1: 'nzl', team2: 'egy', team1Goals: null, team2Goals: null, date: '2026-06-21', time: '22:00', type: 'group' },
  { id: 'g_m5', group: 'G', team1: 'nzl', team2: 'bel', team1Goals: null, team2Goals: null, date: '2026-06-27', time: '00:00', type: 'group' },
  { id: 'g_m6', group: 'G', team1: 'egy', team2: 'irn', team1Goals: null, team2Goals: null, date: '2026-06-27', time: '00:00', type: 'group' },

  // --- Grupo H ---
  { id: 'h_m1', group: 'H', team1: 'esp', team2: 'cpv', team1Goals: null, team2Goals: null, date: '2026-06-15', time: '13:00', type: 'group' },
  { id: 'h_m2', group: 'H', team1: 'ksa', team2: 'uru', team1Goals: null, team2Goals: null, date: '2026-06-15', time: '19:00', type: 'group' },
  { id: 'h_m3', group: 'H', team1: 'esp', team2: 'ksa', team1Goals: null, team2Goals: null, date: '2026-06-21', time: '13:00', type: 'group' },
  { id: 'h_m4', group: 'H', team1: 'uru', team2: 'cpv', team1Goals: null, team2Goals: null, date: '2026-06-21', time: '19:00', type: 'group' },
  { id: 'h_m5', group: 'H', team1: 'cpv', team2: 'ksa', team1Goals: null, team2Goals: null, date: '2026-06-26', time: '21:00', type: 'group' },
  { id: 'h_m6', group: 'H', team1: 'uru', team2: 'esp', team1Goals: null, team2Goals: null, date: '2026-06-26', time: '21:00', type: 'group' },

  // --- Grupo I ---
  { id: 'i_m1', group: 'I', team1: 'fra', team2: 'sen', team1Goals: null, team2Goals: null, date: '2026-06-16', time: '16:00', type: 'group' },
  { id: 'i_m2', group: 'I', team1: 'irq', team2: 'nor', team1Goals: null, team2Goals: null, date: '2026-06-16', time: '19:00', type: 'group' },
  { id: 'i_m3', group: 'I', team1: 'fra', team2: 'irq', team1Goals: null, team2Goals: null, date: '2026-06-22', time: '18:00', type: 'group' },
  { id: 'i_m4', group: 'I', team1: 'nor', team2: 'sen', team1Goals: null, team2Goals: null, date: '2026-06-22', time: '21:00', type: 'group' },
  { id: 'i_m5', group: 'I', team1: 'sen', team2: 'irq', team1Goals: null, team2Goals: null, date: '2026-06-26', time: '16:00', type: 'group' },
  { id: 'i_m6', group: 'I', team1: 'nor', team2: 'fra', team1Goals: null, team2Goals: null, date: '2026-06-26', time: '16:00', type: 'group' },

  // --- Grupo J ---
  { id: 'j_m1', group: 'J', team1: 'arg', team2: 'alg', team1Goals: null, team2Goals: null, date: '2026-06-16', time: '22:00', type: 'group' },
  { id: 'j_m2', group: 'J', team1: 'aut', team2: 'jor', team1Goals: null, team2Goals: null, date: '2026-06-17', time: '01:00', type: 'group' },
  { id: 'j_m3', group: 'J', team1: 'arg', team2: 'aut', team1Goals: null, team2Goals: null, date: '2026-06-22', time: '14:00', type: 'group' },
  { id: 'j_m4', group: 'J', team1: 'jor', team2: 'alg', team1Goals: null, team2Goals: null, date: '2026-06-23', time: '00:00', type: 'group' },
  { id: 'j_m5', group: 'J', team1: 'alg', team2: 'aut', team1Goals: null, team2Goals: null, date: '2026-06-27', time: '23:00', type: 'group' },
  { id: 'j_m6', group: 'J', team1: 'jor', team2: 'arg', team1Goals: null, team2Goals: null, date: '2026-06-27', time: '23:00', type: 'group' },

  // --- Grupo K ---
  { id: 'k_m1', group: 'K', team1: 'por', team2: 'cod', team1Goals: null, team2Goals: null, date: '2026-06-17', time: '14:00', type: 'group' },
  { id: 'k_m2', group: 'K', team1: 'uzb', team2: 'col', team1Goals: null, team2Goals: null, date: '2026-06-17', time: '23:00', type: 'group' },
  { id: 'k_m3', group: 'K', team1: 'por', team2: 'uzb', team1Goals: null, team2Goals: null, date: '2026-06-23', time: '14:00', type: 'group' },
  { id: 'k_m4', group: 'K', team1: 'col', team2: 'cod', team1Goals: null, team2Goals: null, date: '2026-06-23', time: '23:00', type: 'group' },
  { id: 'k_m5', group: 'K', team1: 'cod', team2: 'uzb', team1Goals: null, team2Goals: null, date: '2026-06-27', time: '23:30', type: 'group' },
  { id: 'k_m6', group: 'K', team1: 'col', team2: 'por', team1Goals: null, team2Goals: null, date: '2026-06-27', time: '20:30', type: 'group' },

  // --- Grupo L ---
  { id: 'l_m1', group: 'L', team1: 'eng', team2: 'cro', team1Goals: null, team2Goals: null, date: '2026-06-17', time: '17:00', type: 'group' },
  { id: 'l_m2', group: 'L', team1: 'gha', team2: 'pan', team1Goals: null, team2Goals: null, date: '2026-06-17', time: '20:00', type: 'group' },
  { id: 'l_m3', group: 'L', team1: 'eng', team2: 'gha', team1Goals: null, team2Goals: null, date: '2026-06-23', time: '17:00', type: 'group' },
  { id: 'l_m4', group: 'L', team1: 'pan', team2: 'cro', team1Goals: null, team2Goals: null, date: '2026-06-23', time: '20:00', type: 'group' },
  { id: 'l_m5', group: 'L', team1: 'cro', team2: 'gha', team1Goals: null, team2Goals: null, date: '2026-06-27', time: '18:00', type: 'group' },
  { id: 'l_m6', group: 'L', team1: 'pan', team2: 'eng', team1Goals: null, team2Goals: null, date: '2026-06-27', time: '18:00', type: 'group' }
];

export const PRESET_16AVOS = [
  { team1: 'ger', team2: 'par' }, // k32_1
  { team1: 'fra', team2: 'swe' }, // k32_2
  { team1: 'rsa', team2: 'can' }, // k32_3
  { team1: 'ned', team2: 'mar' }, // k32_4
  { team1: 'por', team2: 'cro' }, // k32_5
  { team1: 'esp', team2: 'aut' }, // k32_6
  { team1: 'usa', team2: 'bih' }, // k32_7
  { team1: 'bel', team2: 'sen' }, // k32_8
  { team1: 'bra', team2: 'jpn' }, // k32_9
  { team1: 'civ', team2: 'nor' }, // k32_10
  { team1: 'mex', team2: 'ecu' }, // k32_11
  { team1: 'eng', team2: 'cod' }, // k32_12
  { team1: 'arg', team2: 'cpv' }, // k32_13
  { team1: 'aus', team2: 'egy' }, // k32_14
  { team1: 'sui', team2: 'alg' }, // k32_15
  { team1: 'col', team2: 'gha' }  // k32_16
];

export const INITIAL_KNOCKOUT_MATCHES: Match[] = [
  // 16avos (Round of 32)
  ...PRESET_16AVOS.map((preset, i): Match => {
    const nextMatchIdx = Math.floor(i / 2) + 1;
    return {
      id: `k32_${i + 1}`,
      group: '16avos',
      team1: preset.team1,
      team2: preset.team2,
      team1Goals: null,
      team2Goals: null,
      date: '2026-06-30',
      time: i % 2 === 0 ? '13:00' : '17:00',
      type: 'knockout',
      nextMatchId: `k16_${nextMatchIdx}`,
      placeholderName1: `Clasificado ${i * 2 + 1}`,
      placeholderName2: `Clasificado ${i * 2 + 2}`
    };
  }),

  // 8vos (Round of 16): 8 matches (k16_1 to k16_8)
  ...Array.from({ length: 8 }).map((_, i): Match => {
    const nextMatchIdx = Math.floor(i / 2) + 1;
    return {
      id: `k16_${i + 1}`,
      group: '8vos',
      team1: '',
      team2: '',
      team1Goals: null,
      team2Goals: null,
      date: '2026-07-04',
      time: i % 2 === 0 ? '13:00' : '17:00',
      type: 'knockout',
      nextMatchId: `k8_${nextMatchIdx}`,
      placeholderName1: `Ganador 16vos ${i * 2 + 1}`,
      placeholderName2: `Ganador 16vos ${i * 2 + 2}`
    };
  }),

  // 4tos (Quarterfinals): 4 matches (k8_1 to k8_4)
  ...Array.from({ length: 4 }).map((_, i): Match => {
    const nextMatchIdx = Math.floor(i / 2) + 1;
    return {
      id: `k8_${i + 1}`,
      group: '4tos',
      team1: '',
      team2: '',
      team1Goals: null,
      team2Goals: null,
      date: '2026-07-08',
      time: i % 2 === 0 ? '13:00' : '17:00',
      type: 'knockout',
      nextMatchId: `k4_${nextMatchIdx}`,
      placeholderName1: `Ganador 8vos ${i * 2 + 1}`,
      placeholderName2: `Ganador 8vos ${i * 2 + 2}`
    };
  }),

  // Semifinales: 2 matches (k4_1, k4_2)
  {
    id: 'k4_1',
    group: 'Semifinal',
    team1: '',
    team2: '',
    team1Goals: null,
    team2Goals: null,
    date: '2026-07-12',
    time: '13:00',
    type: 'knockout',
    nextMatchId: 'k2_final',
    placeholderName1: 'Ganador 4tos 1',
    placeholderName2: 'Ganador 4tos 2'
  },
  {
    id: 'k4_2',
    group: 'Semifinal',
    team1: '',
    team2: '',
    team1Goals: null,
    team2Goals: null,
    date: '2026-07-12',
    time: '17:00',
    type: 'knockout',
    nextMatchId: 'k2_final',
    placeholderName1: 'Ganador 4tos 3',
    placeholderName2: 'Ganador 4tos 4'
  },

  // 3er y 4to puesto
  {
    id: 'k2_third',
    group: '3er y 4to puesto',
    team1: '',
    team2: '',
    team1Goals: null,
    team2Goals: null,
    date: '2026-07-18',
    time: '13:00',
    type: 'knockout',
    placeholderName1: 'Perdedor Semifinal 1',
    placeholderName2: 'Perdedor Semifinal 2'
  },

  // Final
  {
    id: 'k2_final',
    group: 'Final',
    team1: '',
    team2: '',
    team1Goals: null,
    team2Goals: null,
    date: '2026-07-19',
    time: '15:00',
    type: 'knockout',
    placeholderName1: 'Ganador Semifinal 1',
    placeholderName2: 'Ganador Semifinal 2'
  }
];
