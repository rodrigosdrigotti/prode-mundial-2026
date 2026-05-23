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
}

export default function BracketVisualizer({
  matches,
  userPredictions = {},
  isAdmin,
  isLocked,
  onUpdatePrediction,
  onUpdateActualResult
}: BracketVisualizerProps) {
  // Group matches by phase
  const getMatchesOfPhase = (phase: string) => {
    return matches.filter((m) => m.group === phase);
  };

  const p16 = getMatchesOfPhase('16avos');
  const p8 = getMatchesOfPhase('8vos');
  const p4 = getMatchesOfPhase('4tos');
  const pSemi = getMatchesOfPhase('Semifinal');
  const pThird = getMatchesOfPhase('3er y 4to puesto');
  const pFinal = getMatchesOfPhase('Final');

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
        key={match.id}
        className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 hover:border-sky-500/30 transition-all flex flex-col gap-3 shadow-lg"
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
      <div className="hidden lg:block bg-slate-900/50 backdrop-blur-md rounded-2xl border border-sky-500/10 p-6 overflow-x-auto shadow-2xl">
        <h3 className="text-sm font-semibold text-slate-300 mb-6 font-mono tracking-wider uppercase flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" />
          Vista Gráfica del Árbol de Eliminatorias (Cruces Oficiales)
        </h3>

        <div className="flex gap-8 justify-between min-w-[1100px]">
          {/* Phase: 16avos */}
          <div className="flex-1 flex flex-col justify-around gap-4">
            <h4 className="text-center font-bold text-xs font-mono text-slate-400 bg-slate-800/80 py-1.5 rounded-lg border border-slate-700">16AVOS DE FINAL</h4>
            {p16.slice(0, 8).map((m) => (
              <div key={m.id} className="p-2 bg-slate-850 rounded-lg border border-slate-700 text-xs scale-95 origin-left">
                <p className="truncate text-slate-300 font-semibold">{TEAMS[m.team1]?.name || m.placeholderName1 || 'TBD'}</p>
                <div className="h-px bg-slate-700 my-1" />
                <p className="truncate text-slate-300 font-semibold">{TEAMS[m.team2]?.name || m.placeholderName2 || 'TBD'}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center text-slate-600">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Phase: 8vos */}
          <div className="flex-1 flex flex-col justify-around gap-6 py-4">
            <h4 className="text-center font-bold text-xs font-mono text-slate-400 bg-slate-800/80 py-1.5 rounded-lg border border-slate-700">OCTAVOS</h4>
            {p8.slice(0, 4).map((m) => (
              <div key={m.id} className="p-2.5 bg-slate-850 rounded-lg border border-slate-700 text-xs scale-100 shadow-md">
                <p className="truncate text-slate-200 font-semibold flex justify-between">
                  <span>{TEAMS[m.team1]?.name || m.placeholderName1 || 'TBD'}</span>
                  {m.team1Goals !== null && <span className="font-mono font-bold text-sky-400">{m.team1Goals}</span>}
                </p>
                <div className="h-px bg-slate-700/60 my-1.5" />
                <p className="truncate text-slate-200 font-semibold flex justify-between">
                  <span>{TEAMS[m.team2]?.name || m.placeholderName2 || 'TBD'}</span>
                  {m.team2Goals !== null && <span className="font-mono font-bold text-sky-400">{m.team2Goals}</span>}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center text-slate-600">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Phase: 4tos */}
          <div className="flex-1 flex flex-col justify-around gap-12 py-8">
            <h4 className="text-center font-bold text-xs font-mono text-slate-400 bg-slate-800/80 py-1.5 rounded-lg border border-slate-700 font-sans">CUARTOS</h4>
            {p4.slice(0, 2).map((m) => (
              <div key={m.id} className="p-3 bg-slate-800 border-2 border-sky-500/20 rounded-xl text-xs shadow-lg">
                <p className="truncate text-white font-bold flex justify-between">
                  <span>{TEAMS[m.team1]?.emoji} {TEAMS[m.team1]?.name || m.placeholderName1 || 'TBD'}</span>
                  {m.team1Goals !== null && <span className="font-mono text-sky-400">{m.team1Goals}</span>}
                </p>
                <div className="h-px bg-slate-700 my-1" />
                <p className="truncate text-white font-bold flex justify-between">
                  <span>{TEAMS[m.team2]?.emoji} {TEAMS[m.team2]?.name || m.placeholderName2 || 'TBD'}</span>
                  {m.team2Goals !== null && <span className="font-mono text-sky-400">{m.team2Goals}</span>}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center text-slate-600">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Phase: Semifinal */}
          <div className="flex-1 flex flex-col justify-around gap-20 py-12">
            <h4 className="text-center font-bold text-xs font-mono text-slate-400 bg-slate-800/80 py-1.5 rounded-lg border border-slate-700">SEMIFINAL</h4>
            {pSemi.slice(0, 2).map((m) => (
              <div key={m.id} className="p-3.5 bg-blue-950/40 border border-sky-400/40 rounded-xl text-xs shadow-xl animate-fade-in">
                <p className="truncate text-white font-extrabold flex justify-between">
                  <span>{TEAMS[m.team1]?.emoji} {TEAMS[m.team1]?.name || m.placeholderName1 || 'TBD'}</span>
                  {m.team1Goals !== null && <span className="font-mono text-sky-300">{m.team1Goals}</span>}
                </p>
                <div className="h-px bg-sky-500/20 my-1.5" />
                <p className="truncate text-white font-extrabold flex justify-between">
                  <span>{TEAMS[m.team2]?.emoji} {TEAMS[m.team2]?.name || m.placeholderName2 || 'TBD'}</span>
                  {m.team2Goals !== null && <span className="font-mono text-sky-300">{m.team2Goals}</span>}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center text-slate-600">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Phase: Gran Final */}
          <div className="flex-1 flex flex-col justify-center gap-8 py-16">
            <h4 className="text-center font-bold text-xs font-mono text-yellow-400 bg-yellow-950/50 py-1.5 rounded-lg border border-yellow-500/20">GRAN FINAL</h4>
            {pFinal.map((m) => (
              <div key={m.id} className="p-4 bg-gradient-to-r from-yellow-950/60 to-slate-900 border-2 border-yellow-500/40 rounded-2xl text-xs shadow-2xl relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-500 text-slate-950 rounded-full font-bold text-[9px] uppercase tracking-wider">
                  Campeón 🏆
                </span>
                <p className="truncate text-white font-extrabold flex justify-between text-sm mt-1">
                  <span>{TEAMS[m.team1]?.emoji} {TEAMS[m.team1]?.name || m.placeholderName1 || 'TBD'}</span>
                  {m.team1Goals !== null && <span className="font-mono text-yellow-300">{m.team1Goals}</span>}
                </p>
                <div className="h-px bg-yellow-500/20 my-2" />
                <p className="truncate text-white font-extrabold flex justify-between text-sm">
                  <span>{TEAMS[m.team2]?.emoji} {TEAMS[m.team2]?.name || m.placeholderName2 || 'TBD'}</span>
                  {m.team2Goals !== null && <span className="font-mono text-yellow-300">{m.team2Goals}</span>}
                </p>
              </div>
            ))}

            <div className="h-px bg-slate-800 my-4" />

            {/* 3rd place */}
            <h4 className="text-center font-bold text-[10px] font-mono text-slate-400 uppercase">3er Puesto</h4>
            {pThird.map((m) => (
              <div key={m.id} className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs shadow-inner">
                <p className="truncate text-slate-300 font-semibold flex justify-between">
                  <span>{TEAMS[m.team1]?.name || m.placeholderName1 || 'TBD'}</span>
                  {m.team1Goals !== null && <span className="font-mono text-slate-300">{m.team1Goals}</span>}
                </p>
                <p className="truncate text-slate-300 font-semibold flex justify-between">
                  <span>{TEAMS[m.team2]?.name || m.placeholderName2 || 'TBD'}</span>
                  {m.team2Goals !== null && <span className="font-mono text-slate-300">{m.team2Goals}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid view of chosen matches for current KO stage */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          Partidos Programados
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.length === 0 ? (
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
          ) : (
            matches.map((m) => renderMatchCard(m))
          )}
        </div>
      </div>
    </div>
  );
}
