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
        { error: "Aucun texte fourni pour la génération du quiz." },
        { status: 400 }
      );
    }

    // Utilisation de l'ID exact : 'gemini-3.6-flash'
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const systemInstruction = `
Tu es un assistant pédagogique expert pour l'application Samnote.
Analyse le texte fourni et génère obligatoirement un objet JSON strict :
{
  "summary": "Résumé synthétique et pédagogique du cours...",
  "componentsToIllustrate": ["Composant 1", "Composant 2"],
  "quiz": [
    {
      "question": "Intitulé de la question ?",
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