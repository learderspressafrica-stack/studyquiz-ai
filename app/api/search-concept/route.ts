import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Aucun terme fourni." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      },
      { apiVersion: 'v1' }
    );

    const systemInstruction = `
Tu es un dictionnaire technique et pédagogique pour Samnote.
Pour le terme recherché, génère un objet JSON strict :
{
  "term": "${query}",
  "definition": "Définition claire et accessible à un élève...",
  "howItWorks": "Principe de fonctionnement détaillé étape par étape...",
  "characteristics": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3"],
  "imageUrl": "https://image.pollinations.ai/prompt/technical%20drawing%20schema%20of%20${encodeURIComponent(query)}?width=800&height=500&nologo=true"
}
`;

    const result = await model.generateContent(`Recherche le concept : ${query}`);
    const parsedData = JSON.parse(result.response.text());

    return NextResponse.json(parsedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur lors de la recherche" }, { status: 500 });
  }
}