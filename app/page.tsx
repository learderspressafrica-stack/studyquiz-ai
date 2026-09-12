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
  imageDataUrl?: string;
  summary?: string;
  qa?: QAItem[];
  quiz?: QuizItem[];
}

export default function SamnoteWorkspace() {
  const subjectsList = [
    { name: 'Électricité', icon: '⚡' },
    { name: 'Électronique Analogique', icon: '📻' },
    { name: 'Électronique Numérique', icon: '🔢' },
    { name: 'Mesures Électroniques', icon: '📏' },
    { name: 'Automatisme', icon: '⚙️' },
    { name: 'Technologie', icon: '🛠️' },
    { name: 'Utilisation', icon: '🔌' },
    { name: 'TP (Travaux Pratiques)', icon: '🔬' },
    { name: 'Dessin Technique', icon: '📐' },
    { name: 'Gestion', icon: '📊' },
    { name: 'Droit', icon: '⚖️' }
  ];

  const [currentSubject, setCurrentSubject] = useState<string>('Électricité');
  const [activeTab, setActiveTab] = useState<'workspace' | 'history' | 'references'>('workspace');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Devs & Références
  const [refTitle, setRefTitle] = useState<string>('');
  const [refType, setRefType] = useState<string>('Cours de Référence');
  const [refContentText, setRefContentText] = useState<string>('');
  const [refImageData, setRefImageData] = useState<string>('');
  const [refSubject, setRefSubject] = useState<string>('Électricité');

  const [references, setReferences] = useState<SavedReference[]>([]);
  const [history, setHistory] = useState<SavedReference[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SavedReference | null>(null);

  // Audio & Quiz
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const [subjectData, setSubjectData] = useState<Record<string, {
    summary?: string;
    qa?: QAItem[];
    illustrations?: ComponentIllustration[];
    quiz?: QuizItem[];
  }>>({});

  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    const savedHist = localStorage.getItem('samnote_history');
    if (savedHist) setHistory(JSON.parse(savedHist));

    const savedRefs = localStorage.getItem('samnote_references');
    if (savedRefs) setReferences(JSON.parse(savedRefs));
  }, []);

  const handleSubjectChange = (subject: string) => {
    setCurrentSubject(subject);
    setRefSubject(subject);
    setSearchResult(null);
    setUserAnswers({});
    setIsMobileMenuOpen(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => setInputText(event.target?.result as string || '');
      reader.readAsText(file);
    } else {
      setInputText(`[Document / Image chargée : ${file.name}]\nSaisissez des détails supplémentaires pour l'analyse...`);
    }
  };

  const handleRefPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setRefImageData(event.target?.result as string || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveReference = () => {
    if (!refTitle.trim()) {
      alert("Veuillez saisir un titre pour ce document de référence.");
      return;
    }

    if (!refContentText.trim() && !refImageData) {
      alert("Veuillez ajouter du texte ou prendre une photo de votre cours/devoir.");
      return;
    }

    const newRef: SavedReference = {
      id: Date.now().toString(),
      title: refTitle,
      subject: refSubject,
      date: new Date().toLocaleDateString('fr-FR'),
      type: refType,
      content: refContentText || '(Référence visuelle par photo)',
      imageDataUrl: refImageData,
    };

    const updated = [newRef, ...references];
    setReferences(updated);
    localStorage.setItem('samnote_references', JSON.stringify(updated));
    
    setRefTitle('');
    setRefContentText('');
    setRefImageData('');
    alert("Cours / Devoir de référence enregistré !");
  };

  const handleDeleteReference = (id: string) => {
    const updated = references.filter(r => r.id !== id);
    setReferences(updated);
    localStorage.setItem('samnote_references', JSON.stringify(updated));
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('samnote_history', JSON.stringify(updated));
    if (selectedHistoryItem?.id === id) setSelectedHistoryItem(null);
  };

  const handleExportPDF = (title: string, subject: string, summaryText?: string) => {
    if (!summaryText) {
      alert("Aucun résumé disponible pour l'exportation.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Export PDF - Samnote (${subject})</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; line-height: 1.6; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 5px; }
            .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 8px; margin-bottom: 20px; }
            h2 { color: #059669; margin-top: 0; }
            .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>⚡ Samnote - ${title}</h1>
          <div class="meta">Matière : <strong>${subject}</strong> | Date : ${new Date().toLocaleDateString('fr-FR')}</div>
          <div class="box">
            <h2>📘 Résumé Complet du Cours</h2>
            <p>${summaryText.replace(/\n/g, '<br/>')}</p>
          </div>
          <div class="footer">Document d'étude généré et conservé par Samnote</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const toggleAudio = (textToRead: string) => {
    if (!('speechSynthesis' in window)) {
      alert("La synthèse vocale n'est pas disponible sur votre appareil.");
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

  const fetchRealImage = async (term: string): Promise<string> => {
    try {
      const wikiFrRes = await fetch(
        `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
          term
        )}&prop=pageimages&pithumbsize=800&format=json&origin=*`
      );
      const wikiFrData = await wikiFrRes.json();
      if (wikiFrData.query?.pages) {
        const pages = wikiFrData.query.pages;
        const firstKey = Object.keys(pages)[0];
        if (firstKey !== '-1' && pages[firstKey]?.thumbnail?.source) {
          return pages[firstKey].thumbnail.source;
        }
      }

      const commonsRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          term + ' electronic component'
        )}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json&origin=*`
      );
      const commonsData = await commonsRes.json();
      if (commonsData.query?.pages) {
        const pages = commonsData.query.pages;
        const firstKey = Object.keys(pages)[0];
        if (pages[firstKey]?.thumbnail?.source) {
          return pages[firstKey].thumbnail.source;
        }
      }
    } catch (e) {
      console.error("Erreur récupération image réelle :", e);
    }

    return '';
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      alert("Veuillez saisir un texte de cours.");
      return;
    }
    setLoading(true);
    setUserAnswers({});

    const subjectRefs = references
      .filter(r => r.subject === currentSubject)
      .map(r => `[RÉFÉRENCE: ${r.title}] ${r.content}`)
      .join('\n');

    const promptCombined = `[Matière : ${currentSubject}]\n${subjectRefs ? `--- ÉLÉMENTS DE RÉFÉRENCE ENREGISTRÉS ---\n${subjectRefs}\n-----------------------------------\n` : ''}${inputText}`;

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptCombined }),
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

        const newHistItem: SavedReference = {
          id: Date.now().toString(),
          title: `Résumé : ${currentSubject} (${new Date().toLocaleDateString('fr-FR')})`,
          subject: currentSubject,
          date: new Date().toLocaleDateString('fr-FR'),
          type: 'Génération IA',
          content: inputText,
          summary: data.summary,
          qa: data.qa,
          quiz: data.quiz
        };

        const updatedHist = [newHistItem, ...history];
        setHistory(updatedHist);
        localStorage.setItem('samnote_history', JSON.stringify(updatedHist));

      } else {
        alert(data.error || "Erreur de génération.");
      }
    } catch (err) {
      alert("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);

    try {
      const promptSearch = `Explication claire, définition et fonctionnement du composant ou concept "${searchQuery}" pour un étudiant en ${currentSubject}.`;
      
      const realImgUrl = await fetchRealImage(searchQuery);

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
          characteristics: ['Spécifications techniques'],
          imageUrl: realImgUrl
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
  };

  const handleOptionClick = (questionIdx: number, optionIdx: number) => {
    if (userAnswers[questionIdx] !== undefined) return;
    setUserAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const currentData = subjectData[currentSubject] || {};

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans max-w-full overflow-x-hidden">
      
      {/* BARRE HAUTE MOBILE (MENU & TITRE) */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-lg font-bold text-blue-400 flex items-center gap-2">
          ⚡ Samnote
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700"
        >
          {isMobileMenuOpen ? '✕ Fermer' : '☰ Menu / Matières'}
        </button>
      </div>

      {/* BARRE LATÉRALE (DESKTOP ET MENU REPLIABLE MOBILE) */}
      <aside className={`${
        isMobileMenuOpen ? 'block' : 'hidden'
      } md:block w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex-shrink-0 z-20`}>
        
        <h1 className="hidden md:flex text-xl font-bold text-blue-400 mb-6 items-center gap-2">
          ⚡ Samnote
        </h1>
        
        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Navigation</p>
        <div className="space-y-1 mb-6">
          <button
            onClick={() => { setActiveTab('workspace'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'workspace' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📋 Espace de Travail
          </button>
          <button
            onClick={() => { setActiveTab('references'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'references' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📑 Cours & Devoirs Référence
          </button>
          <button
            onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            📜 Historique Complet ({history.length})
          </button>
        </div>

        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Matières & Filières</p>
        <div className="grid grid-cols-1 gap-1 max-h-[50vh] md:max-h-none overflow-y-auto pr-1">
          {subjectsList.map((sub) => (
            <button
              key={sub.name}
              onClick={() => handleSubjectChange(sub.name)}
              className={`px-3 py-2 rounded-lg text-sm text-left transition-colors flex items-center gap-2 ${
                currentSubject === sub.name && activeTab === 'workspace'
                  ? 'bg-blue-600/30 text-blue-400 font-medium border border-blue-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{sub.icon}</span>
              <span>{sub.name}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ZONE DE CONTENU PRINCIPAL */}
      <main className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 overflow-y-auto w-full max-w-full">
        
        {/* VUE 1 : ESPACE DE TRAVAIL */}
        {activeTab === 'workspace' && (
          <>
            {/* RECHERCHE COMPOSANTS AVEC EFFACEMENT RAPIDE SUR MOBILE */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder={`Rechercher un composant (ex: Diode 1N4007, NE555)...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded-full text-xs"
                    title="Vider la recherche"
                  >
                    ✕ Effacer
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {searchLoading ? 'Recherche...' : '🔍 Rechercher Photo'}
              </button>
            </div>

            {/* RÉSULTAT DE RECHERCHE */}
            {searchResult && (
              <section className="bg-slate-900 border border-blue-500/40 rounded-xl p-4 md:p-5 relative w-full">
                <button onClick={clearSearch} className="absolute top-3 right-3 text-slate-400 hover:text-white text-sm font-bold">✕</button>
                <h2 className="text-lg md:text-xl font-bold text-blue-400 mb-2 pr-6">💡 Photo & Fiche Technique : {searchResult.term}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-center">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs md:text-sm font-semibold text-slate-300">📖 Description & Fonctionnement :</h3>
                      <p className="text-xs md:text-sm text-slate-200 mt-1">{searchResult.definition}</p>
                    </div>

                    <a
                      href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchResult.term + ' composant electronique')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:underline bg-blue-950/60 border border-blue-700 px-3 py-2 rounded-lg transition-all w-full justify-center sm:w-auto"
                    >
                      🔍 Voir les photos sur Google Images ↗
                    </a>
                  </div>

                  {searchResult.imageUrl ? (
                    <div className="bg-slate-950 p-2 md:p-3 rounded-lg border border-slate-800 flex flex-col items-center">
                      <img 
                        src={searchResult.imageUrl} 
                        alt={searchResult.term} 
                        className="max-h-48 md:max-h-64 object-contain rounded-lg w-full"
                      />
                      <span className="text-[10px] text-slate-400 mt-2">Source : Wikipédia / Wikimedia Commons</span>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center text-slate-400 text-xs">
                      Aucune image Wikipédia directe. Utilisez le lien Google Images ci-dessus.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* FORMULAIRE DE SAISIE */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-4 space-y-3 w-full">
              <h2 className="text-sm md:text-md font-semibold text-slate-200">
                Saisie & Analyse — <span className="text-blue-400">{currentSubject}</span>
              </h2>
              
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Saisissez le texte du cours pour générer le résumé...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf,.txt" className="hidden" />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  📷 Importer Fichier / Photo
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? 'Analyse...' : '⚡ Générer & Enregistrer'}
                </button>
              </div>
            </section>

            {/* RÉSULTAT DU COURS GENERÉ */}
            {currentData.summary && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h2 className="text-md md:text-lg font-bold text-emerald-400">📘 Résumé ({currentSubject})</h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => toggleAudio(currentData.summary || '')} className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300">
                      {isPlayingAudio ? '⏹️ Arrêter' : '🔊 Écouter'}
                    </button>
                    <button onClick={() => handleExportPDF(`Fiche ${currentSubject}`, currentSubject, currentData.summary)} className="flex-1 sm:flex-initial bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 px-3 py-1.5 rounded-lg text-xs font-medium">
                      📄 PDF
                    </button>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-line">{currentData.summary}</p>
              </section>
            )}

            {/* QUESTIONS & RÉPONSES */}
            {currentData.qa && currentData.qa.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 w-full">
                <h2 className="text-md md:text-lg font-bold text-purple-400">❓ Questions & Réponses</h2>
                <div className="space-y-2">
                  {currentData.qa.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <p className="text-xs md:text-sm font-semibold text-purple-300">Q: {item.question}</p>
                      <p className="text-xs md:text-sm text-slate-300 mt-1">R: {item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* QUIZ INTERACTIF */}
            {currentData.quiz && currentData.quiz.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 w-full">
                <h2 className="text-md md:text-lg font-bold text-blue-400">📝 Quiz d'Évaluation</h2>
                <div className="space-y-4">
                  {currentData.quiz.map((q, qIdx) => {
                    const selectedOption = userAnswers[qIdx];
                    const isAnswered = selectedOption !== undefined;

                    return (
                      <div key={qIdx} className="bg-slate-950 p-3 md:p-4 rounded-lg border border-slate-800">
                        <p className="text-xs md:text-sm font-medium mb-3 text-slate-200">{qIdx + 1}. {q.question}</p>
                        <div className="grid grid-cols-1 gap-2">
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
                                className={`text-left text-xs p-2.5 rounded-lg border transition-all w-full ${btnStyle}`}
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

        {/* VUE 2 : COURS & DEVOIRS DE RÉFÉRENCE */}
        {activeTab === 'references' && (
          <div className="space-y-4 md:space-y-6 w-full">
            <section className="bg-slate-900 border border-blue-500/30 rounded-xl p-4 space-y-3 w-full">
              <h2 className="text-md md:text-lg font-bold text-blue-400">
                ➕ Enregistrer un Document de Référence
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Titre du document..."
                  value={refTitle}
                  onChange={(e) => setRefTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-blue-500"
                />

                <select
                  value={refSubject}
                  onChange={(e) => setRefSubject(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-300"
                >
                  {subjectsList.map(s => <option key={s.name} value={s.name}>{s.icon} {s.name}</option>)}
                </select>

                <select
                  value={refType}
                  onChange={(e) => setRefType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm text-slate-300"
                >
                  <option value="Cours de Référence">Cours de Référence</option>
                  <option value="Devoir de Référence">Devoir de Référence</option>
                  <option value="Travaux Pratiques (TP)">Travaux Pratiques (TP)</option>
                </select>
              </div>

              <textarea
                rows={3}
                placeholder="Texte du cours ou du devoir..."
                value={refContentText}
                onChange={(e) => setRefContentText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs md:text-sm focus:outline-none focus:border-blue-500"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <input
                  type="file"
                  ref={refPhotoInputRef}
                  onChange={handleRefPhotoUpload}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refPhotoInputRef.current?.click()}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    📸 Photo Directe
                  </button>

                  {refImageData && (
                    <span className="text-xs text-emerald-400 font-medium">✓ Photo prête</span>
                  )}
                </div>

                <button
                  onClick={handleSaveReference}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors"
                >
                  💾 Sauvegarder
                </button>
              </div>
            </section>

            {/* LISTE DES RÉFÉRENCES */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 w-full">
              <h2 className="text-md md:text-lg font-bold text-slate-100">📑 Documents de Référence</h2>

              {references.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">Aucun document enregistré.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {references.map((item) => (
                    <div key={item.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xs md:text-sm font-bold text-blue-400">{item.title}</h3>
                        <button onClick={() => handleDeleteReference(item.id)} className="text-[10px] text-rose-400 hover:underline">Supprimer</button>
                      </div>

                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <span className="bg-blue-600/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">{item.subject}</span>
                        <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{item.type}</span>
                        <span className="text-slate-500 py-0.5">{item.date}</span>
                      </div>

                      {item.imageDataUrl && (
                        <img src={item.imageDataUrl} alt={item.title} className="w-full h-32 object-cover rounded border border-slate-800" />
                      )}

                      {item.content && (
                        <p className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 whitespace-pre-line">
                          {item.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* VUE 3 : HISTORIQUE COMPLET */}
        {activeTab === 'history' && (
          <div className="space-y-4 w-full">
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 w-full">
              <div className="flex justify-between items-center">
                <h2 className="text-md md:text-lg font-bold text-emerald-400">📜 Historique</h2>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Voulez-vous supprimer tout l'historique ?")) {
                        setHistory([]);
                        localStorage.removeItem('samnote_history');
                        setSelectedHistoryItem(null);
                      }
                    }}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Vider l'historique
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">Aucun élément enregistre.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2 md:col-span-1">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedHistoryItem(item)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                          selectedHistoryItem?.id === item.id
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs font-bold text-blue-300">{item.title}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHistory(item.id);
                            }}
                            className="text-[10px] text-rose-400 hover:underline"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                          <span>{item.subject}</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {selectedHistoryItem ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <h3 className="text-xs md:text-sm font-bold text-blue-400">{selectedHistoryItem.title}</h3>
                          <button
                            onClick={() => handleExportPDF(selectedHistoryItem.title, selectedHistoryItem.subject, selectedHistoryItem.summary)}
                            className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 px-2.5 py-1 rounded text-[10px]"
                          >
                            📄 PDF
                          </button>
                        </div>

                        {selectedHistoryItem.summary && (
                          <div>
                            <h4 className="text-xs font-semibold text-emerald-400 mb-1">📘 Résumé :</h4>
                            <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-900 p-2.5 rounded border border-slate-800">
                              {selectedHistoryItem.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-slate-500 italic py-8">
                        Sélectionnez un élément dans la liste pour voir ses détails.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

      </main>
    </div>
  );
}