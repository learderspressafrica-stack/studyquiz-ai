import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Aucun texte fourni pour la génération.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API non configurée.' }, { status: 500 });
    }

    const systemInstruction = `
Tu es un professeur expert et un assistant pédagogique. À partir du cours ou texte fourni, génère une réponse STRICTEMENT au format JSON valide, sans balises markdown.

Le JSON doit respecter scrupuleusement cette structure :
{
  "title": "Titre du cours",
  "summary": "Résumé clair et concis du cours, parfaitement adapté à une lecture audio.",
  "realWorldExamples": [
    "Exemple concret 1 issu du monde réel ou de l'industrie",
    "Exemple concret 2 explicatif"
  ],
  "keywords": ["Transistor", "Resistance"], // Composants clés pour les images
  "quiz": [
    {
      "question": "Texte de la question ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explication détaillée de la bonne réponse avec justification pédagogique."
    }
    // Génère AU MINIMUM 5 à 10 questions
  ]
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemInstruction },
                { text: `Voici le cours à analyser :\n${prompt}` }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("L'IA n'a pas retourné de réponse.");
    }

    const parsedData = JSON.parse(rawText);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Erreur API Generate:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la génération du contenu.' },
      { status: 500 }
    );
  }
}