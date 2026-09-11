import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Aucun terme de recherche fourni." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const systemInstruction = `
Tu es un dictionnaire technique et pédagogique pour Samnote.
Pour le terme recherché, génère un JSON strict :
{
  "term": "${query}",
  "definition": "Définition simple et précise...",
  "howItWorks": "Explication étape par étape du fonctionnement...",
  "characteristics": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3"],
  "drawingInstructions": "Drawing of ${query}, formatted like a technical drawing/schema with labeled components, clean lines, realistic engineering style",
  "imageUrl": "https://image.pollinations.ai/prompt/realistic%20technical%20drawing%20schema%20of%20${encodeURIComponent(query)}?width=800&height=500&nologo=true"
}
`;

    const result = await model.generateContent(`Recherche et analyse le terme : ${query}`);
    const data = JSON.parse(result.response.text());

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur de recherche" }, { status: 500 });
  }
}