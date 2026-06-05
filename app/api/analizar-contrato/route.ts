import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { datos, tipo } = await req.json();
    const prompt = `Eres un experto en derecho laboral mexicano. Analiza este contrato de ${tipo} y devuelve ÚNICAMENTE JSON válido sin markdown:

Datos: ${JSON.stringify(datos)}
SMV 2025: $248.93 MXN

Revisa: edad del trabajador, formato RFC/CURP/NSS, salario vs SMV, jornada, actividades suficientes, vigencia correcta.

REGLAS DE JORNADA (Arts. 61, 63 y 64 LFT) — aplícalas con cuidado:
- Evalúa SIEMPRE la JORNADA EFECTIVA, no el lapso de presencia (entrada a salida).
- El campo "jornadaContinua" indica la estructura: "discontinua" = el trabajador PUEDE salir del centro a comer; "continua" = NO puede salir.
- Si es DISCONTINUA: el periodo de comida ("jornadaDuracionComida", en minutos) NO se computa como tiempo efectivo (art. 64 a contrario). Jornada efectiva = presencia − comida. El campo "horasEfectivas" ya trae este cálculo.
- Si es CONTINUA: la comida SÍ se computa como tiempo efectivo (art. 64); jornada efectiva = presencia, y debe haber al menos 30 min de descanso (art. 63).
- Límites de jornada EFECTIVA: diurna 8 h, nocturna 7 h, mixta 7.5 h (art. 61). Compara "horasEfectivas" contra el límite del "jornadaTipo".
- NO marques como error un horario tipo 09:00–18:00 cuando sea discontinuo con 1 h de comida fuera: la jornada efectiva es de 8 h y es LEGAL. Solo márcalo como error si "horasEfectivas" excede el límite.
- Si es discontinua y la comida supera 60 min, NO es ilegal; agrega una observación tipo "warn" sobre riesgo de simulación si el descanso no refleja la operación real.

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

