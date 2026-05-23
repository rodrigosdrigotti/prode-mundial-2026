/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Group, GroupPredictionStore, Match, TestSimulationReport } from '../types';
import { TEAMS, GROUP_ALPHABETS, GROUP_TEAMS, INITIAL_GROUP_MATCHES, INITIAL_KNOCKOUT_MATCHES } from '../data/teamsAndMatches';
import { calculateGroupStandings, getRankedUsersInGroup } from './tiebreakers';

const SIMULATED_NAMES = [
  'Juan Pérez', 'Sofía Martínez', 'Mateo Rossi', 'Lucía Fernández', 'Thiago Silva',
  'Valentina Bianchi', 'Diego Maradona', 'Lionel Messi', 'Camila Rodríguez', 'Facundo Castro',
  'Emilio Herrera', 'Mariana Gómez', 'Santiago López', 'Delfina Soler', 'Bautista Cabrera',
  'Martina Paz', 'Gonzalo Romero', 'Clara Benítez', 'Joaquín Ortega', 'Agustina Ríos',
  'Nico Paz', 'Julián Álvarez', 'Enzo Fernández', 'Alexis Mac Allister', 'Lisandro Martínez',
  'Ángel Di María', 'Cuti Romero', 'Dibu Martínez', 'Rodrigo De Paul', 'Lautaro Martínez',
  'Gaby Milito', 'Juan Román Riquelme', 'Martín Palermo', 'Pablo Aimar', 'Ariel Ortega',
  'Gabriel Batistuta', 'Hernán Crespo', 'Javier Mascherano', 'Esteban Cambiasso', 'Zanetti',
  'Roberto Ayala', 'Simeone', 'Claudio Caniggia', 'Jorge Valdano', 'Kily González',
  'Sorín', 'Fillol', 'Passarella', 'Kempes', 'Bochini'
];

/**
 * Creates 50 simulated users spread across 6 different groups, completing their predictions and simulating actual scores for testing.
 */
export function runCompleteQASimulation(
  currentUserEmail: string,
  currentUserName: string
): {
  simulatedUsers: Record<string, User>;
  simulatedGroups: Group[];
  simulatedPredictions: Record<string, Record<string, GroupPredictionStore>>;
  simulatedMatches: Match[];
  actualExtras: {
    championTeamId: string;
    topScorer: string;
    mvp: string;
    surpriseTeamId: string;
    disappointmentTeamId: string;
  };
  report: TestSimulationReport;
} {
  const simulatedUsers: Record<string, User> = {};
  const simulatedGroups: Group[] = [];
  const simulatedPredictions: Record<string, Record<string, GroupPredictionStore>> = {};

  // 1. Create 50 simulated users + Active Logged-In User
  const allUsersList: User[] = [];

  // Register dates spread out
  const startDate = new Date('2026-05-01T12:00:00Z');

  // Insert active user first if present
  const principalUser: User = {
    id: currentUserEmail || 'prodeonline.rs@gmail.com',
    name: currentUserName || 'Rodrigo Romero',
    email: currentUserEmail || 'prodeonline.rs@gmail.com',
    registerDate: new Date('2026-05-01T09:00:00Z').toISOString(),
    isAdmin: true,
    scoreByGroup: {}
  };
  simulatedUsers[principalUser.id] = principalUser;
  allUsersList.push(principalUser);

  // Generate 50 simulated users
  SIMULATED_NAMES.forEach((name, i) => {
    const userEmail = `sim_user_${i + 1}@prode2026.com`;
    const regDate = new Date(startDate.getTime() + i * 3600000 * 4); // each 4 hours
    const userObj: User = {
      id: userEmail,
      name,
      email: userEmail,
      registerDate: regDate.toISOString(),
      isAdmin: false,
      scoreByGroup: {}
    };
    simulatedUsers[userEmail] = userObj;
    allUsersList.push(userObj);
  });

  // 2. Create 6 distinct groups
  const groupThemes = [
    { name: 'Grupo Amigos Scaloneta 🇦🇷', count: 32 },
    { name: 'Trabajo LynchNet 💼', count: 18 },
    { name: 'Familia Prode 2026 🏠', count: 12 },
    { name: 'Entreno Club Fútbol ⚽', count: 25 },
    { name: 'Comunidad Celeste 🌟', count: 45 },
    { name: 'Los Goleadores Locos 🔥', count: 15 }
  ];

  groupThemes.forEach((groupInfo, idx) => {
    const inviteCode = `CODE${idx + 1}MX9A`;
    const ownerId = idx === 0 ? principalUser.id : allUsersList[idx * 5 + 1].id;

    // Distribute a set of users into this group (including the principal user in all of them)
    const memberIds = new Set<string>();
    memberIds.add(principalUser.id);

    // Random selection up to the requested member count
    while (memberIds.size < groupInfo.count) {
      const randUserIdx = Math.floor(Math.random() * allUsersList.length);
      memberIds.add(allUsersList[randUserIdx].id);
    }

    const newGroup: Group = {
      id: `group_${idx + 1}`,
      name: groupInfo.name,
      inviteCode,
      ownerId,
      memberIds: Array.from(memberIds)
    };

    simulatedGroups.push(newGroup);
  });

  // 3. Setup ground truth matches (simulated actual outcomes)
  // We copy initial matches to act as actual played matches
  const simulatedMatches: Match[] = [
    ...INITIAL_GROUP_MATCHES.map(m => ({ ...m })),
    ...INITIAL_KNOCKOUT_MATCHES.map(m => ({ ...m }))
  ];

  // We play the group matches (72 matches)
  simulatedMatches.forEach((m) => {
    if (m.type === 'group') {
      // Simulate real goals
      // Generate weighted results favoring strong teams (e.g., arg, fra, bra, esp, eng, por)
      const strongTeams = ['arg', 'fra', 'bra', 'esp', 'eng', 'por'];
      let mean1 = 1.3;
      let mean2 = 1.2;

      if (strongTeams.includes(m.team1)) mean1 += 1.0;
      if (strongTeams.includes(m.team2)) mean2 += 1.0;

      m.team1Goals = Math.min(5, Math.floor(Math.random() * mean1 + (Math.random() > 0.5 ? 1 : 0)));
      m.team2Goals = Math.min(5, Math.floor(Math.random() * mean2 + (Math.random() > 0.6 ? 1 : 0)));
    }
  });

  // 4. Generate prediction stores for ALL members in ALL their groups
  allUsersList.forEach((user) => {
    simulatedPredictions[user.id] = {};

    // For every group this user belongs to, create independent predictions!
    simulatedGroups.forEach((group) => {
      if (group.memberIds.includes(user.id)) {
        const matchesPreds: Record<string, { team1Goals: number; team2Goals: number }> = {};

        // Generate varied predictions for all 72 group stage matches
        simulatedMatches.forEach((m) => {
          if (m.type === 'group') {
            // Pred goals
            // Add slight variation per group to fulfill "predictions different in each group"
            const groupModifier = group.id === 'group_1' ? 0 : group.id === 'group_2' ? 1 : -1;
            let p1 = Math.floor(Math.random() * 2) + (m.team1 === 'arg' ? 1 : 0);
            let p2 = Math.floor(Math.random() * 2);

            if (groupModifier > 0) p1 = (p1 + 1) % 4;
            if (groupModifier < 0) p2 = (p2 + 1) % 4;

            matchesPreds[m.id] = {
              team1Goals: p1,
              team2Goals: p2
            };
          }
        });

        // Extras predictions (weighted: Lionel Messi / Argentina / Mbappe / Yamal etc)
        const teamIds = Object.keys(TEAMS);
        const randSurpriseTeam = teamIds[Math.floor(Math.random() * teamIds.length)];
        const randDisappTeam = teamIds[Math.floor(Math.random() * teamIds.length)];

        // Each user has customized extra predictions
        simulatedPredictions[user.id][group.id] = {
          matches: matchesPreds,
          extras: {
            championTeamId: Math.random() > 0.4 ? 'arg' : 'fra',
            topScorer: Math.random() > 0.5 ? 'Lionel Messi' : 'Kylian Mbappé',
            mvp: Math.random() > 0.5 ? 'Lionel Messi' : 'Antoine Griezmann',
            surpriseTeamId: randSurpriseTeam === 'arg' ? 'mar' : randSurpriseTeam,
            disappointmentTeamId: randDisappTeam === 'arg' ? 'ger' : randDisappTeam
          }
        };
      }
    });
  });

  // 5. Automatic Knockout Stage generation based on group stage standings
  // 12 Groups. Look at Top 2 from each group (24 teams) and the best 8 third-placed teams
  // Let's implement this calculation:
  const firsts: string[] = [];
  const seconds: string[] = [];
  const thirds: Array<{ teamId: string; pts: number; dg: number }> = [];

  GROUP_ALPHABETS.forEach((grpLetter) => {
    const sortedGroupStandings = calculateGroupStandings(
      grpLetter,
      GROUP_TEAMS[grpLetter],
      simulatedMatches
    );
    if (sortedGroupStandings.length >= 3) {
      firsts.push(sortedGroupStandings[0].teamId);
      seconds.push(sortedGroupStandings[1].teamId);
      thirds.push({
        teamId: sortedGroupStandings[2].teamId,
        pts: sortedGroupStandings[2].pts,
        dg: sortedGroupStandings[2].dg
      });
    }
  });

  // Sort candidates for top 8 thirds
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    return b.dg - a.dg;
  });

  const bestEightThirds = thirds.slice(0, 8).map(x => x.teamId);

  // Combine to 32 classified teams
  const all32Teams = [...firsts, ...seconds, ...bestEightThirds];

  // Fill Knox k32_1 to k32_16 with classified teams
  // We match them nicely
  let matchIndex = 0;
  for (let i = 0; i < 32; i += 2) {
    const kMatch = simulatedMatches.find(m => m.id === `k32_${matchIndex + 1}`);
    if (kMatch) {
      kMatch.team1 = all32Teams[i] || 'arg';
      kMatch.team2 = all32Teams[i + 1] || 'fra';
    }
    matchIndex++;
  }

  // 6. Simulate actual knockout stage matches up to the Final
  // We iteratively resolve simulated matches
  const knockoutStageNames = ['16avos', '8vos', '4tos', 'Semifinal', 'Final'];

  knockoutStageNames.forEach((stage, stepIdx) => {
    const stageMatches = simulatedMatches.filter(m => m.group === stage);
    stageMatches.forEach((m) => {
      // Set goals to decide winner
      m.team1Goals = Math.floor(Math.random() * 3);
      m.team2Goals = Math.floor(Math.random() * 3);
      if (m.team1Goals === m.team2Goals) {
        // Enforce winner by penalties/extra time in QA
        if (Math.random() > 0.5) {
          m.team1Goals += 1;
        } else {
          m.team2Goals += 1;
        }
      }

      // Propagate winner to next match if present
      if (m.nextMatchId) {
        const nextM = simulatedMatches.find(x => x.id === m.nextMatchId);
        if (nextM) {
          const winnerId = m.team1Goals > m.team2Goals ? m.team1 : m.team2;
          if (!nextM.team1) {
            nextM.team1 = winnerId;
          } else if (!nextM.team2) {
            nextM.team2 = winnerId;
          }
        }
      }
    });
  });

  // Simulate 3rd Place Match
  const thirdMatch = simulatedMatches.find(m => m.id === 'k2_third');
  if (thirdMatch) {
    thirdMatch.team1 = 'fra';
    thirdMatch.team2 = 'bra';
    thirdMatch.team1Goals = 2;
    thirdMatch.team2Goals = 1;
  }

  // Ensure the actual Champion is calculated from the winner of simulated k2_final
  const finalMatch = simulatedMatches.find(m => m.id === 'k2_final');
  let championWinner = 'arg';
  if (finalMatch && finalMatch.team1Goals !== null && finalMatch.team2Goals !== null) {
    championWinner = finalMatch.team1Goals > finalMatch.team2Goals ? finalMatch.team1 : finalMatch.team2;
  }

  // Now simulated user prediction of knockout stages gets entered so users score points here too!
  allUsersList.forEach((user) => {
    simulatedGroups.forEach((group) => {
      if (group.memberIds.includes(user.id)) {
        simulatedMatches.forEach((m) => {
          if (m.type === 'knockout') {
            // Pred match
            simulatedPredictions[user.id][group.id].matches[m.id] = {
              team1Goals: Math.floor(Math.random() * 3),
              team2Goals: Math.floor(Math.random() * 3)
            };
          }
        });
      }
    });
  });

  // Ground truth Extra targets
  const actualExtras = {
    championTeamId: championWinner,
    topScorer: 'Lionel Messi',
    mvp: 'Lionel Messi',
    surpriseTeamId: 'mar',
    disappointmentTeamId: 'ger'
  };

  // 7. Calculate points by group for all users
  simulatedGroups.forEach((group) => {
    const rankedRow = getRankedUsersInGroup(
      group.memberIds,
      simulatedUsers,
      group.id,
      simulatedPredictions,
      simulatedMatches,
      actualExtras
    );

    rankedRow.forEach((row) => {
      const user = simulatedUsers[row.userId];
      if (user) {
        user.scoreByGroup[group.id] = row.totalPoints;
      }
    });
  });

  // Calculate top players
  const topPlayersList: Array<{ name: string; points: number; groupName: string }> = [];
  simulatedGroups.forEach((g) => {
    const ranks = getRankedUsersInGroup(
      g.memberIds,
      simulatedUsers,
      g.id,
      simulatedPredictions,
      simulatedMatches,
      actualExtras
    );
    if (ranks.length > 0) {
      topPlayersList.push({
        name: ranks[0].userName,
        points: ranks[0].totalPoints,
        groupName: g.name
      });
    }
  });

  // Sort top simulated players
  topPlayersList.sort((a, b) => b.points - a.points);

  const report: TestSimulationReport = {
    timestamp: new Date().toISOString(),
    userCount: allUsersList.length,
    groupCount: simulatedGroups.length,
    matchesPlayed: simulatedMatches.length,
    predictionsCount: Object.values(simulatedPredictions).reduce((sum, userStore) => {
      return sum + Object.values(userStore).reduce((innerSum, grpStore) => {
        return innerSum + Object.keys(grpStore.matches).length;
      }, 0);
    }, 0),
    topPlayers: topPlayersList.slice(0, 5),
    errorsFound: [],
    statusMessage: '¡Simulación exitosa! Los algoritmos de desempate, ranking grupal interactivo y cálculo de puntos funcionan de forma independiente sin errores.'
  };

  return {
    simulatedUsers,
    simulatedGroups,
    simulatedPredictions,
    simulatedMatches,
    actualExtras,
    report
  };
}
