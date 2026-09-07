import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseText, userProfile, homeworkImageBase64 } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Gemini manquante dans les variables d'environnement Vercel." },
        { status: 500 }
      );
    }

    const prompt = `Tu es un assistant pédagogique. Génère un objet JSON valide suivant exactement la structure ci-dessous.

Structure JSON attendue :
{
  "title": "Titre explicatif du cours",
  "summary": "Résumé synthétique du cours",
  "audioScript": "Script concis à lire à voix haute",
  "qaPairs": [
    {
      "question": "Question directe 1 ?",
      "answer": "Réponse explicite 1"
    }
  ],
  "quiz": [
    {
      "question": "Question 1",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explication"
    }
  ],
  "weeklyAssignment": {
    "title": "Devoir de révision",
    "instructions": "Consignes",
    "questions": ["Q1", "Q2"],
    "practicalExercise": "Exercice pratique",
    "gradingCriteria": "Critères de notation"
  }
}

Profil :
- Niveau : ${userProfile?.level || 'Lycée'}
- Classe : ${userProfile?.grade || 'Terminale'}
- Filière : ${userProfile?.field || 'Informatique'}

Contenu :
${courseText || 'Analyse la photo transmise.'}`;

    let contents: any[] = [prompt];

    if (homeworkImageBase64) {
      const parts = homeworkImageBase64.split(',');
      const mimeType = parts[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const base64Data = parts[1] || homeworkImageBase64;

      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let rawText = response.text || '';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(rawText);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Erreur Backend:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la génération du contenu.' },
      { status: 500 }
    );
  }
}