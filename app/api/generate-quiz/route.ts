import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "La clé GEMINI_API_KEY n'est pas configurée dans Vercel." },
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

    // Définition du modèle avec la version API 'v1' pour éviter les erreurs v1beta
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      },
      { apiVersion: 'v1' }
    );

    const systemInstruction = `
Tu es un assistant pédagogique expert pour l'application Samnote.
Analyse le document/cours fourni et génère obligatoirement un objet JSON strict :
{
  "summary": "Explication claire, simple et pédagogique du cours...",
  "qa": [
    {
      "question": "Question clé sur le cours ?",
      "answer": "Explication détaillée de la réponse."
    }
  ],
  "componentsToIllustrate": [
    {
      "name": "Composant ou concept (ex: Diode)",
      "description": "Fonctionnement et caractéristiques du composant.",
      "imagePrompt": "Technical drawing of Diode, engineering blueprint style, clean labeled components, realistic schema"
    }
  ],
  "quiz": [
    {
      "question": "Question du quiz ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}
`;

    const result = await model.generateContent(`${systemInstruction}\n\nContenu :\n${prompt}`);
    const responseText = result.response.text();

    if (!responseText) {
      return NextResponse.json(
        { error: "L'IA n'a pas retourné de résultat." },
        { status: 500 }
      );
    }

    const parsedData = JSON.parse(responseText);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Erreur API Gemini:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du traitement par l'IA" },
      { status: 500 }
    );
  }
}