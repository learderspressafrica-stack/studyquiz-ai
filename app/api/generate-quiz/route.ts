import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "La clé GEMINI_API_KEY n'est pas configurée dans les variables Vercel." },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Aucun contenu n'a été fourni." },
        { status: 400 }
      );
    }

    // Utilisation de la version stable recommandée pour l'API v1
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
Tu es l'assistant pédagogique Samnote.
Analyse le texte fourni et génère obligatoirement un objet JSON strict :
{
  "summary": "Résumé clair et explication pédagogique du cours...",
  "qa": [
    {
      "question": "Question de compréhension importante ?",
      "answer": "Explication claire et détaillée."
    }
  ],
  "componentsToIllustrate": [
    {
      "name": "Nom du composant ou concept clé",
      "description": "Explication de son fonctionnement.",
      "imagePrompt": "Technical drawing schematic, isometric style, clean lines, white background"
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

    const result = await model.generateContent(`${systemInstruction}\n\nTexte du cours :\n${prompt}`);
    const responseText = result.response.text();

    if (!responseText) {
      return NextResponse.json(
        { error: "Aucun résultat n'a été retourné." },
        { status: 500 }
      );
    }

    const parsedData = JSON.parse(responseText);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Erreur API Gemini:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'analyse du cours." },
      { status: 500 }
    );
  }
}