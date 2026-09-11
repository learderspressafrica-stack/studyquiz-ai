'use client';

import React, { useState } from 'react';

export default function DevoirsReferencesPage() {
  const [refText, setRefText] = useState('');
  const [fileName, setFileName] = useState('');
  const [frequency, setFrequency] = useState<'semaine' | 'mois'>('semaine');
  const [loading, setLoading] = useState(false);
  const [homework, setHomework] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type === 'application/pdf') {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) setRefText(data.text);
      } catch (err) {
        alert("Erreur lors du chargement du fichier.");
      }
    } else {
      setRefText(`Fichier chargé : ${file.name}`);
    }
  };

  const handleGenerateHomework = async () => {
    if (!refText.trim()) return alert("Veuillez importer ou coller un sujet de référence.");

    setLoading(true);
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Génère un devoir de référence basé sur le document suivant avec une fréquence (${frequency}) :\n${refText}`
        }),
      });

      const result = await res.json();
      setHomework(result);
    } catch (err: any) {
      alert("Erreur lors de la génération du devoir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto text-slate-100 font-sans">
      <h1 className="text-2xl font-bold text-blue-400 mb-6">📚 Devoirs & Sujets de Référence</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <label className="block text-xs font-semibold text-slate-400 mb-2">
          Importer un document de référence (PDF, Sujet d'examen, Photo) :
        </label>

        {/* Bouton d'importation mobile / desktop */}
        <div className="flex items-center gap-4 mb-4">
          <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition">
            📁 Importer depuis le téléphone / PC
            <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          {fileName && <span className="text-xs text-slate-400">📄 {fileName}</span>}
        </div>

        <textarea
          value={refText}
          onChange={(e) => setRefText(e.target.value)}
          placeholder="Le texte extrait de votre document de référence s'affichera ici..."
          className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none mb-4"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Fréquence :</span>
            <select
              value={frequency}
              onChange={(e: any) => setFrequency(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2 rounded-xl"
            >
              <option value="semaine">Hebdomadaire (Par semaine)</option>
              <option value="mois">Mensuel (Par mois)</option>
            </select>
          </div>

          <button
            onClick={handleGenerateHomework}
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
          >
            {loading ? "Génération..." : "⚡ Générer le Devoir de Référence"}
          </button>
        </div>
      </div>

      {/* Affichage du devoir généré */}
      {homework && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-3">📝 Sujet du Devoir Généré</h2>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
            {homework.summary}
          </p>
        </div>
      )}
    </div>
  );
}