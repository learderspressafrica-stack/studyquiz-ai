'use client';

import React, { useState, useRef, useEffect } from 'react';

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

interface SavedReference {
  id: string;
  title: string;
  subject: string;
  date: string;
  type: string;
  content: string;
  summary?: string;
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
  const [activeTab, setActiveTab] = useState<'workspace' | 'history' | 'references'>('workspace');
  
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Nouveaux états : Devoirs de Référence & Historique
  const [refTitle, setRefTitle] = useState<string>('');
  const [refType, setRefType] = useState<string>('Devoir');
  const [references, setReferences] = useState<SavedReference[]>([]);
  const [history, setHistory] = useState<SavedReference[]>([]);

  // Gestion de l'audio
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  
  // Réponses du quiz
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [subjectData, setSubjectData] = useState<Record<string, {
    summary?: string;
    qa?: QAItem[];
    illustrations?: ComponentIllustration[];
    quiz?: QuizItem[];
  }>>({});

  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  // Charger l'historique et les références enregistrées au démarrage
  useEffect(() => {
    const savedHist = localStorage.getItem('samnote_history');
    if (savedHist) setHistory(JSON.parse(savedHist));

    const savedRefs = localStorage.getItem('samnote_references');
    if (savedRefs) setReferences(JSON.parse(savedRefs));
  }, []);

  const handleSubjectChange = (subject: string) => {
    setCurrentSubject(subject);
    setSearchResult(null);
    setUserAnswers({});
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
  };

  // Importation Fichier Photo / PDF / Texte
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
      setInputText(`[Document / Image importée : ${file.name}]\nSaisissez les détails de ce cours ou schéma pour l'analyse...`);
    }
  };

  // Enregistrer comme Devoir de Référence
  const handleSaveReference = () => {
    if (!inputText.trim() && !refTitle.trim()) {
      alert("Veuillez saisir un titre et le contenu du devoir de référence.");
      return;
    }

    const newRef: SavedReference = {
      id: Date.now().toString(),
      title: refTitle || `Référence - ${currentSubject}`,
      subject: currentSubject,
      date: new Date().toLocaleDateString('fr-FR'),
      type: refType,
      content: inputText,
      summary: subjectData[currentSubject]?.summary || ''
    };

    const updated = [newRef, ...references];
    setReferences(updated);
    localStorage.setItem('samnote_references', JSON.stringify(updated));
    setRefTitle('');
    alert("Devoir de référence enregistré avec succès !");
  };

  // Exporter en PDF / Document Imprimable
  const handleExportPDF = () => {
    const summaryText = subjectData[currentSubject]?.summary;
    if (!summaryText) {
      alert("Aucun résumé à exporter. Veuillez d'abord générer un contenu.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Export PDF - Samnote (${currentSubject})</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; line-height: 1.6; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
            h2 { color: #059669; margin-top: 20px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
            .footer { margin-top: 30px; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <h1>⚡ Samnote - Fiche de Révision : ${currentSubject}</h1>
          <p><strong>Date d'export :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          <div class="box">
            <h2>📘 Résumé du Cours</h2>
            <p>${summaryText.replace(/\n/g, '<br/>')}</p>
          </div>
          <div class="footer">Document généré par Samnote - Électronique & Automatismes</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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

  // Génération principale via l'API Gemini 3.6
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

        // Sauvegarde dans l'Historique
        const newHistItem: SavedReference = {
          id: Date.now().toString(),
          title: `Fiche ${currentSubject}`,
          subject: currentSubject,
          date: new Date().toLocaleDateString('fr-FR'),
          type: 'Génération IA',
          content: inputText,
          summary: data.summary
        };

        const updatedHist = [newHistItem, ...history];
        setHistory(updatedHist);
        localStorage.setItem('samnote_history', JSON.stringify(updatedHist));

      } else {
        alert(data.error || "Une erreur est survenue lors de la génération.");
      }
    } catch (err) {
      alert("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Moteur de Recherche Avancé
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);

    try {
      const promptSearch = `Recherche approfondie pour le composant ou la notion "${searchQuery}" dans la matière ${currentSubject}. Donne la définition, le fonctionnement et des caractéristiques techniques.`;
      
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
          characteristics: data.quiz ? data.quiz.map((q: QuizItem) => q.question) : ['Haute précision', 'Norme standard'],
          imageUrl: `https://image.pollinations.ai/prompt/technical%20drawing%20schematic%20diagram%20of%20${encodeURIComponent(searchQuery)}%20electronic%20component?width=700&height=450&nologo=true`
        });
      } else {
        setSearchResult({
          term: searchQuery,
          definition: `Étude technique de "${searchQuery}" en ${currentSubject}.`,
          howItWorks: `Principe de fonctionnement et rôle dans les circuits.`,
          characteristics: ['Spécifications techniques'],
          imageUrl: `https://image.pollinations.ai/prompt/technical%20drawing%20schematic%20diagram%20of%20${encodeURIComponent(searchQuery)}?width=700&height=450&nologo=true`
        });
      }
    } catch (err) {
      setSearchResult({
        term: searchQuery,
        definition: `Détails techniques sur "${searchQuery}".`,
        howItWorks: `Spécifications et applications.`,
        characteristics: ['Généralités'],
        imageUrl: `https://image.pollinations.ai/prompt/technical%20drawing%20schematic%20diagram%20of%20${encodeURIComponent(searchQuery)}?width=700&height=450&nologo=true`
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOptionClick = (questionIdx: number, optionIdx: number) => {
    if (userAnswers[questionIdx] !== undefined) return;
    setUserAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const currentData = subjectData[currentSubject] || {};

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* BARRE LATÉRALE */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
          ⚡ Samnote
        </h1>
        
        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Navigation</p>
        <div className="space-y-1 mb-6">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'workspace' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📁 Espace de Travail
          </button>
          <button
            onClick={() => setActiveTab('references')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'references' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📑 Devoirs de Référence
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📜 Historique
          </button>
        </div>

        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Matières</p>
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1 pb-2 md:pb-0 max-h-[35vh] md:max-h-none overflow-y-auto">
          {subjectsList.map((sub) => (
            <button
              key={sub}
              onClick={() => {
                handleSubjectChange(sub);
                setActiveTab('workspace');
              }}
              className={`px-3 py-2 rounded-lg text-sm text-left whitespace-nowrap transition-colors ${
                currentSubject === sub && activeTab === 'workspace'
                  ? 'bg-blue-600/30 text-blue-400 font-medium border border-blue-500/40'
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
        
        {/* VUE 1 : ESPACE DE TRAVAIL PRINCIPAL */}
        {activeTab === 'workspace' && (
          <>
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
                {searchLoading ? 'Recherche...' : '🔍 Rechercher'}
              </button>
            </div>

            {/* RÉSULTAT DE RECHERCHE */}
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
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-300">📖 Définition :</h3>
                      <p className="text-sm text-slate-200 mt-1">{searchResult.definition}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-300">⚙️ Fonctionnement :</h3>
                      <p className="text-sm text-slate-200 mt-1">{searchResult.howItWorks}</p>
                    </div>
                  </div>

                  {searchResult.imageUrl && (
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-400 mb-2">Schéma Technique</span>
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

            {/* SAISIE, IMPORTATION & DEVOIR DE RÉFÉRENCE */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="text-md font-semibold text-slate-200">
                Saisie & Importation — <span className="text-blue-400">{currentSubject}</span>
              </h2>
              
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Saisissez le cours ou collez les éléments de votre devoir pour la matière ${currentSubject}...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
              />

              {/* BOUTONS D'ACTION : IMPORTATION & ENREGISTREMENT RÉFÉRENCE */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.txt"
                  className="hidden"
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    📷 Importer Photo / PDF
                  </button>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? 'Analyse Gemini 3.6...' : '⚡ Générer Résumé, Q&R & Quiz'}
                </button>
              </div>

              {/* SECTION ENREGISTRER COMME RÉFÉRENCE */}
              <div className="border-t border-slate-800 pt-3 mt-3 flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="text"
                  placeholder="Titre du Devoir de Référence (ex: Devoir Électricité N°1)..."
                  value={refTitle}
                  onChange={(e) => setRefTitle(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <select
                  value={refType}
                  onChange={(e) => setRefType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                >
                  <option value="Devoir">Devoir</option>
                  <option value="TP">Travaux Pratiques (TP)</option>
                  <option value="Examen">Examen / Évaluation</option>
                  <option value="Cours">Cours de Référence</option>
                </select>
                <button
                  onClick={handleSaveReference}
                  className="bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  💾 Enregistrer Référence
                </button>
              </div>
            </section>

            {/* RÉSUMÉ & EXPORTATION PDF */}
            {currentData.summary && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h2 className="text-lg font-bold text-emerald-400">📘 Résumé du Cours ({currentSubject})</h2>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAudio(currentData.summary || '')}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 flex items-center gap-1.5"
                    >
                      {isPlayingAudio ? '⏹️ Arrêter' : '🔊 Écouter Audio'}
                    </button>

                    <button
                      onClick={handleExportPDF}
                      className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      📄 Exporter PDF
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {currentData.summary}
                </p>
              </section>
            )}

            {/* QUESTIONS / RÉPONSES */}
            {currentData.qa && currentData.qa.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-lg font-bold text-purple-400 mb-4">❓ Questions & Réponses</h2>
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

            {/* DESSINS TECHNIQUES ET IMAGES */}
            {currentData.illustrations && currentData.illustrations.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-lg font-bold text-amber-400 mb-4">🎨 Schémas & Dessins Techniques</h2>
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

            {/* QUIZ INTERACTIF VERT / ROUGE */}
            {currentData.quiz && currentData.quiz.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-lg font-bold text-blue-400 mb-4">📝 Quiz de Révision</h2>
                <div className="space-y-5">
                  {currentData.quiz.map((q, qIdx) => {
                    const selectedOption = userAnswers[qIdx];
                    const isAnswered = selectedOption !== undefined;

                    return (
                      <div key={qIdx} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <p className="text-sm font-medium mb-3 text-slate-200">{qIdx + 1}. {q.question}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => {
                            let btnStyle = "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800";
                            
                            if (isAnswered) {
                              if (optIdx === q.correctIndex) {
                                btnStyle = "bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold";
                              } else if (optIdx === selectedOption && selectedOption !== q.correctIndex) {
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
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* VUE 2 : DEVOIRS DE RÉFÉRENCE */}
        {activeTab === 'references' && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">📑 Devoirs & Documents de Référence</h2>
            <p className="text-xs text-slate-400">Consultez vos devoirs, TP et cours enregistrés comme références de travail.</p>

            {references.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-6 text-center">Aucun devoir de référence enregistré pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {references.map((item) => (
                  <div key={item.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-bold text-slate-200">{item.title}</h3>
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/30">
                        {item.type} • {item.subject}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Ajouté le {item.date}</p>
                    <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded border border-slate-800 line-clamp-3">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* VUE 3 : HISTORIQUE DE GÉNÉRATION */}
        {activeTab === 'history' && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-emerald-400">📜 Historique des Synthèses</h2>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('samnote_history');
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Effacer l'historique
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-6 text-center">Votre historique est vide.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-200">{item.title}</h3>
                      <span className="text-xs text-slate-400">{item.date}</span>
                    </div>
                    {item.summary && (
                      <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 line-clamp-3">
                        {item.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}