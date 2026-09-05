'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, Upload, BookOpen, HelpCircle, Download, CheckCircle2, 
  XCircle, Award, RefreshCw, Zap, ArrowRight, FileText, BrainCircuit,
  History, Trash2, Clock, File, Volume2, Square, Pause, Play, Tv,
  ChevronRight, ChevronLeft, X
} from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface SavedStudySession {
  id: string;
  title: string;
  date: string;
  summary: string[];
  quiz: Question[];
}

function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

const DEMO_SUMMARY = [
  "La photosynthèse est le processus biochimique par lequel les plantes convertissent la lumière en énergie chimique.",
  "La chlorophylle captive la lumière du soleil dans les chloroplastes des cellules végétales.",
  "Réaction chimique globale : 6CO2 + 6H2O + Lumière donnent du Glucose + 6O2.",
  "Elle produit du glucose (nourriture de la plante) et libère du dioxygène dans l'atmosphère."
];

const DEMO_QUIZ: Question[] = [
  {
    id: 1,
    question: "Où se déroule principalement la photosynthèse chez la plante ?",
    options: ["Dans les racines", "Dans les chloroplastes des feuilles", "Dans la tige", "Dans les fleurs"],
    answer: "Dans les chloroplastes des feuilles",
    explanation: "Les chloroplastes contiennent la chlorophylle, le pigment vert qui absorbe la lumière solaire."
  },
  {
    id: 2,
    question: "Quel gaz est libéré dans l'air comme sous-produit de la photosynthèse ?",
    options: ["Le dioxyde de carbone", "L'azote", "Le dioxygène", "Le méthane"],
    answer: "Le dioxygène",
    explanation: "La plante consomme du CO2 et de l'eau pour produire du glucose, libérant du O2 pur dans l'air."
  }
];

export default function Home() {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [isDragging, setIsDragging] = useState(false);

  // Historique
  const [history, setHistory] = useState<SavedStudySession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Gestion de la Synthèse Vocale globale
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);

  // État de la Capsule Vidéo Interactive
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('studyquiz_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur de chargement de l'historique", e);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Lecture audio de la capsule vidéo slide par slide
  useEffect(() => {
    if (isVideoMode && summary && summary[currentSlide]) {
      speakSlideText(summary[currentSlide]);
    }
  }, [currentSlide, isVideoMode]);

  const speakSlideText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;

    utterance.onend = () => {
      // Passer automatiquement au point suivant si disponible
      if (summary && currentSlide < summary.length - 1) {
        setCurrentSlide((prev) => prev + 1);
      } else {
        setIsPlayingAudio(false);
      }
    };

    synth.speak(utterance);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
  };

  const startVideoCapsule = () => {
    if (!summary || summary.length === 0) return;
    setCurrentSlide(0);
    setIsVideoMode(true);
  };

  const closeVideoCapsule = () => {
    handleSpeechStop();
    setIsVideoMode(false);
  };

  const handleSpeechToggle = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    if (isPlayingAudio) {
      if (isPausedAudio) {
        synth.resume();
        setIsPausedAudio(false);
      } else {
        synth.pause();
        setIsPausedAudio(true);
      }
      return;
    }

    if (!summary || summary.length === 0) return;
    synth.cancel();

    const fullText = "Fiche de synthèse. " + summary.join(". ");
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    synth.speak(utterance);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
  };

  const handleSpeechStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
  };

  const saveToHistory = (newSummary: string[], newQuiz: Question[]) => {
    const title = newSummary[0] ? newSummary[0].slice(0, 40) + "..." : "Fiche de révision";
    const newSession: SavedStudySession = {
      id: Date.now().toString(),
      title,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      summary: newSummary,
      quiz: newQuiz
    };

    const updatedHistory = [newSession, ...history.filter(item => item.id !== newSession.id)].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('studyquiz_history', JSON.stringify(updatedHistory));
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('studyquiz_history', JSON.stringify(updated));
  };

  const loadFromHistory = (session: SavedStudySession) => {
    handleSpeechStop();
    setSummary(session.summary);
    setQuiz(session.quiz);
    setSelectedAnswers({});
    setFilePreview(null);
    setSelectedFile(null);
    setShowHistory(false);
  };

  const handleFileChange = (file: File | undefined) => {
    if (file) {
      handleSpeechStop();
      setSelectedFile(file);
      const isPdfFile = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      setIsPdf(isPdfFile);

      if (isPdfFile) {
        setFilePreview(file.name);
      } else {
        setFilePreview(URL.createObjectURL(file));
      }

      setSummary(null);
      setQuiz(null);
      setSelectedAnswers({});
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileChange(file);
  };

  const handleGenerateContent = async () => {
    if (!selectedFile) return;

    handleSpeechStop();
    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.summary && data.quiz) {
        const shuffledQuiz = data.quiz.map((q: Question) => ({
          ...q,
          options: shuffleArray(q.options),
        }));
        setSummary(data.summary);
        setQuiz(shuffledQuiz);
        saveToHistory(data.summary, shuffledQuiz);
      } else {
        alert("Erreur lors du traitement du fichier.");
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = () => {
    handleSpeechStop();
    setIsPdf(false);
    setFilePreview("https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800");
    setSummary(DEMO_SUMMARY);
    setQuiz(DEMO_QUIZ);
    setSelectedAnswers({});
    saveToHistory(DEMO_SUMMARY, DEMO_QUIZ);
  };

  const handleSelectOption = (questionId: number, option: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleExportPDF = () => {
    window.print();
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = quiz ? quiz.filter(q => selectedAnswers[q.id] === q.answer).length : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      
      {/* MODAL CAPSULE VIDÉO INTERACTIVE PLEIN ÉCRAN */}
      {isVideoMode && summary && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-300">
          
          {/* BARRES DE PROGRESSION DE LA CAPSULE */}
          <div className="flex gap-2 w-full max-w-2xl mx-auto pt-2">
            {summary.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  idx <= currentSlide ? 'bg-indigo-500' : 'bg-slate-800'
                }`} 
              />
            ))}
          </div>

          {/* BOUTON FERMER */}
          <button 
            onClick={closeVideoCapsule} 
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          {/* CONTENU ANIMÉ DE LA SLIDE / CAPSULE */}
          <div className="max-w-3xl mx-auto my-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-semibold">
              <Tv className="w-4 h-4" /> Point {currentSlide + 1} / {summary.length}
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 leading-relaxed tracking-tight px-4 animate-in zoom-in-95 duration-300">
              "{summary[currentSlide]}"
            </h2>
          </div>

          {/* CONTRÔLES DU LECTEUR VIDÉO */}
          <div className="flex items-center justify-center gap-6 pb-6">
            <button
              disabled={currentSlide === 0}
              onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleSpeechToggle}
              className="p-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-all"
            >
              {isPlayingAudio && !isPausedAudio ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-current ml-1" />}
            </button>

            <button
              disabled={currentSlide === summary.length - 1}
              onClick={() => setCurrentSlide(prev => Math.min(summary.length - 1, prev + 1))}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ARRIÈRE PLAN FLOU */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 print:hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-6 space-y-10">

        {/* NAVIGATION */}
        <div className="flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white shadow-lg">
              S
            </div>
            <span className="font-extrabold text-lg tracking-tight">StudyQuiz <span className="text-indigo-400">AI</span></span>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-all text-slate-300"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span>Mes Fiches ({history.length})</span>
          </button>
        </div>

        {/* HISTORIQUE */}
        {showHistory && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl print:hidden space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Fiches Récents
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-xs text-slate-400 hover:text-white">Fermer</button>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Aucune fiche enregistrée.</p>
            ) : (
              <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 flex justify-between items-center cursor-pointer group transition-all"
                  >
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-indigo-300 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-500">{item.date} • {item.quiz.length} questions</p>
                    </div>
                    <button
                      onClick={(e) => deleteFromHistory(item.id, e)}
                      className="p-2 text-slate-500 hover:text-rose-400 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HERO HEADER */}
        <div className="text-center space-y-3 print:hidden">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Transforme tes cours en Fiches & Quiz
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Révise plus vite avec l'IA
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Dépose une photo de ton cahier ou un cours PDF. Notre IA extrait l'essentiel et génère un QCM.
          </p>
        </div>

        {/* UPLOAD ZONE */}
        <div className="space-y-4 print:hidden">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all duration-300 bg-slate-900/40 backdrop-blur-sm ${
              isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              id="file-upload" 
              className="hidden" 
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            
            {!filePreview ? (
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200 text-sm sm:text-base">Glisse un document ici ou clique pour parcourir</p>
                  <p className="text-slate-500 text-xs mt-1">Images (PNG, JPG) ou documents PDF</p>
                </div>
              </label>
            ) : (
              <div className="space-y-4">
                {isPdf ? (
                  <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700 max-w-md mx-auto">
                    <FileText className="w-8 h-8 text-rose-400" />
                    <span className="font-medium text-sm text-slate-200 truncate">{filePreview}</span>
                  </div>
                ) : (
                  <div className="relative max-w-xs mx-auto rounded-2xl overflow-hidden border border-slate-700 shadow-xl max-h-48">
                    <img src={filePreview} alt="Aperçu du cours" className="w-full object-cover" />
                  </div>
                )}

                <div className="flex items-center justify-center gap-3">
                  <label htmlFor="file-upload" className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold cursor-pointer transition-all">
                    Changer de fichier
                  </label>
                  <button
                    onClick={handleGenerateContent}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Analyse...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" /> Générer Fiche & Quiz
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!filePreview && (
            <div className="text-center">
              <button onClick={loadDemo} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline">
                Ou essayer avec un cours d'exemple (Photosynthèse)
              </button>
            </div>
          )}
        </div>

        {/* CONTENU GÉNÉRÉ */}
        {(summary || quiz) && (
          <div className="space-y-10 animate-in fade-in duration-500">
            
            {/* ACTION BAR */}
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-lg text-slate-100">Votre Espace de Révision</h2>
              </div>

              <div className="flex items-center gap-3">
                {/* BOUTON D'ACTIVATION DE LA CAPSULE VIDÉO */}
                {summary && (
                  <button
                    onClick={startVideoCapsule}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Tv className="w-4 h-4" /> Mode Capsule Vidéo
                  </button>
                )}

                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all"
                >
                  <Download className="w-4 h-4" /> Imprimer / PDF
                </button>
              </div>
            </div>

            {/* FICHE DE SYNTHÈSE */}
            {summary && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-sm shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-100">Fiche de Synthèse</h3>
                      <p className="text-xs text-slate-500">L'essentiel à retenir de votre document</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={handleSpeechToggle}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isPlayingAudio 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isPlayingAudio ? (
                        isPausedAudio ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span>{isPlayingAudio ? (isPausedAudio ? "Reprendre" : "Pause") : "Écouter"}</span>
                    </button>
                  </div>
                </div>

                <ul className="space-y-3 pt-2">
                  {summary.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* SECTION QUIZ */}
            {quiz && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-sm shadow-xl">
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-100">Quiz de Validation</h3>
                      <p className="text-xs text-slate-500">Testez votre compréhension</p>
                    </div>
                  </div>

                  {answeredCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Score : {correctCount} / {quiz.length}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {quiz.map((q, qIdx) => {
                    const selected = selectedAnswers[q.id];
                    const isAnswered = !!selected;

                    return (
                      <div key={q.id} className="space-y-3 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                        <p className="font-semibold text-sm sm:text-base text-slate-200">
                          <span className="text-indigo-400 font-bold mr-2">{qIdx + 1}.</span> {q.question}
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            let btnStyle = "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700";

                            if (isAnswered) {
                              if (opt === q.answer) {
                                btnStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium";
                              } else if (opt === selected && opt !== q.answer) {
                                btnStyle = "bg-rose-500/10 border-rose-500/40 text-rose-300 font-medium";
                              } else {
                                btnStyle = "bg-slate-900/40 border-slate-800/40 text-slate-600 opacity-60";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectOption(q.id, opt)}
                                disabled={isAnswered}
                                className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex justify-between items-center gap-2 ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {isAnswered && opt === q.answer && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                                {isAnswered && opt === selected && opt !== q.answer && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 space-y-1 animate-in fade-in duration-200">
                            <span className="font-bold text-indigo-400">Explication :</span> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}