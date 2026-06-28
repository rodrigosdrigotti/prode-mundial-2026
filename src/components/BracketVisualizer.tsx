/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Match, Team } from '../types';
import { TEAMS } from '../data/teamsAndMatches';
import { Trophy, HelpCircle, ArrowRight } from 'lucide-react';

interface BracketVisualizerProps {
  matches: Match[];
  userPredictions?: Record<string, { team1Goals: number | null; team2Goals: number | null }>;
  isAdmin: boolean;
  isLocked: boolean;
  onUpdatePrediction?: (matchId: string, team1Goals: number | null, team2Goals: number | null) => void;
  onUpdateActualResult?: (matchId: string, team1Goals: number | null, team2Goals: number | null) => void;
  currentStage?: string;
}

export default function BracketVisualizer({
  matches,
  userPredictions = {},
  isAdmin,
  isLocked,
  onUpdatePrediction,
  onUpdateActualResult,
  currentStage
}: BracketVisualizerProps) {
  const [svgPaths, setSvgPaths] = React.useState<string[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const updatePaths = React.useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const paths: string[] = [];

    matches.forEach((m) => {
      if (!m.nextMatchId) return;

      const currentEl = document.getElementById(`bracket-match-${m.id}`);
      const nextEl = document.getElementById(`bracket-match-${m.nextMatchId}`);

      if (currentEl && nextEl) {
        const rect = currentEl.getBoundingClientRect();
        const nextRect = nextEl.getBoundingClientRect();

        const matchNum = parseInt(m.id.replace(/[^\d]/g, ''), 10);
        const isLeft = m.id.startsWith('k32_')
          ? matchNum <= 8
          : m.id.startsWith('k16_')
          ? matchNum <= 4
          : m.id.startsWith('k8_')
          ? matchNum <= 2
          : m.id === 'k4_1';

        // Compute output point from current match (facing towards the center)
        const xOut = isLeft
          ? rect.right - containerRect.left
          : rect.left - containerRect.left;
        const yOut = rect.top + rect.height / 2 - containerRect.top;

        // Compute input point into next match (facing away from the center)
        const xIn = isLeft
          ? nextRect.left - containerRect.left
          : nextRect.right - containerRect.left;
        const yIn = nextRect.top + nextRect.height / 2 - containerRect.top;

        // Draw an elegant T-bracket orthogonal path
        const xMid = (xOut + xIn) / 2;
        const path = `M ${xOut} ${yOut} H ${xMid} V ${yIn} H ${xIn}`;
        paths.push(path);
      }
    });

    setSvgPaths(paths);
  }, [matches]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      updatePaths();
    }, 150);

    window.addEventListener('resize', updatePaths);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePaths);
    };
  }, [updatePaths, matches]);

  const renderBracketMatchNode = (matchId: string, side: 'left' | 'right' | 'center') => {
    const m = matches.find((match) => match.id === matchId);
    if (!m) {
      return (
        <div className="w-48 p-2.5 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-center text-[10px] text-slate-500 italic">
          Pendiente de definición
        </div>
      );
    }

    const t1 = TEAMS[m.team1];
    const t2 = TEAMS[m.team2];

    const isT1Winner = m.team1Goals !== null && m.team2Goals !== null && m.team1Goals > m.team2Goals;
    const isT2Winner = m.team1Goals !== null && m.team2Goals !== null && m.team2Goals > m.team1Goals;

    // Find the user prediction to show a tiny badge or indicator
    const pred = userPredictions[m.id];
    const hasPred = pred && (pred.team1Goals !== null || pred.team2Goals !== null);

    return (
      <div
        id={`bracket-match-${m.id}`}
        key={m.id}
        className="w-48 bg-slate-900/90 hover:bg-slate-850 border border-slate-800/80 hover:border-sky-500/40 rounded-xl p-2.5 shadow-xl transition-all relative group cursor-pointer"
        onClick={() => {
          const el = document.getElementById(`detail-match-${m.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-sky-500', 'ring-offset-2', 'ring-offset-slate-900');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-sky-500', 'ring-offset-2', 'ring-offset-slate-900');
            }, 2000);
          }
        }}
      >
        <div className="absolute -top-2 left-3 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[8px] font-mono text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {m.id.toUpperCase()}
        </div>

        {hasPred && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-400" title="Predicción registrada" />
        )}

        <div className="space-y-1.5">
          {/* Team 1 */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className={`flex items-center gap-1.5 min-w-0 ${isT2Winner ? 'opacity-40' : ''}`}>
              <span className="text-base shrink-0">{t1?.emoji || '❔'}</span>
              <span className={`text-[11px] font-semibold truncate ${isT1Winner ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                {t1?.name || m.placeholderName1 || 'TBD'}
              </span>
            </div>
            {m.team1Goals !== null && (
              <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-950/60 border ${isT1Winner ? 'text-amber-400 border-amber-500/20' : 'text-slate-400 border-slate-800'}`}>
                {m.team1Goals}
              </span>
            )}
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* Team 2 */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className={`flex items-center gap-1.5 min-w-0 ${isT1Winner ? 'opacity-40' : ''}`}>
              <span className="text-base shrink-0">{t2?.emoji || '❔'}</span>
              <span className={`text-[11px] font-semibold truncate ${isT2Winner ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                {t2?.name || m.placeholderName2 || 'TBD'}
              </span>
            </div>
            {m.team2Goals !== null && (
              <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-950/60 border ${isT2Winner ? 'text-amber-400 border-amber-500/20' : 'text-slate-400 border-slate-800'}`}>
                {m.team2Goals}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTeamNameWithEmoji = (teamId: string, placeholder: string | undefined) => {
    const team = TEAMS[teamId];
    if (team) {
      return (
        <div className="flex items-center gap-2 truncate">
          <span className="text-lg" role="img" aria-label={team.name}>
            {team.emoji}
          </span>
          <span className="text-sm font-semibold text-white truncate">{team.name}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-slate-500 italic truncate">
        <HelpCircle className="w-4 h-4 shrink-0 text-slate-600" />
        <span className="text-xs truncate">{placeholder || 'TBD'}</span>
      </div>
    );
  };

  // Safe helper to handle input updates
  const handleInputChange = (
    matchId: string,
    isTeam1: boolean,
    valStr: string,
    isActual: boolean
  ) => {
    const trimmed = valStr.trim();
    let val: number | null = null;
    if (trimmed !== '') {
      const parsed = parseInt(trimmed, 10);
      if (isNaN(parsed) || parsed < 0) return;
      val = parsed;
    }

    if (isActual && isAdmin) {
      const match = matches.find((m) => m.id === matchId);
      if (match) {
        const team1G = isTeam1 ? val : match.team1Goals;
        const team2G = isTeam1 ? match.team2Goals : val;
        onUpdateActualResult?.(matchId, team1G, team2G);
      }
    } else if (!isActual && !isLocked && onUpdatePrediction) {
      const currentPred = userPredictions[matchId] || { team1Goals: null, team2Goals: null };
      const team1G = isTeam1 ? val : currentPred.team1Goals;
      const team2G = isTeam1 ? currentPred.team2Goals : val;
      onUpdatePrediction(matchId, team1G, team2G);
    }
  };

  const renderMatchCard = (match: Match) => {
    const pred = userPredictions[match.id] || { team1Goals: null, team2Goals: null };
    const hasActual = match.team1Goals !== null && match.team2Goals !== null;

    return (
      <div
        id={`detail-match-${match.id}`}
        key={match.id}
        className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 hover:border-sky-500/30 transition-all flex flex-col gap-3 shadow-lg scroll-mt-24"
      >
        <div className="flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-700/65 pb-2">
          <span>{match.id.toUpperCase()}</span>
          <span>{match.date} - {match.time}hs</span>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between gap-2">
          {renderTeamNameWithEmoji(match.team1, match.placeholderName1)}
          
          <div className="flex items-center gap-2">
            {/* User Prediction score input */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-500">Mi Pred</span>
              <input
                type="number"
                min="0"
                disabled={isLocked}
                value={pred.team1Goals ?? ''}
                placeholder="-"
                onChange={(e) => handleInputChange(match.id, true, e.target.value, false)}
                className="w-11 h-8 rounded bg-slate-900 border border-slate-700 text-center text-white font-bold text-sm focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
            </div>

            {/* Actual Result (only editable by Admin) */}
            { (isAdmin || hasActual) && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono text-sky-400">Real</span>
                <input
                  type="number"
                  min="0"
                  disabled={!isAdmin}
                  value={match.team1Goals ?? ''}
                  placeholder="-"
                  onChange={(e) => handleInputChange(match.id, true, e.target.value, true)}
                  className={`w-11 h-8 rounded text-center text-sm font-bold focus:outline-none ${
                    isAdmin
                      ? 'bg-sky-950/80 border border-sky-400 text-sky-300 focus:border-sky-300'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-300 disabled:opacity-90'
                  }`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between gap-2">
          {renderTeamNameWithEmoji(match.team2, match.placeholderName2)}
          
          <div className="flex items-center gap-2">
            {/* User Prediction score input */}
            <div className="flex flex-col items-center">
              <input
                type="number"
                min="0"
                disabled={isLocked}
                value={pred.team2Goals ?? ''}
                placeholder="-"
                onChange={(e) => handleInputChange(match.id, false, e.target.value, false)}
                className="w-11 h-8 rounded bg-slate-900 border border-slate-700 text-center text-white font-bold text-sm focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
            </div>

            {/* Actual Result (only editable by Admin) */}
            { (isAdmin || hasActual) && (
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  disabled={!isAdmin}
                  value={match.team2Goals ?? ''}
                  placeholder="-"
                  onChange={(e) => handleInputChange(match.id, false, e.target.value, true)}
                  className={`w-11 h-8 rounded text-center text-sm font-bold focus:outline-none ${
                    isAdmin
                      ? 'bg-sky-950/80 border border-sky-400 text-sky-300 focus:border-sky-300'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-300 disabled:opacity-90'
                  }`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Score indicator badge for matching prediction */}
        {hasActual && pred.team1Goals !== null && pred.team2Goals !== null && (
          <div className="mt-2 text-center pt-2 border-t border-slate-700/40">
            {(() => {
              const p1 = pred.team1Goals;
              const p2 = pred.team2Goals;
              const a1 = match.team1Goals!;
              const a2 = match.team2Goals!;
              
              const actualWin = a1 > a2 ? '1' : a1 < a2 ? '2' : 'D';
              const predWin = p1 > p2 ? '1' : p1 < p2 ? '2' : 'D';

              if (actualWin === predWin) {
                if (p1 === a1 && p2 === a2) {
                  return (
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-full font-semibold">
                      ¡Marcador Exacto! (+5 pts)
                    </span>
                  );
                }
                return (
                  <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-1 rounded-full font-semibold">
                    Resultado Acertado (+3 pts)
                  </span>
                );
              }
              return (
                <span className="text-xs bg-slate-700/60 text-slate-400 px-2 py-1 rounded-full">
                  No acertado (0 pts)
                </span>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Visual Bracket Flow Container */}
      <div className="hidden lg:block bg-slate-900/40 backdrop-blur-md rounded-2xl border border-sky-500/10 p-6 overflow-x-auto shadow-2xl relative">
        <h3 className="text-sm font-semibold text-slate-300 mb-6 font-mono tracking-wider uppercase flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" />
          Vista Gráfica del Árbol de Eliminatorias (Cruces Oficiales)
        </h3>

        {/* Symmetrical Bracket Container */}
        <div ref={containerRef} className="relative min-w-[1750px] p-4 select-none">
          {/* Symmetrical SVG Connections Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {svgPaths.map((pathStr, index) => (
              <path
                key={index}
                d={pathStr}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="1.75"
                strokeOpacity="0.45"
                className="transition-all duration-300"
              />
            ))}
          </svg>

          {/* Grid Headers */}
          <div className="grid grid-cols-9 gap-4 text-center border-b border-slate-800/80 pb-4 mb-6 relative z-10">
            <div className="text-[10px] font-black font-sans tracking-widest text-slate-400 uppercase">16vos de Final</div>
            <div className="text-[10px] font-black font-sans tracking-widest text-slate-400 uppercase">8vos de Final</div>
            <div className="text-[10px] font-black font-sans tracking-widest text-slate-400 uppercase">Cuartos</div>
            <div className="text-[10px] font-black font-sans tracking-widest text-slate-400 uppercase">Semifinal</div>
            <div className="text-xs font-black font-sans tracking-widest text-amber-400 uppercase flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" />
              FINAL
            </div>
            <div className="text-[10px] font-black font-sans tracking-widest text-slate-400 uppercase">Semifinal</div>
            <div className="text-[10px] font-black font-sans tracking-widest text-slate-400 uppercase">Cuartos</div>
            <div className="text-[10px] font-black font-sans tracking-widest text-slate-400 uppercase">8vos de Final</div>
            <div className="text-[10px] font-black font-sans tracking-widest text-slate-400 uppercase">16vos de Final</div>
          </div>

          {/* Bracket Content Columns */}
          <div className="grid grid-cols-9 gap-4 relative z-10">
            {/* Column 1: 16vos Left (8 matches: k32_1 to k32_8) */}
            <div className="flex flex-col justify-around h-[820px] gap-2">
              {renderBracketMatchNode('k32_1', 'left')}
              {renderBracketMatchNode('k32_2', 'left')}
              {renderBracketMatchNode('k32_3', 'left')}
              {renderBracketMatchNode('k32_4', 'left')}
              {renderBracketMatchNode('k32_5', 'left')}
              {renderBracketMatchNode('k32_6', 'left')}
              {renderBracketMatchNode('k32_7', 'left')}
              {renderBracketMatchNode('k32_8', 'left')}
            </div>

            {/* Column 2: 8vos Left (4 matches: k16_1 to k16_4) */}
            <div className="flex flex-col justify-around h-[820px] gap-2">
              {renderBracketMatchNode('k16_1', 'left')}
              {renderBracketMatchNode('k16_2', 'left')}
              {renderBracketMatchNode('k16_3', 'left')}
              {renderBracketMatchNode('k16_4', 'left')}
            </div>

            {/* Column 3: 4tos Left (2 matches: k8_1, k8_2) */}
            <div className="flex flex-col justify-around h-[820px] gap-2">
              {renderBracketMatchNode('k8_1', 'left')}
              {renderBracketMatchNode('k8_2', 'left')}
            </div>

            {/* Column 4: Semis Left (1 match: k4_1) */}
            <div className="flex flex-col justify-around h-[820px] gap-2">
              {renderBracketMatchNode('k4_1', 'left')}
            </div>

            {/* Column 5: Center (Trophy, Final, 3er puesto) */}
            <div className="flex flex-col justify-center items-center h-[820px] gap-6 px-1 text-center">
              {/* Cup Graphic */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-amber-500/10 shadow-lg">
                <Trophy className="w-14 h-14 text-yellow-400 filter drop-shadow-[0_0_12px_rgba(234,179,8,0.35)] animate-pulse" />
                <span className="text-[9px] font-mono text-amber-500 font-bold tracking-widest uppercase mt-2">Copa del Mundo</span>
              </div>

              {/* Gran Final match node */}
              <div className="space-y-1">
                <span className="text-[10px] font-black font-sans tracking-widest text-amber-400 uppercase block">Gran Final</span>
                {renderBracketMatchNode('k2_final', 'center')}
              </div>

              {/* 3er puesto match node */}
              <div className="space-y-1 pt-3 border-t border-slate-800/80 w-full flex flex-col items-center">
                <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase block">3er y 4to Puesto</span>
                {renderBracketMatchNode('k2_third', 'center')}
              </div>
            </div>

            {/* Column 6: Semis Right (1 match: k4_2) */}
            <div className="flex flex-col justify-around h-[820px] gap-2">
              {renderBracketMatchNode('k4_2', 'right')}
            </div>

            {/* Column 7: 4tos Right (2 matches: k8_3, k8_4) */}
            <div className="flex flex-col justify-around h-[820px] gap-2">
              {renderBracketMatchNode('k8_3', 'right')}
              {renderBracketMatchNode('k8_4', 'right')}
            </div>

            {/* Column 8: 8vos Right (4 matches: k16_5 to k16_8) */}
            <div className="flex flex-col justify-around h-[820px] gap-2">
              {renderBracketMatchNode('k16_5', 'right')}
              {renderBracketMatchNode('k16_6', 'right')}
              {renderBracketMatchNode('k16_7', 'right')}
              {renderBracketMatchNode('k16_8', 'right')}
            </div>

            {/* Column 9: 16vos Right (8 matches: k32_9 to k32_16) */}
            <div className="flex flex-col justify-around h-[820px] gap-2">
              {renderBracketMatchNode('k32_9', 'right')}
              {renderBracketMatchNode('k32_10', 'right')}
              {renderBracketMatchNode('k32_11', 'right')}
              {renderBracketMatchNode('k32_12', 'right')}
              {renderBracketMatchNode('k32_13', 'right')}
              {renderBracketMatchNode('k32_14', 'right')}
              {renderBracketMatchNode('k32_15', 'right')}
              {renderBracketMatchNode('k32_16', 'right')}
            </div>
          </div>
        </div>
      </div>

      {/* Grid view of chosen matches for current KO stage */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          Partidos Programados ({currentStage || 'Todos'})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            const getMatchNum = (idStr: string) => {
              if (idStr === 'k2_third') return 1;
              if (idStr === 'k2_final') return 2;
              const numMatch = idStr.match(/\d+$/);
              return numMatch ? parseInt(numMatch[0], 10) : 0;
            };

            const filteredAndSorted = matches
              .filter((m) => m.type === 'knockout' && (!currentStage || m.group === currentStage))
              .sort((a, b) => getMatchNum(a.id) - getMatchNum(b.id));

            if (filteredAndSorted.length === 0) {
              return (
                <div className="col-span-full text-center py-12 bg-slate-900/20 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm">
                    Aún no se han generado los enfrentamientos para esta fase eliminatoria.
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-sky-400 mt-1 font-mono">
                      Presioná el botón de "Generar Eliminatorias" en el panel Admin para poblar los cruces.
                    </p>
                  )}
                </div>
              );
            }

            return filteredAndSorted.map((m) => renderMatchCard(m));
          })()}
        </div>
      </div>
    </div>
  );
}
