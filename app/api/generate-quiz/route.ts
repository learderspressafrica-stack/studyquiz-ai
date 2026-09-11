import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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

    const subject = userProfile?.subject || 'Électronique Générale';

    const prompt = `Tu es un professeur expert en Électronique. Fais une analyse complète pour la matière suivante : ${subject}.

Génère un objet JSON valide avec cette structure exacte :
{
  "title": "Titre explicatif de la leçon d'électronique",
  "summary": "Résumé concis avec les formules clés, schémas ou règles essentielles de ${subject}",
  "audioScript": "Explication orale claire de la leçon",
  "qaPairs": [
    {
      "question": "Question classique d'examen en ${subject} ?",
      "answer": "Réponse détaillée"
    }
  ],
  "quiz": [
    {
      "question": "Question 1 de test ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explication technique"
    }
  ]
}

Matière : ${subject}
Contenu transmis par l'élève :
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
      { error: error?.message || 'Erreur de génération.' },
      { status: 500 }
    );
  }
}