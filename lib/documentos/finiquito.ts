// Finiquito / Convenio de Liquidación (Arts. 47, 48-50, 53, 79-81, 87, 162 LFT).
// Recibe los conceptos ya calculados: D.conceptos = [{label, detalle, monto}], D.total, etc.
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType,
} from 'docx';

const BLUE = '2563EB';
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const money = (n: any) => '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function generarFiniquito(D: any): Promise<Buffer> {
  const D2: any = D;
  const ra = (text: string, bold = false, italic = false) => new TextRun({ text, font: 'Arial', size: 22, bold, italics: italic, color: '000000' });
  const cf = (val: string, ph: string) => val ? new TextRun({ text: val, font: 'Arial', size: 22, bold: true, color: '000000' }) : new TextRun({ text: `«${ph}»`, font: 'Arial', size: 22, bold: true, color: BLUE });
  const pa = (children: TextRun[], opts: any = {}) => new Paragraph({ children, alignment: (opts.align || 'both') as any, spacing: { before: opts.before ?? 0, after: opts.after ?? 140, line: 264 } });
  const center = (children: TextRun[], opts: any = {}) => new Paragraph({ children, alignment: AlignmentType.CENTER, spacing: { before: opts.before ?? 20, after: opts.after ?? 20 } });

  const esLiq = D2.tipo === 'liquidacion';
  const titulo = esLiq ? 'CONVENIO DE TERMINACIÓN Y LIQUIDACIÓN' : 'RECIBO DE FINIQUITO';
  const articulos = esLiq ? 'Artículos 48, 49, 50, 53, 79-81, 87 y 162 de la Ley Federal del Trabajo' : 'Artículos 53, 79-81, 87 y 162 de la Ley Federal del Trabajo';

  const razon = D2.patronNombre || '';
  const trab = D2.trabNombre || '';
  const ciudad = D2.ciudad || '';
  const rep = D2.patronRepresentante || '';
  const cargo = D2.cargoRepresentante || '';
  const causaLabel = D2.causaLabel || '';
  const antig = D2.antiguedadTxt || '';
  const fechaDMA = (iso: string) => { if (!iso) return ''; const dt = new Date(iso + 'T00:00:00'); return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`; };
  const fb = D2.fechaBaja ? new Date(D2.fechaBaja + 'T00:00:00') : null;
  const hoy = D2.fechaDocumento ? new Date(D2.fechaDocumento + 'T00:00:00') : new Date();
  const ddDoc = String(hoy.getDate()).padStart(2,'0'); const mesDoc = MESES[hoy.getMonth()]; const anioDoc = String(hoy.getFullYear());

  // Tabla de conceptos
  const conceptos: any[] = Array.isArray(D2.conceptos) ? D2.conceptos.filter((c: any) => c && (c.monto || c.monto === 0)) : [];
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
  const bords = { top: b, bottom: b, left: b, right: b };
  const tcell = (children: any[], w: number, fill?: string, align: any = AlignmentType.LEFT) => new TableCell({
    borders: bords, width: { size: w, type: WidthType.DXA }, shading: fill ? { fill, type: ShadingType.CLEAR } : undefined, margins: { top: 50, bottom: 50, left: 110, right: 110 },
    children: [new Paragraph({ children, alignment: align })],
  });
  const tablaConceptos = () => new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3700, 3360, 2300], rows: [
    new TableRow({ tableHeader: true, children: [
      tcell([ra('Concepto', true)], 3700, 'D6DCE4'),
      tcell([ra('Base de cálculo', true)], 3360, 'D6DCE4'),
      tcell([ra('Importe', true)], 2300, 'D6DCE4', AlignmentType.RIGHT),
    ]}),
    ...conceptos.map((c: any) => new TableRow({ children: [
      tcell([ra(c.label || '')], 3700),
      tcell([ra(c.detalle || '', false, true)], 3360),
      tcell([ra(money(c.monto))], 2300, undefined, AlignmentType.RIGHT),
    ]})),
    new TableRow({ children: [
      tcell([ra('TOTAL', true)], 3700, 'F2F4F7'),
      tcell([ra('', true)], 3360, 'F2F4F7'),
      tcell([ra(money(D2.total), true)], 2300, 'F2F4F7', AlignmentType.RIGHT),
    ]}),
  ]});

  const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const firma = (nombreRun: TextRun, label: string) => new TableCell({
    borders: { top: nb, bottom: nb, left: nb, right: nb }, width: { size: 4680, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 60, right: 60 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 560, after: 6 }, children: [ra('______________________________')] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [nombreRun] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [ra(label, true)] }),
    ],
  });
  const firmas = () => new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
    rows: [new TableRow({ children: [firma(cf(trab, 'NOMBRE DEL TRABAJADOR'), 'EL TRABAJADOR'), firma(cf(rep || razon, 'NOMBRE DEL REPRESENTANTE / PATRÓN'), 'EL PATRÓN')] })] });

  const children: any[] = [
    center([ra(titulo, true)], { after: 14 }),
    center([ra(articulos, false, true)], { after: 180 }),
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 160 }, children: [cf(ciudad, 'Ciudad, Estado'), ra(', a '), ra(ddDoc, true), ra(' de '), ra(mesDoc, true), ra(' de '), ra(anioDoc, true)] }),

    pa([
      ra('Hago constar que '), cf(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN'),
      ra(' y '), cf(trab, 'NOMBRE COMPLETO DEL TRABAJADOR'),
      ra(' dan por terminada la relación laboral que los unía con fecha '), cf(fb ? fechaDMA(D2.fechaBaja) : '', 'FECHA DE BAJA'),
      ra(', por motivo de '), cf(causaLabel, 'CAUSA DE TERMINACIÓN'),
      ra(', habiendo prestado el trabajador sus servicios durante una antigüedad de '), cf(antig, 'ANTIGÜEDAD'),
      ra('. En este acto se cubren las cantidades que a continuación se desglosan:'),
    ]),

    new Paragraph({ spacing: { before: 60, after: 120 }, children: [] }),
    tablaConceptos(),
    pa([
      ra('La cantidad total a pagar es de '), ra(money(D2.total), true),
      ra(' ('), cf('', 'CANTIDAD CON LETRA'), ra(' M.N.), que '), cf(trab, 'NOMBRE DEL TRABAJADOR'),
      ra(esLiq
        ? ' recibe en este acto a su entera satisfacción.'
        : ' recibe en este acto a su entera satisfacción, mediante el pago correspondiente.'),
    ], { before: 140 }),
  ];

  if (esLiq) {
    children.push(
      pa([
        ra('“EL PATRÓN” y “EL TRABAJADOR” reconocen que la terminación de la relación laboral obedece a la causa señalada y, en consecuencia, “EL PATRÓN” cubre en favor de “EL TRABAJADOR” las indemnizaciones que conforme a los artículos 48, 49, 50 y 162 de la Ley Federal del Trabajo le corresponden, las cuales quedan comprendidas en el desglose anterior.'),
      ]),
      pa([
        ra('Ambas partes manifiestan su voluntad de dar por concluida la relación laboral de común acuerdo y sin reserva alguna. “EL TRABAJADOR” reconoce que con el pago aquí descrito quedan cubiertas todas las prestaciones e indemnizaciones derivadas de la relación laboral, otorgando el más amplio finiquito que en derecho proceda, sin reservarse acción o derecho alguno que ejercitar en contra de “EL PATRÓN”.'),
      ]),
      pa([
        ra('Las partes convienen en ratificar el presente convenio ante el Centro de Conciliación Laboral competente o ante la autoridad laboral correspondiente, a fin de que surta plenos efectos legales conforme a los artículos 33 y 987 de la Ley Federal del Trabajo.'),
      ]),
    );
  } else {
    children.push(
      pa([
        ra('Con el pago descrito, '), cf(trab, 'NOMBRE DEL TRABAJADOR'),
        ra(' manifiesta que '), cf(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN'),
        ra(' no le adeuda cantidad alguna por concepto de salarios, aguinaldo, vacaciones, prima vacacional, prima de antigüedad ni por ningún otro concepto derivado de la relación laboral o de la ley, otorgando en este acto el más amplio finiquito que en derecho proceda, sin reservarse acción o derecho alguno que ejercitar.'),
      ]),
    );
  }

  children.push(
    pa([ra('Las cantidades anteriores se calcularon conforme a la Ley Federal del Trabajo con base en los datos proporcionados; cualquier ajuste por conceptos no contemplados deberá hacerse constar por escrito antes de la firma.', false, true)], { before: 40, after: 0 }),
    new Paragraph({ spacing: { before: 120 }, children: [] }),
    pa([ra('Leído que fue el presente documento, lo firman de conformidad en '), cf(ciudad, 'Ciudad'), ra(', a '), ra(ddDoc, true), ra(' de '), ra(mesDoc, true), ra(' de '), ra(anioDoc, true), ra('.')], { after: 0 }),
    firmas(),
    new Paragraph({ spacing: { before: 80 }, children: [ra('Cargo del representante: '), cf(cargo, 'CARGO DEL REPRESENTANTE')] }),
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1418, right: 1418, bottom: 1418, left: 1418 } } }, children }],
  });
  return Packer.toBuffer(doc);
}
