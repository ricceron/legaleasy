import { NextRequest, NextResponse } from 'next/server';
import { generadores } from '../../../lib/documentos/registry';

export async function POST(req: NextRequest) {
  try {
    const { tipo, datos } = await req.json();

    const generar = generadores[tipo as string];
    if (!generar) {
      return NextResponse.json({ error: 'Tipo de documento no soportado' }, { status: 400 });
    }

    const buffer = await generar(datos);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="LexByte_${tipo}_${Date.now()}.docx"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al generar documento' }, { status: 500 });
  }
}
