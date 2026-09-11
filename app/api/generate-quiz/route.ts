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

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const systemInstruction = `
Tu es un assistant pédagogique expert pour l'application Samnote.
Analyse le document fourni et génère un objet JSON strict suivant cette structure exacte :
{
  "summary": "Explication claire, simple et accessible à un élève, avec des analogies si nécessaire...",
  "qa": [
    {
      "question": "Question fréquente ou clé sur le cours ?",
      "answer": "Explication détaillée et pédagogique de la réponse."
    }
  ],
  "componentsToIllustrate": [
    {
      "name": "Nom du composant ou système (ex: Moteur à explosion)",
      "description": "Description technique et rôle du composant.",
      "imagePrompt": "Technical diagram style drawing, clean engineering lines, clear annotations, realistic detail of [Nom du composant]"
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

    const result = await model.generateContent(`${systemInstruction}\n\nContenu à analyser :\n${prompt}`);
    const responseText = result.response.text();

    if (!responseText) {
      return NextResponse.json({ error: "L'IA n'a pas retourné de réponse." }, { status: 500 });
    }

    const parsedData = JSON.parse(responseText);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Erreur API Gemini:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}