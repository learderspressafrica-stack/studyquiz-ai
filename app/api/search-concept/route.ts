import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Terme de recherche requis' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prompt strict pour forcer une réponse JSON structurée comme un vrai cours d'électronique
    const prompt = `Tu es un expert en électronique. Génère une fiche technique pédagogique complète pour le composant ou concept suivant : "${query}".
    
    Réponds EXCLUSIVEMENT au format JSON strict avec la structure exacte suivante :
    {
      "titre": "Nom précis du composant",
      "definition": "Une définition claire avec le symbole électronique et le rôle principal.",
      "fonctionnement": "Explication détaillée du fonctionnement physique et des régimes de fonctionnement.",
      "caracteristiques": [
        "Caractéristique ou paramètre clé 1 (ex: Tension de seuil, Courant max)",
        "Caractéristique ou paramètre clé 2",
        "Caractéristique ou paramètre clé 3",
        "Familles / Types principaux (ex: BJT, MOSFET ou Silicium/Germanium)"
      ]
    }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Nettoyage du JSON dans la réponse (au cas où le modèle inclut des balises ```json)
    const cleanedJson = responseText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanedJson);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur API Search-Concept:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer la fiche technique" },
      { status: 500 }
    );
  }
}