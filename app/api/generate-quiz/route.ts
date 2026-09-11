import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Modèle fixé sur gemini-3.6-flash
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

    const prompt = `Tu es un professeur d'Électronique passionné et très pédagogue.
Ton objectif est de simplifier le cours pour qu'un élève puisse tout comprendre facilement.

Matière : ${subject}

Génère un objet JSON valide suivant exactement cette structure :
{
  "title": "Titre explicatif clair du cours",
  "summary": "Résumé simple et concis avec les notions fondamentales",
  "audioScript": "Texte dynamique et pédagogique à lire à voix haute",
  "conceptExplanations": [
    {
      "concept": "Nom du composant ou de la notion (ex: Transistor, Diode, Bilan de comptabilité)",
      "simpleDefinition": "Explication très simple, comme si tu l'expliquais à un débutant",
      "diagram": "Un schéma visuel explicatif simplifié sous forme de dessin ASCII ou texte (ex: [ Base -> Collecteur -> Émetteur ])"
    }
  ],
  "qaPairs": [
    {
      "question": "Question classique d'examen ou de cours ?",
      "answer": "Explication complète et accessible"
    }
  ],
  "quiz": [
    {
      "question": "Question de test ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explication étape par étape de la réponse"
    }
  ]
}

Contenu du cours à traiter :
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

    let responseText = '';
    let attempts = 0;
    const maxAttempts = 3;

    // Tentatives répétées sur gemini-3.6-flash en cas de pic de charge
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
        if (response.text) {
          responseText = response.text;
        }
      } catch (err: any) {
        if (attempts >= maxAttempts) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Pause de 1.5s entre chaque essai
      }
    }

    let rawText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(rawText);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Erreur Backend:', error);
    return NextResponse.json(
      { error: "Le modèle Gemini 3.6 est très sollicité. Veuillez réessayer dans quelques secondes." },
      { status: 503 }
    );
  }
}