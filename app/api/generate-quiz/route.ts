import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "La clé GEMINI_API_KEY n'est pas configurée." },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Aucun texte fourni pour l'analyse." },
        { status: 400 }
      );
    }

    // Appel strict à Gemini 3.6 Flash via API v1
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-3.6-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      },
      { apiVersion: 'v1' }
    );

    const systemInstruction = `
Tu es un assistant pédagogique expert pour Samnote.
Analyse le document/cours fourni et réponds exclusivement sous forme d'objet JSON respectant la structure suivante :
{
  "summary": "Explication claire, simplifiée et pédagogique du cours...",
  "qa": [
    {
      "question": "Question essentielle de compréhension ?",
      "answer": "Réponse claire et explicative."
    }
  ],
  "componentsToIllustrate": [
    {
      "name": "Nom du composant ou concept clé",
      "description": "Explication du rôle ou fonctionnement.",
      "imagePrompt": "Technical engineering schematic diagram of [name], clean lines, isometric style, labeled components, white background"
    }
  ],
  "quiz": [
    {
      "question": "Question d'évaluation ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}
`;

    const result = await model.generateContent(`${systemInstruction}\n\nCours à analyser :\n${prompt}`);
    const responseText = result.response.text();

    if (!responseText) {
      return NextResponse.json(
        { error: "Gemini 3.6 n'a pas renvoyé de contenu." },
        { status: 500 }
      );
    }

    const parsedData = JSON.parse(responseText);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Erreur Gemini 3.6:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du traitement par Gemini 3.6" },
      { status: 500 }
    );
  }
}