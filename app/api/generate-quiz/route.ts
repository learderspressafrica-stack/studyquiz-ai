import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "La clé GEMINI_API_KEY n'est pas définie sur le serveur." },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Aucun texte fourni." },
        { status: 400 }
      );
    }

    // Utilisation du modèle gemini-1.5-flash avec instruction JSON
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const systemInstruction = `
    Tu es un assistant pédagogique pour l'application Samnote.
    Analyse le contenu fourni et génère un objet JSON strict au format suivant :
    {
      "summary": "Résumé clair et synthétique du cours...",
      "componentsToIllustrate": ["Composant 1", "Composant 2"],
      "quiz": [
        {
          "question": "Question 1 ?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0
        }
      ]
    }
    `;

    const result = await model.generateContent(`${systemInstruction}\n\nContenu:\n${prompt}`);
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
    console.error("Erreur API Gemini:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}