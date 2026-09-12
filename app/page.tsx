'use client';

import React, { useState, useRef } from 'react';

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
  
  // Gestion de l'audio
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  
  // Réponses du quiz sélectionnées par l'utilisateur: { [questionIndex]: selectedOptionIndex }
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [subjectData, setSubjectData] = useState<Record<string, {
    summary?: string;
    qa?: QAItem[];
    illustrations?: ComponentIllustration[];
    quiz?: QuizItem[];
  }>>({});

  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const handleSubjectChange = (subject: string) => {
    setCurrentSubject(subject);
    setSearchResult(null);
    setUserAnswers({});
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
  };

  // Importation Photo / PDF / Texte
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputText(event.target?.result as string || '');
      };
      reader.readAsText(file);
    } else {
      setInputText(`[Document / Photo importé : ${file.name}]\nProcessez l'analyse de ce cours, incluant les composants essentiels, explications et illustrations.`);
    }
  };

  // Synthèse vocale Audio
  const toggleAudio = (textToRead: string) => {
    if (!('speechSynthesis' in window)) {
      alert("La synthèse vocale n'est pas supportée par votre navigateur.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'fr-FR';
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  // Génération principale (Gemini 3.6 Flash)
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      alert("Veuillez saisir un texte ou importer un fichier.");
      return;
    }
    setLoading(true);
    setUserAnswers({});

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `[Matière : ${currentSubject}]\n${inputText}` }),
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
        alert(data.error || "Une erreur est survenue lors de la génération.");
      }
    } catch (err) {
      alert("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Moteur de recherche avancé avec image
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);

    try {
      const promptSearch = `Recherche approfondie pour le composant ou la notion "${searchQuery}" dans le cadre de la matière ${currentSubject}. Donne la définition, le fonctionnement, et 3 caractéristiques techniques.`;
      
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptSearch }),
      });

      const data = await res.json();

      if (res.ok && data.summary) {
        setSearchResult({
          term: searchQuery,
          definition: data.summary,
          howItWorks: data.qa && data.qa[0] ? `${data.qa[0].question} : ${data.qa[0].answer}` : `Fonctionnement de ${searchQuery}.`,
          characteristics: data.quiz ? data.quiz.map((q: QuizItem) => q.question) : ['Haute précision', 'Utilisation industrielle', 'Norme standard'],
          imageUrl: `https://image.pollinations.ai/prompt/technical%20drawing%20schematic%20diagram%20of%20${encodeURIComponent(searchQuery)}%20electronic%20component?width=700&height=450&nologo=true`
        });
      } else {
        setSearchResult({
          term: searchQuery,
          definition: `Définition et étude de "${searchQuery}" appliquée à la matière ${currentSubject}.`,
          howItWorks: `Principe de fonctionnement technique et rôle dans les circuits ou systèmes.`,
          characteristics: ['Composant standard', 'Fiabilité', 'Spécifications techniques'],
          imageUrl: `https://image.pollinations.ai/prompt/technical%20drawing%20schematic%20diagram%20of%20${encodeURIComponent(searchQuery)}?width=700&height=450&nologo=true`
        });
      }
    } catch (err) {
      setSearchResult({
        term: searchQuery,
        definition: `Détails techniques sur "${searchQuery}".`,
        howItWorks: `Spécifications et applications en ${currentSubject}.`,
        characteristics: ['Généralité', 'Application pratique'],
        imageUrl: `https://image.pollinations.ai/prompt/technical%20drawing%20schematic%20diagram%20of%20${encodeURIComponent(searchQuery)}?width=700&height=450&nologo=true`
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Clic sur une option du Quiz
  const handleOptionClick = (questionIdx: number, optionIdx: number) => {
    // Si l'utilisateur a déjà répondu à cette question, ne rien faire
    if (userAnswers[questionIdx] !== undefined) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [questionIdx]: optionIdx
    }));
  };

  const currentData = subjectData[currentSubject] || {};

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* BARRE LATÉRALE : MATIÈRES */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
          ⚡ Samnote
        </h1>
        
        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Navigation</p>
        <button className="w-full text-left px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm mb-4 font-medium border border-blue-500/30">
          📁 Espace de Travail
        </button>

        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Matières</p>
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1 pb-2 md:pb-0 max-h-[40vh] md:max-h-none overflow-y-auto">
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

      {/* ZONE DE CONTENU PRINCIPAL */}
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        
        {/* BARRE DE RECHERCHE */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder={`Rechercher un composant ou un terme dans ${currentSubject}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading}
            className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {searchLoading ? 'Recherche en cours...' : '🔍 Rechercher'}
          </button>
        </div>

        {/* RÉSULTAT DE LA RECHERCHE AVEC SCHÉMA ET EXPLICATIONS */}
        {searchResult && (
          <section className="bg-slate-900 border border-blue-500/40 rounded-xl p-5 relative">
            <button 
              onClick={() => setSearchResult(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-blue-400 mb-2">💡 Fiche Technique : {searchResult.term}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300">📖 Définition :</h3>
                  <p className="text-sm text-slate-200 mt-1 leading-relaxed">{searchResult.definition}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-300">⚙️ Fonctionnement :</h3>
                  <p className="text-sm text-slate-200 mt-1 leading-relaxed">{searchResult.howItWorks}</p>
                </div>
                {searchResult.characteristics && searchResult.characteristics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300">📌 Caractéristiques :</h3>
                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 mt-1">
                      {searchResult.characteristics.map((char, i) => (
                        <li key={i}>{char}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {searchResult.imageUrl && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-400 mb-2">Schéma & Représentation Technique</span>
                  <img
                    src={searchResult.imageUrl}
                    alt={searchResult.term}
                    className="w-full h-56 object-cover rounded-lg border border-slate-700 shadow-md"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* SAISIE & IMPORTATION DE FICHIERS */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-md font-semibold text-slate-200 mb-2">
            Zone de Saisie & Importation — <span className="text-blue-400">{currentSubject}</span>
          </h2>
          
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Collez votre cours ou importez un fichier Photo / PDF pour la matière ${currentSubject}...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
          />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf,.txt"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              📷 Importer Photo / PDF
            </button>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Analyse Gemini 3.6...' : '⚡ Générer Résumé, Schémas, Q&R et Quiz'}
            </button>
          </div>
        </section>

        {/* RÉSUMÉ AVEC LECTURE AUDIO */}
        {currentData.summary && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-emerald-400">📘 Résumé & Explication ({currentSubject})</h2>
              
              {/* BOUTON AUDIO */}
              <button
                onClick={() => toggleAudio(currentData.summary || '')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 flex items-center gap-2 transition-colors"
              >
                {isPlayingAudio ? '⏹️ Arrêter l\'audio' : '🔊 Écouter le Résumé'}
              </button>
            </div>
            
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {currentData.summary}
            </p>
          </section>
        )}

        {/* QUESTIONS & RÉPONSES DÉTAILLÉES */}
        {currentData.qa && currentData.qa.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-purple-400 mb-4">❓ Questions & Réponses ({currentSubject})</h2>
            <div className="space-y-3">
              {currentData.qa.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <p className="text-sm font-semibold text-purple-300">Q: {item.question}</p>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">R: {item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DESSINS & SCHÉMAS TECHNIQUES */}
        {currentData.illustrations && currentData.illustrations.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-amber-400 mb-4">🎨 Schémas & Dessins Techniques ({currentSubject})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentData.illustrations.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <h3 className="text-sm font-bold text-slate-200 mb-1">{item.name}</h3>
                  <p className="text-xs text-slate-400 mb-2">{item.description}</p>
                  <img
                    src={`https://image.pollinations.ai/prompt/${encodeURIComponent(item.imagePrompt || item.name)}?width=600&height=400&nologo=true`}
                    alt={item.name}
                    className="w-full h-44 object-cover rounded border border-slate-800"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* QUIZ INTERACTIF AVEC RETOUR VERT / ROUGE */}
        {currentData.quiz && currentData.quiz.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-blue-400 mb-4">📝 Quiz Interactif de Révision ({currentSubject})</h2>
            <div className="space-y-5">
              {currentData.quiz.map((q, qIdx) => {
                const selectedOption = userAnswers[qIdx];
                const isAnswered = selectedOption !== undefined;

                return (
                  <div key={qIdx} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-sm font-medium mb-3 text-slate-200">
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800";
                        
                        if (isAnswered) {
                          if (optIdx === q.correctIndex) {
                            // La bonne réponse passe TOUJOURS en vert
                            btnStyle = "bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold";
                          } else if (optIdx === selectedOption && selectedOption !== q.correctIndex) {
                            // Mauvaise réponse sélectionnée -> ROUGE
                            btnStyle = "bg-rose-600/30 border-rose-500 text-rose-300 font-bold";
                          } else {
                            btnStyle = "bg-slate-900/40 text-slate-500 border-slate-800 opacity-60";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleOptionClick(qIdx, optIdx)}
                            className={`text-left text-xs p-3 rounded-lg border transition-all ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explication dynamique si répondu */}
                    {isAnswered && (
                      <div className="mt-3 text-xs p-2.5 rounded bg-slate-900 border border-slate-800">
                        {selectedOption === q.correctIndex ? (
                          <span className="text-emerald-400 font-semibold">✅ Bravo ! Excellente réponse.</span>
                        ) : (
                          <span className="text-rose-400 font-semibold">❌ Incorrect. La bonne réponse est indiquée en vert.</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}