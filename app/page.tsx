'use client';

import React, { useState, useEffect } from 'react';

const MATIERES = [
  { id: 'electricite', name: 'Électricité' },
  { id: 'analogique', name: 'Électronique Analogique' },
  { id: 'numerique', name: 'Électronique Numérique' },
  { id: 'automatisme', name: 'Automatisme' },
  { id: 'tp', name: 'Travaux Pratiques (TP)' },
  { id: 'dessin_technique', name: 'Dessin Technique' },
  { id: 'gestion', name: 'Gestion' },
  { id: 'droit', name: 'Droit' },
];

export default function Page() {
  const [selectedSubject, setSelectedSubject] = useState(MATIERES[0].name);
  const [historyFilter, setHistoryFilter] = useState('Toutes');
  const [courseText, setCourseText] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  // Charger l'historique local
  useEffect(() => {
    const savedHistory = localStorage.getItem('samnote_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Erreur chargement historique', e);
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

  const handleGenerate = async () => {
    if (!courseText && !imageFile) {
      setErrorMsg('Veuillez saisir un texte ou charger une photo de votre cours.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseText,
          homeworkImageBase64: imageFile,
          userProfile: { subject: selectedSubject },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la génération.');

      const newItem = {
        id: Date.now(),
        date: new Date().toLocaleDateString('fr-FR'),
        subject: selectedSubject,
        data,
      };

      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('samnote_history', JSON.stringify(updatedHistory));

      setGeneratedData(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const speakAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredHistory = history.filter((item) =>
    historyFilter === 'Toutes' ? true : item.subject === historyFilter
  );

  return (
    <div style={{ maxWidth: '100vw', minHeight: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      
      {/* En-tête */}
      <header style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', color: '#38bdf8', margin: '0 0 6px 0' }}>⚡ Samnote - Électronique</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Fiches, explications, visuels et révisions de cours</p>
      </header>

      {/* Navigation Principale (Générer / Historique) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('generate')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'generate' ? '#0284c7' : '#1e293b',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          🚀 Nouveautés & Génération
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'history' ? '#0284c7' : '#1e293b',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          📚 Historique ({history.length})
        </button>
      </div>

      {activeTab === 'generate' && (
        <>
          {/* Sélection de Matière */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px', WebkitOverflowScrolling: 'touch' }}>
            {MATIERES.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedSubject(m.name)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: selectedSubject === m.name ? '#0284c7' : '#1e293b',
                  color: selectedSubject === m.name ? '#fff' : '#94a3b8',
                  whiteSpace: 'nowrap',
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

          {/* Saisie & Photo */}
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
            <textarea
              placeholder={`Saisissez le texte de cours de ${selectedSubject} ici...`}
              value={courseText}
              onChange={(e) => setCourseText(e.target.value)}
              style={{
                width: '100%',
                height: '110px',
                backgroundColor: '#0f172a',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '14px',
                boxSizing: 'border-box',
                marginBottom: '10px'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{
                textAlign: 'center',
                backgroundColor: '#334155',
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#e2e8f0'
              }}>
                📷 Importer/Prendre une photo de cours
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>

              {imageFile && <span style={{ fontSize: '12px', color: '#4ade80', textAlign: 'center' }}>✓ Photo importée</span>}

              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  padding: '14px',
                  backgroundColor: loading ? '#64748b' : '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Analyse pédagogique...' : '⚡ Générer le résumé & Quiz'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              {errorMsg}
            </div>
          )}

          {/* Résultats Générés */}
          {generatedData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Résumé & Bouton Audio */}
              <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '16px', color: '#38bdf8', margin: 0 }}>📝 Fiche de Révision</h2>
                  {generatedData.audioScript && (
                    <button
                      onClick={() => speakAudio(generatedData.audioScript)}
                      style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🔊 Écouter
                    </button>
                  )}
                </div>
                <h3 style={{ fontSize: '15px', color: '#f1f5f9', marginTop: 0 }}>{generatedData.title}</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#cbd5e1', margin: 0 }}>{generatedData.summary}</p>
              </div>

              {/* Explication Simplifiée des Notions & Schémas */}
              {generatedData.conceptExplanations && generatedData.conceptExplanations.length > 0 && (
                <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px' }}>
                  <h2 style={{ fontSize: '16px', color: '#38bdf8', marginTop: 0 }}>💡 Explication des composants & Notions</h2>
                  {generatedData.conceptExplanations.map((item: any, idx: number) => (
                    <div key={idx} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                      <h4 style={{ color: '#facc15', margin: '0 0 6px 0', fontSize: '14px' }}>🔹 {item.concept}</h4>
                      <p style={{ fontSize: '13px', color: '#e2e8f0', margin: '0 0 8px 0', lineHeight: '1.4' }}>{item.simpleDefinition}</p>
                      {item.diagram && (
                        <pre style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '8px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', margin: 0 }}>
                          {item.diagram}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Questions & Réponses Directes */}
              {generatedData.qaPairs && (
                <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px' }}>
                  <h2 style={{ fontSize: '16px', color: '#38bdf8', marginTop: 0 }}>❓ Questions & Réponses Directes</h2>
                  {generatedData.qaPairs.map((item: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '10px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#f8fafc', margin: '0 0 4px 0' }}>Q{idx + 1}. {item.question}</p>
                      <p style={{ fontSize: '13px', color: '#4ade80', margin: 0 }}>R: {item.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quiz */}
              {generatedData.quiz && (
                <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px' }}>
                  <h2 style={{ fontSize: '16px', color: '#38bdf8', marginTop: 0 }}>🎯 Quiz d'auto-évaluation</h2>
                  {generatedData.quiz.map((q: any, qIdx: number) => (
                    <div key={qIdx} style={{ marginBottom: '12px', backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '13px', margin: '0 0 6px 0' }}>{qIdx + 1}. {q.question}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {q.options.map((opt: string, oIdx: number) => (
                          <div key={oIdx} style={{ padding: '6px 10px', backgroundColor: '#1e293b', borderRadius: '4px', fontSize: '12px', color: '#cbd5e1' }}>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </>
      )}

      {/* Vue HISTORIQUE FILTRABLE */}
      {activeTab === 'history' && (
        <div>
          <h2 style={{ fontSize: '18px', color: '#38bdf8', marginTop: 0 }}>📚 Historique des Fiches</h2>

          {/* Filtres par Matière */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
            <button
              onClick={() => setHistoryFilter('Toutes')}
              style={{
                padding: '6px 12px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: historyFilter === 'Toutes' ? '#0284c7' : '#1e293b',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Toutes
            </button>
            {MATIERES.map((m) => (
              <button
                key={m.id}
                onClick={() => setHistoryFilter(m.name)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: historyFilter === m.name ? '#0284c7' : '#1e293b',
                  color: historyFilter === m.name ? '#fff' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Liste des éléments filtrés */}
          {filteredHistory.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>Aucun enregistrement pour : {historyFilter}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setGeneratedData(item.data);
                    setSelectedSubject(item.subject);
                    setActiveTab('generate');
                  }}
                  style={{
                    backgroundColor: '#1e293b',
                    padding: '12px',
                    borderRadius: '8px',
                    borderLeft: '4px solid #0284c7',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{item.subject}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{item.date}</span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#f8fafc' }}>{item.data.title}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.data.summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}