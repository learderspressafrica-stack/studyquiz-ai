'use client';

import React, { useState } from 'react';

export default function WorkspacePage() {
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);

  // Direct PDF Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setExtracting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur d'extraction du PDF.");

      setInputText(result.text); // Mise à jour explicite du texte
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setExtracting(false);
    }
  };

  // Generation Request
  const handleGenerate = async () => {
    setErrorMsg('');
    
    // S'assurer que le texte n'est pas vide
    if (!inputText || !inputText.trim()) {
      setErrorMsg("Aucun texte fourni pour la génération. Veuillez coller un cours ou importer un fichier.");
      return;
    }

    setLoading(true);
    setShowResults(false);
    setUserAnswers({});

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputText }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur lors de la génération.");

      setData(result);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAudioSummary = () => {
    if (!data?.summary) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(data.summary);
      utterance.lang = 'fr-FR';
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
        <h2 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
          📥 Saisie de Cours / Importation PDF / Photo
        </h2>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Le contenu de votre cours ou document importé s'affichera ici..."
          className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm focus:outline-none focus:border-blue-500 resize-none mb-4"
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition">
              📄 Importer un PDF
              <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            </label>

            {fileName && (
              <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                📄 {fileName} {extracting && "(Extraction...)"}
              </span>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || extracting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg"
          >
            {loading ? "Génération en cours..." : "⚡ Générer Fiche & Exercices"}
          </button>
        </div>
      </div>

      {/* Message d'erreur dynamique */}
      {errorMsg && (
        <div className="p-4 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl text-xs font-semibold mb-6 flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Affichage des Résultats */}
      {data && (
        <div className="space-y-6">
          {/* Résumé & Audio */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-emerald-400">📖 Résumé du Cours</h3>
              <button
                onClick={toggleAudioSummary}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl"
              >
                {isPlayingAudio ? "⏹ Arrêter l'Audio" : "🔊 Écouter le Résumé Audio"}
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              {data.summary}
            </p>
          </div>

          {/* Exemples du Monde Réel */}
          {data.realWorldExamples && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-md font-bold text-amber-400 mb-3">💡 Explications & Exemples Réels</h3>
              <ul className="space-y-2">
                {data.realWorldExamples.map((ex: string, idx: number) => (
                  <li key={idx} className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    • {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quiz (5+ QCM) */}
          {data.quiz && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-md font-bold text-blue-400 mb-4">📝 Quiz d'Évaluation ({data.quiz.length} Questions)</h3>
              <div className="space-y-4">
                {data.quiz.map((q: any, qIdx: number) => (
                  <div key={qIdx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <p className="text-xs font-semibold mb-3">{qIdx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt: string, oIdx: number) => (
                        <button
                          key={oIdx}
                          onClick={() => setUserAnswers({ ...userAnswers, [qIdx]: oIdx })}
                          className={`p-2.5 text-left text-xs rounded-lg border transition ${
                            userAnswers[qIdx] === oIdx ? 'bg-blue-900/60 border-blue-500 text-blue-200' : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}