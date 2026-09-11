'use client';

import React, { useState } from 'react';

interface QuizItem {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QAItem {
  question: string;
  answer: string;
}

interface ComponentIllustration {
  name: string;
  description: string;
  imagePrompt: string;
}

interface SearchResult {
  term: string;
  definition: string;
  howItWorks: string;
  characteristics: string[];
  imageUrl: string;
}

export default function SamnoteWorkspace() {
  // Liste complète de toutes vos matières
  const subjectsList = [
    'Électricité',
    'Électronique Analogique',
    'Électronique Numérique',
    'Mesures Électroniques',
    'Automatisme',
    'Technologie',
    'Utilisation',
    'TP (Travaux Pratiques)',
    'Dessin Technique',
    'Gestion',
    'Droit'
  ];

  const [currentSubject, setCurrentSubject] = useState<string>('Électricité');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stockage indépendant des cours générés par matière
  const [subjectData, setSubjectData] = useState<Record<string, {
    summary?: string;
    qa?: QAItem[];
    illustrations?: ComponentIllustration[];
    quiz?: QuizItem[];
  }>>({});

  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  // Changement de matière et remise à zéro de la recherche
  const handleSubjectChange = (subject: string) => {
    setCurrentSubject(subject);
    setSearchResult(null);
  };

  // Traitement du cours avec Gemini 3.6
  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputText }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubjectData(prev => ({
          ...prev,
          [currentSubject]: {
            summary: data.summary,
            qa: data.qa,
            illustrations: data.componentsToIllustrate,
            quiz: data.quiz,
          }
        }));
      } else {
        alert(data.error || "Erreur de génération avec Gemini 3.6.");
      }
    } catch (err) {
      alert("Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Recherche explicative
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);

    try {
      const res = await fetch('/api/search-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await res.json();
      if (res.ok) {
        setSearchResult(data);
      } else {
        alert(data.error || "Impossible d'exécuter la recherche.");
      }
    } catch (err) {
      alert("Erreur lors de la recherche.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Fonction d'exportation PDF / Impression
  const handleExportPDF = () => {
    window.print();
  };

  const currentData = subjectData[currentSubject] || {};

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* BARRE LATÉRALE : MATIÈRES */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
          ⚡ Samnote
        </h1>
        
        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Espace de travail</p>
        <button className="w-full text-left px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm mb-4 font-medium border border-blue-500/30">
          📁 Espace de Travail
        </button>

        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Matières</p>
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1 pb-2 md:pb-0 max-h-[60vh] md:max-h-none overflow-y-auto">
          {subjectsList.map((sub) => (
            <button
              key={sub}
              onClick={() => handleSubjectChange(sub)}
              className={`px-3 py-2 rounded-lg text-sm text-left whitespace-nowrap transition-colors ${
                currentSubject === sub
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              📂 {sub}
            </button>
          ))}
        </div>
      </aside>

      {/* ZONE PRINCIPALE DE CONTENU */}
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        
        {/* BARRE DE RECHERCHE ET BOUTONS EXPORT */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder={`Rechercher dans ${currentSubject}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading}
            className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {searchLoading ? 'Recherche...' : 'Rechercher'}
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            📷 Exporter Photo / PDF
          </button>
        </div>

        {/* FICHE DE RECHERCHE AVEC IMAGE */}
        {searchResult && (
          <section className="bg-slate-900 border border-blue-500/40 rounded-xl p-5 relative">
            <button 
              onClick={() => setSearchResult(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-blue-400 mb-2">💡 Résultat : {searchResult.term}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300">Définition :</h3>
                  <p className="text-sm text-slate-200">{searchResult.definition}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-300">Fonctionnement :</h3>
                  <p className="text-sm text-slate-200">{searchResult.howItWorks}</p>
                </div>
                {searchResult.characteristics && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300">Caractéristiques :</h3>
                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                      {searchResult.characteristics.map((char, i) => (
                        <li key={i}>{char}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {searchResult.imageUrl && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-400 mb-1">Schéma / Dessin Technique</span>
                  <img
                    src={searchResult.imageUrl}
                    alt={searchResult.term}
                    className="w-full h-48 object-cover rounded-lg border border-slate-700"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* SAISIE DU COURS DE LA MATIÈRE ACTUELLE */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-md font-semibold text-slate-200 mb-2">
            Zone de Saisie & Importation — <span className="text-blue-400">{currentSubject}</span>
          </h2>
          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Saisissez le cours ou collez le texte de ${currentSubject} ici...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Analyse Gemini 3.6 en cours...' : 'Générer avec Gemini 3.6'}
            </button>
          </div>
        </section>

        {/* EXPLICATION & RÉSUMÉ SIMPLIFIÉ */}
        {currentData.summary && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-emerald-400 mb-2">📘 Résumé & Explication ({currentSubject})</h2>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {currentData.summary}
            </p>
          </section>
        )}

        {/* QUESTIONS - RÉPONSES (Q&A) */}
        {currentData.qa && currentData.qa.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-purple-400 mb-4">❓ Questions & Réponses ({currentSubject})</h2>
            <div className="space-y-3">
              {currentData.qa.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <p className="text-sm font-semibold text-purple-300">Q: {item.question}</p>
                  <p className="text-sm text-slate-300 mt-1">R: {item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DESSINS TECHNIQUES & SCHÉMAS */}
        {currentData.illustrations && currentData.illustrations.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-amber-400 mb-4">🎨 Dessins Techniques ({currentSubject})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentData.illustrations.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <h3 className="text-sm font-bold text-slate-200 mb-1">{item.name}</h3>
                  <p className="text-xs text-slate-400 mb-2">{item.description}</p>
                  <img
                    src={`https://image.pollinations.ai/prompt/${encodeURIComponent(item.imagePrompt || item.name)}?width=600&height=400&nologo=true`}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded border border-slate-800"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* QUIZ D'ÉVALUATION */}
        {currentData.quiz && currentData.quiz.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-blue-400 mb-4">📝 Quiz ({currentSubject})</h2>
            <div className="space-y-4">
              {currentData.quiz.map((q, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <p className="text-sm font-medium mb-3">{idx + 1}. {q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        className="text-left text-xs bg-slate-900 hover:bg-blue-900/40 border border-slate-800 p-2.5 rounded transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}