import { NextRequest, NextResponse } from 'next/server';
import { pdfToText } from 'pdf-ts';

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

    // Extraction du texte via pdf-ts (compatible Vercel Serverless)
    const text = await pdfToText(buffer);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le fichier PDF ne contient pas de texte lisible.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Erreur extraction PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la lecture du fichier PDF sur le serveur.' },
      { status: 500 }
    );
  }
}