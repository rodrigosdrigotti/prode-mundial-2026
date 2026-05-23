/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExtrasPrediction } from '../types';
import { TEAMS } from '../data/teamsAndMatches';
import { Trophy, Award, TrendingUp, Sparkles, AlertTriangle, Lock } from 'lucide-react';

interface ExtrasPredictionsProps {
  prediction: ExtrasPrediction;
  onUpdate: (field: keyof ExtrasPrediction, value: string) => void;
  isLocked: boolean;
  actualExtras?: {
    championTeamId: string;
    topScorer: string;
    mvp: string;
    surpriseTeamId: string;
    disappointmentTeamId: string;
  };
}

export default function ExtrasPredictions({
  prediction,
  onUpdate,
  isLocked,
  actualExtras
}: ExtrasPredictionsProps) {
  const sortedTeams = Object.values(TEAMS).sort((a, b) => a.name.localeCompare(b.name));

  const renderDropdown = (
    label: string,
    field: keyof ExtrasPrediction,
    icon: React.ReactNode,
    actualVal?: string,
    pointsAwarded?: number
  ) => {
    return (
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-3 shadow-lg relative overflow-hidden">
        {isLocked && (
          <div className="absolute top-2 right-2 text-slate-500" title="Locked">
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="flex items-center gap-2.5 text-white font-medium text-sm md:text-base border-b border-slate-700/60 pb-2">
          <div className="text-sky-400">{icon}</div>
          <span>{label}</span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono tracking-wider text-slate-500 uppercase">Tu Categoría Seleccionada</label>
            <select
              disabled={isLocked}
              value={prediction[field] || ''}
              onChange={(e) => onUpdate(field, e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-sm font-semibold focus:outline-none focus:border-sky-500 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <option value="">-- Seleccionar Equipo --</option>
              {sortedTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actual result display for comparison */}
          {actualVal && (
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-mono text-[10px] uppercase block">Resultado Oficial</span>
                <span className="text-yellow-400 font-semibold font-sans">
                  {TEAMS[actualVal]?.emoji} {TEAMS[actualVal]?.name || actualVal}
                </span>
              </div>
              {prediction[field] === actualVal ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">
                  +{pointsAwarded} PTS
                </span>
              ) : (
                <span className="bg-slate-700/40 text-slate-500 px-2 py-0.5 rounded-full font-bold text-[10px]">
                  0 PTS
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTextInput = (
    label: string,
    field: keyof ExtrasPrediction,
    icon: React.ReactNode,
    actualVal?: string,
    pointsAwarded?: number
  ) => {
    return (
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-3 shadow-lg relative overflow-hidden">
        {isLocked && (
          <div className="absolute top-2 right-2 text-slate-500">
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="flex items-center gap-2.5 text-white font-medium text-sm md:text-base border-b border-slate-700/60 pb-2">
          <div className="text-sky-400">{icon}</div>
          <span>{label}</span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono tracking-wider text-slate-500 uppercase">Tu Predicción (Nombre)</label>
            <input
              type="text"
              disabled={isLocked}
              value={prediction[field] || ''}
              placeholder="Ej. Lionel Messi"
              onChange={(e) => onUpdate(field, e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-sm font-semibold focus:outline-none focus:border-sky-500 disabled:opacity-75"
            />
          </div>

          {/* Actual value comparison for free text (case insensitive) */}
          {actualVal && (
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-mono text-[10px] uppercase block">Resultado Oficial</span>
                <span className="text-yellow-400 font-semibold font-sans">{actualVal}</span>
              </div>
              {prediction[field]?.trim().toLowerCase() === actualVal.trim().toLowerCase() ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold text-[10px]">
                  +{pointsAwarded} PTS
                </span>
              ) : (
                <span className="bg-slate-700/40 text-slate-500 px-2 py-0.5 rounded-full font-bold text-[10px]">
                  0 PTS
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-sky-950/20 rounded-xl p-4 border border-sky-450/10">
        <div className="space-y-1">
          <h3 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Pronósticos Extras de Definición
          </h3>
          <p className="text-slate-400 text-xs md:text-sm">
            Predecí los grandes hitos del torneo. Los puntos de los extras se calculan al final del campeonato.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderDropdown('Campeón Mundial', 'championTeamId', <Trophy className="w-5 h-5 text-yellow-400" />, actualExtras?.championTeamId, 10)}
        {renderTextInput('Figura del Mundial', 'mvp', <Award className="w-5 h-5 text-purple-400" />, actualExtras?.mvp, 5)}
        {renderTextInput('Goleador del Mundial', 'topScorer', <TrendingUp className="w-5 h-5 text-emerald-400" />, actualExtras?.topScorer, 5)}
        {renderDropdown('Equipo Sorpresa', 'surpriseTeamId', <Sparkles className="w-5 h-5 text-indigo-400" />, actualExtras?.surpriseTeamId, 5)}
        {renderDropdown('Equipo Decepción', 'disappointmentTeamId', <AlertTriangle className="w-5 h-5 text-rose-400" />, actualExtras?.disappointmentTeamId, 5)}
      </div>
    </div>
  );
}
