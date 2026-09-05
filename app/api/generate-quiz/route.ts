import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier n\'a été fourni.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Support des images et des PDF
    const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prompt configuré spécifiquement pour le Collège, Lycée et les Enseignements Techniques (ex: Électronique)
    const prompt = `
Tu es un assistant pédagogique spécialisé pour les élèves du Collège, du Lycée et des Enseignements Techniques/Professionnels (notamment la filière Électronique et sciences appliquées).

Analyse le document fourni et génère une fiche de révision ainsi qu'un quiz sous forme de JSON strict.

Directives de rédaction :
1. Langue : Détecte automatiquement la langue du document (Français ou Anglais) et réponds dans la MÊME langue.
2. Niveau Pédagogique : Adapte le vocabulaire pour un élève de collège, lycée ou école technique.
3. Spécificité Technique / Électronique : Si le cours traite de technique ou d'électronique (composants, tensions, courants, schémas, formules, lois de physique, sécurité), mets en avant ces notions clés de façon très structurée.
4. Synthèse : Extrais entre 4 et 6 points essentiels, concis et faciles à retenir.
5. Quiz : Génère 3 à 5 questions à choix multiples (QCM) avec 4 options, la bonne réponse, et une explication claire et bienveillante.

Réponds STRICTEMENT sous forme d'objet JSON valide avec la structure suivante (sans texte ou balises markdown supplémentaires) :
{
  "summary": [
    "Point clé 1...",
    "Point clé 2..."
  ],
  "quiz": [
    {
      "id": 1,
      "question": "Texte de la question...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option exacte",
      "explanation": "Explication pédagogique..."
    }
  ]
}
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: mimeType
        }
      }
    ]);

    const textResponse = result.response.text();
    const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Erreur lors de la génération :', error);
    return NextResponse.json({ error: 'Échec de l\'analyse du document.' }, { status: 500 });
  }
}