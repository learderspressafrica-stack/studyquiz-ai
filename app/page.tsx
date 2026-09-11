'use client';

import React, { useState, useEffect } from 'react';

// Configuration du lecteur PDF
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const [activeTab, setActiveTab] = useState<'generate' | 'search' | 'homework' | 'history'>('generate');
  
  // Saisie texte, photo & PDF
  const [courseText, setCourseText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  
  // Modération & Références Devoirs
  const [homeworkRefs, setHomeworkRefs] = useState<{ [subject: string]: string }>({});
  const [currentRefText, setCurrentRefText] = useState<string>('');

  // États de chargement et résultats
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Historique
  const [history, setHistory] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>('Toutes');

  // Réponses utilisateur au quiz
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    // Charger l'historique
    const savedHistory = localStorage.getItem('samnote_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }
    // Charger les références de devoirs
    const savedRefs = localStorage.getItem('samnote_hw_refs');
    if (savedRefs) {
      try { setHomeworkRefs(JSON.parse(savedRefs)); } catch (e) {}
    }
  }, []);

  // Mettre à jour le champ de référence quand la matière change
  useEffect(() => {
    setCurrentRefText(homeworkRefs[selectedSubject] || '');
  }, [selectedSubject, homeworkRefs]);

  // Sauvegarder la référence/sujet de devoir pour la matière active
  const saveHomeworkRef = () => {
    const updated = { ...homeworkRefs, [selectedSubject]: currentRefText };
    setHomeworkRefs(updated);
    localStorage.setItem('samnote_hw_refs', JSON.stringify(updated));
    alert(`Références de devoirs enregistrées pour : ${selectedSubject}`);
  };

  // Importation et extraction de texte depuis un fichier PDF
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMsg('Veuillez sélectionner un fichier au format PDF.');
      return;
    }

    setPdfFileName(file.name);
    setLoading(true);
    setErrorMsg('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n` + pageText;
      }

      setCourseText((prev) => prev + `\n\n[Contenu extrait du PDF : ${file.name}]\n` + fullText);
    } catch (err: any) {
      setErrorMsg('Erreur lors de la lecture du fichier PDF.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Importation d'une image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Traitement Génération / Recherche / Devoir Hebdomadaire
  const handleProcess = async (mode: 'generate' | 'search' | 'weekly_exam') => {
    let textToSubmit = courseText;

    if (mode === 'search') {
      textToSubmit = searchQuery;
    } else if (mode === 'weekly_exam') {
      // Rassemblement de l'historique de la semaine pour la matière active
      const subjectHistory = history.filter((h) => h.subject === selectedSubject);
      if (subjectHistory.length === 0) {
        setErrorMsg(`Aucun cours enregistré dans l'historique pour ${selectedSubject} afin de générer le devoir hebdomadaire.`);
        return;
      }
      const summaries = subjectHistory.map((h) => h.data.summary).join('\n---\n');
      const refs = homeworkRefs[selectedSubject] || '';
      textToSubmit = `Génère un Devoir Bilan Hebdomadaire de synthèse pour la matière : ${selectedSubject}.\n\nVoici le résumé des leçons vues cette semaine :\n${summaries}\n\nVoici le style et les types de sujet de référence à respecter :\n${refs}`;
    }

    if (!textToSubmit && !imageFile) {
      setErrorMsg('Veuillez entrer du texte, importer un PDF/Image ou avoir un historique de cours.');
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
      if (mode === 'search' || mode === 'weekly_exam') setActiveTab('generate');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un élément de l'historique
  const deleteHistoryItem = (idToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter((item) => item.id !== idToDelete);
    setHistory(updatedHistory);
    localStorage.setItem('samnote_history', JSON.stringify(updatedHistory));
  };

  // Exporter en PDF (Impression)
  const exportToPDF = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const data = item.data;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Samnote - ${data.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; line-height: 1.5; }
          h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
          h2 { color: #1e293b; margin-top: 20px; border-bottom: 1px solid #ccc; }
          .badge { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
          .quiz-item { background: #f8fafc; padding: 10px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
          .correct { color: #15803d; font-weight: bold; }
        </style>
      </head>
      <body>
        <div><span class="badge">${item.subject}</span> &nbsp; <small>Date: ${item.date}</small></div>
        <h1>${data.title}</h1>
        <h2>📌 Synthèse</h2>
        <p>${data.summary}</p>
    `;

    if (data.quiz && data.quiz.length > 0) {
      htmlContent += `<h2>🎯 Devoir / Quiz & Explications</h2>`;
      data.quiz.forEach((q: any, i: number) => {
        htmlContent += `
          <div class="quiz-item">
            <p><strong>Q${i + 1}. ${q.question}</strong></p>
            <ul>
              ${q.options.map((opt: string, idx: number) => `<li class="${idx === q.correctIndex ? 'correct' : ''}">${opt} ${idx === q.correctIndex ? '✓' : ''}</li>`).join('')}
            </ul>
            <p><small><em>Explication: ${q.explanation}</em></small></p>
          </div>
        `;
      });
    }

    htmlContent += `</body></html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
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
      
      {/* SIDEBAR LATÉRALE */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={{ backgroundColor: '#0284c7', padding: '8px 12px', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold' }}>⚡</div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>Samnote</h1>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>Électronique & Sciences</span>
            </div>
          </div>

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
              onClick={() => setActiveTab('homework')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'homework' ? '#1e293b' : 'transparent',
                color: activeTab === 'homework' ? '#38bdf8' : '#94a3b8',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              📝 Devoirs & Références
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

          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
              Matière Active
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
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

      {/* ZONE PRINCIPALE */}
      <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* TAB WORKSPACE */}
        {activeTab === 'generate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '16px', color: '#38bdf8', margin: 0, fontWeight: 'bold' }}>
                  📥 Saisie de Cours / Importation PDF / Photo ({selectedSubject})
                </h2>
              </div>

              <textarea
                placeholder={`Collez ici votre cours, ou chargez un fichier PDF/Photo ci-dessous...`}
                value={courseText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCourseText(e.target.value)}
                style={{
                  width: '100%',
                  height: '140px',
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
                
                {/* IMPORTATION PDF */}
                <label style={{
                  padding: '10px 16px',
                  backgroundColor: '#0284c7',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  📄 Importer un PDF
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
                </label>

                {/* IMPORTATION PHOTO */}
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
                  📷 Importer une Photo
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>

                {pdfFileName && <span style={{ fontSize: '12px', color: '#38bdf8' }}>📄 {pdfFileName} chargé</span>}
                {imageFile && <span style={{ fontSize: '12px', color: '#4ade80' }}>✓ Photo jointe</span>}

                <button
                  onClick={() => handleProcess('generate')}
                  disabled={loading}
                  style={{
                    marginLeft: 'auto',
                    padding: '12px 24px',
                    backgroundColor: loading ? '#64748b' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Analyse en cours...' : '⚡ Générer la Fiche & Quiz'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                {errorMsg}
              </div>
            )}

            {/* FICHE GÉNÉRÉE ET QUIZ */}
            {generatedData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1f2937' }}>
                  <span style={{ fontSize: '12px', backgroundColor: '#0284c7', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                    {selectedSubject}
                  </span>
                  <h3 style={{ fontSize: '18px', color: '#f8fafc', margin: '10px 0' }}>{generatedData.title}</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1', margin: 0 }}>{generatedData.summary}</p>
                </div>

                {generatedData.quiz && (
                  <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1f2937' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', color: '#38bdf8', margin: 0 }}>🎯 Devoir & Évaluation</h3>
                      {Object.keys(userAnswers).length === generatedData.quiz.length && (
                        <span style={{ backgroundColor: '#0284c7', padding: '6px 14px', borderRadius: '16px', fontSize: '13px', fontWeight: 'bold' }}>
                          Note: {calculateScore()} / {generatedData.quiz.length}
                        </span>
                      )}
                    </div>

                    {generatedData.quiz.map((q: any, qIdx: number) => {
                      const selectedOpt = userAnswers[qIdx];
                      const isAnswered = selectedOpt !== undefined;

                      return (
                        <div key={qIdx} style={{ marginBottom: '16px', backgroundColor: '#0b0f19', padding: '14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                          <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc', margin: '0 0 12px 0' }}>
                            Q{qIdx + 1}. {q.question}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {q.options.map((opt: string, oIdx: number) => {
                              let bgColor = '#1e293b';
                              let textColor = '#e2e8f0';

                              if (isAnswered) {
                                if (oIdx === q.correctIndex) bgColor = '#15803d';
                                else if (oIdx === selectedOpt) bgColor = '#991b1b';
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
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    color: textColor,
                                    cursor: isAnswered ? 'default' : 'pointer'
                                  }}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {isAnswered && (
                            <p style={{ marginTop: '10px', fontSize: '12px', color: '#cbd5e1' }}>💡 Explication: {q.explanation}</p>
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

        {/* TAB DEVOIRS DE RÉFÉRENCE & DEVOIR HEBDOMADAIRE */}
        {activeTab === 'homework' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1f2937' }}>
              <h2 style={{ fontSize: '18px', color: '#38bdf8', marginTop: 0, marginBottom: '8px' }}>
                📝 Devoirs de Référence pour : <span style={{ color: '#fff' }}>{selectedSubject}</span>
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>
                Collez ici vos anciens sujets de devoirs de classe, exercices types d'examen ou consignes pour que l'IA connaisse exactement le niveau et le style des devoirs à vous donner.
              </p>

              <textarea
                placeholder={`Exemple :
- Devoir N°1 d'Électricité : Calculs des mailles, théorème de Thévenin, circuits RLC...
- Type de questions attendues : Exercices pratiques avec schémas et calculs.`}
                value={currentRefText}
                onChange={(e) => setCurrentRefText(e.target.value)}
                style={{
                  width: '100%',
                  height: '150px',
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

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={saveHomeworkRef}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  💾 Enregistrer les Références
                </button>

                <button
                  onClick={() => handleProcess('weekly_exam')}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Génération du Devoir...' : '🎯 Générer le Devoir Bilan Hebdomadaire'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB HISTORIQUE */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ fontSize: '20px', color: '#f8fafc', margin: '0 0 16px 0' }}>📚 Historique des Cours & Devoirs</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {filteredHistory.map((item: any) => (
                <div key={item.id} style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '12px', border: '1px solid #1f2937' }}>
                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{item.subject}</span>
                  <h4 style={{ margin: '6px 0', fontSize: '15px', color: '#f8fafc' }}>{item.data.title}</h4>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>{item.date}</p>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={(e) => exportToPDF(item, e)} style={{ padding: '6px 12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                      📄 Exporter PDF
                    </button>
                    <button onClick={(e) => deleteHistoryItem(item.id, e)} style={{ padding: '6px 12px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}