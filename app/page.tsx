'use client';

import React, { useState } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface CourseData {
  title: string;
  summary: string;
  realWorldExamples: string[];
  componentsToIllustrate: string[];
  quiz: QuizQuestion[];
  qna: { question: string; answer: string }[];
}

export default function SamnoteWorkspace() {
  // Matière active
  const [activeSubject, setActiveSubject] = useState('Électricité');
  
  // Barre de recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string | null>(null);

  // Saisie et import
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Données générées
  const [data, setData] = useState<CourseData | null>(null);

  // Gestion Audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Gestion Réponses Quiz
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  // Importation PDF / Photo
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
        const result = await res.json();
        if (res.ok && result.text) setInputText(result.text);
      } catch (err) {
        alert("Erreur lors de l'extraction du PDF.");
      } finally {
        setIsExtracting(false);
      }
    } else {
      setInputText(`[Contenu extrait de la photo : ${file.name}]`);
      setIsExtracting(false);
    }
  };

  // Génération IA
  const handleGenerate = async () => {
    if (!inputText.trim()) return alert("Veuillez saisir du texte ou importer un fichier.");
    setIsGenerating(true);
    setSubmittedQuiz(false);
    setUserAnswers({});

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Matière : ${activeSubject}\n${inputText}` }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Lecture Audio
  const toggleAudio = () => {
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

  // Recherche rapide
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchResults(`Explication détaillée pour "${searchQuery}" dans la matière ${activeSubject} : Concept clé, fonctionnement et applications pratiques.`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-slate-100 font-sans">
      
      {/* 1. Barre de Recherche Globale */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Rechercher une explication, un composant (ex: Transistor, Loi d'Ohm)..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-xl transition">
            Rechercher
          </button>
        </div>
        {searchResults && (
          <div className="mt-3 p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-xs text-blue-200">
            {searchResults}
          </div>
        )}
      </form>

      {/* 2. Zone de Saisie & Importation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
        <h2 className="text-md font-bold text-blue-400 mb-3">
          📥 Saisie / Importation PDF ou Photo ({activeSubject})
        </h2>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Collez votre cours ou importez une photo / PDF..."
          className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none mb-4"
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition">
              📄 Importer PDF / Photo
              <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            {fileName && <span className="text-xs text-slate-400">📄 {fileName} {isExtracting && "(Lecture...)"}</span>}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || isExtracting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
          >
            {isGenerating ? "Traitement..." : "⚡ Générer Fiche, Audio & Quiz"}
          </button>
        </div>
      </div>

      {/* 3. Résultats de Génération */}
      {data && (
        <div className="space-y-6">
          
          {/* Résumé & Bouton Audio */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-bold text-emerald-400">📖 Résumé du Cours</h3>
              <button
                onClick={toggleAudio}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2"
              >
                {isPlayingAudio ? "⏹ Arrêter l'Audio" : "🔊 Écouter le Résumé Audio"}
              </button>
            </div>
            <p className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
              {data.summary}
            </p>
          </div>

          {/* Explications & Visuels de composants réels */}
          {data.componentsToIllustrate && data.componentsToIllustrate.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-md font-bold text-amber-400 mb-3">🖼️ Composants & Explications Réelles</h3>
              <div className="flex flex-wrap gap-4">
                {data.componentsToIllustrate.map((comp, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center min-w-[140px]">
                    <img
                      src={`https://source.unsplash.com/featured/200x150/?${encodeURIComponent(comp)},electronics`}
                      alt={comp}
                      className="w-32 h-24 object-cover rounded-lg mx-auto mb-2 bg-slate-900"
                      onError={(e: any) => { e.target.src = "https://via.placeholder.com/150?text=" + comp; }}
                    />
                    <span className="text-xs font-semibold text-slate-200">{comp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz de 2 à 10 questions avec Code Couleur (Vert / Rouge / Jaune) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-md font-bold text-blue-400 mb-4">
              📝 Quiz d'Évaluation ({data.quiz.length} Questions)
            </h3>

            <div className="space-y-6">
              {data.quiz.map((q, qIdx) => (
                <div key={qIdx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs font-semibold mb-3">{qIdx + 1}. {q.question}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = userAnswers[qIdx] === oIdx;
                      const isCorrect = q.correctIndex === oIdx;

                      // Styles conditionnels selon l'état de validation
                      let btnStyle = "bg-slate-900 border-slate-800 text-slate-300";

                      if (submittedQuiz) {
                        if (isSelected && isCorrect) {
                          // Bonne réponse choisie -> VERT
                          btnStyle = "bg-emerald-600 border-emerald-500 text-white font-bold";
                        } else if (isSelected && !isCorrect) {
                          // Mauvaise réponse choisie -> ROUGE
                          btnStyle = "bg-red-600 border-red-500 text-white font-bold";
                        } else if (!isSelected && isCorrect) {
                          // La bonne réponse à révéler -> JAUNE
                          btnStyle = "bg-amber-400 border-amber-300 text-slate-950 font-bold";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-blue-900/60 border-blue-500 text-blue-200";
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={submittedQuiz}
                          onClick={() => setUserAnswers({ ...userAnswers, [qIdx]: oIdx })}
                          className={`p-3 text-left text-xs rounded-xl border transition ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              {!submittedQuiz ? (
                <button
                  onClick={() => setSubmittedQuiz(true)}
                  disabled={Object.keys(userAnswers).length === 0}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Valider le Quiz
                </button>
              ) : (
                <button
                  onClick={() => { setSubmittedQuiz(false); setUserAnswers({}); }}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Recommencer
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}