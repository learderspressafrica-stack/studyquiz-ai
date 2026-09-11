import { NextRequest, NextResponse } from 'next/server';

// Utilisation de require pour charger pdf2json proprement
const PDFParser = require('pdf2json');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier PDF fourni.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extraction du texte via pdf2json
    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(errData.parserError);
      });

      pdfParser.on('pdfParser_dataReady', () => {
        const rawText = pdfParser.getRawTextContent();
        resolve(rawText);
      });

      pdfParser.parseBuffer(buffer);
    });

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
      { error: 'Erreur lors de la lecture du fichier PDF.' },
      { status: 500 }
    );
  }
}