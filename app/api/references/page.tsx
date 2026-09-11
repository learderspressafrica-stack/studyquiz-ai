'use client';

import React, { useState } from 'react';

export default function ReferencesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | null>(null);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssignments, setGeneratedAssignments] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileType(type);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      alert("Veuillez sélectionner un fichier PDF ou une image de référence.");
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('frequency', frequency);

      // 1. Extraction du fichier
      const extractEndpoint = fileType === 'pdf' ? '/api/extract-pdf' : '/api/extract-image';
      const extractRes = await fetch(extractEndpoint, {
        method: 'POST',
        body: formData,
      });

      const extractData = await extractRes.json();

      if (!extractRes.ok) {
        throw new Error(extractData.error || "Erreur lors du traitement du fichier.");
      }

      // 2. Génération de la planification des devoirs/sujets via l'IA
      const generateRes = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Basé sur ce document de référence : "${extractData.text}". Génère un programme de devoirs et sujets d'évaluation sur une fréquence : ${frequency === 'weekly' ? 'Hebdomadaire (par semaine)' : 'Mensuelle (par mois)'}. Crée des exercices progressifs avec leurs corrigés.`,
        }),
      });

      const generateData = await generateRes.json();
      setGeneratedAssignments(generateData.text || generateData.result);
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-2">📚 Devoirs & Sujets de Référence</h1>
      <p className="text-slate-400 text-sm mb-6">
        Importez un programme, un cours ou une fiche de référence (PDF ou Photo) pour générer automatiquement un planning de devoirs récurrents.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Choix des fichiers */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3">
            1. Document de Référence (PDF ou Image)
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex-1 min-w-[200px] border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'pdf')}
              />
              <span className="text-2xl block mb-1">📄</span>
              <span className="text-xs text-slate-300 font-medium">Importer un PDF</span>
            </label>

            <label className="flex-1 min-w-[200px] border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'image')}
              />
              <span className="text-2xl block mb-1">🖼️</span>
              <span className="text-xs text-slate-300 font-medium">Importer une Photo</span>
            </label>
          </div>

          {file && (
            <p className="mt-3 text-xs text-emerald-400 flex items-center gap-1">
              ✓ Fichier sélectionné : <span className="font-semibold">{file.name}</span>
            </p>
          )}
        </div>

        {/* Sélection Fréquence */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3">
            2. Fréquence des Devoirs / Évaluations
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFrequency('weekly')}
              className={`p-3 rounded-xl border text-sm font-semibold transition ${
                frequency === 'weekly'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              📅 Par Semaine (Hebdomadaire)
            </button>
            <button
              type="button"
              onClick={() => setFrequency('monthly')}
              className={`p-3 rounded-xl border text-sm font-semibold transition ${
                frequency === 'monthly'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              📆 Par Mois (Mensuel)
            </button>
          </div>
        </div>

        {/* Bouton de génération */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !file}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-bold rounded-xl transition"
        >
          {isGenerating ? "Traitement et génération des devoirs..." : "⚡ Générer la Planification des Devoirs"}
        </button>
      </div>

      {/* Zone de résultat */}
      {generatedAssignments && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">📝 Programme de Devoirs Généré</h2>
          <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
            {generatedAssignments}
          </div>
        </div>
      )}
    </div>
  );
}