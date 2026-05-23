/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Group, User, Match, GroupPredictionStore, ExtrasPrediction } from '../types';
import { getRankedUsersInGroup } from '../utils/tiebreakers';
import {
  Users,
  PlusCircle,
  Hash,
  Share2,
  Copy,
  Mail,
  Send,
  LogOut,
  Trash2,
  Check,
  Smartphone,
  ExternalLink,
  X,
  Edit3
} from 'lucide-react';

interface MyGroupsProps {
  groups: Group[];
  currentUser: User;
  usersMap: Record<string, User>;
  onJoinGroup: (code: string) => void;
  onCreateGroup: (name: string, requiresApproval: boolean) => void;
  onExitGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onSelectGroup: (groupId: string) => void;
  activeGroupId: string | null;
  isGroupCreationLocked: boolean;
  onUpdateNickname: (newName: string) => void;
  predictionsStore: Record<string, Record<string, GroupPredictionStore>>;
  matches: Match[];
  actualExtras: ExtrasPrediction;
}

export default function MyGroups({
  groups,
  currentUser,
  usersMap,
  onJoinGroup,
  onCreateGroup,
  onExitGroup,
  onDeleteGroup,
  onSelectGroup,
  activeGroupId,
  isGroupCreationLocked,
  onUpdateNickname,
  predictionsStore,
  matches,
  actualExtras
}: MyGroupsProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [reqApproval, setReqApproval] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  const [groupToLeaveId, setGroupToLeaveId] = useState<string | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState('');

  // Filter groups where current user is a helper/member
  const userGroups = groups.filter((g) => g.memberIds.includes(currentUser.id));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGroupCreationLocked) {
      alert('La creación de grupos está bloqueada actualmente (Fecha de cierre alcanzada o superada).');
      return;
    }
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), reqApproval);
    setNewGroupName('');
    setReqApproval(false);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGroupCreationLocked) {
      alert('Unirte a grupos está bloqueado actualmente.');
      return;
    }
    if (!joinCodeInput.trim()) return;
    onJoinGroup(joinCodeInput.trim().toUpperCase());
    setJoinCodeInput('');
  };

  const copyToClipboard = (text: string, groupId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(groupId);
    setTimeout(() => {
      setCopiedCodeId(null);
    }, 2000);
  };

  const getShareLink = (code: string) => {
    return `${window.location.origin}?invite=${code}`;
  };

  return (
    <div className="space-y-8 animate-fade-in text-white">
      {/* Profile / Nickname Editor Panel */}
      <div className="bg-gradient-to-r from-sky-950/40 to-slate-900/60 backdrop-blur-md rounded-2xl border border-sky-400/20 p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center font-bold text-sky-300 text-lg">
            👤
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Tu Identificador</div>
            <div className="text-slate-200 text-xs font-mono">{currentUser.email}</div>
          </div>
        </div>

        <div className="flex-1 max-w-sm w-full">
          {isEditingNickname ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (tempNickname.trim()) {
                  onUpdateNickname(tempNickname.trim());
                  setIsEditingNickname(false);
                }
              }}
              className="flex items-center gap-2 w-full"
            >
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  className="w-full bg-slate-950 border border-sky-400 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
                  placeholder="Tu apodo / nombre..."
                  maxLength={30}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="Guardar apodo"
              >
                <Check className="w-3.5 h-3.5" /> <span>Guardar</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingNickname(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer shrink-0"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-4 bg-slate-950/40 rounded-xl px-3 py-2.5 border border-slate-800/80">
              <div className="truncate flex-1">
                <span className="text-[9px] font-mono uppercase text-slate-450 block">Tu Apodo de Competidor</span>
                <span className="font-extrabold text-sm text-[#74ACDF] truncate block">{currentUser.name}</span>
              </div>
              <button
                onClick={() => {
                  setTempNickname(currentUser.name);
                  setIsEditingNickname(true);
                }}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-400/30 text-sky-400 hover:text-sky-300 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Edit3 className="w-3 h-3" /> Editar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upper Grid: Create / Join Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Create Group Box */}
        <div className="bg-slate-900/45 backdrop-blur-md rounded-2xl border border-sky-500/20 p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sky-400 border-b border-slate-800 pb-3">
            <PlusCircle className="w-5 h-5" />
            <h3 className="font-bold font-sans text-sm md:text-base uppercase tracking-wider text-white">Crear Nuevo Grupo Privado</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono tracking-wider text-slate-500 block mb-1 uppercase">Nombre del Grupo</label>
              <input
                type="text"
                disabled={isGroupCreationLocked}
                placeholder="Ej. Amigos de la AFA, Oficina 2026..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm p-2.5 rounded-xl font-semibold focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
            </div>

            {/* Requires Approval Checkbox option */}
            <div className="flex items-start gap-2 pt-1 pb-1">
              <input
                id="reqApprovalCheckbox"
                type="checkbox"
                checked={reqApproval}
                onChange={(e) => setReqApproval(e.target.checked)}
                disabled={isGroupCreationLocked}
                className="mt-0.5 rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="reqApprovalCheckbox" className="text-xs text-slate-350 cursor-pointer leading-tight select-none">
                <span className="font-semibold text-slate-250 block">Requiere aprobación del creador</span>
                Los nuevos usuarios ingresando con código quedarán en una lista de espera hasta que los apruebes.
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isGroupCreationLocked || !newGroupName.trim()}
              className="w-full p-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:hover:bg-sky-500 font-extrabold text-xs uppercase text-slate-950 tracking-wider rounded-xl transition-all"
            >
              {isGroupCreationLocked ? 'Creación Bloqueada' : 'Crear Grupo e Invitar'}
            </button>
            {isGroupCreationLocked && (
              <p className="text-[10px] font-mono text-rose-400 text-center uppercase tracking-wide">La fecha límite de creación o ingreso expiró</p>
            )}
          </form>
        </div>

        {/* Join Group Box */}
        <div className="bg-slate-900/45 backdrop-blur-md rounded-2xl border border-sky-500/20 p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sky-400 border-b border-slate-800 pb-3">
            <Hash className="w-5 h-5" />
            <h3 className="font-bold font-sans text-sm md:text-base uppercase tracking-wider text-white">Unirse Mediante Código</h3>
          </div>

          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono tracking-wider text-slate-500 block mb-1 uppercase">Código de Invitación</label>
              <input
                type="text"
                disabled={isGroupCreationLocked}
                placeholder="Ej. CODE1MX9A"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm p-2.5 rounded-xl font-mono text-center uppercase tracking-wide focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isGroupCreationLocked || !joinCodeInput.trim()}
              className="w-full p-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 disabled:hover:bg-yellow-400 text-xs font-black uppercase text-slate-950 tracking-wider rounded-xl transition-all"
            >
              Unirse al Grupo
            </button>
          </form>
        </div>

      </div>

      {/* Main List: "Mis Grupos" */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            Mis Grupos Competitivos ({userGroups.length})
          </h3>
          <span className="text-xs text-sky-400 font-semibold font-mono animate-pulse">
            ★ Pestaña Visible a Todos ★
          </span>
        </div>

        {userGroups.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 backdrop-blur rounded-2xl border border-slate-850">
            <Users className="w-10 h-10 mx-auto text-slate-650 opacity-40 mb-3" />
            <p className="text-slate-400 text-sm mb-1 font-semibold">No participás de ningún grupo todavía.</p>
            <p className="text-slate-500 text-xs text-center pr-4 pl-4">¡Creá tu propio grupo o ingresá el código que te compartieron tus amigos para comenzar la competencia!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userGroups.map((g) => {
              const isOwner = g.ownerId === currentUser.id;
              const ownerObj = usersMap[g.ownerId];
              
              // Calculate live total points for current user in this group
              const groupRanks = getRankedUsersInGroup(
                g.memberIds,
                usersMap,
                g.id,
                predictionsStore,
                matches,
                actualExtras
              );
              const currentUserRank = groupRanks.find(r => r.userId === currentUser.id);
              const score = currentUserRank ? currentUserRank.totalPoints : 0;
              
              const directShareText = `¡Sumate a mi grupo de Prode Mundial 2026!\nGrupo: ${g.name}\nCódigo: ${g.inviteCode}\nEnlace para ingresar: ${getShareLink(g.inviteCode)}`;

              return (
                <div
                  key={g.id}
                  className={`p-5 rounded-2xl border shadow-xl flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                    activeGroupId === g.id
                      ? 'bg-gradient-to-br from-slate-905 via-sky-950/20 to-slate-900 border-sky-400/50 ring-2 ring-sky-505/20'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div
                      onClick={() => onSelectGroup(g.id)}
                      className="cursor-pointer space-y-1 group flex-1"
                    >
                      <h4 className="text-base font-extrabold text-white group-hover:text-sky-300 transition-colors flex items-center gap-2">
                        {g.name}
                        {activeGroupId === g.id && (
                          <span className="px-2 py-0.5 bg-sky-500 text-slate-950 rounded-full font-bold text-[9px] uppercase tracking-wide">
                            Activo
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Administrador: <strong className="text-slate-300">{ownerObj ? ownerObj.name : 'Desconocido'}</strong>
                      </p>
                      <p className="text-xs text-slate-400">
                        Miembros: <span className="text-sky-400 font-bold">{g.memberIds.length} competidores</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Mis Puntos</span>
                      <span className="text-2xl font-black text-sky-400 font-mono tracking-tight">{score}pts</span>
                    </div>
                  </div>

                  {/* Share & Code utility. Styled in 2 rows on mobile layout optimized */}
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Cód. Invitación</span>
                      <span className="text-xs font-mono font-bold text-sky-300">{g.inviteCode}</span>
                    </div>
                    
                    {/* Share action buttons row */}
                    {/* Responsive adjustment: 2 rows with neat icons to save spacing on mobile devices */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/40">
                      {/* Copy Code Button */}
                      <button
                        onClick={() => copyToClipboard(g.inviteCode, g.id)}
                        className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-bold text-slate-300 transition-colors"
                        title="Copiar Código"
                      >
                        {copiedCodeId === g.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Código
                          </>
                        )}
                      </button>

                      {/* WhatsApp Share Button */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(directShareText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-bold text-slate-300 transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
                      </a>

                      {/* Email Share Button */}
                      <a
                        href={`mailto:?subject=${encodeURIComponent(`Invitación a Prode Mundial: ${g.name}`)}&body=${encodeURIComponent(directShareText)}`}
                        className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-bold text-slate-300 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-sky-400" /> E-mail
                      </a>
                    </div>
                  </div>

                  {/* Actions Drawer Footer: structured on two rows on mobile */}
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap pt-2 border-t border-slate-800/40 w-full">
                    {groupToDeleteId === g.id ? (
                      <div className="w-full flex items-center justify-between bg-rose-950/40 border border-rose-500/30 rounded-xl px-3 py-2 gap-2 animate-fade-in">
                        <span className="text-[10px] md:text-xs text-rose-300 font-bold">¿Eliminar el grupo para todos?</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onDeleteGroup(g.id);
                              setGroupToDeleteId(null);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer shrink-0"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            onClick={() => setGroupToDeleteId(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase rounded-lg transition-all cursor-pointer shrink-0"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : groupToLeaveId === g.id ? (
                      <div className="w-full flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 gap-2 animate-fade-in">
                        <span className="text-[10px] md:text-xs text-slate-300 font-bold">¿Querés salir del grupo?</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onExitGroup(g.id);
                              setGroupToLeaveId(null);
                            }}
                            className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black text-[10px] uppercase rounded-lg transition-all cursor-pointer shrink-0"
                          >
                            Sí, salir
                          </button>
                          <button
                            onClick={() => setGroupToLeaveId(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase rounded-lg transition-all cursor-pointer shrink-0"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onSelectGroup(g.id)}
                          className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs uppercase rounded-xl transition-all tracking-wider text-center"
                        >
                          Ingresar al Prode
                        </button>

                        {(isOwner || currentUser.isAdmin) && (
                          <button
                            onClick={() => {
                              setGroupToDeleteId(g.id);
                              setGroupToLeaveId(null);
                            }}
                            className="p-2.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-400 hover:text-white rounded-xl transition-all cursor-pointer"
                            title={currentUser.isAdmin && !isOwner ? "Eliminar Grupo (Admin)" : "Eliminar Grupo"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {(!isOwner || currentUser.isAdmin) && (
                          <button
                            onClick={() => {
                              setGroupToLeaveId(g.id);
                              setGroupToDeleteId(null);
                            }}
                            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                            title="Salir del Grupo"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending requested groups list */}
      {groups.filter((g) => g.pendingMemberIds?.includes(currentUser.id)).length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h4 className="text-sm md:text-base font-bold text-yellow-500 tracking-wider uppercase flex items-center gap-2">
            <span className="animate-pulse">⏳</span>
            Solicitudes de Ingreso en Espera ({groups.filter((g) => g.pendingMemberIds?.includes(currentUser.id)).length})
          </h4>
          <p className="text-xs text-slate-400 leading-normal">
            Te postulaste con código a estos grupos. Aparecerán en tu lista principal tan pronto como sus creadores aprueben tu solicitud.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups
              .filter((g) => g.pendingMemberIds?.includes(currentUser.id))
              .map((g) => {
                const ownerObj = usersMap[g.ownerId];
                return (
                  <div key={g.id} className="p-4 bg-slate-950/40 rounded-xl border border-yellow-500/15 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm truncate">{g.name}</h4>
                      <p className="text-xs text-slate-400">
                        Administrador: <span className="text-slate-300 font-medium">{ownerObj ? ownerObj.name : 'Desconocido'}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Código: <span className="font-mono text-sky-300 font-bold bg-sky-950/30 px-1.5 py-0.5 rounded border border-sky-500/10 text-[10.5px]">{g.inviteCode}</span>
                      </p>
                    </div>
                    <div className="bg-yellow-950/20 border border-yellow-500/10 rounded-lg py-1.5 text-center">
                      <span className="text-[10px] uppercase font-extrabold tracking-wide text-yellow-400">Esperando Aprobación</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
