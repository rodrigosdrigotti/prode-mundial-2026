/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, ShieldCheck, Trophy, Target, Calendar, Users } from 'lucide-react';

export default function Regulation() {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-sky-500/20 p-6 md:p-8 text-slate-100 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
      {/* Background decorations matching the Argentine-Celeste atmosphere */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 border-b border-sky-500/20 pb-6 mb-8">
        <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
            Reglamento Oficial
          </h2>
          <p className="text-sky-400 font-mono text-xs">PRODE MUNDIAL 2026</p>
        </div>
      </div>

      <div className="space-y-8 text-sm md:text-base leading-relaxed text-slate-300">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Target className="w-5 h-5 text-sky-400" />
            <h3>1. Objetivo del Juego</h3>
          </div>
          <p className="pl-7">
            El objetivo de <strong className="text-white">Prode Mundial 2026</strong> es acumular la mayor cantidad de puntos posible prediciendo correctamente:
          </p>
          <ul className="list-disc pl-14 space-y-1 text-slate-300">
            <li>Los resultados de los partidos de la Copa del Mundo.</li>
            <li>Los desafíos y pronósticos extras que propone el juego.</li>
          </ul>
          <p className="pl-7 text-xs text-sky-300 italic">
            Los usuarios competirán amistosamente dentro de sus grupos cerrados o de forma general para alcanzar los primeros puestos del torneo.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Users className="w-5 h-5 text-sky-400" />
            <h3>2. Participación y Grupos Independientes</h3>
          </div>
          <p className="pl-7">
            Cada usuario deberá registrarse con una cuenta de correo electrónico válida. Cada cuenta corresponde a una única persona real.
          </p>
          <p className="pl-7">
            Los usuarios registrados podrán:
          </p>
          <ul className="list-disc pl-14 space-y-1 text-slate-300">
            <li>Crear grupos privados y personalizarlos.</li>
            <li>Unirse a otros de forma instantánea mediante un código de invitación o enlace compartible.</li>
            <li>Participar de manera simultánea en múltiples grupos de amigos, trabajo, familia, entreno o comunidades.</li>
          </ul>
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 ml-7">
            <h4 className="font-semibold text-sky-300 mb-1">Aclaración Importante</h4>
            <p className="text-xs md:text-sm text-slate-300">
              Cada grupo funciona de manera <strong className="text-white">totalmente independiente</strong>. Un mismo usuario puede participar en múltiples grupos y realizar predicciones diferentes en cada uno si lo desea. Los puntajes y pronósticos extras no se cruzan ni se comparten entre grupos.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Trophy className="w-5 h-5 text-sky-400" />
            <h3>3. Sistema de Puntaje por Partido</h3>
          </div>
          <p className="pl-7">
            Cada usuario deberá ingresar los goles que considera que anotará cada equipo en cada fase. De acuerdo a la predicción se otorga:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7 mt-2">
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
              <span className="font-bold text-sky-400 text-lg block">3 Puntos</span>
              <span className="text-slate-300 text-xs md:text-sm">Por predecir correctamente el ganador o empate del partido (Resultado correcto).</span>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
              <span className="font-bold text-sky-400 text-lg block">+2 Puntos Extra</span>
              <span className="text-slate-300 text-xs md:text-sm">Por predecir de forma exacta la cantidad de goles de ambos equipos (Marcador exacto).</span>
            </div>
          </div>
          <p className="pl-7 text-xs text-sky-300 font-mono">
            Ejemplo: Si tu pronóstico es 🇦🇷 Argentina 2 - 1 Japón 🇯🇵:
            <br />• Si termina 2 - 0: Sumás 3 puntos (ganador acertado).
            <br />• Si termina 2 - 1: Sumás 5 puntos (ganador acertado + marcador exacto de 2-1).
          </p>
          <p className="pl-7 font-semibold text-white">
            Puntaje máximo por partido: 5 puntos.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3>4. Puntajes Extras</h3>
          </div>
          <p className="pl-7">
            Se sumarán puntos adicionales por predecir las siguientes categorías de definición del campeonato:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-7 text-xs md:text-sm">
            <div className="bg-slate-800/40 p-3 rounded-lg border border-sky-500/10">
              <span className="text-emerald-400 font-bold">10 Puntos</span>
              <p className="text-white font-medium">Campeón Mundial</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-sky-500/10">
              <span className="text-sky-400 font-bold">5 Puntos</span>
              <p className="text-white font-medium">Goleador del Mundial</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-sky-500/10">
              <span className="text-sky-400 font-bold">5 Puntos</span>
              <p className="text-white font-medium">Figura del Mundial</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-sky-500/10">
              <span className="text-sky-400 font-bold">5 Puntos</span>
              <p className="text-white font-medium">Equipo Sorpresa</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-sky-500/10">
              <span className="text-sky-400 font-bold">5 Puntos</span>
              <p className="text-white font-medium">Equipo Decepción</p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h3>5. Desempates</h3>
          </div>
          <p className="pl-7">
            En caso de igualdad de puntos en la tabla de cualquier grupo, se resolverá de forma automática bajo el siguiente orden de prioridad:
          </p>
          <ol className="list-decimal pl-14 space-y-1 text-slate-300 text-xs md:text-sm">
            <li>Mayor cantidad de puntos totales acumulados en el grupo.</li>
            <li>Mayor cantidad de puntos obtenidos únicamente por pronósticos de partidos (resultado/marcador de partidos).</li>
            <li>Mayor cantidad de puntos obtenidos en los Pronósticos Extras.</li>
            <li>Mayor cantidad de puntos obtenidos en la fase de grupos del Mundial.</li>
            <li>Fecha de registro más antigua del usuario en el sistema.</li>
          </ol>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Calendar className="w-5 h-5 text-sky-400" />
            <h3>6. Actualización de Tabla e Independencia</h3>
          </div>
          <p className="pl-7">
            La tabla de posiciones de cada grupo privado se recalcula en tiempo real inmediatamente después de que el administrador ingrese un resultado oficial.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h3>7. Bloqueo de Pronósticos y Cierres</h3>
          </div>
          <p className="pl-7">
            El juego cuenta con bloqueos temporales e inalterables según el cronograma oficial argentino:
          </p>
          <div className="pl-7 space-y-4">
            <div className="border-l-2 border-amber-500 pl-4 py-1">
              <span className="text-amber-400 font-bold block text-sm">Cierre de Pronósticos de Fase de Grupos</span>
              <span className="text-white text-sm font-semibold">11 de junio de 2026 — 13:00 hs (Arg)</span>
              <p className="text-xs text-slate-400 mt-1">
                Posterior a este límite no se admiten modificaciones en partidos de fase de grupos, ni nuevos registros de predicciones grupales.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4 py-1">
              <span className="text-amber-400 font-bold block text-sm">Cierre de Creación de Grupos</span>
              <span className="text-white text-sm font-semibold">27 de junio de 2026 — 21:00 hs (Arg)</span>
              <p className="text-xs text-slate-400 mt-1">
                Límite final para crear o sumarse a nuevos grupos de amigos.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4 py-1">
              <span className="text-amber-400 font-bold block text-sm">Cierre de Pronósticos de Fase Eliminatoria</span>
              <span className="text-white text-sm font-semibold">28 de junio de 2026 — 13:00 hs (Arg)</span>
              <p className="text-xs text-slate-400 mt-1">
                Límite estricto para definir los pronósticos de octavos, cuartos, semifinales, tercer puesto y gran final. Todo quedará sellado para la definición.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
