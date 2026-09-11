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
  // Liste des matières
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

  // États principaux
  const [activeSubject, setActiveSubject] = useState('Électricité');
  const [activeTab, setActiveTab] = useState<'workspace' | 'history' | 'references'>('workspace');
  
  // Recherche et saisie
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Données générées & Historique
  const [currentData, setCurrentData] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Quiz & Audio
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Charger l'historique au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('samnote_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Sauvegarder l'historique
  const saveToHistory = (newItem: HistoryItem) => {
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem('samnote_history', JSON.stringify(updated));
  };

  // Supprimer un élément de l'historique
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('samnote_history', JSON.stringify(updated));
    if (currentData?.id === id) setCurrentData(null);
  };

  // Importer PDF ou Photo
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
      setInputText(`[Document photo chargé : ${file.name}]`);
      setIsExtracting(false);
    }
  };

  // Génération de la fiche et du quiz
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

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        subject: activeSubject,
        title: inputText.slice(0, 30) + '...',
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

  // Lecture Audio
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

  // Exporter en fichier texte
  const exportItem = (item: HistoryItem) => {
    const content = `MATIÈRE: ${item.subject}\nTITRE: ${item.title}\nDATE: ${item.date}\n\nRÉSUMÉ:\n${item.summary}\n\nQUIZ:\n` +
      item.quiz.map((q, i) => `${i+1}. ${q.question}\nOptions: ${q.options.join(', ')}`).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.subject}_${item.id}.txt`;
    a.click();
  };

  // Filtrer l'historique selon la matière active
  const filteredHistory = history.filter(item => item.subject === activeSubject);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* ================= SIDEBAR LATÉRALE (Style PodNote / Notebook) ================= */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 select-none">
        <div>
          {/* Logo / Titre */}
          <div className="flex items-center gap-2 mb-6 px-2">
            <span className="text-xl">⚡</span>
            <h1 className="font-bold text-lg text-blue-400 tracking-wide">Samnote</h1>
          </div>

          {/* Vues Rapides */}
          <div className="space-y-1 mb-6">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'workspace' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📝 Espace de Travail
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📚 Historique ({filteredHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('references')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'references' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📑 Devoirs & Références
            </button>
          </div>

          {/* Separation */}
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
            Matières
          </div>

          {/* Liste des Matières */}
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => { setActiveSubject(sub); }}
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

        {/* Profil / Statut */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>🟢 Mode En Ligne</span>
        </div>
      </aside>

      {/* ================= CONTENU PRINCIPAL ================= */}
      <main className="flex-1 flex flex-col overflow-y-auto p-6">
        
        {/* Barre de recherche supérieure */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`🔍 Rechercher dans ${activeSubject}...`}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 bg-blue-900/40 text-blue-400 border border-blue-500/30 rounded-lg">
            Matière active : {activeSubject}
          </span>
        </div>

        {/* VUE 1 : ESPACE DE TRAVAIL */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            
            {/* Zone d'Importation */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-blue-400 mb-3">
                📥 Importer un Cours ou Exercice ({activeSubject})
              </h2>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Collez votre cours ou déposez un fichier PDF/Photo pour la matière ${activeSubject}...`}
                className="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none mb-4"
              />

              <div className="flex items-center justify-between">
                <label className="cursor-pointer px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition">
                  📄 Importer PDF / Photo
                  <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || isExtracting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                >
                  {isGenerating ? "Traitement..." : "⚡ Générer Fiche & Quiz"}
                </button>
              </div>
            </div>

            {/* Affichage des Résultats */}
            {currentData && (
              <div className="space-y-6">
                
                {/* Résumé & Audio */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-emerald-400">📖 Résumé de la Fiche</h3>
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

                {/* Quiz Vert / Rouge / Jaune */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
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
                                className={`p-2.5 text-left text-xs rounded-xl border transition ${btnStyle}`}
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
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                      >
                        Valider Réponses
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSubmittedQuiz(false); setUserAnswers({}); }}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
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

        {/* VUE 2 : HISTORIQUE PAR MATIÈRE */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-blue-400 mb-4">
              📚 Historique des Recherches : {activeSubject}
            </h2>

            {filteredHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Aucune recherche ni fiche enregistrée pour cette matière.</p>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => { setCurrentData(item); setActiveTab('workspace'); }}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Enregistré le {item.date}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); exportItem(item); }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg font-semibold"
                      >
                        📥 Exporter
                      </button>
                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="px-3 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 text-[10px] rounded-lg font-semibold border border-red-800/40"
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

        {/* VUE 3 : DEVOIRS & RÉFÉRENCES */}
        {activeTab === 'references' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-amber-400 mb-4">
              📑 Sujets de Référence ({activeSubject})
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Déposez ici les devoirs officiels ou anciens sujets d'examen de {activeSubject} pour calibrer le niveau de difficulté des quiz.
            </p>
            <label className="cursor-pointer px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold inline-block">
              📁 Importer un Devoir / PDF de Référence
              <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

      </main>
    </div>
  );
}