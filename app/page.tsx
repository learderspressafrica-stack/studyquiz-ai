'use client';

import React, { useState, useEffect } from 'react';

interface HistoryItem {
  id: string;
  subject: string;
  title: string;
  date: string;
  summary: string;
  components: string[];
  quiz: any[];
}

export default function SamnoteApp() {
  const subjects = [
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

  const [activeSubject, setActiveSubject] = useState('Électricité');
  const [activeTab, setActiveTab] = useState<'workspace' | 'history' | 'references'>('workspace');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Barre de recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);

  // Saisie & Fichier (Partie droite)
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Données générées
  const [currentData, setCurrentData] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Quiz & Audio
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('samnote_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (newItem: HistoryItem) => {
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem('samnote_history', JSON.stringify(updated));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('samnote_history', JSON.stringify(updated));
    if (currentData?.id === id) setCurrentData(null);
  };

  // Traitement Recherche (Compatible Android / Clavier Mobile + PC)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Simulation de recherche explicative dans la matière active
    setSearchResult(
      `Explication pour "${searchQuery}" dans la matière ${activeSubject} : Concept clé, fonctionnement théorique, et cas d'application pratique dans l'industrie.`
    );
  };

  // Importation Photo / PDF / Texte
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
        alert("Erreur lors de la lecture du PDF.");
      } finally {
        setIsExtracting(false);
      }
    } else {
      // Cas des photos/images prises sur téléphone ou chargées depuis le PC
      setInputText(`[Document photo chargé : ${file.name}]`);
      setIsExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return alert("Veuillez d'abord saisir un texte ou importer une photo/PDF.");
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

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        subject: activeSubject,
        title: inputText.slice(0, 35) + '...',
        date: new Date().toLocaleDateString('fr-FR'),
        summary: result.summary,
        components: result.componentsToIllustrate || [],
        quiz: result.quiz || []
      };

      setCurrentData(newItem);
      saveToHistory(newItem);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAudio = (text: string) => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const filteredHistory = history.filter(item => item.subject === activeSubject);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">

      {/* ================= SIDEBAR LATÉRALE (Adaptée Mobile & PC) ================= */}
      <aside className={`fixed md:relative z-30 w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <h1 className="font-bold text-lg text-blue-400">Samnote</h1>
            </div>
            {/* Bouton fermeture sur mobile */}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 text-lg">✕</button>
          </div>

          <div className="space-y-1 mb-6">
            <button
              onClick={() => { setActiveTab('workspace'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'workspace' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📝 Espace de Travail
            </button>
            <button
              onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📚 Historique ({filteredHistory.length})
            </button>
            <button
              onClick={() => { setActiveTab('references'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'references' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📑 Devoirs & Références
            </button>
          </div>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
            Matières
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => { setActiveSubject(sub); setIsSidebarOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                  activeSubject === sub ? 'bg-slate-800 text-blue-400 font-bold border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <span className="truncate">📁 {sub}</span>
                {history.filter(h => h.subject === sub).length > 0 && (
                  <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded-md text-slate-400">
                    {history.filter(h => h.subject === sub).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
          🟢 En ligne sur Mobile & PC
        </div>
      </aside>

      {/* ================= ZONE DE TRAVAIL PRINCIPALE (DROITE) ================= */}
      <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 w-full">

        {/* Entête avec menu mobile et Barre de recherche interactive */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs font-bold"
            >
              ☰ Matières
            </button>
            <span className="text-xs font-semibold px-3 py-2 bg-blue-900/40 text-blue-400 border border-blue-500/30 rounded-xl whitespace-nowrap">
              {activeSubject}
            </span>
          </div>

          {/* Formulaire de recherche universel (Entrée sur mobile ou Clic sur bouton) */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`🔍 Rechercher une explication dans ${activeSubject}...`}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition whitespace-nowrap"
            >
              Rechercher
            </button>
          </form>
        </div>

        {/* Affichage du résultat de recherche si disponible */}
        {searchResult && (
          <div className="mb-6 p-4 bg-slate-900 border border-blue-500/40 rounded-2xl text-xs text-blue-200 flex justify-between items-start gap-3">
            <div>
              <p className="font-bold text-blue-400 mb-1">💡 Résultat de recherche :</p>
              <p>{searchResult}</p>
            </div>
            <button onClick={() => setSearchResult(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* VUE 1 : ESPACE DE TRAVAIL (Saisie de Texte / Export Photo / PDF) */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">

            {/* Case principale d'importation et d'écriture */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
              <h2 className="text-sm font-bold text-blue-400 mb-3">
                📥 Zone de Saisie & Importation ({activeSubject})
              </h2>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Tapez votre cours ici ou déposez une photo / PDF pour la matière ${activeSubject}...`}
                className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none mb-4"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-2">
                    📷 Exporter Photo / PDF
                    <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {fileName && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      📄 {fileName} {isExtracting && "(Lecture...)"}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || isExtracting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition w-full md:w-auto"
                >
                  {isGenerating ? "Génération en cours..." : "⚡ Générer Fiche, Audio & Quiz"}
                </button>
              </div>
            </div>

            {/* Résultats de génération */}
            {currentData && (
              <div className="space-y-6">
                
                {/* Résumé & Audio */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-emerald-400">📖 Résumé du Cours</h3>
                    <button
                      onClick={() => toggleAudio(currentData.summary)}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                    >
                      {isPlayingAudio ? "⏹ Arrêter" : "🔊 Écouter l'Audio"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
                    {currentData.summary}
                  </p>
                </div>

                {/* Quiz interactif Vert / Rouge / Jaune */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6">
                  <h3 className="text-sm font-bold text-blue-400 mb-4">
                    📝 Quiz d'Évaluation ({currentData.quiz.length} Questions)
                  </h3>

                  <div className="space-y-4">
                    {currentData.quiz.map((q, qIdx) => (
                      <div key={qIdx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                        <p className="text-xs font-semibold mb-3">{qIdx + 1}. {q.question}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options.map((opt: string, oIdx: number) => {
                            const isSelected = userAnswers[qIdx] === oIdx;
                            const isCorrect = q.correctIndex === oIdx;

                            let btnStyle = "bg-slate-900 border-slate-800 text-slate-300";
                            if (submittedQuiz) {
                              if (isSelected && isCorrect) btnStyle = "bg-emerald-600 border-emerald-500 text-white font-bold";
                              else if (isSelected && !isCorrect) btnStyle = "bg-red-600 border-red-500 text-white font-bold";
                              else if (!isSelected && isCorrect) btnStyle = "bg-amber-400 border-amber-300 text-slate-950 font-bold";
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

                  <div className="mt-4 flex justify-end">
                    {!submittedQuiz ? (
                      <button
                        onClick={() => setSubmittedQuiz(true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl w-full md:w-auto"
                      >
                        Valider Réponses
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSubmittedQuiz(false); setUserAnswers({}); }}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl w-full md:w-auto"
                      >
                        Recommencer
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* VUE 2 : HISTORIQUE FILTRÉ PAR MATIÈRE */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6">
            <h2 className="text-sm font-bold text-blue-400 mb-4">
              📚 Historique des Recherches : {activeSubject}
            </h2>

            {filteredHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Aucune recherche enregistrée pour cette matière.</p>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => { setCurrentData(item); setActiveTab('workspace'); }}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition flex flex-col md:flex-row justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Enregistré le {item.date}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 text-[10px] rounded-lg font-semibold border border-red-800/40"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VUE 3 : DEVOIRS DE RÉFÉRENCE */}
        {activeTab === 'references' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6">
            <h2 className="text-sm font-bold text-amber-400 mb-4">
              📑 Devoirs & Sujets de Référence ({activeSubject})
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Importez vos devoirs de référence (PDF ou Photo) depuis un ordinateur ou votre téléphone portable.
            </p>
            <label className="cursor-pointer px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold inline-block">
              📁 Importer un Devoir / Photo / PDF
              <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

      </main>
    </div>
  );
}