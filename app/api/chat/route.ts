import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        system: `Eres LEX, un asistente jurídico laboral mexicano con 20 años de experiencia. Trabajas para LegalEasy.\n\nReglas: Siempre cita el artículo LFT aplicable. Corrige conceptos erróneos primero. Lenguaje claro. Máximo 300 palabras.\n\nDatos clave: SMV 2025 $248.93. Art 47 causas de rescisión. Maternidad 84 días Art 170. Retardos NO son faltas sin Reglamento Interior registrado Art 423.`,
        messages,
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Error al procesar.';
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: 'Error', reply: 'Error al procesar.' }, { status: 500 });
  }
}
