// Helpers compartidos para generación de DOCX (docx 9.6.1).
import {
  Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType,
} from 'docx';

export function r(text: string, bold = false, size = 20) {
  return new TextRun({ text, font: 'Arial', size, bold, color: '000000' });
}

export function p(children: TextRun[], opts: { align?: string; before?: number; after?: number; spacing?: number } = {}) {
  return new Paragraph({
    children,
    alignment: (opts.align || 'both') as any,
    spacing: { before: opts.before ?? 80, after: opts.after ?? 80, line: opts.spacing ?? 276 },
  });
}

export function pBullet(ref: string, text: string, bold = false) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [r(text, bold)],
    spacing: { before: 60, after: 60, line: 276 },
    alignment: AlignmentType.BOTH,
  });
}

export function titulo(text: string) {
  return new Paragraph({
    children: [r(text, true, 24)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 80 },
  });
}

export function subtitulo(text: string) {
  return new Paragraph({
    children: [r(text, true, 22)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 160 },
  });
}

export function seccion(text: string) {
  return new Paragraph({
    children: [r(text, true, 20)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 100 },
  });
}

export function clausulaTitulo(texto: string) {
  return new Paragraph({
    children: [r(texto, true, 20)],
    alignment: AlignmentType.BOTH,
    spacing: { before: 140, after: 60 },
  });
}

export function cuerpo(children: TextRun[]) {
  return p(children, { before: 40, after: 60, spacing: 276 });
}

// Texto de la cláusula de jornada según continuidad (Arts. 61, 63 y 64 LFT).
export function fmtHoras(h: number) {
  return Number.isInteger(h) ? String(h) : h.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
export function textoJornada(D: any) {
  const entrada = D.jornadaEntrada || '09:00';
  const salida = D.jornadaSalida || '18:00';
  const continua = D.jornadaContinua === 'continua';
  const dur = Number(D.jornadaDuracionComida || 60);
  const inicio = D.jornadaInicioComida || '14:00';
  const [hI, mI] = inicio.split(':').map(Number);
  const fin = (() => {
    const t = hI * 60 + mI + dur;
    return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  })();
  const [hE, mE] = entrada.split(':').map(Number);
  const [hS, mS] = salida.split(':').map(Number);
  let span = hS * 60 + mS - (hE * 60 + mE);
  if (span <= 0) span += 1440;
  const efectivas = continua ? span / 60 : span / 60 - dur / 60;
  const durTxt = dur === 60 ? 'una hora' : dur === 30 ? 'media hora' : dur === 90 ? 'una hora y media' : dur === 120 ? 'dos horas' : `${dur} minutos`;

  if (continua) {
    return `La duración de la jornada de trabajo será la ${D.jornadaTipo}, con un horario de ${entrada} a ${salida} horas. Dentro de dicha jornada continua "EL TRABAJADOR" gozará de un descanso de ${durTxt} para tomar sus alimentos, de conformidad con el artículo 63 de la Ley Federal del Trabajo. Al permanecer "EL TRABAJADOR" dentro del centro de trabajo durante dicho periodo, el mismo se computa como tiempo efectivo de la jornada en términos del artículo 64 de la propia Ley, resultando una jornada efectiva de ${fmtHoras(efectivas)} horas diarias. "EL PATRON" podrá en todo momento ajustar los días laborables y redistribuir el horario conforme a sus necesidades operativas y a los requerimientos del objeto del contrato, sin que dichos ajustes impliquen una modificación sustancial de las condiciones de trabajo, con descanso semanal los días ${D.jornadaDescanso}.`;
  }
  return `La duración de la jornada de trabajo será la ${D.jornadaTipo}, con un horario de ${entrada} a ${salida} horas, comprendiendo dentro de ese periodo un lapso de ${durTxt}, de las ${inicio} a las ${fin} horas, destinado a que "EL TRABAJADOR" tome sus alimentos fuera del centro de trabajo, durante el cual podrá disponer libremente de su tiempo, por lo que dicho lapso no se computa como tiempo efectivo de la jornada laboral conforme a la interpretación a contrario sensu del artículo 64 de la Ley Federal del Trabajo, quedando la jornada efectiva de trabajo en ${fmtHoras(efectivas)} horas diarias, dentro del máximo previsto por el artículo 61 de la propia Ley. En caso de que "EL TRABAJADOR" no pudiera salir del centro de trabajo durante dicho lapso, el tiempo correspondiente se computará como tiempo efectivo de trabajo en términos del citado artículo 64. "EL PATRON" podrá en todo momento ajustar los días laborables y redistribuir el horario conforme a sus necesidades operativas y a los requerimientos del objeto del contrato, sin que dichos ajustes impliquen una modificación sustancial de las condiciones de trabajo, con descanso semanal los días ${D.jornadaDescanso}.`;
}

export function linea() {
  return new Paragraph({
    children: [r('________________________________')],
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 40 },
  });
}

export function firmaTable(izqTitulo: string, izqNombre: string, derTitulo: string, derNombre: string) {
  const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const bords = { top: nb, bottom: nb, left: nb, right: nb };
  const w = 4680;
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [w, w],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: bords, width: { size: w, type: WidthType.DXA }, children: [
          new Paragraph({ children: [r('________________________________')], alignment: AlignmentType.LEFT, spacing: { before: 0, after: 40 } }),
          new Paragraph({ children: [r(izqTitulo, true)], alignment: AlignmentType.LEFT, spacing: { before: 0, after: 20 } }),
          new Paragraph({ children: [r(izqNombre, true)], alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0 } }),
        ]}),
        new TableCell({ borders: bords, width: { size: w, type: WidthType.DXA }, children: [
          new Paragraph({ children: [r('________________________________')], alignment: AlignmentType.LEFT, spacing: { before: 0, after: 40 } }),
          new Paragraph({ children: [r(derTitulo, true)], alignment: AlignmentType.LEFT, spacing: { before: 0, after: 20 } }),
          new Paragraph({ children: [r(derNombre, true)], alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0 } }),
        ]}),
      ]}),
    ],
  });
}

export function tablaVacaciones() {
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
  const bords = { top: b, bottom: b, left: b, right: b };
  const rows = [['1', '12 días'], ['2', '14 días'], ['3', '16 días'], ['4', '18 días']];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: bords, width: { size: 4680, type: WidthType.DXA }, shading: { fill: 'D5E8F0', type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [r('AÑOS DE SERVICIOS', true)], alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: bords, width: { size: 4680, type: WidthType.DXA }, shading: { fill: 'D5E8F0', type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [r('DIAS DE VACACIONES', true)], alignment: AlignmentType.CENTER })] }),
      ]}),
      ...rows.map(([anio, dias]) => new TableRow({ children: [
        new TableCell({ borders: bords, width: { size: 4680, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [r(anio)], alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: bords, width: { size: 4680, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [r(dias)], alignment: AlignmentType.CENTER })] }),
      ]})),
    ],
  });
}

export function tablaAnexoA(actividades: string[]) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
  const bords = { top: b, bottom: b, left: b, right: b };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [600, 8760],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: bords, width: { size: 600, type: WidthType.DXA }, shading: { fill: 'D5E8F0', type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [r('N°', true)], alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: bords, width: { size: 8760, type: WidthType.DXA }, shading: { fill: 'D5E8F0', type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [r('Descripción del Puesto', true)], alignment: AlignmentType.CENTER })] }),
      ]}),
      ...actividades.map((act, i) => new TableRow({ children: [
        new TableCell({ borders: bords, width: { size: 600, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [r(`${i + 1}.-`)], alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: bords, width: { size: 8760, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [r(act.trim())], alignment: AlignmentType.BOTH })] }),
      ]})),
    ],
  });
}

// ── API HANDLER ──────────────────────────────────────────────────
