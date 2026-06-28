/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Group, Match, User, GroupStandingRow, UserRankRow, GroupPredictionStore, MatchPrediction, ExtrasPrediction } from '../types';
import { TEAMS, GROUP_TEAMS, GROUP_ALPHABETS } from '../data/teamsAndMatches';
import { calculateGroupStandings, getRankedUsersInGroup } from '../utils/tiebreakers';
import BracketVisualizer from './BracketVisualizer';
import ExtrasPredictions from './ExtrasPredictions';
import {
  Trophy,
  Users,
  Calendar,
  Lock,
  Unlock,
  Award,
  TrendingUp,
  Table,
  Eye,
  Menu,
  ChevronDown,
  UserCheck,
  UserX,
  Trash2,
  Check,
  X,
  Edit3
} from 'lucide-react';

interface GroupDetailsProps {
  group: Group;
  currentUser: User;
  usersMap: Record<string, User>;
  matches: Match[];
  predictionsStore: Record<string, Record<string, GroupPredictionStore>>;
  isGroupStageLocked: boolean;
  isKnockoutStageLocked: boolean;
  isKnockoutPhaseVisible?: boolean;
  onUpdatePrediction: (matchId: string, team1Goals: number | null, team2Goals: number | null) => void;
  onUpdateExtrasPrediction: (field: string, value: string) => void;
  onSaveGroupPredictions?: (newMatches: Record<string, MatchPrediction> | null, newExtras: ExtrasPrediction | null) => Promise<void>;
  actualExtras: {
    championTeamId: string;
    topScorer: string;
    mvp: string;
    surpriseTeamId: string;
    disappointmentTeamId: string;
  };
  globalGroups: Group[]; // Used for General Ranking calculation
  onAcceptPendingMember?: (groupId: string, userId: string) => void;
  onRejectPendingMember?: (groupId: string, userId: string) => void;
  onRemoveMemberFromGroup?: (groupId: string, userId: string) => void;
  onUpdateActualResult?: (matchId: string, team1Goals: number | null, team2Goals: number | null) => void;
  onUpdateGroupName?: (groupId: string, newName: string) => void;
}

export default function GroupDetails({
  group,
  currentUser,
  usersMap,
  matches,
  predictionsStore,
  isGroupStageLocked,
  isKnockoutStageLocked,
  isKnockoutPhaseVisible = false,
  onUpdatePrediction,
  onUpdateExtrasPrediction,
  onSaveGroupPredictions,
  actualExtras,
  globalGroups,
  onAcceptPendingMember,
  onRejectPendingMember,
  onRemoveMemberFromGroup,
  onUpdateActualResult,
  onUpdateGroupName
}: GroupDetailsProps) {
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [tempGroupName, setTempGroupName] = useState('');

  // Tabs state dynamically dependent on visibility setting:
  const tabs = [
    ...GROUP_ALPHABETS.map((letter) => ({ id: letter, type: 'group' as const, label: letter })),
    ...(isKnockoutPhaseVisible
      ? [
          { id: '16avos', type: 'knockout' as const, label: '16avos' },
          { id: '8vos', type: 'knockout' as const, label: '8vos' },
          { id: '4tos', type: 'knockout' as const, label: '4tos' },
          { id: 'Semifinal', type: 'knockout' as const, label: 'Semifinal' },
          { id: '3er y 4to puesto', type: 'knockout' as const, label: '3er y 4to puesto' },
          { id: 'Final', type: 'knockout' as const, label: 'Final' }
        ]
      : [])
  ];

  const [activeTabId, setActiveTabId] = useState<string>('A');
  const [activeSegment, setActiveSegment] = useState<'fixtures' | 'participants' | 'extras' | 'generalRanking'>('fixtures');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Redirect active tab if it's knockout and visibility is disabled
  React.useEffect(() => {
    if (!isKnockoutPhaseVisible && activeTab.type === 'knockout') {
      setActiveTabId('A');
    }
  }, [isKnockoutPhaseVisible, activeTabId]);

  const grpPreds = predictionsStore[currentUser.id]?.[group.id] || {
    matches: {},
    extras: { championTeamId: '', topScorer: '', mvp: '', surpriseTeamId: '', disappointmentTeamId: '' }
  };

  const grpPredsMatchesStr = JSON.stringify(grpPreds.matches || {});

  // Draft matches predictions state
  const [draftMatches, setDraftMatches] = useState<Record<string, MatchPrediction>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync draftMatches when active tab, group, user or predictions change in real-time
  React.useEffect(() => {
    const nextDraft: Record<string, MatchPrediction> = {};
    activeMatches.forEach((m) => {
      const pred = grpPreds.matches[m.id];
      nextDraft[m.id] = pred ? { ...pred } : { team1Goals: null, team2Goals: null };
    });
    setDraftMatches(nextDraft);
    setHasUnsavedChanges(false);
  }, [activeTabId, group.id, currentUser.id, grpPredsMatchesStr]);

  const handleGoalsChangeLocal = (matchId: string, isTeam1: boolean, valueStr: string) => {
    const trimmed = valueStr.trim();
    let val: number | null = null;
    if (trimmed !== '') {
      const parsed = parseInt(trimmed, 10);
      if (isNaN(parsed) || parsed < 0) return;
      val = parsed;
    }

    const currentPred = draftMatches[matchId] || { team1Goals: null, team2Goals: null };
    const finalT1 = isTeam1 ? val : currentPred.team1Goals;
    const finalT2 = isTeam1 ? currentPred.team2Goals : val;

    setDraftMatches((prev) => ({
      ...prev,
      [matchId]: {
        team1Goals: finalT1,
        team2Goals: finalT2
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleClearLocalMatches = () => {
    const clearedDraft: Record<string, MatchPrediction> = {};
    activeMatches.forEach((m) => {
      clearedDraft[m.id] = { team1Goals: null, team2Goals: null };
    });
    setDraftMatches(clearedDraft);
    setHasUnsavedChanges(true);
  };

  const handleSaveLocalMatches = async () => {
    const batchUpdates: Record<string, MatchPrediction> = {};
    activeMatches.forEach((m) => {
      const draft = draftMatches[m.id] || { team1Goals: null, team2Goals: null };
      batchUpdates[m.id] = { team1Goals: draft.team1Goals, team2Goals: draft.team2Goals };
    });

    try {
      if (onSaveGroupPredictions) {
        await onSaveGroupPredictions(batchUpdates, null);
      } else {
        activeMatches.forEach((m) => {
          const draft = draftMatches[m.id] || { team1Goals: null, team2Goals: null };
          onUpdatePrediction(m.id, draft.team1Goals, draft.team2Goals);
        });
      }
      setHasUnsavedChanges(false);
      alert('💾 ¡Predicciones guardadas exitosamente para la sección actual!');
    } catch (err) {
      alert('Error al guardar predicciones: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Extras draft state
  const [draftExtras, setDraftExtras] = useState<ExtrasPrediction>({
    championTeamId: '',
    topScorer: '',
    mvp: '',
    surpriseTeamId: '',
    disappointmentTeamId: ''
  });
  const [hasUnsavedExtrasChanges, setHasUnsavedExtrasChanges] = useState(false);

  // Sync draft extras initially or when active segment flips to extras
  const grpPredsExtrasStr = JSON.stringify(grpPreds.extras || {});

  React.useEffect(() => {
    setDraftExtras({
      championTeamId: grpPreds.extras?.championTeamId || '',
      topScorer: grpPreds.extras?.topScorer || '',
      mvp: grpPreds.extras?.mvp || '',
      surpriseTeamId: grpPreds.extras?.surpriseTeamId || '',
      disappointmentTeamId: grpPreds.extras?.disappointmentTeamId || ''
    });
    setHasUnsavedExtrasChanges(false);
  }, [group.id, currentUser.id, activeSegment, grpPredsExtrasStr]);

  const handleUpdateExtrasLocal = (field: keyof ExtrasPrediction, value: string) => {
    setDraftExtras((prev) => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedExtrasChanges(true);
  };

  const handleClearExtras = () => {
    setDraftExtras({
      championTeamId: '',
      topScorer: '',
      mvp: '',
      surpriseTeamId: '',
      disappointmentTeamId: ''
    });
    setHasUnsavedExtrasChanges(true);
  };

  const handleSaveExtras = async () => {
    try {
      if (onSaveGroupPredictions) {
        await onSaveGroupPredictions(null, draftExtras);
      } else {
        (Object.keys(draftExtras) as Array<keyof ExtrasPrediction>).forEach((field) => {
          onUpdateExtrasPrediction(field, draftExtras[field]);
        });
      }
      setHasUnsavedExtrasChanges(false);
      alert('✨ ¡Pronósticos Extras guardados exitosamente!');
    } catch (err) {
      alert('Error al guardar pronósticos extras: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Group standings (only relevant if active tab is a letter A to L)
  const showGroupStandingsTable = activeTab.type === 'group';
  const groupStandings = showGroupStandingsTable
    ? calculateGroupStandings(activeTab.id, GROUP_TEAMS[activeTab.id], matches)
    : [];

  // Filter current matches for active tab
  const activeMatches = matches.filter((m) => {
    if (activeTab.type === 'group') {
      return m.type === 'group' && m.group === activeTab.id;
    } else {
      return m.type === 'knockout' && m.group === activeTab.id;
    }
  });

  // Calculate live ranking of user group members
  const participantsRanking = getRankedUsersInGroup(
    group.memberIds,
    usersMap,
    group.id,
    predictionsStore,
    matches,
    actualExtras
  );

  // Group total points visible underneath
  const sumGroupTotalPoints = participantsRanking.reduce((sum, r) => sum + r.totalPoints, 0);

  // Lock logic
  const isTabLocked = activeTab.type === 'group' ? isGroupStageLocked : isKnockoutStageLocked;

  // General Ranking of across all registered Groups showing Top 3 of each group
  const totalGeneralRankingList = globalGroups.map((g) => {
    const ranks = getRankedUsersInGroup(
      g.memberIds,
      usersMap,
      g.id,
      predictionsStore,
      matches,
      actualExtras
    );
    return {
      groupId: g.id,
      groupName: g.name,
      topThree: ranks.slice(0, 3)
    };
  });



  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto">
      
      {/* Group Title Box banner with Celeste design */}
      <div className="relative bg-gradient-to-r from-sky-600/80 via-blue-900/40 to-slate-900 rounded-3xl p-6 md:p-8 border border-sky-400/20 shadow-2xl overflow-hidden animate-fade-in">
        {/* Sky-blue visual hints */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1.5 flex-1 p-1">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">🏆</span>
              <span className="text-[10px] font-mono tracking-wider font-semibold text-sky-300 uppercase">GRUPO DE COMPETENCIA</span>
            </div>
            {isEditingGroupName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (tempGroupName.trim() && onUpdateGroupName) {
                    onUpdateGroupName(group.id, tempGroupName.trim());
                    setIsEditingGroupName(false);
                  }
                }}
                className="flex items-center gap-2 mt-1"
              >
                <input
                  type="text"
                  value={tempGroupName}
                  onChange={(e) => setTempGroupName(e.target.value)}
                  className="bg-slate-950 border border-sky-450 text-white rounded-xl px-3 py-1.5 text-lg md:text-2xl font-black focus:outline-none focus:ring-1 focus:ring-sky-500"
                  maxLength={50}
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Guardar nombre"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingGroupName(false)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">{group.name}</h2>
                {group.ownerId === currentUser.id && (
                  <button
                    onClick={() => {
                      setTempGroupName(group.name);
                      setIsEditingGroupName(true);
                    }}
                    className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-sky-400/30 text-slate-300 hover:text-sky-300 rounded-lg transition-all cursor-pointer shrink-0"
                    title="Editar nombre del grupo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-300 font-mono">
              <span>Invitación: <strong className="text-sky-300 font-bold bg-sky-950/40 px-2 py-0.5 rounded border border-sky-500/20">{group.inviteCode}</strong></span>
              <span>•</span>
              <span>{group.memberIds.length} Participantes</span>
              <span>•</span>
              <span>Puntaje total debajo: <strong className="text-sky-300">{sumGroupTotalPoints} pts</strong></span>
            </div>
          </div>

          {/* Quick Segment buttons wrapper */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: 'fixtures', label: 'Mis Pronósticos', icon: <Calendar className="w-4 h-4" /> },
              { id: 'participants', label: 'Tabla de Posiciones', icon: <Trophy className="w-4 h-4" /> },
              { id: 'extras', label: 'Pronósticos Extras', icon: <Award className="w-4 h-4" /> },
              { id: 'generalRanking', label: 'Ranking General', icon: <Users className="w-4 h-4" /> }
            ].map((seg) => (
              <button
                key={seg.id}
                onClick={() => setActiveSegment(seg.id as any)}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                  activeSegment === seg.id
                    ? 'bg-sky-500 text-slate-950 shadow-sky-500/10'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                {seg.icon}
                <span className="inline">{seg.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SEGMENT 1: FIXTURES (THE 18 TABS EXPERIENCE & THE PREDICTIONS) */}
      {activeSegment === 'fixtures' && (
        <div className="space-y-6">
          
          {/* THE 18 TABS CONTAINER */}
          {/* Responsive Mobile Layout: Show only letters. Desktop Layout: Full Name */}
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2 relative">
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-400 uppercase">
                Seleccionar Grupo o Fecha ({tabs.length} Pestañas Oficiales)
              </span>
              <span className="text-xs font-mono font-bold flex items-center gap-1">
                Estado: {isTabLocked ? (
                  <span className="text-rose-400 flex items-center gap-1 font-semibold uppercase"><Lock className="w-3 h-3" /> Bloqueado</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold uppercase"><Unlock className="w-3 h-3" /> Abierto</span>
                )}
              </span>
            </div>

            {/* Desktop Tabs flex wrapper */}
            {/* Horizontal scrollable row, hidden on mobile in favor of adaptive list */}
            <div className="hidden md:flex flex-wrap gap-1">
              {tabs.map((tab) => {
                const isActive = activeTabId === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                      isActive
                        ? tab.type === 'knockout'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                          : 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    {tab.type === 'group' ? `Grupo ${tab.label}` : tab.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile version tab bar (Show only letters "A", "B", ... as required: "En mobile: Mostrar solo letra del grupo. Ejemplo: 'A'") */}
            <div className="md:hidden flex flex-col gap-2">
              <div className="grid grid-cols-6 gap-1">
                {tabs.slice(0, 12).map((tab) => {
                  const isActive = activeTabId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      className={`h-10 rounded-lg text-sm font-black font-mono transition-all ${
                        isActive
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {tabs.slice(12).map((tab) => {
                  const isActive = activeTabId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      className={`h-9 rounded-lg text-[10px] font-bold uppercase truncate transition-all ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-extrabold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* Left/Middle Column: Match Fixtures of this zone */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-bold text-white tracking-tight animate-fade-in flex items-center gap-2">
                  <span>⚽ Pronósticos de Partidos</span>
                  <span className="text-xs bg-sky-950 font-normal border border-sky-400/20 text-sky-300 px-2 py-0.5 rounded-full">
                    {activeTab.type === 'group' ? `Grupo ${activeTab.label}` : activeTab.label}
                  </span>
                </h3>
              </div>

              {/* Toolbar Actions for match changes */}
              {!isTabLocked && (
                <div className="bg-[#003566]/65 border border-[#74ACDF]/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md animate-fade-in">
                  <div className="text-left space-y-1">
                    <span className="text-xs font-bold text-slate-100 block">
                      {hasUnsavedChanges ? '⚠️ Tenés cambios sin guardar en estos resultados' : '✓ Tus pronósticos coinciden con lo guardado'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-350 block leading-relaxed">
                      Dejá casilleros en blanco si aún no sabés tu predicción y no se forzarán en 0. ¡Clickeá Guardar antes de continuar!
                    </span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleClearLocalMatches}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-350 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Limpiar todo
                    </button>
                    <button
                      onClick={handleSaveLocalMatches}
                      className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-sans font-black uppercase tracking-wider transition-all cursor-pointer ${
                        hasUnsavedChanges
                          ? 'bg-[#74ACDF] text-[#001D3D] shadow-lg shadow-[#74ACDF]/20 hover:scale-[1.01]'
                          : 'bg-white/5 text-slate-400 cursor-not-allowed border border-white/10'
                      }`}
                      disabled={!hasUnsavedChanges}
                    >
                      Guardar Pronósticos
                    </button>
                  </div>
                </div>
              )}

              {activeTab.type === 'knockout' ? (
                <BracketVisualizer
                  matches={matches}
                  userPredictions={{ ...grpPreds.matches, ...draftMatches }}
                  isAdmin={currentUser.isAdmin}
                  isLocked={isKnockoutStageLocked}
                  onUpdateActualResult={onUpdateActualResult}
                  onUpdatePrediction={(matchId, t1Goals, t2Goals) => {
                    setDraftMatches((prev) => ({
                      ...prev,
                      [matchId]: { team1Goals: t1Goals, team2Goals: t2Goals }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeMatches.map((m) => {
                    const t1 = TEAMS[m.team1];
                    const t2 = TEAMS[m.team2];
                    const pred = draftMatches[m.id] || { team1Goals: null, team2Goals: null };
                    const hasActual = m.team1Goals !== null && m.team2Goals !== null;

                    return (
                      <div
                        key={m.id}
                        className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 space-y-4 shadow-lg hover:border-sky-500/20 transition-all"
                      >
                        <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-400 border-b border-slate-700/60 pb-2">
                          <span>Partido {m.id.split('_')[1]?.toUpperCase() || m.id.toUpperCase()}</span>
                          <span>{m.date} - {m.time}hs</span>
                        </div>

                        {/* Home Team Rows */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-xl" role="img" aria-label={t1?.name}>
                              {t1?.emoji || '🏳️'}
                            </span>
                            <span className="text-sm font-bold text-white truncate">{t1?.name || 'TBD'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] font-mono text-slate-500 uppercase">Mi Pred.</span>
                              <input
                                type="number"
                                min="0"
                                disabled={isTabLocked}
                                value={pred.team1Goals ?? ''}
                                placeholder="-"
                                onChange={(e) => handleGoalsChangeLocal(m.id, true, e.target.value)}
                                className="w-12 h-8 rounded bg-slate-900 border border-slate-700 text-center font-bold text-sm text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                              />
                            </div>

                            {hasActual && (
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] font-mono text-sky-400 uppercase">Real</span>
                                <span className="w-12 h-8 flex items-center justify-center rounded bg-slate-950 font-bold text-slate-300 border border-slate-800 text-sm">
                                  {m.team1Goals}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Away Team Rows */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-xl" role="img" aria-label={t2?.name}>
                              {t2?.emoji || '🏳️'}
                            </span>
                            <span className="text-sm font-bold text-white truncate">{t2?.name || 'TBD'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                              <input
                                type="number"
                                min="0"
                                disabled={isTabLocked}
                                value={pred.team2Goals ?? ''}
                                placeholder="-"
                                onChange={(e) => handleGoalsChangeLocal(m.id, false, e.target.value)}
                                className="w-12 h-8 rounded bg-slate-900 border border-slate-700 text-center font-bold text-sm text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                              />
                            </div>

                            {hasActual && (
                              <span className="w-12 h-8 flex items-center justify-center rounded bg-slate-950 font-bold text-slate-300 border border-slate-800 text-sm">
                                {m.team2Goals}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Match points feedback */}
                        {hasActual && pred.team1Goals !== null && pred.team2Goals !== null && (
                          <div className="pt-2.5 border-t border-slate-750 text-center text-xs">
                            {(() => {
                              const p1 = pred.team1Goals;
                              const p2 = pred.team2Goals;
                              const a1 = m.team1Goals!;
                              const a2 = m.team2Goals!;
                              
                              const actualWin = a1 > a2 ? '1' : a1 < a2 ? '2' : 'D';
                              const predWin = p1 > p2 ? '1' : p1 < p2 ? '2' : 'D';

                              if (actualWin === predWin) {
                                if (p1 === a1 && p2 === a2) {
                                  return (
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                      Marcador Exacto (+5 PTS) 🌟
                                    </span>
                                  );
                                }
                                return (
                                  <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold">
                                    Resultado Acertado (+3 PTS)
                                  </span>
                                );
                              }
                              return (
                                <span className="text-slate-450 italic font-mono text-[11px]">
                                  No acertado (0 PTS)
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Group Stage Standings table (if active tab is a zone A to L) */}
            <div className="space-y-4">
              {showGroupStandingsTable ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-sky-400">
                    <Table className="w-4 h-4" />
                    <h3 className="font-bold text-xs font-mono uppercase tracking-wider text-white">Tabla de Posiciones Oficial</h3>
                  </div>

                  {/* Standings table responsive content */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800 text-slate-400 uppercase font-mono text-[9px] tracking-wider">
                          <th className="p-2.5">Equipo</th>
                          <th className="p-2.5 text-center">PJ</th>
                          <th className="p-2.5 text-center">G</th>
                          <th className="p-2.5 text-center">E</th>
                          <th className="p-2.5 text-center">P</th>
                          <th className="p-2.5 text-center">DG</th>
                          <th className="p-2.5 text-center font-bold text-sky-300">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
                        {groupStandings.map((stand) => (
                          <tr key={stand.teamId} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-2.5 font-bold text-white flex items-center gap-1.5 truncate max-w-36">
                              <span>{stand.emoji}</span>
                              <span className="truncate">{stand.teamName}</span>
                            </td>
                            <td className="p-2.5 text-center font-mono">{stand.pj}</td>
                            <td className="p-2.5 text-center font-mono text-slate-300">{stand.g}</td>
                            <td className="p-2.5 text-center font-mono text-slate-300">{stand.e}</td>
                            <td className="p-2.5 text-center font-mono text-slate-300">{stand.p}</td>
                            <td className={`p-2.5 text-center font-mono font-semibold ${
                              stand.dg > 0 ? 'text-emerald-400' : stand.dg < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {stand.dg > 0 ? `+${stand.dg}` : stand.dg}
                            </td>
                            <td className="p-2.5 text-center font-mono font-black text-sky-300">{stand.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] font-mono text-slate-450 leading-relaxed italic text-center">
                    Los números de PJ, G, E, P, DG, Pts se actualizan automáticamente al instante cuando el admin ingresa registros de goles reales.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 shadow-xl text-center space-y-2">
                  <Trophy className="w-8 h-8 text-yellow-450 mx-auto opacity-40 animate-pulse" />
                  <p className="font-bold text-xs text-white uppercase tracking-wider">Fase de Eliminación Directa</p>
                  <p className="text-[11px] text-slate-450 leading-relaxed pr-2 pl-2">
                    En esta etapa de playoffs (16avos a Final) los partidos se juegan a eliminación directa. No hay tabla de posiciones, ¡se define en el bracket!
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SEGMENT 2: LIVE PARTICIPANTS RANKING (INSIDE GROUP RANKING) */}
      {activeSegment === 'participants' && (
        <div className="space-y-6">
          {/* Pending Approval Requests section for group owners */}
          {group.ownerId === currentUser.id && (group.pendingMemberIds || []).length > 0 && (
            <div className="bg-slate-900/80 border border-yellow-500/20 rounded-2xl p-4 shadow-xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-yellow-500 border-b border-slate-800 pb-2">
                <span className="animate-pulse">⏳</span>
                <h4 className="font-bold text-xs uppercase tracking-wider text-white">Solicitudes de ingreso pendientes (Cerrar acceso o aprobar)</h4>
              </div>
              <div className="space-y-2">
                {(group.pendingMemberIds || []).map((userId) => {
                  const u = usersMap[userId];
                  if (!u) return null;
                  return (
                    <div key={userId} className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                      <div>
                        <p className="font-bold text-sm text-white">{u.name}</p>
                        <p className="text-xs font-mono text-slate-450">{u.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onAcceptPendingMember?.(group.id, userId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Aceptar
                        </button>
                        <button
                          onClick={() => onRejectPendingMember?.(group.id, userId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" /> Rechazar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-slate-900/45 border border-sky-500/15 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-base font-extrabold text-white">Ranking del Grupo — Tabla Individual del Torneo</h3>
              </div>
              
              <span className="text-[11px] font-mono text-slate-400">
                Puntuación Total del Grupo: <strong className="text-sky-300">{sumGroupTotalPoints} pts</strong>
              </span>
            </div>

            {/* Participants rankings table mapping */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-800 text-slate-450 font-mono text-[9.5px] uppercase tracking-wider">
                    <th className="p-3 text-center">Pos</th>
                    <th className="p-3">Participante / Correo</th>
                    <th className="p-3 text-center">Acierto Partidos</th>
                    <th className="p-3 text-center">Acierto Extras</th>
                    <th className="p-3 text-center">Solo F. Grupos</th>
                    <th className="p-3 text-center">Reg. Date</th>
                    <th className="p-3 text-right font-black text-white bg-sky-950/30">Ptos Totales</th>
                    {group.ownerId === currentUser.id && <th className="p-3 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/20">
                  {participantsRanking.map((p, idx) => {
                    const isSelf = p.userId === currentUser.id;
                    const isOwner = group.ownerId === currentUser.id;
                    return (
                      <tr
                        key={p.userId}
                        className={`hover:bg-slate-850/50 transition-colors ${
                          isSelf ? 'bg-sky-950/20 border-l-4 border-sky-400' : ''
                        }`}
                      >
                        <td className="p-3 text-center font-black font-mono">
                          {idx + 1 === 1 ? '🥇 1' : idx + 1 === 2 ? '🥈 2' : idx + 1 === 3 ? '🥉 3' : idx + 1}
                        </td>
                        <td className="p-3">
                          <div>
                            <span className="font-extrabold text-white flex items-center gap-1.5">
                              {p.userName || p.email.split('@')[0]}
                              {isSelf && <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 rounded uppercase font-mono font-bold border border-sky-500/20">Vos</span>}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">{p.email}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-300">{p.matchPoints}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{p.extraPoints}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{p.groupStagePoints}</td>
                        <td className="p-3 text-center font-mono text-[10px] text-slate-500">
                          {new Date(p.registerDate).toLocaleString('es-AR', { hour12: false })}
                        </td>
                        <td className="p-3 text-right font-black font-mono text-sm text-sky-400 bg-sky-950/10">
                          {p.totalPoints}
                        </td>
                        {isOwner && (
                          <td className="p-3 text-center">
                            {p.userId !== group.ownerId ? (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de que querés eliminar definitivamente a "${p.userName || p.email}" del grupo? Se borrará su participación en este prode.`)) {
                                    onRemoveMemberFromGroup?.(group.id, p.userId);
                                  }
                                }}
                                className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900 text-rose-350 hover:text-white border border-rose-500/30 rounded-lg text-[10.5px] font-bold flex items-center gap-1 mx-auto transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3" /> Eliminar
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500">Creador</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tiebreakers legend footnote */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-[10.5px] text-slate-400 space-y-1 leading-relaxed">
              <strong className="text-slate-300 block uppercase font-mono">Criterios de Desempate Aplicados en Vivo:</strong>
              <p>
                1º Puntos Totales • 2º Puntos en Partidos (Resultados + Exactos) • 3º Puntos de Extras • 4º Puntos de Fase de Grupos • 5º Antigüedad de Registro (Más antiguo primero).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SEGMENT 3: EXTRAS PREDICTIONS FOR USER */}
      {activeSegment === 'extras' && (
        <div className="animate-fade-in space-y-6">
          <ExtrasPredictions
            prediction={draftExtras}
            onUpdate={handleUpdateExtrasLocal}
            isLocked={isGroupStageLocked} // Tied to group stage lock as per rule
            actualExtras={actualExtras}
          />

          {!isGroupStageLocked && (
            <div className="bg-[#003566]/65 border border-[#74ACDF]/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md mt-4 animate-fade-in">
              <div className="text-left space-y-1">
                <span className="text-xs font-bold text-slate-100 block">
                  {hasUnsavedExtrasChanges ? '⚠️ Tenés cambios sin guardar en los Pronósticos Extras' : '✓ Tus pronósticos extras coinciden con lo guardado'}
                </span>
                <span className="text-[10px] font-mono text-slate-350 block leading-relaxed">
                  Para que tu predicción de Campeón, MVP, Goleador y Sorpresas cuente de verdad, ¡hacé clic en el botón de Guardar!
                </span>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleClearExtras}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-350 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Limpiar Extras
                </button>
                <button
                  onClick={handleSaveExtras}
                  className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-sans font-black uppercase tracking-wider transition-all cursor-pointer ${
                    hasUnsavedExtrasChanges
                      ? 'bg-[#74ACDF] text-[#001D3D] shadow-lg shadow-[#74ACDF]/20 hover:scale-[1.01]'
                      : 'bg-white/5 text-slate-400 cursor-not-allowed border border-white/10'
                  }`}
                  disabled={!hasUnsavedExtrasChanges}
                >
                  Guardar Extras
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEGMENT 4: GENERAL RANKING (SHOWS ALL GROUPS TOP 3 PLAYERS) */}
      {activeSegment === 'generalRanking' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-450 animate-bounce" />
              <div>
                <h3 className="text-base font-extrabold text-white">Ranking General — Podios de Todos los Grupos</h3>
                <p className="text-xs text-slate-400">Visualiza en tiempo real quién lidera cada liga cerrada del Prode Mundial 2026.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {totalGeneralRankingList.map((entry) => (
                <div
                  key={entry.groupId}
                  className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3 shadow-md hover:border-sky-500/10 transition-all flex flex-col justify-between"
                >
                  <h4 className="font-extrabold text-sm text-white truncate border-b border-slate-800 pb-2 bg-gradient-to-r from-sky-950/30 to-transparent p-1.5 rounded">{entry.groupName}</h4>
                  
                  <div className="space-y-2">
                    {entry.topThree.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2 text-center">Aún no hay competidores en este grupo.</p>
                    ) : (
                      entry.topThree.map((player, pIdx) => (
                        <div key={player.userId} className="flex justify-between items-center text-xs font-sans group">
                          <span className="text-slate-400 flex items-center gap-1.5 truncate">
                            <span className="font-bold">
                              {pIdx === 0 ? '🥇' : pIdx === 1 ? '🥈' : '🥉'}
                            </span>
                            <span className="truncate text-slate-200 group-hover:text-white transition-colors">{player.userName || player.email.split('@')[0]}</span>
                          </span>
                          <span className="font-mono text-sky-400 font-bold">{player.totalPoints} pts</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
