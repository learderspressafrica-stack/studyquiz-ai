import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "La clé GEMINI_API_KEY n'est pas configurée dans les variables d'environnement Vercel." },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Aucun contenu n'a été fourni pour l'analyse." },
        { status: 400 }
      );
    }

    // Intégration du modèle Gemini 3.6 Flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

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

    const result = await model.generateContent(`${systemInstruction}\n\nContenu du cours à analyser :\n${prompt}`);
    const responseText = result.response.text();

    if (!responseText) {
      return NextResponse.json(
        { error: "L'IA n'a retourné aucune réponse." },
        { status: 500 }
      );
    }

    // Extraction et nettoyage du JSON
    const cleanJsonText = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonText);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Erreur Gemini 3.6 API:", error);
    return NextResponse.json(
      { error: error.message || "Une erreur est survenue lors du traitement avec Gemini 3.6." },
      { status: 500 }
    );
  }
}