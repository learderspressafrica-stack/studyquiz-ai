import { NextRequest, NextResponse } from 'next/server';

// Forcer le runtime Node.js complet pour Vercel / Turbopack
export const runtime = 'nodejs';

// Import de pdf-parse
const pdfParse = require('pdf-parse');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier PDF fourni.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extraction du texte
    const pdfData = await pdfParse(buffer);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le fichier PDF ne contient pas de texte lisible.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: pdfData.text });
  } catch (error: any) {
    console.error('Erreur extraction PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la lecture du fichier PDF.' },
      { status: 500 }
    );
  }
}