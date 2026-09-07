'use client';

import React, { useState, useEffect } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QAPair {
  question: string;
  answer: string;
}

interface WeeklyAssignment {
  title: string;
  instructions: string;
  questions: string[];
  practicalExercise: string;
  gradingCriteria: string;
}

interface CourseResponse {
  id?: string;
  date?: string;
  title: string;
  summary: string;
  audioScript: string;
  qaPairs?: QAPair[];
  quiz: QuizQuestion[];
  weeklyAssignment: WeeklyAssignment;
}

interface UserProfile {
  level: string;
  grade: string;
  field: string;
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<'input' | 'history' | 'profile'>('input');
  const [courseText, setCourseText] = useState('');
  const [homeworkImageBase64, setHomeworkImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedData, setGeneratedData] = useState<CourseResponse | null>(null);

  // Historique & Profil
  const [history, setHistory] = useState<CourseResponse[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    level: 'Lycée',
    grade: 'Terminale',
    field: 'Informatique',
  });

  // État du Quiz & Audio
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('samnote_user_profile');
    if (savedProfile) {
      try { setUserProfile(JSON.parse(savedProfile)); } catch (e) {}
    }

    const savedHistory = localStorage.getItem('samnote_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }
  }, []);

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('samnote_user_profile', JSON.stringify(updatedProfile));
    alert('Profil enregistré !');
  };

  const toggleAudio = () => {
    if (!generatedData?.audioScript) return;

    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(generatedData.audioScript);
        utterance.lang = 'fr-FR';
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert("Synthèse vocale non supportée sur ce navigateur.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHomeworkImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!courseText && !homeworkImageBase64) {
      setErrorMessage("Veuillez saisir un texte ou charger une image.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setGeneratedData(null);
    setSelectedAnswers({});
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlayingAudio(false);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseText,
          userProfile,
          homeworkImageBase64,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur s'est produite lors de la génération.");
      }

      const newCourse: CourseResponse = {
        ...data,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      };

      setGeneratedData(newCourse);

      const updatedHistory = [newCourse, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('samnote_history', JSON.stringify(updatedHistory));

    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIndex: number, oIndex: number) => {
    if (selectedAnswers[qIndex] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: oIndex }));
  };

  const calculateScore = () => {
    if (!generatedData?.quiz || generatedData.quiz.length === 0) return 0;
    let correctCount = 0;
    generatedData.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });
    return Math.round((correctCount / generatedData.quiz.length) * 20);
  };

  const isQuizFinished = generatedData?.quiz && Object.keys(selectedAnswers).length === generatedData.quiz.length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f3f4f6', fontFamily: 'sans-serif' }}>
      
      {/* Barre Latérale */}
      <aside style={{ width: '280px', backgroundColor: '#111827', padding: '24px', borderRight: '1px solid #1f2937' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ec4899', marginBottom: '32px' }}>⚡ Samnote</h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ padding: '12px', textAlign: 'left', backgroundColor: activeTab === 'profile' ? '#1e1b4b' : 'transparent', color: activeTab === 'profile' ? '#a78bfa' : '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === 'profile' ? 'bold' : 'normal' }}
          >
            👤 Profil & Niveau
          </button>

          <button 
            onClick={() => setActiveTab('input')}
            style={{ padding: '12px', textAlign: 'left', backgroundColor: activeTab === 'input' ? '#1e1b4b' : 'transparent', color: activeTab === 'input' ? '#a78bfa' : '#9ca3af', border: 'none', borderRadius: '8px', fontWeight: activeTab === 'input' ? 'bold' : 'normal', cursor: 'pointer' }}
          >
            📄 Saisie Cours & Photo
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            style={{ padding: '12px', textAlign: 'left', backgroundColor: activeTab === 'history' ? '#1e1b4b' : 'transparent', color: activeTab === 'history' ? '#a78bfa' : '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === 'history' ? 'bold' : 'normal' }}
          >
            📁 Mes Anciens Cours ({history.length})
          </button>
        </nav>
      </aside>

      {/* Contenu Principal */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        
        {/* PROFIL */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: '#a78bfa' }}>👤 Votre Profil & Niveau d'étude</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#9ca3af' }}>Niveau :</label>
                <input type="text" value={userProfile.level} onChange={(e) => setUserProfile({ ...userProfile, level: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#9ca3af' }}>Classe :</label>
                <input type="text" value={userProfile.grade} onChange={(e) => setUserProfile({ ...userProfile, grade: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#9ca3af' }}>Filière / Spécialité :</label>
                <input type="text" value={userProfile.field} onChange={(e) => setUserProfile({ ...userProfile, field: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff' }} />
              </div>
              <button onClick={() => handleSaveProfile(userProfile)} style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Enregistrer le profil
              </button>
            </div>
          </div>
        )}

        {/* HISTORIQUE */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>📁 Mes Anciens Cours enregistrés</h2>
            {history.length === 0 ? (
              <p style={{ color: '#9ca3af' }}>Aucun cours enregistré. Générez un cours pour le retrouver ici.</p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {history.map((item, idx) => (
                  <div key={item.id || idx} onClick={() => { setGeneratedData(item); setSelectedAnswers({}); setActiveTab('input'); }} style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#60a5fa' }}>{item.title}</h3>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.date}</span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAISIE & GENERATION */}
        {activeTab === 'input' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px' }}>📚 Contenu du cours & Devoir</h2>

            {errorMessage && (
              <div style={{ backgroundColor: '#7f1d1d', color: '#fecaca', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #991b1b' }}>
                {errorMessage}
              </div>
            )}

            <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', marginBottom: '32px' }}>
              <textarea
                value={courseText}
                onChange={(e) => setCourseText(e.target.value)}
                placeholder="Copiez et collez votre cours ici..."
                style={{ width: '100%', height: '180px', backgroundColor: '#030712', color: '#f3f4f6', padding: '16px', borderRadius: '8px', border: '1px solid #374151', resize: 'vertical', fontSize: '14px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <label style={{ backgroundColor: '#1f2937', color: '#e5e7eb', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #374151', fontSize: '14px' }}>
                  📷 Importer une photo de cours / devoir
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{ backgroundColor: '#7c3aed', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Génération en cours...' : '⚡ Générer Fiche, Quiz, Q&R & Audio'}
                </button>
              </div>
            </div>

            {/* RÉSULTATS GENERES */}
            {generatedData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Résumé & Script Audio */}
                <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#60a5fa' }}>{generatedData.title}</h3>
                    <button onClick={toggleAudio} style={{ backgroundColor: isPlayingAudio ? '#dc2626' : '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      {isPlayingAudio ? '⏹ Arrêter l\'écoute' : '🔊 Écouter le cours'}
                    </button>
                  </div>
                  <p style={{ color: '#d1d5db', lineHeight: '1.6', fontSize: '15px' }}>{generatedData.summary}</p>
                </div>

                {/* Section Questions - Réponses Directes */}
                {generatedData.qaPairs && generatedData.qaPairs.length > 0 && (
                  <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#38bdf8' }}>❓ Questions & Réponses Directes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {generatedData.qaPairs.map((item, idx) => (
                        <div key={idx} style={{ backgroundColor: '#030712', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                          <p style={{ fontWeight: 'bold', color: '#e0f2fe', marginBottom: '8px' }}>Q{idx + 1}. {item.question}</p>
                          <p style={{ color: '#4ade80', fontSize: '14px' }}><strong>R :</strong> {item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Quiz */}
                <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa' }}>📝 Quiz d'évaluation</h3>
                    {isQuizFinished && (
                      <div style={{ backgroundColor: calculateScore() >= 10 ? '#065f46' : '#991b1b', color: '#fff', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px' }}>
                        Score : {calculateScore()} / 20
                      </div>
                    )}
                  </div>
                  
                  {generatedData.quiz.map((q, qIndex) => {
                    const userChoice = selectedAnswers[qIndex];
                    const hasAnswered = userChoice !== undefined;

                    return (
                      <div key={qIndex} style={{ marginBottom: '24px', backgroundColor: '#030712', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '15px' }}>{qIndex + 1}. {q.question}</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {q.options.map((opt, oIndex) => {
                            let btnBg = '#1f2937';
                            let btnBorder = '#374151';

                            if (hasAnswered) {
                              if (oIndex === q.correctIndex) {
                                btnBg = userChoice === q.correctIndex ? '#059669' : '#d97706';
                                btnBorder = userChoice === q.correctIndex ? '#10b981' : '#f59e0b';
                              } else if (oIndex === userChoice) {
                                btnBg = '#dc2626';
                                btnBorder = '#ef4444';
                              }
                            }

                            return (
                              <button
                                key={oIndex}
                                onClick={() => handleOptionSelect(qIndex, oIndex)}
                                disabled={hasAnswered}
                                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '6px', backgroundColor: btnBg, border: `1px solid ${btnBorder}`, color: '#f3f4f6', cursor: hasAnswered ? 'default' : 'pointer' }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {hasAnswered && (
                          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#1e1b4b', color: '#c7d2fe', borderRadius: '6px', fontSize: '13px' }}>
                            💡 <strong>Explication :</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}