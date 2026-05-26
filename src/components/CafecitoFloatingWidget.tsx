import React, { useState } from 'react';
import { Coffee, X, Copy, Check, Heart, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CafecitoFloatingWidgetProps {
  cafecitoUsername: string;
  mpAlias: string;
  mpCvu?: string;
  enabled: boolean;
}

export default function CafecitoFloatingWidget({
  cafecitoUsername = 'rodrigos',
  mpAlias = 'prodeonline-rs.mp',
  enabled = true
}: CafecitoFloatingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [aliasCopied, setAliasCopied] = useState(false);

  if (!enabled) return null;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAliasCopied(true);
      setTimeout(() => setAliasCopied(false), 2000);
    } catch (err) {
      console.error('No se pudo copiar el texto: ', err);
    }
  };

  const cafecitoUrl = `https://cafecito.app/${cafecitoUsername.trim()}`;

  return (
    <>
      {/* Floating Button */}
      <div id="cafecito-trigger-btn" className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-[45] font-sans">
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs md:text-sm rounded-full shadow-lg shadow-amber-550/20 shadow-slate-950/40 border border-amber-400/30 transition-all cursor-pointer group"
          title="Colaborar con el Prode ☕"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
          </span>
          <Coffee className="w-4 h-4 text-slate-950 animate-bounce" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-[130px] md:group-hover:max-w-[130px] transition-all duration-300 ease-out whitespace-nowrap font-bold">
            Apoyar Prode ☕
          </span>
          <span className="md:inline group-hover:hidden transition-all text-[11px] font-sans">Apoyar Prode</span>
        </motion.button>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-sans">
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left"
            >
              {/* Header Badge & Close Button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Decorative top header banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 p-6 pt-8 border-b border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow-lg shadow-amber-500/10">
                  <Coffee className="w-7 h-7 font-black animate-pulse" />
                </div>
                <div>
                  <h4 className="text-white font-black text-lg flex items-center gap-1.5 uppercase tracking-wide">
                    ¿Te copa el Prode? ☕
                  </h4>
                  <span className="text-[10.5px] font-mono text-amber-400 font-bold uppercase tracking-widest block">Ayudanos a seguir mejorándolo</span>
                </div>
              </div>

              {/* Description Body */}
              <div className="p-6 space-y-5 text-xs text-slate-300 leading-relaxed font-sans">
                <p>
                  Si disfrutás el Mundial con amigos y grupos, podés colaborar con un cafecito o una transferencia. 💙
                </p>

                <div className="text-[11px] font-sans py-2 px-3.5 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-200 flex items-start gap-2 leading-relaxed">
                  <Heart className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <span>
                    💛 Cada aporte ayuda un montón. ¡Gracias por bancar el proyecto!
                  </span>
                </div>

                {/* Option 1: Cafecito.app Button */}
                <div className="space-y-2">
                  <p className="font-bold text-white uppercase text-[10px] tracking-wider font-mono text-slate-400">Opción 1: Cafecito (Mercado Pago / Tarjeta)</p>
                  <a
                    href={cafecitoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 bg-[#FFDF00] hover:bg-[#FFE533] text-slate-950 flex items-center justify-center gap-2 rounded-xl transition-all font-sans font-black text-sm uppercase shadow-md shadow-yellow-500/15 cursor-pointer"
                  >
                    <span>☕</span> Enviar Cafecito
                    <ExternalLink className="w-4 h-4 text-slate-950" />
                  </a>
                </div>

                {/* Option 2: MP Alias */}
                <div className="space-y-3 pt-1 border-t border-slate-800">
                  <p className="font-bold text-white uppercase text-[10px] tracking-wider font-mono text-slate-400">Opción 2: Transferencia Directa (Alias)</p>
                  
                  {/* Alias Field */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10.5px] font-semibold text-slate-400">
                      <span>Alias de Mercado Pago</span>
                      {aliasCopied && <span className="text-emerald-400 font-bold font-sans">¡Copiado con éxito! ✅</span>}
                    </div>
                    <div className="flex bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-white text-xs font-black select-all select-text">{mpAlias}</span>
                      <button
                        onClick={() => handleCopy(mpAlias)}
                        className="p-1 px-2 border border-slate-700 bg-slate-900 hover:bg-slate-800/80 text-slate-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-bold text-[10.5px]"
                        title="Copiar Alias"
                      >
                        {aliasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Alias
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-850 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
