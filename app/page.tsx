'use client';

import React, { useState, useEffect } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
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

  // État du Quiz & Score
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  
  // État Audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Charger le profil et l'historique depuis localStorage au démarrage
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

  // Sauvegarder le profil
  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('samnote_user_profile', JSON.stringify(updatedProfile));
    alert('Profil mis à jour avec succès !');
  };

  // Gestion de l'audio avec l'API Web Speech
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
      alert("La synthèse vocale n'est pas supportée sur ce navigateur.");
    }
  };

  // Traitement du chargement d'image
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

  // Soumission de la génération
  const handleGenerate = async () => {
    if (!courseText && !homeworkImageBase64) {
      setErrorMessage("Veuillez saisir le texte du cours ou charger une image.");
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

      // Enregistrement dans l'historique
      const updatedHistory = [newCourse, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('samnote_history', JSON.stringify(updatedHistory));

    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de la communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Interaction Quiz
  const handleOptionSelect = (qIndex: number, oIndex: number) => {
    if (selectedAnswers[qIndex] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: oIndex }));
  };

  // Calcul de la note du Quiz sur 20
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
            style={{ 
              padding: '12px', 
              textAlign: 'left', 
              backgroundColor: activeTab === 'profile' ? '#1e1b4b' : 'transparent', 
              color: activeTab === 'profile' ? '#a78bfa' : '#9ca3af', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: activeTab === 'profile' ? 'bold' : 'normal'
            }}
          >
            👤 Profil & Niveau
          </button>

          <button 
            onClick={() => setActiveTab('input')}
            style={{ 
              padding: '12px', 
              textAlign: 'left', 
              backgroundColor: activeTab === 'input' ? '#1e1b4b' : 'transparent', 
              color: activeTab === 'input' ? '#a78bfa' : '#9ca3af', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: activeTab === 'input' ? 'bold' : 'normal', 
              cursor: 'pointer' 
            }}
          >
            📄 Saisie Cours & Photo
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            style={{ 
              padding: '12px', 
              textAlign: 'left', 
              backgroundColor: activeTab === 'history' ? '#1e1b4b' : 'transparent', 
              color: activeTab === 'history' ? '#a78bfa' : '#9ca3af', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: activeTab === 'history' ? 'bold' : 'normal'
            }}
          >
            📁 Mes Anciens Cours ({history.length})
          </button>
        </nav>
      </aside>

      {/* Contenu Principal */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        
        {/* ONGLET 1: PROFIL */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: '#a78bfa' }}>👤 Votre Profil & Niveau d'étude</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#9ca3af' }}>Niveau :</label>
                <input 
                  type="text" 
                  value={userProfile.level} 
                  onChange={(e) => setUserProfile({ ...userProfile, level: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#9ca3af' }}>Classe :</label>
                <input 
                  type="text" 
                  value={userProfile.grade} 
                  onChange={(e) => setUserProfile({ ...userProfile, grade: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#9ca3af' }}>Filière / Spécialité :</label>
                <input 
                  type="text" 
                  value={userProfile.field} 
                  onChange={(e) => setUserProfile({ ...userProfile, field: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff' }}
                />
              </div>

              <button 
                onClick={() => handleSaveProfile(userProfile)}
                style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
              >
                Enregistrer le profil
              </button>
            </div>
          </div>
        )}

        {/* ONGLET 2: HISTORIQUE */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>📁 Mes Anciens Cours enregistrés</h2>
            {history.length === 0 ? (
              <p style={{ color: '#9ca3af' }}>Aucun cours enregistré pour le moment. Générez votre premier cours pour le retrouver ici.</p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {history.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    onClick={() => {
                      setGeneratedData(item);
                      setSelectedAnswers({});
                      setActiveTab('input');
                    }}
                    style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937', cursor: 'pointer', transition: 'border 0.2s' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#60a5fa' }}>{item.title}</h3>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.date}</span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 3: SAISIE & GENERATION */}
        {activeTab === 'input' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px' }}>📚 Contenu du cours & Devoir</h2>

            {/* Message d'erreur */}
            {errorMessage && (
              <div style={{ backgroundColor: '#7f1d1d', color: '#fecaca', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #991b1b' }}>
                {errorMessage}
              </div>
            )}

            {/* Formulaire de Saisie */}
            <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', marginBottom: '32px' }}>
              <textarea
                value={courseText}
                onChange={(e) => setCourseText(e.target.value)}
                placeholder="Collez ou saisissez votre cours ici..."
                style={{ width: '100%', height: '180px', backgroundColor: '#030712', color: '#f3f4f6', padding: '16px', borderRadius: '8px', border: '1px solid #374151', resize: 'vertical', fontSize: '14px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <label style={{ backgroundColor: '#1f2937', color: '#e5e7eb', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #374151', fontSize: '14px' }}>
                  ➕ Charger une photo de devoir
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{ backgroundColor: '#7c3aed', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Génération en cours...' : '⚡ Générer Quiz, Devoir & Audio'}
                </button>
              </div>
            </div>

            {/* Affichage des Résultats */}
            {generatedData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Résumé & Script Audio */}
                <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#60a5fa' }}>{generatedData.title}</h3>
                    <button
                      onClick={toggleAudio}
                      style={{ backgroundColor: isPlayingAudio ? '#dc2626' : '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {isPlayingAudio ? '⏹ Arrêter l\'écoute' : '🔊 Écouter le cours'}
                    </button>
                  </div>
                  <p style={{ color: '#d1d5db', lineHeight: '1.6', fontSize: '15px' }}>{generatedData.summary}</p>
                </div>

                {/* Section Quiz */}
                <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa' }}>📝 Quiz d'évaluation</h3>
                    
                    {/* Affichage de la Note Finale sur 20 */}
                    {isQuizFinished && (
                      <div style={{ 
                        backgroundColor: calculateScore() >= 10 ? '#065f46' : '#991b1b', 
                        color: '#fff', 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        fontWeight: 'bold', 
                        fontSize: '16px' 
                      }}>
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
                            let textColor = '#f3f4f6';

                            if (hasAnswered) {
                              if (oIndex === q.correctIndex) {
                                if (userChoice === q.correctIndex) {
                                  btnBg = '#059669'; // Vert si bonne réponse choisie
                                  btnBorder = '#10b981';
                                } else {
                                  btnBg = '#d97706'; // Jaune si c'est la bonne réponse mais échec
                                  btnBorder = '#f59e0b';
                                }
                              } else if (oIndex === userChoice) {
                                btnBg = '#dc2626'; // Rouge si mauvaise réponse choisie
                                btnBorder = '#ef4444';
                              }
                            }

                            return (
                              <button
                                key={oIndex}
                                onClick={() => handleOptionSelect(qIndex, oIndex)}
                                disabled={hasAnswered}
                                style={{
                                  textAlign: 'left',
                                  padding: '12px 16px',
                                  borderRadius: '6px',
                                  backgroundColor: btnBg,
                                  border: `1px solid ${btnBorder}`,
                                  color: textColor,
                                  cursor: hasAnswered ? 'default' : 'pointer',
                                  fontWeight: hasAnswered && (oIndex === q.correctIndex || oIndex === userChoice) ? 'bold' : 'normal',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explication après sélection */}
                        {hasAnswered && (
                          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#1e1b4b', color: '#c7d2fe', borderRadius: '6px', fontSize: '13px' }}>
                            💡 <strong>Explication :</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Devoir de Révision */}
                <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#f43f5e' }}>📌 {generatedData.weeklyAssignment.title}</h3>
                  <p style={{ color: '#d1d5db', marginBottom: '12px' }}><strong>Consignes :</strong> {generatedData.weeklyAssignment.instructions}</p>
                  
                  <ul style={{ paddingLeft: '20px', color: '#e5e7eb', marginBottom: '16px' }}>
                    {generatedData.weeklyAssignment.questions.map((q, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>{q}</li>
                    ))}
                  </ul>

                  <div style={{ backgroundColor: '#030712', padding: '12px', borderRadius: '6px', border: '1px solid #1f2937', fontSize: '14px', color: '#9ca3af' }}>
                    <p>🛠 <strong>Exercice pratique :</strong> {generatedData.weeklyAssignment.practicalExercise}</p>
                    <p style={{ marginTop: '6px' }}>📊 <strong>Critères de notation :</strong> {generatedData.weeklyAssignment.gradingCriteria}</p>
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}