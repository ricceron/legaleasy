import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { datos, tipo } = await req.json();
    const prompt = `Eres un experto en derecho laboral mexicano. Analiza este contrato de ${tipo} y devuelve ÚNICAMENTE JSON válido sin markdown:

Datos: ${JSON.stringify(datos)}
SMV 2025: $248.93 MXN

Revisa: edad del trabajador, formato RFC/CURP/NSS, salario vs SMV, horario congruente, actividades suficientes, vigencia correcta.

JSON: {"puntaje":<0-100>,"observaciones":[{"tipo":"ok"|"warn"|"error"|"info","texto":"<texto con artículo LFT>"}],"recomendacion":"<una oración>"}
Máximo 7 observaciones.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const raw = data.content?.[0]?.text || '{}';
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error al analizar' }, { status: 500 });
  }
}
