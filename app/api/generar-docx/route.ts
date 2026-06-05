import { NextRequest, NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, PageBreak, LevelFormat,
} from 'docx';

// ── HELPERS ──────────────────────────────────────────────────────

function r(text: string, bold = false, size = 20) {
  return new TextRun({ text, font: 'Arial', size, bold, color: '000000' });
}

function p(children: TextRun[], opts: { align?: string; before?: number; after?: number; spacing?: number } = {}) {
  return new Paragraph({
    children,
    alignment: (opts.align || 'both') as any,
    spacing: { before: opts.before ?? 80, after: opts.after ?? 80, line: opts.spacing ?? 276 },
  });
}

function pBullet(ref: string, text: string, bold = false) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [r(text, bold)],
    spacing: { before: 60, after: 60, line: 276 },
    alignment: AlignmentType.BOTH,
  });
}

function titulo(text: string) {
  return new Paragraph({
    children: [r(text, true, 24)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 80 },
  });
}

function subtitulo(text: string) {
  return new Paragraph({
    children: [r(text, true, 22)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 160 },
  });
}

function seccion(text: string) {
  return new Paragraph({
    children: [r(text, true, 20)],
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 100 },
  });
}

function clausulaTitulo(texto: string) {
  return new Paragraph({
    children: [r(texto, true, 20)],
    alignment: AlignmentType.BOTH,
    spacing: { before: 140, after: 60 },
  });
}

function cuerpo(children: TextRun[]) {
  return p(children, { before: 40, after: 60, spacing: 276 });
}

// Texto de la cláusula de jornada según continuidad (Arts. 61, 63 y 64 LFT).
function fmtHoras(h: number) {
  return Number.isInteger(h) ? String(h) : h.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
function textoJornada(D: any) {
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

function linea() {
  return new Paragraph({
    children: [r('________________________________')],
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 40 },
  });
}

function firmaTable(izqTitulo: string, izqNombre: string, derTitulo: string, derNombre: string) {
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

function tablaVacaciones() {
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

function tablaAnexoA(actividades: string[]) {
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

export async function POST(req: NextRequest) {
  try {
    const { tipo, datos } = await req.json();
    let buffer: Buffer;

    if (tipo === 'capacitacion') {
      buffer = await generarCapacitacion(datos);
    } else if (tipo === 'obra') {
      buffer = await generarObra(datos);
    } else {
      return NextResponse.json({ error: 'Tipo de contrato no soportado' }, { status: 400 });
    }

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

// ── CAPACITACIÓN INICIAL ─────────────────────────────────────────

async function generarCapacitacion(D: any): Promise<Buffer> {
  const durLetra = D.duracion === '30' ? 'TREINTA (30)' : D.duracion === '60' ? 'SESENTA (60)' : 'NOVENTA (90)';
  const patronNombre = D.patronNombre.toUpperCase();
  const trabNombre = D.trabNombre.toUpperCase();
  const representante = (D.patronRepresentante || D.patronNombre).toUpperCase();
  const fechaDoc = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  const ciudadUp = D.patronCiudad.toUpperCase();
  const actividades = (D.condActividades || 'Actividades del puesto').split('\n').filter((a: string) => a.trim());

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '-', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 360 } } } }],
        },
        {
          reference: 'instructivo',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '-', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 360 } } } }],
        },
      ],
    },
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1440 },
        },
      },
      children: [

        // ── ENCABEZADO ──
        p([r(`CAPACITACIÓN INICIAL (${durLetra} DIAS)`, true, 24)], { align: 'center', before: 0, after: 120 }),
        cuerpo([
          r('CONTRATO INDIVIDUAL DE TRABAJO PARA CAPACITACIÓN INICIAL POR TIEMPO FIJO Y DETERMINADO QUE CELEBRAN POR UNA PARTE '),
          r(patronNombre, true),
          r(' A QUIEN EN LO SUCESIVO SE DENOMINARÁ "EL PATRON" Y POR LA OTRA, POR SU PROPIO DERECHO '),
          r(trabNombre, true),
          r(' EN LO SUCESIVO "EL TRABAJADOR", AL TENOR DE LAS CLÁUSULAS QUE OTORGAN EN VISTA DE LAS SIGUIENTES:'),
        ]),

        // ── DECLARACIONES ──
        seccion('D E C L A R A C I O N E S'),
        cuerpo([r('DECLARACIONES DE "EL PATRON":', true)]),

        pBullet('bullets', `Que es una persona ${D.patronTipo === 'fisica' ? 'física' : 'moral'} con capacidad legal para celebrar este contrato.`),
        pBullet('bullets', `Que se encuentra inscrito en el Registro Federal de Contribuyentes ${D.patronRFC}, así mismo señala como su domicilio el ubicado en ${D.patronDomicilio} en ${D.patronCiudad}.`),
        pBullet('bullets', `Se encuentra debidamente inscrito ante el Instituto Mexicano del Seguro Social del quien tiene el Registro Patronal número ${D.patronRegIMSS}.`),
        pBullet('bullets', `Que en el citado domicilio viene realizando sus actividades y que para tal fin requieren la contratación de personal calificado y con capacidades que le permitan aprender, adquirir conocimientos y habilidades necesarios para el desarrollo de las actividades de la Empresa en el puesto que más adelante se menciona y cuyas características están descritas en el "ANEXO A" que forma parte integrante de este Contrato, para lo cual es necesario en primer término llevar a cabo una etapa de "CAPACITACIÓN INICIAL" para poder evaluar las capacidades reales de la persona que le permitan ejecutar el trabajo y ser elegible para una contratación definitiva o bien eventual y temporal.`),
        pBullet('bullets', `Bajo estas condiciones requiere la contratación de personal que tenga las características señaladas en el citado "ANEXO A" y la posibilidad de participar en un proceso de capacitación inicial de ${D.duracion} días que podrá ampliarse por determinación de la "EL PATRON", lo que servirá de base para determinar si se continúa con el siguiente modulo o periodo o bien se da por terminado el contrato y la relación que de él emana dentro de la particularidad de capacitación inicial a que se refiere el artículo 39-B de la Ley Federal del Trabajo.`),

        new Paragraph({ children: [], spacing: { before: 80, after: 40 } }),
        cuerpo([r('DECLARA "EL TRABAJADOR":', true)]),

        pBullet('bullets', `Ser una persona física del sexo ${D.trabSexo === 'FEMENINO' ? 'femenino' : 'masculino'}, con fecha de nacimiento ${D.trabNacimiento}, Nacionalidad ${D.trabNacionalidad || 'Mexicana'} con Registro Federal de contribuyentes ${D.trabRFC}, Clave Única de Registro de Población ${D.trabCURP} y con domicilio ${D.trabDomicilio}, contar con número de Seguridad Social ${D.trabNSS}.`),
        pBullet('bullets', 'No tener impedimento alguno para celebrar el presente Contrato y obligarse en los términos de este, ya que cuenta con capacidad, aptitudes y la disponibilidad de tiempo requeridos, así como con el interés, disponibilidad y voluntad de recibir la capacitación inicial objeto de este con pleno conocimiento de sus particularidades y características que se detallan en el cuerpo de este Contrato incluido el Anexo "A" el cual ha leído detenidamente.'),

        new Paragraph({ children: [], spacing: { before: 80, after: 40 } }),
        cuerpo([r('DECLARAN "LAS PARTES":', true)]),
        pBullet('bullets', 'Que estando de acuerdo con lo expresado en estas declaraciones proceden a celebrar este Contrato bajo las siguientes:'),

        // ── CLÁUSULAS ──
        seccion('C L Á U S U L A S'),

        clausulaTitulo('PRIMERA.-'),
        cuerpo([
          r('"EL PATRON" conviene en contratar a partir de esta fecha los servicios personales del "TRABAJADOR" en forma subordinada, bajo la modalidad de "capacitación inicial", de conformidad con lo señalado en las Declaraciones que anteceden, de acuerdo con lo que ha determinado "EL PATRON" para la misma y que tiene por objeto que "EL TRABAJADOR" adquiera los conocimientos y/o habilidades necesarios para desarrollar el puesto de '),
          r(D.condPuesto, true),
          r(' bajo las características que se detallan en el Anexo "A" del presente Contrato el cual firmado por "LAS PARTES" forma parte integrante del mismo.'),
        ]),
        cuerpo([
          r('Considerando la especial naturaleza de este contrato, las partes están de acuerdo en que a la conclusión de periodo a que está sujeto el proceso de capacitación inicial, a juicio de "EL PATRON" se podrá dar por terminada la relación laboral que concluyen precisamente el día '),
          r(D.condTermino, true),
          r(' en cuya fecha se dará por terminado este contrato y la relación laboral que de él emana, salvo que la "EMPRESA" expresamente y por escrito haga del conocimiento del "TRABAJADOR" su deseo de continuar con la Relación Laboral, quedando obligado "EL TRABAJADOR" a firmar en su caso el documento que contenga las condiciones de la contratación y en caso de que esto no se haga, se estará a lo establecido en este contrato. En todos estos supuestos se tomará en cuenta la opinión de la Comisión Mixta de Capacitación, Adiestramiento y Productividad para los fines de lo establecido en el Artículo 39-B de la Ley Federal del Trabajo.'),
        ]),

        clausulaTitulo('SEGUNDA.-'),
        cuerpo([r('"LAS PARTES" convienen que "EL PATRON" podrá rescindir el presente contrato de trabajo sin ninguna responsabilidad de su parte, si "EL TRABAJADOR" demuestra falta de capacidad, aptitudes o facultades que ha manifestado tener, o bien exista engaño en los certificados o referencias personales proporcionadas por éste.')]),

        clausulaTitulo('TERCERA.-'),
        cuerpo([r('Las obligaciones que por este medio asume "EL TRABAJADOR" en relación al trabajo contratado, comprenden todas las estipuladas en las Leyes y Reglamentos vigentes en materia de trabajo y específicamente en el Contrato, en el Reglamento Interior de Trabajo y en el Código de Conducta que rigen en "EL PATRON".')]),
        cuerpo([r('Por lo anterior, "EL TRABAJADOR" se obliga y se compromete a observar y llevar a cabo las instrucciones que de carácter general reciba por parte de "EL PATRON" y que se encuentren relacionadas con la actividad para la cual se le contrata. Así mismo, se obliga "EL TRABAJADOR" a acatar las instrucciones que en forma especial se le den por "EL PATRON" para el desempeño de los servicios pactados en el presente Contrato.')]),

        clausulaTitulo('CUARTA.-'),
        cuerpo([r(`"LAS PARTES" convienen en establecer como lugar de la prestación de servicios, el o los domicilios con que cuenta "EL PATRON" y en principio en el que ha quedado señalado en el cuerpo de este Contrato, sin perjuicio de que conforme a las necesidades y requerimientos de la misma, sin modificar su objeto, esta podrá en todo tiempo, asignar a "EL TRABAJADOR" para recibir la capacitación inicial en cualquier otro lugar que la empresa habilite en ${D.patronCiudad} y área Metropolitana, con lo que también están de acuerdo las partes.`)]),

        clausulaTitulo('QUINTA.-'),
        cuerpo([
          r(textoJornada(D)),
        ]),

        clausulaTitulo('SEXTA.-'),
        cuerpo([
          r('"EL TRABAJADOR" percibirá como retribución por la prestación de sus servicios la cantidad de '),
          r(`$${D.condSalario} M.N.`, true),
          r(` como sueldo diario integrado, sujeta a las deducciones y/o retenciones que legal o contractualmente correspondan, pagaderos ${D.jornadaPago}, a la hora que fije "EL PATRON" durante la jornada de trabajo. Queda bien entendido que si cualquiera de los días destinados para el pago es inhábil éste se hará el día anterior, en la forma y términos convenidos.`),
        ]),
        cuerpo([r('"EL TRABAJADOR" está obligado a otorgar y firmar los recibos que sean necesarios, en los que se incluyan impuestos y otras deducciones correspondientes. Dichos recibos únicamente acreditan el pago de los conceptos en ellos descritos y no extinguen prestaciones adicionales derivadas de la relación laboral.')]),
        cuerpo([r('Para mayor seguridad del "TRABAJADOR", con su expreso consentimiento y por acuerdo de las partes, a efecto de cumplir con esta obligación "EL PATRON" podrá realizar el pago del salario y prestaciones mediante depósitos en la cuenta bancaria del "TRABAJADOR" sirviendo de comprobante de pago las constancias de tales depósitos, sin perjuicio de la obligación por parte del "TRABAJADOR" de firmar los recibos correspondientes.')]),

        clausulaTitulo('SÉPTIMA.-'),
        cuerpo([r('Queda establecido que cuando "EL PATRON" conforme a sus necesidades requiera que "EL TRABAJADOR" labore tiempo extra, el mismo estará obligado a prestar sus servicios en dicha jornada extraordinaria con el límite establecido por el artículo 66 de la Ley Federal del Trabajo, y le será pagado de conformidad con lo establecido en dicho ordenamiento. El tiempo extraordinario efectivamente laborado podrá acreditarse por cualquier medio de prueba admitido en derecho. "EL TRABAJADOR" deberá reportar de inmediato a su jefe inmediato cualquier tiempo extra laborado sin instrucción previa, a fin de que "EL PATRON" pueda llevar el control correspondiente.')]),

        clausulaTitulo('OCTAVA.-'),
        cuerpo([r('"EL TRABAJADOR" tendrá derecho a recibir el pago de las prestaciones que se detallan y se describen en el "ANEXO B" del Contrato el cual firmado por "LAS PARTES" forma parte integrante del mismo y que sustituyen, por ser superiores, a las establecidas en la Ley Federal del Trabajo.')]),
        cuerpo([r('Para los efectos de lo establecido por el Art. 39-C de la Ley Federal del Trabajo y de las disposiciones correlativas de la Ley del Seguro Social, Ley del INFONAVIT y de la Ley de los Sistemas de Ahorro para el Retiro, el Patrón hace del conocimiento de "EL TRABAJADOR" que durante todo el tiempo en que estén vinculados por una relación laboral cumplirá con todas las obligaciones establecidas en los citados ordenamientos legales, iniciando con su incorporación al régimen obligatorio ante los Institutos correspondientes y al pago de las cuotas que correspondan.')]),

        clausulaTitulo('NOVENA.-'),
        cuerpo([r('La base para el cálculo del pago de prestaciones a "EL TRABAJADOR" será el salario ordinario que tiene asignado, las que se cubrirán conforme a lo establecido en el segundo párrafo de la cláusula sexta de este contrato, bien entendido que "EL TRABAJADOR" queda obligado a suscribir los recibos correspondientes por el pago de prestaciones y salarios que por concepto de servicios prestados se le cubran, contando con tres días para hacer aclaraciones o reclamaciones de diferencias que advierta.')]),

        clausulaTitulo('DÉCIMA.- INVENTOS, OBRAS CREATIVAS Y DERECHOS AUTORALES.-'),
        cuerpo([r(`Reconoce y acepta "EL TRABAJADOR" que al ser contratado para realizar la función de ${D.condPuesto}, al mismo se le paga lo justo y correcto, considerando ya en el salario pactado el tipo de actividad que se realizará y la creación de obras, proyectos, obras intelectuales, etc., por ello, las partes hacen constar que todos los inventos, derechos autorales, obras susceptibles de registro y propiedad intelectual, obras creativas, y obras registrables, sistemas o programas de cómputo, que se generen en la vigencia de este contrato o durante la relación laboral, serán propiedad de "EL PATRON". "EL TRABAJADOR" se obliga a firmar toda la documentación que sea necesaria para que los inventos, obras o descubrimientos queden registrados a nombre de "EL PATRON".`)]),

        clausulaTitulo('DÉCIMA PRIMERA.- DOCUMENTACIÓN.-'),
        cuerpo([r('"EL TRABAJADOR" reconoce como propiedad exclusiva de "EL PATRON" todos los documentos e información que reciba con motivo de la relación de trabajo, y/o que tenga bajo su posesión y control así como los que el propio "TRABAJADOR" prepare o formule en relación o conexión con sus servicios o se originen con motivo de la relación de trabajo, por lo que se obliga a conservarlos en buen estado y entregarlos a "EL PATRON" en el momento que esta lo requiera o bien al terminar el presente contrato o la relación de trabajo, por el motivo que fuere.')]),

        clausulaTitulo('DÉCIMA SEGUNDA.- CONFIDENCIALIDAD.-'),
        cuerpo([r('"EL TRABAJADOR" se obliga a no divulgar ninguno de los aspectos de los negocios de "EL PATRON" y a no proporcionar información sobre los sistemas o actividades de la misma, salvo que cuente con autorización expresa y escrita en tal sentido. Esta obligación permanece vigente durante 5 (cinco) años posteriores a la terminación de la relación laboral.')]),
        cuerpo([r('"LAS PARTES" convienen en que es causa especial de rescisión de este contrato la violación de esta cláusula, independientemente de las acciones civiles y penales que se pudieran ejercitar en contra del "TRABAJADOR" por tal conducta.')]),

        clausulaTitulo('DÉCIMA TERCERA.- DAÑOS Y PERJUICIOS.-'),
        cuerpo([r('"EL TRABAJADOR" deberá cumplir con todas las instrucciones de carácter administrativo o de operación que reciba de "EL PATRON" y/o del Jefe inmediato superior. En caso de que "EL TRABAJADOR" cause daños o perjuicios a "EL PATRON" por dolo o negligencia grave, éste último podrá ejercer las acciones legales que correspondan conforme a la Ley Federal del Trabajo y la legislación civil aplicable. Cualquier descuento salarial únicamente podrá realizarse en los supuestos y con los límites previstos en el artículo 110 de la Ley Federal del Trabajo, sin que sea procedente el descuento por daños derivados de la operación ordinaria.')]),

        clausulaTitulo('DÉCIMA CUARTA.-'),
        cuerpo([r('"LAS PARTES" se obligan a sujetarse a las disposiciones que en relación a la capacitación, adiestramiento y productividad establece el Artículo 153-A al 153-V de la Ley de la materia de acuerdo con los planes y programas que al efecto se establezcan, quedando obligado "EL TRABAJADOR" a cumplir con todas las obligaciones que le correspondan.')]),
        cuerpo([r('"EL TRABAJADOR" se obliga en términos de lo dispuesto por la fracción X del Artículo 134 de la Ley Federal del Trabajo, a someterse a todos los reconocimientos y exámenes médicos que "EL PATRON" le indique, así como a los que correspondan de acuerdo a los reglamentos sanitarios.')]),

        clausulaTitulo('DÉCIMA QUINTA.-'),
        cuerpo([r('"LAS PARTES" convienen en que a falta de estipulación expresa en este Contrato Individual de Trabajo, se estará a lo dispuesto en el Reglamento Interior de Trabajo y en la contratación colectiva que rige en "EL PATRON" y supletoriamente a lo establecido por la Ley Federal del Trabajo y sus Reglamentos.')]),

        clausulaTitulo('DÉCIMA SEXTA.-'),
        cuerpo([r(`Con el objeto de que "EL TRABAJADOR" tenga posibilidades de una mejor integración familiar y por su parte "EL PATRON" de tener continuidad en los trabajos, las partes convienen de acuerdo con las necesidades y posibilidades de esta última, que los días de descanso obligatorio podrán ser cambiados para que sean disfrutados por "EL TRABAJADOR" en fecha distinta. De conformidad con lo establecido en el artículo 75 de la Ley Federal del Trabajo, cuando así lo requiera por escrito "EL PATRON", "EL TRABAJADOR" quedará obligado a prestar sus servicios en los días de descanso obligatorio con el pago del salario correspondiente.`)]),

        clausulaTitulo('DÉCIMA SÉPTIMA.-'),
        cuerpo([r(`Para la aplicación, interpretación y cumplimiento del presente Contrato las partes se someten expresamente a la Jurisdicción de los Tribunales Competentes en materia de Trabajo ubicados en ${D.patronCiudad}, renunciando desde ahora a cualquier fuero que pudiere corresponderle por razón de sus domicilios presentes o futuros.`)]),

        // ── CIERRE Y FIRMAS ──
        new Paragraph({ children: [], spacing: { before: 100, after: 60 } }),
        cuerpo([r(`LEÍDO QUE FUE POR LAS PARTES EL PRESENTE CONTRATO, LO SUSCRIBEN RECIBIENDO COPIA DEL MISMO EN ${ciudadUp}, A ${fechaDoc.toUpperCase()}.`)]),
        new Paragraph({ children: [], spacing: { before: 160, after: 0 } }),
        firmaTable('EL PATRON', representante, 'EL TRABAJADOR', trabNombre),

        // ── ANEXO A ──
        new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),
        p([r('ANEXO A.', true, 22)], { align: 'center', before: 0, after: 80 }),
        cuerpo([r('El presente anexo es complemento y parte integrante del Contrato Individual de Trabajo de Capacitación Inicial celebrada entre "LAS PARTES", establece las funciones y/o actividades, a realizar por "EL TRABAJADOR" en los términos que convinieron "LAS PARTES".')]),
        new Paragraph({ children: [], spacing: { before: 60, after: 40 } }),
        cuerpo([r(`${D.patronCiudad}, ${fechaDoc}.`)]),
        new Paragraph({ children: [], spacing: { before: 40, after: 40 } }),
        cuerpo([r('PUESTO: ', true), r(D.condPuesto, true)]),
        new Paragraph({ children: [], spacing: { before: 60, after: 60 } }),
        tablaAnexoA(actividades),
        new Paragraph({ children: [], spacing: { before: 200, after: 0 } }),
        firmaTable('EL PATRON', representante, 'EL TRABAJADOR', trabNombre),

        // ── ANEXO B ──
        new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),
        p([r('ANEXO B', true, 22)], { align: 'center', before: 0, after: 80 }),
        cuerpo([r('El presente anexo que es parte integrante del Contrato Individual de Trabajo de Capacitación Inicial celebrado entre "LAS PARTES", establece las prestaciones a que se refiere la cláusula octava del mismo.')]),
        new Paragraph({ children: [], spacing: { before: 60, after: 40 } }),

        clausulaTitulo('AGUINALDO, DÍAS DE DESCANSO OBLIGATORIO, VACACIONES Y PRIMA VACACIONAL.-'),
        cuerpo([
          r('"LAS PARTES" convienen en que el EMPLEADO por año de servicios prestados tendrá derecho a un AGUINALDO de '),
          r(`${D.condAguinaldo} días`, true),
          r(' de salario conforme a lo que establece el artículo 87 de la Ley Federal del Trabajo, que será pagado por "EL PATRON" antes del 20 de diciembre de cada año o su parte proporcional si el empleado no presta sus servicios el año completo.'),
        ]),
        cuerpo([r('DÍAS DE DESCANSO OBLIGATORIOS.- Serán días de descanso obligatorios los que señala el artículo 74 de la Ley Federal del Trabajo.', true)]),
        cuerpo([r('VACACIONES.- "EL TRABAJADOR" disfrutará de vacaciones de acuerdo a lo establecido en el artículo 76 de la Ley Federal del Trabajo (reforma 2023):', true)]),
        new Paragraph({ children: [], spacing: { before: 40, after: 40 } }),
        tablaVacaciones(),
        new Paragraph({ children: [], spacing: { before: 80, after: 40 } }),
        cuerpo([r('A partir del quinto año de servicios el periodo de vacaciones se aumentará en dos días por cada 5 años de servicio adicionales.')]),
        cuerpo([
          r('PRIMA VACACIONAL: El trabajador percibirá durante su periodo vacacional una prima vacacional equivalente al '),
          r(`${D.condPrima}%`, true),
          r(' de los salarios correspondientes al periodo vacacional, de acuerdo con lo establecido por el artículo 80 de la Ley Federal del Trabajo.'),
        ]),
        cuerpo([r('"LAS PARTES" hacen constar que no existen más prestaciones que las antes mencionadas y las que la Ley Federal del Trabajo establece.')]),
        new Paragraph({ children: [], spacing: { before: 60, after: 40 } }),
        cuerpo([r(`${D.patronCiudad} a ${fechaDoc}.`)]),
        new Paragraph({ children: [], spacing: { before: 160, after: 0 } }),
        firmaTable('LA EMPRESA', representante, 'EL TRABAJADOR', trabNombre),

        // ── ANEXO C — INSTRUCTIVO ──
        new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),
        p([r('ANEXO C', true, 22)], { align: 'center', before: 0, after: 40 }),
        p([r('INSTRUCTIVO PARA EL CORRECTO LLENADO DEL CONTRATO.', true, 20)], { align: 'center', before: 0, after: 80 }),
        pBullet('instructivo', 'El contrato deberá ser firmado por el trabajador al calce en cada hoja.'),
        pBullet('instructivo', 'El trabajador deberá de firmar cada uno de los anexos contenidos en el contrato.'),
        pBullet('instructivo', 'Es necesario que el trabajador firme el aviso de privacidad contenido en este contrato.'),
        pBullet('instructivo', 'Verificar que el salario pactado sea igual o superior al Salario Mínimo Vigente — www.gob.mx/conasami.'),
        pBullet('instructivo', `Este contrato es de ${D.duracion} días naturales. No puede prorrogarse bajo la misma modalidad — Art. 39-C LFT.`),
        pBullet('instructivo', 'Registrar al trabajador ante el IMSS el mismo día de inicio de la relación laboral — Art. 15 LSS.'),
        pBullet('instructivo', 'Conservar el original firmado en el expediente laboral del trabajador.'),
        new Paragraph({ children: [], spacing: { before: 200, after: 60 } }),
        new Paragraph({ children: [r('______________________________')], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 } }),
        new Paragraph({ children: [r('"EL TRABAJADOR"', true)], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 20 } }),
        new Paragraph({ children: [r(trabNombre, true)], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 } }),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

// ── OBRA DETERMINADA ─────────────────────────────────────────────

async function generarObra(D: any): Promise<Buffer> {
  const patronNombre = D.patronNombre.toUpperCase();
  const trabNombre = D.trabNombre.toUpperCase();
  const representante = (D.patronRepresentante || D.patronNombre).toUpperCase();
  const fechaDoc = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  const ciudadUp = D.patronCiudad.toUpperCase();
  const actividades = (D.condActividades || 'Actividades del puesto').split('\n').filter((a: string) => a.trim());

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '-', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 360 } } } }],
      }],
    },
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1440 },
        },
      },
      children: [
        p([r('CONTRATO INDIVIDUAL DE TRABAJO', true, 24)], { align: 'center', before: 0, after: 60 }),
        p([r('MODALIDAD POR OBRA DETERMINADA', true, 22)], { align: 'center', before: 0, after: 40 }),
        p([r('Artículos 35 y 36 de la Ley Federal del Trabajo', false, 18)], { align: 'center', before: 0, after: 140 }),

        cuerpo([
          r('CONTRATO INDIVIDUAL DE TRABAJO POR OBRA DETERMINADA QUE CELEBRAN POR UNA PARTE '),
          r(patronNombre, true),
          r(' A QUIEN EN LO SUCESIVO SE DENOMINARÁ "EL PATRON" Y POR LA OTRA '),
          r(trabNombre, true),
          r(' EN LO SUCESIVO "EL TRABAJADOR", AL TENOR DE LAS SIGUIENTES:'),
        ]),

        seccion('D E C L A R A C I O N E S'),
        cuerpo([r('DECLARACIONES DE "EL PATRON":', true)]),
        pBullet('bullets', `Que es una persona ${D.patronTipo === 'fisica' ? 'física' : 'moral'} con capacidad legal para celebrar este contrato.`),
        pBullet('bullets', `RFC: ${D.patronRFC}, con domicilio en ${D.patronDomicilio}, ${D.patronCiudad}. Registro Patronal IMSS: ${D.patronRegIMSS}.`),
        pBullet('bullets', `Requiere contratar personal para la obra: ${D.obraNombre}, ubicada en ${D.obraDomicilio}. Registro IMSS de obra: ${D.obraRegIMSS}.`),

        new Paragraph({ children: [], spacing: { before: 80, after: 40 } }),
        cuerpo([r('DECLARA "EL TRABAJADOR":', true)]),
        pBullet('bullets', `Ser una persona física del sexo ${D.trabSexo === 'FEMENINO' ? 'femenino' : 'masculino'}, RFC: ${D.trabRFC}, CURP: ${D.trabCURP}, NSS: ${D.trabNSS}, con domicilio en ${D.trabDomicilio}.`),
        pBullet('bullets', 'No tener impedimento alguno para celebrar el presente Contrato y contar con las capacidades y aptitudes requeridas para el desempeño del puesto contratado.'),

        seccion('C L Á U S U L A S'),

        clausulaTitulo('PRIMERA.- NATURALEZA Y OBJETO.-'),
        cuerpo([
          r('El presente contrato se celebra bajo la modalidad de Obra Determinada conforme a los Arts. 35 y 36 LFT. "EL TRABAJADOR" prestará sus servicios en el puesto de '),
          r(D.condPuesto, true),
          r(` en el Área de ${D.condArea}, en la obra denominada `),
          r(D.obraNombre, true),
          r(`, ubicada en ${D.obraDomicilio}. Fecha estimada de término: ${D.obraTermino}. Las actividades específicas se detallan en el Anexo "A".`),
        ]),

        clausulaTitulo('SEGUNDA.- DURACIÓN.-'),
        cuerpo([r('El presente contrato durará el tiempo necesario para concluir la obra antes señalada. Al terminarse la obra, la relación laboral concluye sin responsabilidad para ninguna de las partes — Arts. 35, 36, 53 fracc. III LFT.')]),

        clausulaTitulo('TERCERA.- JORNADA DE TRABAJO.-'),
        cuerpo([r(textoJornada(D))]),

        clausulaTitulo('CUARTA.- SALARIO Y FORMA DE PAGO.-'),
        cuerpo([
          r('"EL TRABAJADOR" percibirá un salario diario integrado de '),
          r(`$${D.condSalario} M.N.`, true),
          r(`, igual o superior al Salario Mínimo Vigente. Pago ${D.jornadaPago} — Art. 101 LFT.`),
        ]),

        clausulaTitulo('QUINTA.- PRESTACIONES.-'),
        cuerpo([r(`Aguinaldo: ${D.condAguinaldo} días — Art. 87 LFT. Prima vacacional: ${D.condPrima}% — Art. 80 LFT. Vacaciones conforme reforma 2023 (12-14-16-18 días para años 1-2-3-4) — Art. 76 LFT.`)]),

        clausulaTitulo('SEXTA.- CONFIDENCIALIDAD.-'),
        cuerpo([r('"EL TRABAJADOR" se obliga a no divulgar información confidencial de "EL PATRON". Esta obligación permanece vigente durante 5 (cinco) años posteriores a la terminación de la relación laboral — Art. 47 LFT.')]),

        clausulaTitulo('SÉPTIMA.- PROPIEDAD INTELECTUAL.-'),
        cuerpo([r('Las creaciones intelectuales generadas en el ejercicio de las funciones contratadas serán propiedad de "EL PATRON" — Arts. 163 y 164 LFT.')]),

        clausulaTitulo('OCTAVA.- JURISDICCIÓN.-'),
        cuerpo([r(`Las partes se someten a los Tribunales laborales competentes de ${D.patronCiudad} — Art. 700 LFT.`)]),

        new Paragraph({ children: [], spacing: { before: 120, after: 60 } }),
        cuerpo([r(`LEÍDO QUE FUE POR LAS PARTES EL PRESENTE CONTRATO, LO SUSCRIBEN EN ${ciudadUp}, A ${fechaDoc.toUpperCase()}.`)]),
        new Paragraph({ children: [], spacing: { before: 160, after: 0 } }),
        firmaTable('EL PATRON', representante, 'EL TRABAJADOR', trabNombre),

        new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),
        p([r('ANEXO A.', true, 22)], { align: 'center', before: 0, after: 80 }),
        cuerpo([r(`Obra: `, true), r(D.obraNombre)]),
        cuerpo([r('Puesto: ', true), r(D.condPuesto), r('    Área: ', true), r(D.condArea)]),
        new Paragraph({ children: [], spacing: { before: 60, after: 60 } }),
        tablaAnexoA(actividades),
        new Paragraph({ children: [], spacing: { before: 200, after: 0 } }),
        firmaTable('EL PATRON', representante, 'EL TRABAJADOR', trabNombre),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}
