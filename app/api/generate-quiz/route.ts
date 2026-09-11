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

    // Configuration explicite sur Gemini 3.6 Flash
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-3.6-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      },
      { apiVersion: 'v1' } // Force la version d'API v1 pour eviter l'erreur 404 sur v1beta
    );

    const systemInstruction = `
Tu es un assistant pédagogique expert pour l'application Samnote.
Analyse le document fourni et génère un objet JSON strict :
{
  "summary": "Explication claire et simple accessible à un élève...",
  "qa": [
    {
      "question": "Question de compréhension importante ?",
      "answer": "Réponse explicative simple et précise."
    }
  ],
  "componentsToIllustrate": [
    {
      "name": "Nom du composant (ex: Diode ou Moto)",
      "description": "Rôle et fonctionnement basique.",
      "imagePrompt": "Technical engineering schema drawing of [name], isometric view, clean lines, clear component callouts, white background"
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
    console.error("Erreur API Gemini 3.6:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du traitement par Gemini 3.6" },
      { status: 500 }
    );
  }
}