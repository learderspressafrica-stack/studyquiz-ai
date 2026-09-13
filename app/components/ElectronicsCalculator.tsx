import React, { useState } from 'react';

export default function ElectronicCalculator() {
  const [calcMode, setCalcMode] = useState<'standard' | 'ohm' | 'divider' | 'resistors'>('standard');

  // États pour la calculatrice standard
  const [display, setDisplay] = useState('0');

  // États pour la Loi d'Ohm (U = R * I)
  const [ohmVoltage, setOhmVoltage] = useState('');
  const [ohmCurrent, setOhmCurrent] = useState('');
  const [ohmResistance, setOhmResistance] = useState('');

  // États pour le Pont Diviseur de Tension (Us = Ue * R2 / (R1 + R2))
  const [ue, setUe] = useState('');
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');

  // Fonctions de calcul électronique sécurisées
  const calculateOhm = (target: 'U' | 'I' | 'R') => {
    const v = parseFloat(ohmVoltage);
    const i = parseFloat(ohmCurrent);
    const r = parseFloat(ohmResistance);

    if (target === 'U' && !isNaN(i) && !isNaN(r)) return (i * r).toFixed(2) + ' V';
    if (target === 'I' && !isNaN(v) && !isNaN(r) && r !== 0) return (v / r).toFixed(2) + ' A';
    if (target === 'R' && !isNaN(v) && !isNaN(i) && i !== 0) return (v / i).toFixed(2) + ' Ω';
    return 'Entrées invalides';
  };

  const calculateDivider = () => {
    const voltageIn = parseFloat(ue);
    const res1 = parseFloat(r1);
    const res2 = parseFloat(r2);
    if (!isNaN(voltageIn) && !isNaN(res1) && !isNaN(res2) && (res1 + res2) !== 0) {
      const us = voltageIn * (res2 / (res1 + res2));
      return us.toFixed(2) + ' V';
    }
    return '0.00 V';
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto py-4 select-none">
      <div>
        <h2 className="text-xl font-bold text-white">Calculatrice Électronique & Standard</h2>
        <p className="text-xs text-slate-400">Effectuez vos calculs mathématiques et vos dimensions de circuits.</p>
      </div>

      {/* Sélecteur de mode */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setCalcMode('standard')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${calcMode === 'standard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Standard
        </button>
        <button
          onClick={() => setCalcMode('ohm')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${calcMode === 'ohm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Loi d'Ohm
        </button>
        <button
          onClick={() => setCalcMode('divider')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${calcMode === 'divider' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Diviseur
        </button>
      </div>

      {/* Mode Standard */}
      {calcMode === 'standard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="bg-slate-950 p-4 rounded-xl text-right text-2xl font-mono text-white border border-slate-800">
            {display}
          </div>
          <div className="grid grid-cols-4 gap-2 text-sm">
            {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === '=') {
                    try {
                      // Évaluation sécurisée simple ou remplacement des symboles
                      const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/');
                      setDisplay(eval(sanitized).toString());
                    } catch {
                      setDisplay('Erreur');
                    }
                  } else if (display === '0' || display === 'Erreur') {
                    setDisplay(btn);
                  } else {
                    setDisplay(display + btn);
                  }
                }}
                className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-all"
              >
                {btn}
              </button>
            ))}
            <button
              onClick={() => setDisplay('0')}
              className="col-span-4 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 font-semibold py-2 rounded-xl transition-all text-xs"
            >
              Effacer (C)
            </button>
          </div>
        </div>
      )}

      {/* Mode Loi d'Ohm */}
      {calcMode === 'ohm' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-amber-400">Loi d'Ohm ($U = R \times I$)</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Tension U (Volts) - Laissez vide pour calculer</label>
              <input
                type="number"
                value={ohmVoltage}
                onChange={(e) => setOhmVoltage(e.target.value)}
                placeholder="ex: 12"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Courant I (Ampères) - Laissez vide pour calculer</label>
              <input
                type="number"
                value={ohmCurrent}
                onChange={(e) => setOhmCurrent(e.target.value)}
                placeholder="ex: 0.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Résistance R (Ohms) - Laissez vide pour calculer</label>
              <input
                type="number"
                value={ohmResistance}
                onChange={(e) => setOhmResistance(e.target.value)}
                placeholder="ex: 24"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-slate-400 text-[11px] block">Résultat du calcul :</span>
              <span className="text-lg font-bold text-blue-400">
                {!ohmVoltage ? `U = ${calculateOhm('U')}` : !ohmCurrent ? `I = ${calculateOhm('I')}` : `R = ${calculateOhm('R')}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mode Pont Diviseur de Tension */}
      {calcMode === 'divider' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-amber-400">Pont Diviseur de Tension (Us = Ue &times; R₂ / (R₁ + R₂))</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Tension d'entrée Ue (V)</label>
              <input
                type="number"
                value={ue}
                onChange={(e) => setUe(e.target.value)}
                placeholder="ex: 9"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Résistance R₁ (Ω)</label>
                <input
                  type="number"
                  value={r1}
                  onChange={(e) => setR1(e.target.value)}
                  placeholder="ex: 1000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Résistance R₂ (Ω)</label>
                <input
                  type="number"
                  value={r2}
                  onChange={(e) => setR2(e.target.value)}
                  placeholder="ex: 1000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-slate-400 text-[11px] block">Tension de sortie Us :</span>
              <span className="text-lg font-bold text-blue-400">{calculateDivider()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}