import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseText, userProfile, homeworkImageBase64 } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API Gemini manquante dans le fichier .env.local' },
        { status: 500 }
      );
    }

    // Utilisation du modèle gemini-3.6-flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const prompt = `Tu es un assistant pédagogique. Génère uniquement un objet JSON valide qui respecte scrupuleusement la structure ci-dessous. Ne rajoute aucun texte, ni balise Markdown autour du JSON.

Structure JSON attendue :
{
  "title": "Titre explicatif du cours",
  "summary": "Résumé synthétique et pédagogique du cours",
  "audioScript": "Script concis destiné à être lu à voix haute pour réviser le cours",
  "quiz": [
    {
      "question": "Question 1",
      "options": ["Choix A", "Choix B", "Choix C", "Choix D"],
      "correctIndex": 0,
      "explanation": "Explication de la réponse"
    }
  ],
  "weeklyAssignment": {
    "title": "Devoir de révision",
    "instructions": "Consignes de l'exercice",
    "questions": ["Question 1", "Question 2"],
    "practicalExercise": "Exercice pratique à réaliser",
    "gradingCriteria": "Critères d'évaluation"
  }
}

Profil de l'élève :
- Niveau : ${userProfile?.level || 'Lycée'}
- Classe : ${userProfile?.grade || 'Terminale'}
- Filière : ${userProfile?.field || 'Informatique'}

Contenu du cours :
${courseText || 'Analyse l\'image.'}`;

    const contents: any[] = [prompt];

    if (homeworkImageBase64) {
      const parts = homeworkImageBase64.split(',');
      const mimeType = parts[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const base64Data = parts[1] || homeworkImageBase64;

      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }

    const result = await model.generateContent(contents);
    let rawText = result.response.text();

    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(rawText);
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Erreur Backend Gemini:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la génération du contenu.' },
      { status: 500 }
    );
  }
}