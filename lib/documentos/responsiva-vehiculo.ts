// Carta Responsiva de Asignación de Vehículo (Arts. 134-VI y 135-IX LFT).
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType,
} from 'docx';

export function generarResponsivaVehiculo(D: any): Promise<Buffer> {
  const BLUE = '2563EB';
  const ra = (text: string, bold = false, italic = false) => new TextRun({ text, font: 'Arial', size: 22, bold, italics: italic, color: '000000' });
  const campo = (val: string, ph: string) =>
    val ? new TextRun({ text: val, font: 'Arial', size: 22, bold: true, color: '000000' })
        : new TextRun({ text: `«${ph}»`, font: 'Arial', size: 22, bold: true, color: BLUE });
  const pa = (children: TextRun[], opts: any = {}) => new Paragraph({ children, alignment: (opts.align || 'both') as any, spacing: { before: opts.before ?? 0, after: opts.after ?? 130, line: 264 } });
  const center = (children: TextRun[], opts: any = {}) => new Paragraph({ children, alignment: AlignmentType.CENTER, spacing: { before: opts.before ?? 20, after: opts.after ?? 20 } });
  const sub = (text: string) => new Paragraph({ children: [ra(text, true)], spacing: { before: 160, after: 60 } });

  const tb = { style: BorderStyle.SINGLE, size: 1, color: 'BBBBBB' };
  const cell = (children: TextRun[], w: number, fill?: string) => new TableCell({
    borders: { top: tb, bottom: tb, left: tb, right: tb }, width: { size: w, type: WidthType.DXA },
    shading: fill ? { fill, type: 'clear' as any } : undefined, margins: { top: 60, bottom: 60, left: 130, right: 130 },
    children: [new Paragraph({ children })],
  });
  const kv = (rows: Array<[string, TextRun]>) => new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [3200, 6160],
    rows: rows.map(([l, v]) => new TableRow({ children: [cell([ra(l, true)], 3200, 'F2F4F7'), cell([v], 6160)] })),
  });

  const razon = D.patronNombre || '';
  const titular = D.trabNombre || '';
  const puesto = D.puesto || '';
  const ciudad = D.ciudad || '';
  const rep = D.representante || '';
  const cargo = D.cargoRepresentante || '';
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const f = D.fecha ? new Date(D.fecha + 'T00:00:00') : null;
  const dd = f ? String(f.getDate()).padStart(2, '0') : '';
  const mesNom = f ? meses[f.getMonth()] : '';
  const anio = f ? String(f.getFullYear()) : '';

  const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const firmaCell = (nombre: TextRun, rol: string) => new TableCell({
    borders: { top: nb, bottom: nb, left: nb, right: nb }, width: { size: 4680, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 500, after: 6 }, children: [ra('______________________________')] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [nombre] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [ra(rol, false, true)] }),
    ],
  });

  const children: any[] = [
    center([ra('CARTA RESPONSIVA DE ASIGNACIÓN DE VEHÍCULO', true)], { after: 14 }),
    center([ra('Artículos 134 Fracción VI y 135 Fracción IX de la Ley Federal del Trabajo', false, true)], { after: 180 }),
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 180 }, children: [campo(ciudad, 'Ciudad, Estado'), ra(', a '), campo(dd, 'DD'), ra(' de '), campo(mesNom, 'mes'), ra(' de '), campo(anio, 'AAAA')] }),
    new Paragraph({ spacing: { after: 0, line: 264 }, children: [campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN')] }),
    new Paragraph({ spacing: { after: 160, line: 264 }, children: [ra('P r e s e n t e', true)] }),

    pa([
      ra('Por medio de la presente, yo '), campo(titular, 'NOMBRE COMPLETO DEL TRABAJADOR/A'),
      ra(', con CURP '), campo(D.curp, 'CURP'),
      ra(', con domicilio en '), campo(D.domicilio, 'DOMICILIO COMPLETO, COLONIA, C.P., CIUDAD, ESTADO'),
      ra(', de nacionalidad mexicana, mayor de edad, en mi carácter de '), campo(puesto, 'DENOMINACIÓN DEL PUESTO'),
      ra(', declaro haber recibido de conformidad el vehículo automotor que a continuación se describe, el cual me es asignado para resguardo y para la ejecución y desempeño de mis funciones laborales:'),
    ]),

    sub('DATOS DEL VEHÍCULO:'),
    kv([
      ['Marca:', campo(D.vehMarca, 'MARCA')],
      ['Modelo / Tipo:', campo(D.vehModelo, 'MODELO')],
      ['Año:', campo(D.vehAnio, 'AÑO')],
      ['Número de serie:', campo(D.vehSerie, 'NÚMERO DE SERIE / VIN')],
      ['Clave vehicular:', campo(D.vehClave, 'CLAVE VEHICULAR')],
      ['Número de placas:', campo(D.vehPlacas, 'PLACAS')],
      ['Color:', campo(D.vehColor, 'COLOR')],
      ['Kilometraje:', campo(D.vehKm, 'KILOMETRAJE AL MOMENTO DE ENTREGA')],
    ]),
    sub('ACCESORIOS Y DOCUMENTOS INCLUIDOS:'),
    kv([
      ['Llanta de refacción:', campo(D.accLlanta, 'SÍ / NO')],
      ['Gato hidráulico:', campo(D.accGato, 'SÍ / NO')],
      ['Caja de herramienta:', campo(D.accCaja, 'SÍ / NO')],
      ['Tapetes / cubre asientos:', campo(D.accTapetes, 'SÍ / NO')],
      ['Tarjeta de circulación:', campo(D.accTarjeta, 'FOLIO')],
      ['Póliza de seguro:', campo(D.accPoliza, 'NÚMERO DE PÓLIZA — ASEGURADORA')],
      ['Otros accesorios:', campo(D.accOtros, "DESCRIPCIÓN O 'NINGUNO'")],
    ]),

    pa([
      ra('El vehículo se entrega en '), campo(D.condiciones, 'óptimas / regulares'),
      ra(' condiciones físicas y mecánicas, conforme consta en las fotografías que se adjuntan al presente documento como '),
      ra('Anexo 1', true),
      ra('. El/La trabajador(a) se obliga a devolver el vehículo en el mismo estado, salvo el desgaste natural derivado del uso correcto para las funciones encomendadas.'),
    ], { before: 80 }),

    sub('COMPROMISOS DE CONDUCCIÓN.'),
    pa([
      ra('El/La trabajador(a) manifiesta que se encuentra facultado/a para operar el vehículo conforme a sus características, que cuenta con licencia de conducir vigente tipo '),
      campo(D.tipoLicencia, 'TIPO DE LICENCIA'),
      ra(', y asume el compromiso de: (i) operar la unidad con extrema precaución; (ii) respetar los límites de velocidad y reglamentos de tránsito municipales, estatales y federales vigentes; y (iii) no conducir bajo el influjo de alcohol, estupefacientes u otras sustancias que disminuyan sus facultades.'),
    ]),
    sub('PROTOCOLO DE REPORTE DE SINIESTROS.'),
    pa([
      ra('En caso de accidente, robo, avería o cualquier eventualidad que afecte el vehículo, el/la trabajador(a) se obliga a: (i) reportar el hecho a '),
      campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN'),
      ra(' dentro de las '), ra('primeras 24 horas', true),
      ra(' de ocurrido el evento; (ii) obtener el reporte policial correspondiente en caso de accidente o robo; (iii) no abandonar el lugar del accidente sin haber cumplido con las obligaciones legales aplicables; y (iv) proporcionar todos los datos necesarios para el trámite ante la aseguradora. El incumplimiento de este protocolo hará al/a la trabajador(a) responsable de los costos que por dicha omisión no sean cubiertos por el seguro.'),
    ]),
    sub('PROHIBICIÓN DE USO POR TERCEROS.'),
    pa([
      ra('El/La trabajador(a) se compromete a no prestar, ceder, subarrendar ni permitir el uso del bien descrito a ningún tercero, sea familiar, conocido u otra persona ajena a '),
      campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN'),
      ra('. El bien asignado es de uso exclusivo del/de la trabajador(a) para el desempeño de sus funciones laborales. El incumplimiento de esta prohibición constituirá causa de rescisión sin responsabilidad para el patrón conforme al artículo 135, fracción IX de la Ley Federal del Trabajo.'),
    ]),
    sub('RESPONSABILIDAD POR DAÑOS.'),
    pa([
      ra('El/La trabajador(a) se hace responsable de cualquier daño, deterioro anormal o pérdida del bien asignado que sea resultado de dolo, negligencia grave o uso distinto al laboral. En tales casos, '),
      campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN'),
      ra(' podrá exigir la reparación o reposición del bien, o bien ejercer las acciones legales que correspondan conforme a la Ley Federal del Trabajo y la legislación civil aplicable. El desgaste natural derivado del uso correcto del bien para las funciones encomendadas no generará responsabilidad alguna para el/la trabajador(a).'),
    ]),
    sub('DEVOLUCIÓN AL TÉRMINO DE LA RELACIÓN LABORAL.'),
    pa([
      ra('Al momento en que se dé por terminada la relación de trabajo con '),
      campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN'),
      ra(', por cualquier causa, el/la trabajador(a) se obliga a devolver el bien descrito a más tardar el '),
      ra('mismo día hábil', true),
      ra(' en que opere la terminación, en el mismo estado en que le fue entregado, salvo el desgaste natural por uso correcto. La devolución deberá constar en un Acta de Devolución firmada por ambas partes. Mientras no se formalice la devolución, el/la trabajador(a) continuará siendo responsable del bien, conforme al artículo 134, fracción VI de la Ley Federal del Trabajo.'),
    ]),

    pa([
      ra('Leído y firmado de conformidad por las partes en la ciudad de '), campo(ciudad, 'Ciudad'),
      ra(', a '), campo(dd, 'DD'), ra(' de '), campo(mesNom, 'mes'), ra(' de '), campo(anio, 'AAAA'), ra('.'),
    ], { before: 60, after: 40 }),

    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680], rows: [new TableRow({ children: [
      firmaCell(campo(titular, 'NOMBRE COMPLETO DEL TRABAJADOR/A'), 'Firma del trabajador/a — Recibe'),
      firmaCell(campo(rep, 'NOMBRE DEL REPRESENTANTE DEL PATRÓN'), 'Firma del patrón — Entrega'),
    ] })] }),

    new Paragraph({ spacing: { before: 80 }, children: [ra('Cargo del representante: '), campo(cargo, 'CARGO DEL REPRESENTANTE')] }),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1418, right: 1418, bottom: 1418, left: 1418 } } }, children }],
  });
  return Packer.toBuffer(doc);
}
