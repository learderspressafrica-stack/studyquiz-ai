'use client';

import React, { useState, useEffect } from 'react';

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

export default function WorkspacePage() {
  const [currentSubject, setCurrentSubject] = useState<string>('Électricité');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Données par matière (empêche le blocage/mélange entre matières)
  const [subjectData, setSubjectData] = useState<Record<string, {
    summary?: string;
    qa?: QAItem[];
    illustrations?: ComponentIllustration[];
    quiz?: QuizItem[];
  }>>({});

  // Résultat de la barre de recherche
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  // 1. Vider la recherche et rafraîchir l'interface au changement de matière
  const handleSubjectChange = (subject: string) => {
    setCurrentSubject(subject);
    setSearchResult(null); // Réinitialise la recherche lors du changement d'onglet
  };

  // 2. Génération de Fiche, Quiz, Q&R et Audio
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
        alert(data.error || "Une erreur est survenue.");
      }
    } catch (err) {
      alert("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Recherche de concept (avec Définition, Fonctionnement, Caractéristiques et Image)
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
        alert(data.error || "Impossible d'effectuer la recherche.");
      }
    } catch (err) {
      alert("Erreur lors de la recherche.");
    } finally {
      setSearchLoading(false);
    }
  };

  const currentData = subjectData[currentSubject] || {};

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* BARRE LATÉRALE - Matières (Responsive Mobile / PC) */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4">
        <h1 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
          ⚡ Samnote
        </h1>
        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Matières</p>
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1 pb-2 md:pb-0">
          {['Électricité', 'Électronique Analogique', 'Électronique Numérique', 'Technologie', 'Automatisme'].map((sub) => (
            <button
              key={sub}
              onClick={() => handleSubjectChange(sub)}
              className={`px-3 py-2 rounded-lg text-sm text-left whitespace-nowrap transition-colors ${
                currentSubject === sub
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        
        {/* BARRE DE RECHERCHE */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder={`Rechercher un composant ou un mot dans ${currentSubject}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {searchLoading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* AFFICHAGE DES RÉSULTATS DE RECHERCHE */}
        {searchResult && (
          <section className="bg-slate-900 border border-blue-500/30 rounded-xl p-5 relative">
            <button 
              onClick={() => setSearchResult(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-blue-400 mb-2">💡 Fiche : {searchResult.term}</h2>
            
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

              {/* DESSIN TECHNIQUE REALISTE */}
              {searchResult.imageUrl && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-400 mb-1">Schéma technique & Dessin</span>
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

        {/* ZONE DE SAISIE ET GÉNÉRATION DE COURS */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-md font-semibold text-slate-200 mb-2">
            Zone de Saisie & Importation ({currentSubject})
          </h2>
          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Saisissez ou collez votre cours de ${currentSubject} ici...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Analyse par Gemini 3.6...' : 'Générer Fiche, Q&R, Audio & Quiz'}
            </button>
          </div>
        </section>

        {/* AFFICHAGE DU RÉSUMÉ / EXPLICATION SIMPLIFIÉE */}
        {currentData.summary && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-emerald-400 mb-2">📘 Explication & Résumé Simplifié</h2>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {currentData.summary}
            </p>
          </section>
        )}

        {/* AFFICHAGE DES QUESTIONS / RÉPONSES (Q&A) */}
        {currentData.qa && currentData.qa.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-purple-400 mb-4">❓ Questions - Réponses Pédagogiques</h2>
            <div className="space-y-4">
              {currentData.qa.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <p className="text-sm font-semibold text-purple-300">Q: {item.question}</p>
                  <p className="text-sm text-slate-300 mt-1">R: {item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SCHÉMAS TECHNIQUES ASSOCIÉS AU COURS */}
        {currentData.illustrations && currentData.illustrations.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-amber-400 mb-4">🎨 Dessins Techniques & Composants</h2>
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

        {/* AFFICHAGE DU QUIZ */}
        {currentData.quiz && currentData.quiz.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-blue-400 mb-4">📝 Quiz d'évaluation</h2>
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