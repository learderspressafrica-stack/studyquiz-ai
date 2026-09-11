import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier PDF fourni.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Chargement dynamique avec require pour contourner l'erreur TypeScript (ts2339)
    const pdfParse = require('pdf-parse');

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