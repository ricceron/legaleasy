import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { datos, tipo } = await req.json();
    const esRenuncia = /renuncia/i.test(tipo || '');
    const esResponsiva = /responsiva/i.test(tipo || '');

    const reglasResponsiva = `Revisa que esta CARTA RESPONSIVA de asignación de bienes (Arts. 134 fracc. VI y 135 fracc. IX LFT) sea sólida y completa:
- IDENTIFICACIÓN DEL BIEN: el bien debe quedar plenamente identificado (marca, modelo, número de serie/IMEI/VIN, placas, etc., según el caso). Si faltan datos clave de identificación, márcalo "warn", porque un bien mal identificado debilita la responsiva.
- PARTES: deben estar el patrón ("patronNombre"), el trabajador ("trabNombre") y el representante del patrón que entrega ("representante"). Si falta alguno, "warn".
- CLÁUSULAS: la carta ya incluye uso correcto, prohibición de uso por terceros, responsabilidad por daños y obligación de devolución al término de la relación (esto es correcto, "ok").
- FIRMAS: recuérdale (tipo "info") que la carta debe firmarse por AMBAS partes (quien recibe y quien entrega) y conservarse una copia; sin la firma del trabajador la responsiva pierde valor probatorio.
- NO apliques reglas de jornada, salario mínimo ni edad: este documento no las contiene.`;

    const reglasContrato = `Revisa: edad del trabajador, formato RFC/CURP/NSS, salario vs SMV, jornada, actividades suficientes, vigencia correcta.

REGLAS DE JORNADA (Arts. 61, 63 y 64 LFT) — aplícalas con cuidado:
- Evalúa SIEMPRE la JORNADA EFECTIVA, no el lapso de presencia (entrada a salida).
- El campo "jornadaContinua" indica la estructura: "discontinua" = el trabajador PUEDE salir del centro a comer; "continua" = NO puede salir.
- Si es DISCONTINUA: el periodo de comida ("jornadaDuracionComida", en minutos) NO se computa como tiempo efectivo (art. 64 a contrario). Jornada efectiva = presencia − comida. El campo "horasEfectivas" ya trae este cálculo.
- Si es CONTINUA: la comida SÍ se computa como tiempo efectivo (art. 64); jornada efectiva = presencia, y debe haber al menos 30 min de descanso (art. 63).
- Límites de jornada EFECTIVA: diurna 8 h, nocturna 7 h, mixta 7.5 h (art. 61). Compara "horasEfectivas" contra el límite del "jornadaTipo".
- NO marques como error un horario tipo 09:00–18:00 cuando sea discontinuo con 1 h de comida fuera: la jornada efectiva es de 8 h y es LEGAL.
- Si es discontinua y la comida supera 60 min, NO es ilegal; agrega una observación "warn" sobre riesgo de simulación.`;

    const reglasRenuncia = `Revisa que esta CARTA DE RENUNCIA VOLUNTARIA sea sólida conforme al artículo 53, fracción I de la LFT:
- VOLUNTARIEDAD: la carta declara una renuncia libre, voluntaria e irrevocable. Esto es lo correcto (art. 53, fracc. I). Si los datos son congruentes, márcalo como "ok".
- FECHAS: "fechaIngreso" debe ser ANTERIOR a "fechaRenuncia". Si falta alguna, o si la de ingreso es igual o posterior a la de renuncia, márcalo como "error" o "warn".
- ANTIGÜEDAD: comenta la antigüedad que resulta entre ambas fechas.
- FINIQUITO: la carta incluye el reconocimiento de no adeudo y el otorgamiento del finiquito (art. 53, fracc. I). Márcalo como "ok".
- DATOS: verifica que estén el patrón ("patronNombre"), el trabajador ("trabNombre"), puesto, área, ciudad y hora. Si falta el patrón o el trabajador, márcalo "warn".
- RECORDATORIO (usa tipo "info"): la carta debe firmarse de puño y letra por el trabajador y conviene conservar acuse de recibo; una renuncia NO puede ser exigida ni redactada bajo presión del patrón, pues ello la haría impugnable.
- NO apliques reglas de jornada ni de salario mínimo: este documento no las contiene.`;

    const prompt = `Eres un experto en derecho laboral mexicano. Analiza este documento de tipo "${tipo}" y devuelve ÚNICAMENTE JSON válido sin markdown:

Datos: ${JSON.stringify(datos)}
SMV 2025: $248.93 MXN

${esRenuncia ? reglasRenuncia : esResponsiva ? reglasResponsiva : reglasContrato}

JSON: {"puntaje":<0-100>,"observaciones":[{"tipo":"ok"|"warn"|"error"|"info","texto":"<texto con artículo LFT cuando aplique>"}],"recomendacion":"<una oración>"}
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
