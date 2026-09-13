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
    { name: 'Droit', icon: '⚖️' },
    { name: 'Support & Contact', icon: '💬' }
  ];

  const [currentSubject, setCurrentSubject] = useState<string>('Électricité');
  const [activeTab, setActiveTab] = useState<'workspace' | 'references' | 'calculator' | 'history'>('workspace');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);

  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [refTitle, setRefTitle] = useState<string>('');
  const [refType, setRefType] = useState<string>('Cours de Référence');
  const [refContentText, setRefContentText] = useState<string>('');
  const [refImageData, setRefImageData] = useState<string>('');
  const [refSubject, setRefSubject] = useState<string>('Électricité');

  const [references, setReferences] = useState<SavedReference[]>([]);
  const [history, setHistory] = useState<SavedReference[]>([]);

  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  
  // États du Calculateur Électronique
  const [ohmV, setOhmV] = useState<string>('');
  const [ohmR, setOhmR] = useState<string>('');
  const [ohmI, setOhmI] = useState<string>('');
  const [ohmP, setOhmP] = useState<string>('');

  const [resSeries, setResSeries] = useState<string>('100, 220, 470');
  const [resParallel, setResParallel] = useState<string>('100, 100');

  const [divUe, setDivUe] = useState<string>('12');
  const [divR1, setDivR1] = useState<string>('1000');
  const [divR2, setDivR2] = useState<string>('1000');

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

  const closeSplashScreen = () => {
    setShowSplashScreen(false);
  };

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

  // Calculs Loi d'Ohm
  const calculateOhm = (field: 'V' | 'R' | 'I' | 'P') => {
    const v = parseFloat(ohmV);
    const r = parseFloat(ohmR);
    const i = parseFloat(ohmI);
    const p = parseFloat(ohmP);

    if (field === 'V') {
      if (!isNaN(r) && !isNaN(i)) setOhmV((r * i).toFixed(2));
      else if (!isNaN(p) && !isNaN(i) && i !== 0) setOhmV((p / i).toFixed(2));
      else if (!isNaN(p) && !isNaN(r)) setOhmV((Math.sqrt(p * r)).toFixed(2));
    } else if (field === 'I') {
      if (!isNaN(v) && !isNaN(r) && r !== 0) setOhmI((v / r).toFixed(4));
      else if (!isNaN(p) && !isNaN(v) && v !== 0) setOhmI((p / v).toFixed(4));
      else if (!isNaN(p) && !isNaN(r) && r !== 0) setOhmI((Math.sqrt(p / r)).toFixed(4));
    } else if (field === 'R') {
      if (!isNaN(v) && !isNaN(i) && i !== 0) setOhmR((v / i).toFixed(2));
      else if (!isNaN(v) && !isNaN(p) && p !== 0) setOhmR(((v * v) / p).toFixed(2));
      else if (!isNaN(p) && !isNaN(i) && i !== 0) setOhmR((p / (i * i)).toFixed(2));
    } else if (field === 'P') {
      if (!isNaN(v) && !isNaN(i)) setOhmP((v * i).toFixed(2));
      else if (!isNaN(v) && !isNaN(r) && r !== 0) setOhmP(((v * v) / r).toFixed(2));
      else if (!isNaN(r) && !isNaN(i)) setOhmP((r * i * i).toFixed(2));
    }
  };

  // Calcul Série / Parallèle
  const parseResistors = (str: string): number[] => {
    return str
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n) && n > 0);
  };

  const seriesTotal = parseResistors(resSeries).reduce((acc, val) => acc + val, 0);
  const parallelTotal = (() => {
    const vals = parseResistors(resParallel);
    if (vals.length === 0) return 0;
    const invSum = vals.reduce((acc, val) => acc + (1 / val), 0);
    return invSum !== 0 ? 1 / invSum : 0;
  })();

  // Diviseur de tension
  const calculateVoltageDivider = () => {
    const ue = parseFloat(divUe) || 0;
    const r1 = parseFloat(divR1) || 0;
    const r2 = parseFloat(divR2) || 0;
    if (r1 + r2 === 0) return 0;
    return ue * (r2 / (r1 + r2));
  };

  const currentData = subjectData[currentSubject] || {};

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans max-w-full overflow-x-hidden">
      
      {/* ÉCRAN DE DÉMARRAGE PLEIN ÉCRAN */}
      {showSplashScreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between items-center p-4 md:p-6 text-center select-none">
          <div className="pt-4 md:pt-6 flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-500/20 mb-2">
              ⚡
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
              Samnote
            </h1>
            <p className="text-xs text-blue-400 font-medium mt-0.5">
              Assistant Virtuel & Espace de Cours BP Électronique
            </p>
          </div>

          <div className="w-full max-w-md my-auto space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl aspect-video flex items-center justify-center">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/demo.mp4" type="video/mp4" />
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed px-2">
              Plateforme d'apprentissage, résumés de cours, quiz interactifs et fiches techniques.
            </p>
          </div>

          <div className="w-full max-w-md pb-4 md:pb-6">
            <button
              onClick={closeSplashScreen}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-xl text-base shadow-lg transition-all transform active:scale-95"
            >
              Accéder à l'application
            </button>
          </div>
        </div>
      )}

      {/* BARRE HAUTE MOBILE */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center text-xs font-bold text-white">
            ⚡
          </div>
          <h1 className="text-base font-bold text-white">Samnote</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSplashScreen(true)}
            className="bg-slate-800 text-blue-400 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700"
          >
            Présentation
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700"
          >
            {isMobileMenuOpen ? 'Fermer' : 'Menu'}
          </button>
        </div>
      </div>

      {/* BARRE LATÉRALE */}
      <aside className={`${
        isMobileMenuOpen ? 'block' : 'hidden'
      } md:block w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex-shrink-0 z-20`}>
        
        <div className="hidden md:flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center font-bold text-xl text-white shadow-lg">
            ⚡
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wide">Samnote</h1>
            <p className="text-[10px] text-blue-400 font-medium">BP Électronique</p>
          </div>
        </div>
        
        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Navigation</p>
        <div className="space-y-1 mb-6">
          <button
            onClick={() => { setActiveTab('workspace'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'workspace' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Espace de Travail
          </button>
          <button
            onClick={() => { setActiveTab('calculator'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'calculator' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            🧮 Calculateur Électronique
          </button>
          <button
            onClick={() => { setActiveTab('references'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'references' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cours & Devoirs Référence
          </button>
          <button
            onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Historique ({history.length})
          </button>
        </div>

        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Matières & Support</p>
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
        
        {/* VUE : CALCULATEUR ÉLECTRONIQUE */}
        {activeTab === 'calculator' ? (
          <div className="space-y-6 max-w-3xl mx-auto py-2">
            <div>
              <h2 className="text-xl font-bold text-white">Calculateur Électronique</h2>
              <p className="text-xs text-slate-400">Outils de calcul rapide pour la loi d'Ohm, les résistances et le diviseur de tension.</p>
            </div>

            {/* 1. LOI D'OHM */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-blue-400">Loi d'Ohm ($U = R \times I, P = U \times I$)</h3>
                <span className="text-[10px] text-slate-500">Remplissez 2 champs pour calculer les autres</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Tension U (V)</label>
                  <input
                    type="number"
                    value={ohmV}
                    onChange={(e) => { setOhmV(e.target.value); }}
                    onBlur={() => calculateOhm('V')}
                    placeholder="ex: 12"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Résistance R (Ω)</label>
                  <input
                    type="number"
                    value={ohmR}
                    onChange={(e) => { setOhmR(e.target.value); }}
                    onBlur={() => calculateOhm('R')}
                    placeholder="ex: 220"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Intensité I (A)</label>
                  <input
                    type="number"
                    value={ohmI}
                    onChange={(e) => { setOhmI(e.target.value); }}
                    onBlur={() => calculateOhm('I')}
                    placeholder="ex: 0.054"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Puissance P (W)</label>
                  <input
                    type="number"
                    value={ohmP}
                    onChange={(e) => { setOhmP(e.target.value); }}
                    onBlur={() => calculateOhm('P')}
                    placeholder="ex: 0.65"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setOhmV('');
                    setOhmR('');
                    setOhmI('');
                    setOhmP('');
                  }}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1 bg-slate-800 rounded-lg"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* 2. RÉSISTANCES EN SÉRIE ET PARALLÈLE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-emerald-400">Résistances en Série</h3>
                <p className="text-[11px] text-slate-400">Séparez les valeurs par des virgules (ex: 100, 220, 470)</p>
                <input
                  type="text"
                  value={resSeries}
                  onChange={(e) => setResSeries(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400">R équivalente :</span>
                  <span className="text-sm font-bold text-emerald-400">{seriesTotal.toFixed(2)} Ω</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-purple-400">Résistances en Parallèle</h3>
                <p className="text-[11px] text-slate-400">Séparez les valeurs par des virgules (ex: 100, 100)</p>
                <input
                  type="text"
                  value={resParallel}
                  onChange={(e) => setResParallel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400">R équivalente :</span>
                  <span className="text-sm font-bold text-purple-400">{parallelTotal.toFixed(2)} Ω</span>
                </div>
              </div>
            </div>

            {/* 3. DIVISEUR DE TENSION */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-amber-400">
              Pont Diviseur de Tension (U<sub>s</sub> = U<sub>e</sub> &times; R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>))
            </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Tension d'entrée $U_e$ (V)</label>
                  <input
                    type="number"
                    value={divUe}
                    onChange={(e) => setDivUe(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Résistance $R_1$ (Ω)</label>
                  <input
                    type="number"
                    value={divR1}
                    onChange={(e) => setDivR1(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Résistance $R_2$ (Ω)</label>
                  <input
                    type="number"
                    value={divR2}
                    onChange={(e) => setDivR2(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                  />
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center mt-2">
                <span className="text-xs text-slate-300">Tension de sortie calculée ($U_s$) :</span>
                <span className="text-sm font-bold text-amber-400">{calculateVoltageDivider().toFixed(3)} V</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'workspace' && currentSubject === 'Support & Contact' ? (
          <div className="space-y-6 max-w-2xl mx-auto py-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl">
                  💬
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Support & Amélioration de la Page</h2>
                  <p className="text-xs text-slate-400">Contactez-moi pour suggérer des améliorations ou signaler un problème.</p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-4 text-sm text-slate-300">
                <p>
                  Cette application a été conçue pour vous accompagner dans vos études en électronique. Vos retours, idées d'améliorations ou signalements de bugs sont précieux pour faire évoluer la plateforme.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <a
                    href="https://wa.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 p-4 rounded-xl flex items-center gap-3 transition-all text-emerald-300"
                  >
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wide">WhatsApp</p>
                      <p className="text-xs text-slate-300">Envoyer un message direct</p>
                    </div>
                  </a>

                  <a
                    href="mailto:skillforgeofficiel@gmail.com"
                    className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 p-4 rounded-xl flex items-center gap-3 transition-all text-blue-300"
                  >
                    <span className="text-2xl">✉️</span>
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wide">E-mail</p>
                      <p className="text-xs text-slate-300">skillforgeofficiel@gmail.com</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'references' ? (
          <div className="space-y-6 max-w-4xl mx-auto py-2">
            <div>
              <h2 className="text-xl font-bold text-white">Cours & Devoirs Référence</h2>
              <p className="text-xs text-slate-400">Enregistrez vos cours, TP ou devoirs pour guider l'assistant IA.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-bold text-blue-400">Ajouter une Référence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Titre</label>
                  <input
                    type="text"
                    value={refTitle}
                    onChange={(e) => setRefTitle(e.target.value)}
                    placeholder="Ex: TP Transistor BJT"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Matière</label>
                  <select
                    value={refSubject}
                    onChange={(e) => setRefSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                  >
                    {subjectsList.filter(s => s.name !== 'Support & Contact').map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium">Type</label>
                <select
                  value={refType}
                  onChange={(e) => setRefType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                >
                  <option value="Cours de Référence">Cours de Référence</option>
                  <option value="Énoncé de Devoir">Énoncé de Devoir</option>
                  <option value="Compte rendu TP">Compte rendu TP</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium">Contenu du texte (optionnel si photo)</label>
                <textarea
                  rows={3}
                  value={refContentText}
                  onChange={(e) => setRefContentText(e.target.value)}
                  placeholder="Collez le texte du cours ou notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  ref={refPhotoInputRef}
                  onChange={handleRefPhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => refPhotoInputRef.current?.click()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-700"
                >
                  📷 Ajouter une photo
                </button>
                {refImageData && (
                  <span className="text-xs text-emerald-400">Photo chargée ✓</span>
                )}
              </div>

              <button
                onClick={handleSaveReference}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
              >
                Enregistrer la Référence
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Références Enregistrées ({references.length})</h3>
              {references.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucune référence enregistrée pour le moment.</p>
              ) : (
                references.map((ref) => (
                  <div key={ref.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-400">{ref.subject}</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">{ref.type}</span>
                        <span className="text-[10px] text-slate-500">{ref.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{ref.title}</h4>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{ref.content}</p>
                      {ref.imageDataUrl && (
                        <img src={ref.imageDataUrl} alt="Référence" className="w-32 h-32 object-cover rounded-lg mt-2 border border-slate-700" />
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteReference(ref.id)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-950/40 border border-red-900/40 rounded-lg"
                    >
                      Supprimer
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="space-y-6 max-w-4xl mx-auto py-2">
            <div>
              <h2 className="text-xl font-bold text-white">Historique des Générations</h2>
              <p className="text-xs text-slate-400">Retrouvez vos résumés et quiz générés précédemment.</p>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Aucun historique pour le moment.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400">{item.subject}</span>
                      <span className="text-[10px] text-slate-500">{item.date}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  {item.summary && (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap">
                      {item.summary}
                    </div>
                  )}
                  {item.summary && (
                    <button
                      onClick={() => handleExportPDF(item.title, item.subject, item.summary)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      📄 Exporter en PDF
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* WORKSPACE NORMAL TAB */
          <div className="space-y-6 max-w-4xl mx-auto py-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div>
                <span className="text-[10px] text-blue-400 uppercase font-semibold">Matière active</span>
                <h2 className="text-xl font-bold text-white">{currentSubject}</h2>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un composant / concept..."
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  {searchLoading ? 'Recherche...' : 'Rechercher'}
                </button>
                {searchResult && (
                  <button
                    onClick={clearSearch}
                    className="bg-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs"
                  >
                    X
                  </button>
                )}
              </div>
            </div>

            {searchResult && (
              <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-blue-400">{searchResult.term}</h3>
                </div>
                {searchResult.imageUrl && (
                  <img src={searchResult.imageUrl} alt={searchResult.term} className="w-full max-h-52 object-contain rounded-lg bg-slate-950 p-2" />
                )}
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{searchResult.definition}</p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Fonctionnement :</p>
                  <p className="text-xs text-slate-300">{searchResult.howItWorks}</p>
                </div>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-300">Saisir ou coller votre texte de cours / sujet :</label>
              <textarea
                rows={5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Collez ici le cours ou posez votre question en électronique..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700"
                  >
                    📁 Joindre un fichier
                  </button>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all"
                >
                  {loading ? 'Génération en cours...' : 'Générer Résumé, Q&A & Quiz'}
                </button>
              </div>
            </div>

            {currentData.summary && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-emerald-400">📘 Résumé du Cours</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAudio(currentData.summary || '')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs"
                    >
                      {isPlayingAudio ? '⏹️ Arrêter Audio' : '🔊 Écouter'}
                    </button>
                    <button
                      onClick={() => handleExportPDF(`Résumé_${currentSubject}`, currentSubject, currentData.summary)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs"
                    >
                      📄 PDF
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{currentData.summary}</p>
              </div>
            )}

            {currentData.qa && currentData.qa.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-blue-400">❓ Questions & Réponses Clés</h3>
                <div className="space-y-2">
                  {currentData.qa.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                      <p className="text-xs font-bold text-white">Q{idx + 1}: {item.question}</p>
                      <p className="text-xs text-slate-300">R: {item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentData.quiz && currentData.quiz.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-purple-400">📝 Quiz d'auto-évaluation</h3>
                <div className="space-y-4">
                  {currentData.quiz.map((q, qIdx) => {
                    const selectedOpt = userAnswers[qIdx];
                    return (
                      <div key={qIdx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                        <p className="text-xs font-bold text-white">{qIdx + 1}. {q.question}</p>
                        <div className="space-y-1.5">
                          {q.options.map((opt, optIdx) => {
                            let btnStyle = 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700';
                            if (selectedOpt !== undefined) {
                              if (optIdx === q.correctIndex) {
                                btnStyle = 'bg-emerald-950/50 text-emerald-300 border-emerald-500/50';
                              } else if (selectedOpt === optIdx) {
                                btnStyle = 'bg-red-950/50 text-red-300 border-red-500/50';
                              }
                            }
                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleOptionClick(qIdx, optIdx)}
                                className={`w-full text-left p-2 rounded-lg text-xs border transition-all ${btnStyle}`}
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
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}