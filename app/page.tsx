'use client';

import React, { useState, useEffect } from 'react';

interface Matiere {
  id: string;
  name: string;
  icon: string;
}

const MATIERES: Matiere[] = [
  { id: 'electricite', name: 'Électricité', icon: '⚡' },
  { id: 'analogique', name: 'Électronique Analogique', icon: '🔌' },
  { id: 'numerique', name: 'Électronique Numérique', icon: '💻' },
  { id: 'automatisme', name: 'Automatisme', icon: '🤖' },
  { id: 'tp', name: 'Travaux Pratiques (TP)', icon: '🛠️' },
  { id: 'dessin_technique', name: 'Dessin Technique', icon: '📐' },
  { id: 'gestion', name: 'Gestion', icon: '📊' },
  { id: 'droit', name: 'Droit', icon: '⚖️' },
];

export default function Page() {
  const [selectedSubject, setSelectedSubject] = useState<string>(MATIERES[0].name);
  const [activeTab, setActiveTab] = useState<'generate' | 'search' | 'history'>('generate');
  
  // Saisie texte & photo
  const [courseText, setCourseText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  
  // États de chargement et résultats
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Historique & Filtres
  const [history, setHistory] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>('Toutes');

  // Réponses utilisateur au quiz
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});

  // Chargement de l'historique local (Fonctionne Hors-ligne)
  useEffect(() => {
    const savedHistory = localStorage.getItem('samnote_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Erreur lors du chargement de l\'historique', e);
      }
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Traitement Génération / Recherche
  const handleProcess = async (mode: 'generate' | 'search') => {
    const textToSubmit = mode === 'search' ? searchQuery : courseText;
    
    if (!textToSubmit && !imageFile) {
      setErrorMsg('Veuillez entrer une question/recherche ou joindre un cours.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setUserAnswers({});

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseText: textToSubmit,
          homeworkImageBase64: imageFile,
          userProfile: { subject: selectedSubject, mode },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors du traitement.');

      const newItem = {
        id: Date.now(),
        date: new Date().toLocaleDateString('fr-FR'),
        subject: selectedSubject,
        mode,
        data,
      };

      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('samnote_history', JSON.stringify(updatedHistory));

      setGeneratedData(data);
      if (mode === 'search') setActiveTab('generate');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un élément spécifique de l'historique
  const deleteHistoryItem = (idToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Évite d'ouvrir l'élément lors du clic sur supprimer
    const updatedHistory = history.filter((item) => item.id !== idToDelete);
    setHistory(updatedHistory);
    localStorage.setItem('samnote_history', JSON.stringify(updatedHistory));
  };

  // Télécharger une fiche au format texte (.txt)
  const downloadHistoryItem = (item: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Évite d'ouvrir l'élément lors du clic
    const data = item.data;
    
    let content = `=========================================\n`;
    content += `SAMNOTE - ${item.subject.toUpperCase()}\n`;
    content += `Date: ${item.date}\n`;
    content += `Titre: ${data.title}\n`;
    content += `=========================================\n\n`;
    content += `--- RESUME ---\n${data.summary}\n\n`;

    if (data.conceptExplanations && data.conceptExplanations.length > 0) {
      content += `--- NOTIONS CLES ---\n`;
      data.conceptExplanations.forEach((c: any) => {
        content += `• ${c.concept}: ${c.simpleDefinition}\n`;
      });
      content += `\n`;
    }

    if (data.quiz && data.quiz.length > 0) {
      content += `--- QUIZ D'AUTO-EVALUATION ---\n`;
      data.quiz.forEach((q: any, i: number) => {
        content += `Q${i + 1}: ${q.question}\n`;
        q.options.forEach((opt: string, optIdx: number) => {
          content += `  ${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
        });
        content += `  Réponse correcte: ${q.options[q.correctIndex]}\n`;
        content += `  Explication: ${q.explanation}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Samnote_${item.subject}_${item.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const speakAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOptionSelect = (qIndex: number, oIndex: number) => {
    if (userAnswers[qIndex] !== undefined) return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: oIndex }));
  };

  const calculateScore = () => {
    if (!generatedData?.quiz) return 0;
    let score = 0;
    generatedData.quiz.forEach((q: any, idx: number) => {
      if (userAnswers[idx] === q.correctIndex) score++;
    });
    return score;
  };

  const filteredHistory = history.filter((item: any) =>
    historyFilter === 'Toutes' ? true : item.subject === historyFilter
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SIDEBAR LATÉRALE À GAUCHE */}
      <aside style={{
        width: '280px',
        backgroundColor: '#111827',
        borderRight: '1px solid #1f2937',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div>
          {/* Logo App */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={{ backgroundColor: '#0284c7', padding: '8px 12px', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold' }}>⚡</div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>Samnote</h1>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>Électronique & Sciences</span>
            </div>
          </div>

          {/* Navigation Principale */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
            <button
              onClick={() => setActiveTab('generate')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'generate' ? '#1e293b' : 'transparent',
                color: activeTab === 'generate' ? '#38bdf8' : '#94a3b8',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              🚀 Workspace & Cours
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'history' ? '#1e293b' : 'transparent',
                color: activeTab === 'history' ? '#38bdf8' : '#94a3b8',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              📚 Historique ({history.length})
            </button>
          </nav>

          {/* Sélecteur de Matière */}
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
              Matière Active
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
              {MATIERES.map((m: Matiere) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedSubject(m.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: selectedSubject === m.name ? '#0284c7' : 'transparent',
                    color: selectedSubject === m.name ? '#ffffff' : '#94a3b8',
                    fontSize: '13px',
                    fontWeight: selectedSubject === m.name ? 'bold' : 'normal',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: '0.2s'
                  }}
                >
                  <span>{m.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ZONE PRINCIPALE DE TRAVAIL */}
      <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Barre de Recherche */}
        <div style={{ backgroundColor: '#1e293b', padding: '12px 16px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', border: '1px solid #334155' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input
            type="text"
            placeholder={`Rechercher ou poser une question ciblée sur : ${selectedSubject}...`}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleProcess('search')}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => handleProcess('search')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Rechercher
          </button>
        </div>

        {activeTab === 'generate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Boîte de Saisie */}
            <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '16px', color: '#38bdf8', margin: 0, fontWeight: 'bold' }}>
                  📥 Saisie de Cours ou Devoir ({selectedSubject})
                </h2>
              </div>

              <textarea
                placeholder={`Collez ici votre cours, une leçon ou une question technique en ${selectedSubject}...`}
                value={courseText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCourseText(e.target.value)}
                style={{
                  width: '100%',
                  height: '120px',
                  backgroundColor: '#0b0f19',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  marginBottom: '12px',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{
                  padding: '10px 16px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#e2e8f0',
                  fontWeight: '500'
                }}>
                  📷 Importer photo du cours
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>

                {imageFile && <span style={{ fontSize: '12px', color: '#4ade80' }}>✓ Photo jointe</span>}

                <button
                  onClick={() => handleProcess('generate')}
                  disabled={loading}
                  style={{
                    marginLeft: 'auto',
                    padding: '12px 24px',
                    backgroundColor: loading ? '#64748b' : '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Analyse & Génération...' : '⚡ Générer la Fiche & Quiz'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                {errorMsg}
              </div>
            )}

            {/* RÉSULTATS GÉNÉRÉS */}
            {generatedData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Résumé & Synthèse Vocale */}
                <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', backgroundColor: '#0284c7', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                      {selectedSubject}
                    </span>
                    {generatedData.audioScript && (
                      <button
                        onClick={() => speakAudio(generatedData.audioScript)}
                        style={{ padding: '6px 14px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🔊 Écouter l'explication audio
                      </button>
                    )}
                  </div>
                  <h3 style={{ fontSize: '18px', color: '#f8fafc', margin: '0 0 10px 0' }}>{generatedData.title}</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1', margin: 0 }}>{generatedData.summary}</p>
                </div>

                {/* Explications des Notions */}
                {generatedData.conceptExplanations && generatedData.conceptExplanations.length > 0 && (
                  <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1f2937' }}>
                    <h3 style={{ fontSize: '16px', color: '#38bdf8', marginTop: 0, marginBottom: '14px' }}>💡 Notions Clés & Images Illustratives</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                      {generatedData.conceptExplanations.map((item: any, idx: number) => (
                        <div key={idx} style={{ backgroundColor: '#0b0f19', padding: '14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                          <h4 style={{ color: '#facc15', margin: '0 0 6px 0', fontSize: '14px' }}>🔹 {item.concept}</h4>
                          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: '1.4' }}>{item.simpleDefinition}</p>
                          
                          <div style={{ marginTop: '10px', textAlign: 'center' }}>
                            <img
                              src={`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(item.concept)}.jpg`}
                              alt={item.concept}
                              onError={(e: any) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop';
                              }}
                              style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #334155' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions & Réponses Directes */}
                {generatedData.qaPairs && (
                  <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1f2937' }}>
                    <h3 style={{ fontSize: '16px', color: '#38bdf8', marginTop: 0, marginBottom: '14px' }}>❓ Questions / Réponses d'Examen</h3>
                    {generatedData.qaPairs.map((item: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc', margin: '0 0 4px 0' }}>Q{idx + 1}. {item.question}</p>
                        <p style={{ fontSize: '13px', color: '#4ade80', margin: 0 }}>R: {item.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* QUIZ INTERACTIF */}
                {generatedData.quiz && (
                  <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1f2937' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', color: '#38bdf8', margin: 0 }}>🎯 Quiz Interactif d'Auto-Évaluation</h3>
                      {Object.keys(userAnswers).length === generatedData.quiz.length && (
                        <span style={{ backgroundColor: '#0284c7', padding: '6px 14px', borderRadius: '16px', fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>
                          Score: {calculateScore()} / {generatedData.quiz.length}
                        </span>
                      )}
                    </div>

                    {generatedData.quiz.map((q: any, qIdx: number) => {
                      const selectedOpt = userAnswers[qIdx];
                      const isAnswered = selectedOpt !== undefined;

                      return (
                        <div key={qIdx} style={{ marginBottom: '16px', backgroundColor: '#0b0f19', padding: '14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                          <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc', margin: '0 0 12px 0' }}>
                            {qIdx + 1}. {q.question}
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {q.options.map((opt: string, oIdx: number) => {
                              let bgColor = '#1e293b';
                              let borderColor = 'transparent';
                              let textColor = '#e2e8f0';

                              if (isAnswered) {
                                if (oIdx === q.correctIndex) {
                                  bgColor = selectedOpt === q.correctIndex ? '#15803d' : '#ca8a04';
                                  borderColor = '#22c55e';
                                  textColor = '#ffffff';
                                } else if (oIdx === selectedOpt) {
                                  bgColor = '#991b1b';
                                  borderColor = '#ef4444';
                                  textColor = '#ffffff';
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleOptionSelect(qIdx, oIdx)}
                                  disabled={isAnswered}
                                  style={{
                                    textAlign: 'left',
                                    padding: '12px',
                                    backgroundColor: bgColor,
                                    border: `2px solid ${borderColor}`,
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    color: textColor,
                                    cursor: isAnswered ? 'default' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontWeight: isAnswered && (oIdx === q.correctIndex || oIdx === selectedOpt) ? 'bold' : 'normal'
                                  }}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {isAnswered && (
                            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#111827', borderRadius: '6px', fontSize: '13px', color: '#cbd5e1', borderLeft: '3px solid #38bdf8' }}>
                              <strong>💡 Explication :</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* HISTORIQUE HORS-LIGNE AVEC BOUTONS SUPPRIMER ET TÉLÉCHARGER */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ fontSize: '20px', color: '#f8fafc', margin: '0 0 16px 0' }}>📚 Historique des Recherches & Cours (Disponible Hors-Ligne)</h2>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
              <button
                onClick={() => setHistoryFilter('Toutes')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: historyFilter === 'Toutes' ? '#0284c7' : '#1e293b',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Toutes les matières
              </button>
              {MATIERES.map((m: Matiere) => (
                <button
                  key={m.id}
                  onClick={() => setHistoryFilter(m.name)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    backgroundColor: historyFilter === m.name ? '#0284c7' : '#1e293b',
                    color: historyFilter === m.name ? '#fff' : '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {filteredHistory.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Aucune recherche enregistrée pour la catégorie : {historyFilter}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {filteredHistory.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setGeneratedData(item.data);
                      setSelectedSubject(item.subject);
                      setUserAnswers({});
                      setActiveTab('generate');
                    }}
                    style={{
                      backgroundColor: '#111827',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #1f2937',
                      cursor: 'pointer',
                      transition: '0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{item.subject}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{item.date}</span>
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#f8fafc' }}>{item.data.title}</h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {item.data.summary}
                      </p>
                    </div>

                    {/* BOUTONS D'ACTION : TÉLÉCHARGER ET SUPPRIMER */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #1e293b', paddingTop: '12px', marginTop: 'auto' }}>
                      <button
                        onClick={(e) => downloadHistoryItem(item, e)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          backgroundColor: '#1e293b',
                          color: '#38bdf8',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        📥 Télécharger
                      </button>

                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#7f1d1d',
                          color: '#fca5a5',
                          border: '1px solid #991b1b',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
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

      </main>

    </div>
  );
}