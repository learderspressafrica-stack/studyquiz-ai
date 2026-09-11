import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MODEL_NAME = 'gemini-3.6-flash';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseText, userProfile, homeworkImageBase64 } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Gemini manquante dans Vercel." },
        { status: 500 }
      );
    }

    const subject = userProfile?.subject || 'Électronique';
    const mode = userProfile?.mode || 'generate';

    const prompt = `Tu es un professeur expert et très pédagogue, spécialisé dans la matière : "${subject}".

Consigne de cadrage :
- Si la matière est "Droit" ou "Gestion", réponds exclusivement avec les lois, concepts de gestion et exemples associés.
- Si la matière est technique ("Électronique", "Électricité", "Automatisme", "TP", "Dessin"), fournis des explications claires, des applications pratiques réelles et des schémas visuels sous forme de texte/ASCII.

Format attendu : Un objet JSON valide respectant cette structure exacte :
{
  "title": "Titre explicatif clair",
  "summary": "Synthèse et explications simples et concises",
  "audioScript": "Texte dynamique et pédagogique destiné à être lu à voix haute",
  "conceptExplanations": [
    {
      "concept": "Nom du composant, principe ou article de loi",
      "simpleDefinition": "Explication simple et claire",
      "diagram": "Schéma visuel en texte/ASCII ou exemple d'application concrète"
    }
  ],
  "qaPairs": [
    {
      "question": "Question classique d'examen ?",
      "answer": "Réponse complète et accessible"
    }
  ],
  "quiz": [
    {
      "question": "Question de test de connaissances ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explication étape par étape de la bonne réponse"
    }
  ]
}

Demande / Recherche de l'élève en ${subject} :
${courseText || 'Analyse l’image transmise.'}`;

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

    let responseText = '';
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !responseText) {
      try {
        attempts++;
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: contents,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response.text) responseText = response.text;
      } catch (err: any) {
        if (attempts >= maxAttempts) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    let rawText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(rawText);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Erreur Backend:', error);
    return NextResponse.json(
      { error: "Le service Gemini 3.6 est temporairement sollicité. Veuillez réespayer." },
      { status: 503 }
    );
  }
}