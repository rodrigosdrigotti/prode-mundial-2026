/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Match, User, Gruop } from '../types';
import { TEAMS, GROUP_ALPHABETS } from '../data/teamsAndMatches';
import {
  Settings,
  Trophy,
  Calendar,
  Lock,
  Unlock,
  Trash2,
  ListFilter,
  CheckCircle,
  RefreshCw,
  Play,
  Hammer,
  Edit3,
  X,
  Check
} from 'lucide-react';

interface AdminPanelProps {
  matches: Match[];
  users: Record<string, User>;
  groups: Group[];
  isGroupStageLocked: boolean;
  isKnockoutStageLocked: boolean;
  isGroupCreationLocked: boolean;
  isKnockoutPhaseVisible: boolean;
  onUpdateMatchActualResult: (matchId: string, team1Goals: number | null, team2Goals: number | null) => void;
  onUpdateMatchDateTime: (matchId: string, date: string, time: string) => void;
  onUpdateTeamName: (teamId: string, newName: string) => void;
  onGenerateEliminatories: () => void;
  onToggleLock: (stage: 'group' | 'knockout' | 'groupCreation' | 'knockoutPhaseVisible') => void;
  onDeleteUser: (userId: string) => void;
  onTriggerSimulation: () => void;
  onResetData: () => void;
  onForceRegenerateMatches?: () => void;
  actualExtras: {
    championTeamId: string;
    topScorer: string;
    mvp: string;
    surpriseTeamId: string;
    disappointmentTeamId: string;
  };
  onUpdateActualExtras: (field: string, value: string) => void;
  onUpdateGroupName: (groupId: string, newName: string) => void;
  onDeleteGroup: (groupId: string) => void;
}

export default function AdminPanel({
  matches,
  users,
  groups = [],
  isGroupStageLocked,
  isKnockoutStageLocked,
  isGroupCreationLocked,
  isKnockoutPhaseVisible,
  onUpdateMatchActualResult,
  onUpdateMatchDateTime,
  onUpdateTeamName,
  onGenerateEliminatories,
  onToggleLock,
  onDeleteUser,
  onTriggerSimulation,
  onResetData,
  onForceRegenerateMatches,
  actualExtras,
  onUpdateActualExtras,
  onUpdateGroupName,
  onDeleteGroup
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'matches' | 'teams' | 'users' | 'locks' | 'extras' | 'groups'>('matches');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('A');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState<string>('');
  const [confirmClearMatchId, setConfirmClearMatchId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>('');
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Handle goals input directly from state
  const handleGoalsChange = (matchId: string, isTeam1: boolean, valueStr: string) => {
    const trimmed = valueStr.trim();
    let val: number | null = null;
    if (trimmed !== '') {
      const parsed = parseInt(trimmed, 10);
      if (isNaN(parsed) || parsed < 0) return;
      val = parsed;
    }

    const match = matches.find((m) => m.id === matchId);
    if (match) {
      const is1Goals = isTeam1 ? val : match.team1Goals;
      const is2Goals = isTeam1 ? match.team2Goals : val;
      onUpdateMatchActualResult(matchId, is1Goals, is2Goals);
    }
  };

  const handleDateTimeChange = (matchId: string, field: 'date' | 'time', value: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      const date = field === 'date' ? value : match.date;
      const time = field === 'time' ? value : match.time;
      onUpdateMatchDateTime(matchId, date, time);
    }
  };

  // Group filtered matches
  const filteredMatches = matches.filter((m) => {
    if (activeTab === 'matches') {
      if (GROUP_ALPHABETS.includes(selectedGroupFilter)) {
        return m.type === 'group' && m.group === selectedGroupFilter;
      }
      return m.type === 'knockout' && m.group === selectedGroupFilter;
    }
    return false;
  });

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-sky-500/20 p-5 md:p-6 text-white shadow-2xl space-y-6">
      
      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">Panel de Control General (Admin)</h2>
            <p className="text-xs text-sky-400 font-mono font-semibold">Administra equipos, partidos, cierres oficiales y simulación completa</p>
          </div>
        </div>

        {/* Rapid control buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onTriggerSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-transform focus:ring focus:ring-amber-400/50"
          >
            <Play className="w-3.5 h-3.5" />
            Simulación 100% (QA)
          </button>

          {onForceRegenerateMatches && (
            <button
              onClick={onForceRegenerateMatches}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-transform focus:ring focus:ring-sky-500/50"
              title="Regenerar todos los partidos del mundial en Firestore"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerar Partidos Eliminados
            </button>
          )}
          
          <button
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-transform focus:ring focus:ring-rose-500/50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpiar Datos y Restablecer
          </button>
        </div>
      </div>

      {/* Admin sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/70 pb-3">
        {[
          { id: 'matches', label: 'Editar Resultados & Partidos' },
          { id: 'teams', label: 'Nombres de Equipos' },
          { id: 'users', label: 'Gestionar Usuarios' },
          { id: 'groups', label: 'Gestionar Grupos del Prode' },
          { id: 'locks', label: 'Bloqueos & Generación de Bracket' },
          { id: 'extras', label: 'Resultados Extras Oficiales' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-sky-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. EDIT MATCHES */}
      {activeTab === 'matches' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3 bg-slate-850 p-3 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5" />
              Filtrar Fase:
            </span>
            <div className="flex flex-wrap gap-1">
              {/* Group Stages A to L */}
              {GROUP_ALPHABETS.map((ltr) => (
                <button
                  key={ltr}
                  onClick={() => setSelectedGroupFilter(ltr)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs ${
                    selectedGroupFilter === ltr
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {ltr}
                </button>
              ))}
              {/* Knockout stages */}
              {['16avos', '8vos', '4tos', 'Semifinal', '3er y 4to puesto', 'Final'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setSelectedGroupFilter(stage)}
                  className={`px-2.5 h-8 rounded-lg font-bold text-xs ${
                    selectedGroupFilter === stage
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6 col-span-full">
                No hay partidos generados o cargados para esta fase en este momento.
              </p>
            ) : (
              filteredMatches.map((m) => {
                const team1Info = TEAMS[m.team1];
                const team2Info = TEAMS[m.team2];

                return (
                  <div
                    key={m.id}
                    className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-2">
                      <span>ID: {m.id} • {m.type.toUpperCase()}</span>
                      {(m.team1Goals !== null || m.team2Goals !== null) && (
                        confirmClearMatchId === m.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/20">
                            <span className="text-[9px] text-rose-300 font-bold font-mono">¿Borrar?</span>
                            <button
                              onClick={() => {
                                onUpdateMatchActualResult(m.id, null, null);
                                setConfirmClearMatchId(null);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded text-[8px] transition-all uppercase cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmClearMatchId(null)}
                              className="text-slate-400 hover:text-white font-bold px-1 py-0.5 text-[8px] transition-all uppercase cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setConfirmClearMatchId(m.id);
                            }}
                            className="text-rose-450 hover:text-rose-300 font-bold transition-all uppercase cursor-pointer text-[9.5px]/none hover:underline"
                          >
                            Limpiar
                          </button>
                        )
                      )}
                    </div>

                    {/* Team Rows */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-sm font-semibold truncate">
                          {team1Info ? `${team1Info.emoji} ${team1Info.name}` : m.placeholderName1 || 'TBD'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={m.team1Goals ?? ''}
                          onChange={(e) => handleGoalsChange(m.id, true, e.target.value)}
                          placeholder="-"
                          className="w-12 h-8 rounded bg-sky-950/80 border border-sky-400 text-sky-300 font-bold text-sm text-center focus:outline-none focus:border-sky-300"
                        />
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <span className="text-sm font-semibold truncate">
                          {team2Info ? `${team2Info.emoji} ${team2Info.name}` : m.placeholderName2 || 'TBD'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={m.team2Goals ?? ''}
                          onChange={(e) => handleGoalsChange(m.id, false, e.target.value)}
                          placeholder="-"
                          className="w-12 h-8 rounded bg-sky-950/80 border border-sky-400 text-sky-300 font-bold text-sm text-center focus:outline-none focus:border-sky-300"
                        />
                      </div>
                    </div>

                    {/* Date / Time editor */}
                    <div className="pt-2 border-t border-slate-800/80 flex gap-2 text-xs">
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Fecha</span>
                        <input
                          type="date"
                          value={m.date}
                          onChange={(e) => handleDateTimeChange(m.id, 'date', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded h-7 text-[10px] px-1 text-slate-300 font-mono text-center focus:outline-none"
                        />
                      </div>

                      <div className="w-18 flex flex-col gap-0.5">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Hora 24hs</span>
                        <input
                          type="text"
                          value={m.time}
                          placeholder="HH:MM"
                          onChange={(e) => handleDateTimeChange(m.id, 'time', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded h-7 text-[10px] px-1 text-slate-300 font-mono text-center focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. MANAGE TEAM NAMES */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in max-h-[450px] overflow-y-auto pr-2">
          {Object.values(TEAMS).map((t) => (
            <div
              key={t.id}
              className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex justify-between items-center"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl">{t.emoji}</span>
                {editingTeamId === t.id ? (
                  <input
                    type="text"
                    value={editingTeamName}
                    onChange={(e) => setEditingTeamName(e.target.value)}
                    className="bg-slate-900 border border-sky-500 rounded px-2 py-0.5 text-xs text-white uppercase focus:outline-none font-bold"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-200 truncate">{t.name}</span>
                )}
              </div>

              <div>
                {editingTeamId === t.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        onUpdateTeamName(t.id, editingTeamName);
                        setEditingTeamId(null);
                      }}
                      className="px-2 py-1 bg-sky-500 hover:bg-sky-600 rounded text-[10px] font-extrabold uppercase text-white"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setEditingTeamId(null)}
                      className="px-2 py-1 bg-slate-750 hover:bg-slate-700 rounded text-[10px] uppercase text-slate-400"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingTeamId(t.id);
                      setEditingTeamName(t.name);
                    }}
                    className="text-slate-400 hover:text-sky-400 text-[11px] font-semibold underline"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. MANAGE USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-3.5">Nombre de Usuario / Apodo</th>
                  <th className="p-3.5">Correo Electrónico</th>
                  <th className="p-3.5">Fecha de Ingreso</th>
                  <th className="p-3.5 text-center">Rol</th>
                  <th className="p-3.5 text-right">Fuerza Bruta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {Object.values(users).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-3.5 font-bold text-white">{u.name}</td>
                    <td className="p-3.5 text-slate-300 font-mono">{u.email}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(u.registerDate).toLocaleString('es-AR', { hour12: false })}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          u.isAdmin
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.isAdmin ? 'ADMIN' : 'IDÍS'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          if (u.isAdmin) {
                            alert('No se puede eliminar la cuenta principal de administrador por motivos de seguridad.');
                            return;
                          }
                          setUserToDelete(u);
                        }}
                        disabled={u.isAdmin}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-400 hover:text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. GESTIONAR GRUPOS DEL PRODE */}
      {activeTab === 'groups' && (
        <div className="space-y-4 animate-fade-in">
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-3.5">Nombre del Grupo</th>
                  <th className="p-3.5">Creador / Dueño</th>
                  <th className="p-3.5">Código de Invitación</th>
                  <th className="p-3.5 text-center">Miembros</th>
                  <th className="p-3.5 text-center">Aprobación</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs italic font-semibold">
                      ¡Aún no se han creado grupos de Prode en el sistema!
                    </td>
                  </tr>
                ) : (
                  groups.map((g) => {
                    const owner = users[g.ownerId];
                    const isEditing = editingGroupId === g.id;

                    return (
                      <tr key={g.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="p-3.5 font-bold text-white">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 max-w-[240px]">
                              <input
                                type="text"
                                value={editingGroupName}
                                onChange={(e) => setEditingGroupName(e.target.value)}
                                className="bg-slate-950 border border-sky-400 rounded px-2 py-1 text-xs text-white uppercase focus:outline-none font-bold flex-1"
                                placeholder="Nombre de grupo"
                              />
                              <button
                                onClick={() => {
                                  if (!editingGroupName.trim()) {
                                    alert('El nombre del grupo no puede estar vacío.');
                                    return;
                                  }
                                  onUpdateGroupName(g.id, editingGroupName.trim());
                                  setEditingGroupId(null);
                                }}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                                title="Guardar"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingGroupId(null)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-705 text-slate-400 rounded cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-white font-bold">{g.name}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-300 font-mono">
                          {owner ? (
                            <div>
                              <p className="font-semibold text-slate-200 text-xs">{owner.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{owner.email}</p>
                            </div>
                          ) : (
                            <div className="text-[11px]">
                              <span className="text-white font-semibold">Dueño por Defecto (Admin)</span>
                              <p className="text-[9.5px]/none text-slate-500 font-mono truncate max-w-[130px]">{g.ownerId}</p>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-300 uppercase tracking-wider font-bold">{g.inviteCode}</td>
                        <td className="p-3.5 text-center font-bold text-slate-200">
                          {g.memberIds?.length || 0}
                        </td>
                        <td className="p-3.5 text-center text-[10px] font-semibold">
                          {g.requiresApproval ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                              Aprobación ({ (g.pendingMemberIds || []).length } pendiente)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                              Auto-unir (Abierto)
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex justify-end gap-1.5">
                            {!isEditing && (
                              <button
                                onClick={() => {
                                  setEditingGroupId(g.id);
                                  setEditingGroupName(g.name);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 cursor-pointer"
                                title="Editar Nombre"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setGroupToDelete(g)}
                              className="p-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-450 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Eliminar Grupo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. LOCKDOWNS & AUTOMATIONS */}
      {activeTab === 'locks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Automated knockout generator card */}
          <div className="bg-slate-850 p-5 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-yellow-400 flex items-center gap-1.5 uppercase font-sans">
                <Trophy className="w-4 h-4" />
                Generar Bracket Directo (16avos)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Examina los resultados de los partidos jugados en la Fase de Grupos. Ordena las posiciones de cada uno de los 12 grupos de manera oficial, selecciona los top 1 y 2 de cada zona, filtra los 8 mejores tercer clasificados y genera automáticamente el armado de los enfrentamientos de la ronda de 16avos.
              </p>
            </div>
            
            <button
              onClick={onGenerateEliminatories}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:zoom text-white text-xs font-black uppercase rounded-lg shadow-lg active:scale-95 transition-transform"
            >
              <Hammer className="w-4 h-4" />
              Generar Cruces Oficiales (Bracket Real)
            </button>
          </div>

          {/* Locks manager cards */}
          <div className="bg-slate-850 p-5 rounded-xl border border-slate-800 space-y-4">
            <h4 className="font-bold text-sm text-sky-400 flex items-center gap-1.5 uppercase">
              <Lock className="w-4 h-4" />
              Toggles de Seguridad & Bloqueos
            </h4>
            <div className="space-y-2.5 text-xs">
              
              {/* Group phase lockdown */}
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">Bloqueo: Fase de Grupos</p>
                  <p className="text-[10px] text-slate-400">11/06/2026 — 13:00hs (AR)</p>
                </div>
                <button
                  onClick={() => onToggleLock('group')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded font-black text-[10px] transition-colors ${
                    isGroupStageLocked
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/20'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/20'
                  }`}
                >
                  {isGroupStageLocked ? (
                    <>
                      <Lock className="w-3" /> BLOQUEADO
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3" /> ABIERTO
                    </>
                  )}
                </button>
              </div>

              {/* Group creation lockdown */}
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">Bloqueo: Creación de Grupos</p>
                  <p className="text-[10px] text-slate-400">27/06/2026 — 21:00hs (AR)</p>
                </div>
                <button
                  onClick={() => onToggleLock('groupCreation')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded font-black text-[10px] transition-colors ${
                    isGroupCreationLocked
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/20'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/20'
                  }`}
                >
                  {isGroupCreationLocked ? (
                    <>
                      <Lock className="w-3" /> BLOQUEADO
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3" /> ABIERTO
                    </>
                  )}
                </button>
              </div>

              {/* Knockout lockdown */}
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">Bloqueo: Eliminatorias</p>
                  <p className="text-[10px] text-slate-400">28/06/2026 — 13:00hs (AR)</p>
                </div>
                <button
                  onClick={() => onToggleLock('knockout')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded font-black text-[10px] transition-colors ${
                    isKnockoutStageLocked
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/20'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/20'
                  }`}
                >
                  {isKnockoutStageLocked ? (
                    <>
                      <Lock className="w-3" /> BLOQUEADO
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3" /> ABIERTO
                    </>
                  )}
                </button>
              </div>

              {/* Tournament Playoff Phase Visibility Control */}
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">Visibilidad Fase Eliminatoria</p>
                  <p className="text-[10px] text-slate-400">Permite ver Bracket Visualizer & playoffs a usuarios normales</p>
                </div>
                <button
                  onClick={() => onToggleLock('knockoutPhaseVisible')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded font-black text-[10px] transition-colors ${
                    isKnockoutPhaseVisible
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  {isKnockoutPhaseVisible ? (
                    <>
                      <Unlock className="w-3" /> VISIBLE (Habilitado)
                    </>
                  ) : (
                    <>
                      <Lock className="w-3" /> INVISIBLE (Deshabilitado)
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. ACTUAL EXTRAS GROUND TRUTH INTERFACE */}
      {activeTab === 'extras' && (
        <div className="bg-slate-850 p-5 rounded-xl border border-slate-800 space-y-4 animate-fade-in text-xs md:text-sm">
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-yellow-400 uppercase flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Carga de Podios Oficiales de la Copa 2026
            </h4>
            <p className="text-xs text-slate-450">
              Define los verdaderos campeones, goleadores y sorpresas según vayan culminando la Copa para calcular los 10+5+5 puntos correspondientes de los Pronósticos Extras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white font-semibold">Seleccionar Campeón del Mundo Oficial</label>
              <select
                value={actualExtras.championTeamId}
                onChange={(e) => onUpdateActualExtras('championTeamId', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-semibold focus:outline-none"
              >
                <option value="">No definido aún</option>
                {Object.values(TEAMS)
                  .sort((a,b) => a.name.localeCompare(b.name))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-white font-semibold flex items-center gap-1">
                Escribir MVP / Figura de la Copa
              </label>
              <input
                type="text"
                value={actualExtras.mvp}
                placeholder="Ej. Lionel Messi"
                onChange={(e) => onUpdateActualExtras('mvp', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-semibold focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-white font-semibold">Escribir Máximo Goleador Oficial</label>
              <input
                type="text"
                value={actualExtras.topScorer}
                placeholder="Ej. Kylian Mbappé"
                onChange={(e) => onUpdateActualExtras('topScorer', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-semibold focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-white font-semibold">Seleccionar Equipo Sorpresa Oficial</label>
              <select
                value={actualExtras.surpriseTeamId}
                onChange={(e) => onUpdateActualExtras('surpriseTeamId', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-semibold focus:outline-none"
              >
                <option value="">No definido</option>
                {Object.values(TEAMS)
                  .sort((a,b) => a.name.localeCompare(b.name))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-white font-semibold">Seleccionar Equipo Decepción Oficial</label>
              <select
                value={actualExtras.disappointmentTeamId}
                onChange={(e) => onUpdateActualExtras('disappointmentTeamId', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-semibold focus:outline-none"
              >
                <option value="">No definido</option>
                {Object.values(TEAMS)
                  .sort((a,b) => a.name.localeCompare(b.name))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE USER CUSTOM MODAL (COMPATIBLE WITH IFRAME) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/25">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Confirmar Eliminación</h3>
                <p className="text-[10px] text-rose-400 font-mono">Esta acción es permanente e irreversible</p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl space-y-1 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Usuario seleccionado para eliminar:</p>
              <p className="text-sm font-black text-rose-300">{userToDelete.name}</p>
              <p className="text-xs font-mono text-slate-400 break-all">{userToDelete.email}</p>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
              <p className="font-semibold text-rose-400">¿Estás seguro? Al eliminar, se realizará lo siguiente de forma inmediata:</p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                <li>Se purgará permanentemente la dirección de email de <strong>Firebase Authentication</strong>.</li>
                <li>Se eliminará su perfil de usuario en la base de datos Firestore.</li>
                <li>Se destruirán todas sus predicciones guardadas para siempre.</li>
                <li>Se removerá su membresía de todos los grupos del Prode.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/15 transition-colors cursor-pointer"
              >
                Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE GROUP CUSTOM MODAL (COMPATIBLE WITH IFRAME) */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/25">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Confirmar Eliminación de Grupo</h3>
                <p className="text-[10px] text-rose-400 font-mono">Esta acción eliminará el grupo de Firebase permanentemente</p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl space-y-1 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Grupo seleccionado para eliminar:</p>
              <p className="text-sm font-black text-rose-300">{groupToDelete.name}</p>
              <p className="text-xs text-slate-400 font-mono">ID: {groupToDelete.id}</p>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
              <p className="font-semibold text-rose-400">¿Estás seguro? Al eliminar la liga:</p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                <li>Se purgará permanentemente la liga/grupo de la base de datos Firestore.</li>
                <li>Los {groupToDelete.memberIds?.length || 0} miembros asignados perderán el acceso a esta liga de forma instantánea.</li>
                <li>El código de invitación <strong>{groupToDelete.inviteCode}</strong> quedará inhabilitado de inmediato.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-705 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGroup(groupToDelete.id);
                  setGroupToDelete(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/15 transition-colors cursor-pointer"
              >
                Eliminar Grupo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
