import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "La clé GEMINI_API_KEY n'est pas configurée sur Vercel." },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Aucun contenu fourni." },
        { status: 400 }
      );
    }

    // Utilisation de gemini-2.5-flash sur l'API v1 stable
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      },
      { apiVersion: 'v1' }
    );

    const systemInstruction = `
Tu es un assistant pédagogique pour l'application Samnote.
Analyse le document fourni et réponds exclusivement sous la forme d'un objet JSON strict :
{
  "summary": "Résumé explicatif et pédagogique du cours...",
  "qa": [
    {
      "question": "Question de compréhension importante ?",
      "answer": "Explication claire et détaillée."
    }
  ],
  "componentsToIllustrate": [
    {
      "name": "Composant ou notion clé",
      "description": "Fonctionnement et caractéristiques.",
      "imagePrompt": "Technical drawing schematic diagram, isometric style, clear labeled lines, white background"
    }
  ],
  "quiz": [
    {
      "question": "Question de révision ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}
`;

    const result = await model.generateContent(`${systemInstruction}\n\nCours :\n${prompt}`);
    const responseText = result.response.text();

    if (!responseText) {
      return NextResponse.json(
        { error: "L'IA n'a pas retourné de réponse." },
        { status: 500 }
      );
    }

    const parsedData = JSON.parse(responseText);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Erreur Gemini:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du traitement par Gemini" },
      { status: 500 }
    );
  }
}