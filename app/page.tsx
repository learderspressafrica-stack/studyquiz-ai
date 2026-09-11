'use client';

import React, { useState, useEffect } from 'react';

const MATIERES_ELECTRONIQUE = [
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
  const [selectedSubject, setSelectedSubject] = useState(MATIERES_ELECTRONIQUE[0].name);
  const [courseText, setCourseText] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg('Veuillez entrer du texte ou importer une photo de votre cours.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setGeneratedData(null);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseText,
          homeworkImageBase64: imageFile,
          userProfile: {
            field: 'Électronique',
            subject: selectedSubject,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la génération.');
      
      setGeneratedData(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '100vw', minHeight: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      
      {/* En-tête Mobile */}
      <header style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', color: '#38bdf8', margin: '0 0 8px 0' }}>⚡ Samnote - Électronique</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Sélectionnez une matière pour générer la fiche, le quiz et les Q&R</p>
      </header>

      {/* Barre des Onglets Matières (Défilement horizontal sur Mobile) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '20px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {MATIERES_ELECTRONIQUE.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedSubject(m.name)}
            style={{
              padding: '10px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: selectedSubject === m.name ? '#0284c7' : '#1e293b',
              color: selectedSubject === m.name ? '#ffffff' : '#94a3b8',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Matière Sélectionnée */}
      <div style={{ backgroundColor: '#1e293b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', borderLeft: '4px solid #0284c7' }}>
        <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Matière active : <strong>{selectedSubject}</strong></span>
      </div>

      {/* Saisie de Cours / Photo */}
      <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
        <textarea
          placeholder={`Collez ici le cours ou l'exercice de ${selectedSubject}...`}
          value={courseText}
          onChange={(e) => setCourseText(e.target.value)}
          style={{
            width: '100%',
            height: '120px',
            backgroundColor: '#0f172a',
            color: '#fff',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            boxSizing: 'border-box',
            marginBottom: '12px',
            resize: 'vertical'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{
            display: 'block',
            textAlign: 'center',
            backgroundColor: '#334155',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#e2e8f0'
          }}>
            📷 Importer/Prendre une photo
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>

          {imageFile && <span style={{ fontSize: '12px', color: '#4ade80', textAlign: 'center' }}>✓ Photo chargée avec succès</span>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#64748b' : '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Analyse en cours...' : '⚡ Générer la fiche & Quiz'}
          </button>
        </div>
      </div>

      {/* Message d'Erreur */}
      {errorMsg && (
        <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {errorMsg}
        </div>
      )}

      {/* Résultats Générés (Fiche, Q&R, Quiz) */}
      {generatedData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Résumé */}
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '18px', color: '#38bdf8', marginTop: 0 }}>📝 Fiche de révision ({selectedSubject})</h2>
            <h3 style={{ fontSize: '16px', color: '#f1f5f9' }}>{generatedData.title}</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#cbd5e1' }}>{generatedData.summary}</p>
          </div>

          {/* Questions & Réponses Directes */}
          {generatedData.qaPairs && (
            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', color: '#38bdf8', marginTop: 0 }}>❓ Questions & Réponses Directes</h2>
              {generatedData.qaPairs.map((item: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc', margin: '0 0 4px 0' }}>Q{idx + 1}. {item.question}</p>
                  <p style={{ fontSize: '14px', color: '#4ade80', margin: 0 }}>R: {item.answer}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quiz Interactive */}
          {generatedData.quiz && (
            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', color: '#38bdf8', marginTop: 0 }}>🎯 Quiz de Validation</h2>
              {generatedData.quiz.map((q: any, qIdx: number) => (
                <div key={qIdx} style={{ marginBottom: '16px', backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 8px 0' }}>{qIdx + 1}. {q.question}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {q.options.map((opt: string, oIdx: number) => (
                      <div key={oIdx} style={{ padding: '8px', backgroundColor: '#1e293b', borderRadius: '4px', fontSize: '13px', color: '#e2e8f0' }}>
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

    </div>
  );
}