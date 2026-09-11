'use client';

import React, { useState } from 'react';

export default function DevoirsReferencesSection() {
  const [refContent, setRefContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [frequency, setFrequency] = useState<'semaine' | 'mois'>('semaine');

  // Importation directe de PDF ou Image/Photo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsExtracting(true);

    if (file.type === 'application/pdf') {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok && data.text) {
          setRefContent(data.text);
        } else {
          alert(data.error || "Erreur lors de l'extraction du PDF.");
        }
      } catch (err) {
        alert("Impossible de lire le fichier PDF.");
      } finally {
        setIsExtracting(false);
      }
    } else {
      // Pour les photos / images
      setRefContent(`[Document Image/Photo chargé : ${file.name}]`);
      setIsExtracting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100">
      <h2 className="text-lg font-bold text-blue-400 mb-4">
        📚 Devoirs & Sujets de Référence
      </h2>

      {/* Zone d'importation direct depuis Téléphone / PC */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2">
          📁 Importer un Devoir / PDF / Photo
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {fileName && (
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            📄 {fileName} {isExtracting && "(Extraction en cours...)"}
          </span>
        )}
      </div>

      {/* Zone d'affichage du texte du devoir de référence */}
      <textarea
        value={refContent}
        onChange={(e) => setRefContent(e.target.value)}
        placeholder="Le sujet ou document de référence importé s'affichera ici..."
        className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none mb-4"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Fréquence d'évaluation :</span>
          <select
            value={frequency}
            onChange={(e: any) => setFrequency(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg"
          >
            <option value="semaine">Par semaine (Hebdomadaire)</option>
            <option value="mois">Par mois (Mensuel)</option>
          </select>
        </div>

        <button
          onClick={() => alert("Génération du devoir lancée !")}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
        >
          ⚡ Générer l'Évaluation
        </button>
      </div>
    </div>
  );
}