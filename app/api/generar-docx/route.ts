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

function pBullet(doc_ref: string, text: string, bold = false) {
  return new Paragraph({
    numbering: { reference: doc_ref, level: 0 },
    children: [r(text, bold)],
    spacing: { before: 60, after: 60, line: 276 },
    alignment: AlignmentType.BOTH,
  });
}

function sep() {
  return new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA' } },
    spacing: { before: 120, after: 120 },
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

function firmaTable(izq: string, izqNombre: string, der: string, derNombre: string) {
  const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const bords = { top: nb, bottom: nb, left: nb, right: nb };
  const w = 4680;
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [w, w],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: bords, width: { size: w, type: WidthType.DXA }, children: [
          p([r('________________________________')], { align: 'left' }),
        ]}),
        new TableCell({ borders: bords, width: { size: w, type: WidthType.DXA }, children: [
          p([r('________________________________')], { align: 'left' }),
        ]}),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: bords, width: { size: w, type: WidthType.DXA }, children: [
          p([r(izq, true)], { align: 'left' }),
          p([r(izqNombre, true)], { align: 'left' }),
        ]}),
        new TableCell({ borders: bords, width: { size: w, type: WidthType.DXA }, children: [
          p([r(der, true)], { align: 'left' }),
          p([r(derNombre, true)], { align: 'left' }),
        ]}),
      ]}),
    ],
  });
}

function tablaAnexoA(headers: string[], rows: string[][], widths: number[]) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
  const bords = { top: b, bottom: b, left: b, right: b };
  return new Table({
    width: { size: widths.reduce((a, v) => a + v, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h, i) => new TableCell({
        borders: bords, width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: 'D5E8F0', type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [r(h, true)], alignment: AlignmentType.CENTER })],
      })) }),
      ...rows.map(row => new TableRow({ children: row.map((cell, i) => new TableCell({
        borders: bords, width: { size: widths[i], type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [r(cell)], alignment: i === 0 ? AlignmentType.CENTER : AlignmentType.BOTH })],
      })) })),
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
  const actividades = (D.condActividades || 'Actividades del puesto').split('\n').filter((a: string) => a.trim());

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'patron-bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '-', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 360 } } } }],
        },
        {
          reference: 'trab-bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '-', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 360 } } } }],
        },
        {
          reference: 'anexo-numbers',
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.-', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
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
        titulo(`CAPACITACIÓN INICIAL (${durLetra} DIAS)`),
        new Paragraph({ children: [], spacing: { before: 0, after: 80 } }),
        cuerpo([
          r('CONTRATO INDIVIDUAL DE TRABAJO PARA CAPACITACIÓN INICIAL POR TIEMPO FIJO Y DETERMINADO QUE CELEBRAN POR UNA PARTE '),
          r(patronNombre, true),
          r(' QUIEN ACTUA POR SU PROPIO DERECHO Y A QUIEN EN LO SUCESIVO SE DENOMINARÁ "EL PATRON" Y POR LA OTRA, POR SU PROPIO DERECHO '),
          r(trabNombre, true),
          r(' EN LO SUCESIVO "EL TRABAJADOR", AL TENOR DE LAS CLÁUSULAS QUE OTORGAN EN VISTA DE LAS SIGUIENTES:'),
        ]),

        // ── DECLARACIONES ──
        seccion('D E C L A R A C I O N E S'),
        cuerpo([r('DECLARACIONES DE "EL PATRON":', true)]),

        pBullet('patron-bullets', `Que es una persona ${D.patronTipo === 'fisica' ? 'física' : 'moral'} con capacidad legal para celebrar este contrato.`),
        pBullet('patron-bullets', `Que se encuentra inscrito en el Registro Federal de Contribuyentes ${D.patronRFC}, así mismo señala como su domicilio el ubicado en ${D.patronDomicilio} en ${D.patronCiudad}.`),
        pBullet('patron-bullets', `Se encuentra debidamente inscrito ante el Instituto Mexicano del Seguro Social del quien tiene el Registro Patronal número ${D.patronRegIMSS}.`),
        pBullet('patron-bullets', `Que en el citado domicilio viene realizando sus actividades y que para tal fin requieren la contratación de personal calificado y con capacidades que le permitan aprender, adquirir conocimientos y habilidades necesarios para el desarrollo de las actividades de la Empresa en el puesto que más adelante se menciona y cuyas características están descritas en el "ANEXO A" que forma parte integrante de este Contrato, para lo cual es necesario en primer término llevar a cabo una etapa de "CAPACITACIÓN INICIAL" para poder evaluar las capacidades reales de la persona que le permitan ejecutar el trabajo y ser elegible para una contratación definitiva o bien eventual y temporal.`),
        pBullet('patron-bullets', `Bajo estas condiciones requiere la contratación de personal que tenga las características señaladas en el citado "ANEXO A" y la posibilidad de participar en un proceso de capacitación inicial de ${D.duracion} días que podrá ampliarse por determinación de la "EL PATRON", lo que servirá de base para determinar si se continúa con el siguiente modulo o periodo o bien se da por terminado el contrato y la relación que de él emana dentro de la particularidad de capacitación inicial a que se refiere el artículo 39-B de la Ley Federal del Trabajo.`),

        new Paragraph({ children: [], spacing: { before: 80, after: 40 } }),
        cuerpo([r('DECLARA "EL TRABAJADOR":', true)]),

        pBullet('trab-bullets', `Ser una persona física del sexo ${D.trabSexo === 'FEMENINO' ? 'femenino' : 'masculino'}, con fecha de nacimiento ${D.trabNacimiento}, Nacionalidad ${D.trabNacionalidad || 'Mexicana'} con Registro Federal de contribuyentes ${D.trabRFC}, Clave Única de Registro de Población ${D.trabCURP} y con domicilio ${D.trabDomicilio}, contar con número de Seguridad Social ${D.trabNSS}.`),
        pBullet('trab-bullets', 'No tener impedimento alguno para celebrar el presente Contrato y obligarse en los términos de este, ya que cuenta con capacidad, aptitudes y la disponibilidad de tiempo requeridos, así como con el interés, disponibilidad y voluntad de recibir la capacitación inicial objeto de este con pleno conocimiento de sus particularidades y características que se detallan en el cuerpo de este Contrato incluido el Anexo "A" el cual ha leído detenidamente.'),

        new Paragraph({ children: [], spacing: { before: 80, after: 40 } }),
        cuerpo([r('DECLARAN "LAS PARTES":', true)]),
        pBullet('patron-bullets', 'Que estando de acuerdo con lo expresado en estas declaraciones proceden a celebrar este Contrato bajo las siguientes:'),

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
        cuerpo([r(`La duración de la jornada de trabajo será la ${D.jornadaTipo}, con un horario de ${D.jornadaEntrada} a ${D.jornadaSalida} horas, con descanso los días ${D.jornadaDescanso}, en el entendido que podrá quedar distribuida en los días de la semana que "EL PATRON" determine conforme a sus necesidades y/o los lineamientos relativos al objeto del contrato, estando facultada en todo tiempo a realizar los ajustes que se requieran respecto de los días laborables y horarios establecidos, de acuerdo con los requerimientos de producción y a redistribuir la Jornada de Trabajo.`)]),

        clausulaTitulo('SEXTA.-'),
        cuerpo([
          r('"EL TRABAJADOR" percibirá como retribución por la prestación de sus servicios la cantidad de '),
          r(`$${D.condSalario} M.N.`, true),
          r(` como sueldo diario integrado, sujeta a las deducciones y/o retenciones que legal o contractualmente correspondan, pagaderos ${D.jornadaPago}, a la hora que fije "EL PATRON" durante la jornada de trabajo. Queda bien entendido que si cualquiera de los días destinados para el pago es inhábil éste se hará el día anterior, en la forma y términos convenidos.`),
        ]),
        cuerpo([r('"EL TRABAJADOR" está obligado a otorgar y firmar los recibos que sean necesarios, en los que se incluyan impuestos y otras deducciones correspondientes, constituyendo los mismos el finiquito más amplio que en derecho proceda hasta el día de su suscripción.')]),
        cuerpo([r('Para mayor seguridad del "TRABAJADOR", con su expreso consentimiento y por acuerdo de las partes, a efecto de cumplir con esta obligación "EL PATRON" podrá realizar el pago del salario y prestaciones mediante depósitos en la cuenta bancaria del "TRABAJADOR" sirviendo de comprobante de pago las constancias de tales depósitos, sin perjuicio de la obligación por parte del "TRABAJADOR" de firmar los recibos correspondientes.')]),

        clausulaTitulo('SÉPTIMA.-'),
        cuerpo([r('Queda establecido que cuando "EL PATRON" conforme a sus necesidades ordene a "EL TRABAJADOR" laborar tiempo extra, el mismo estará obligado a prestar sus servicios en dicha jornada extraordinaria con el límite establecido por el artículo 66 de la Ley Federal del Trabajo, y le será pagado de conformidad con lo establecido en dicho ordenamiento, bien entendido que "EL PATRON" no estará obligada a pagar el tiempo extraordinario que labore dicho "TRABAJADOR" si no cuenta con la orden por escrito, de la cual deberá conservar una copia para cualquier aclaración futura.')]),

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
        cuerpo([r('"EL TRABAJADOR" deberá cumplir con todas las instrucciones de carácter administrativo o de operación que reciba de "EL PATRON" y/o del Jefe inmediato superior, siendo responsable de los daños y perjuicios que se causen a esta o por el incumplimiento de dichas instrucciones, estando conforme en que el importe de los mismos le sea descontado de sus salarios, en los términos de la fracción I del artículo 110 de la Ley Federal del Trabajo.')]),

        clausulaTitulo('DÉCIMA CUARTA.-'),
        cuerpo([r('"LAS PARTES" se obligan a sujetarse a las disposiciones que en relación a la capacitación, adiestramiento y productividad establece el Artículo 153-A al 153-V de la Ley de la materia de acuerdo con los planes y programas que al efecto se establezcan, quedando obligado "EL TRABAJADOR" a cumplir con todas las obligaciones que le correspondan.')]),
        cuerpo([r('"EL TRABAJADOR" se obliga en términos de lo dispuesto por la fracción X del Artículo 134 de la Ley Federal del Trabajo, a someterse a todos los reconocimientos y exámenes médicos que "EL PATRON" le indique, así como a los que correspondan de acuerdo a los reglamentos sanitarios.')]),

        clausulaTitulo('DÉCIMA QUINTA.-'),
        cuerpo([r('"LAS PARTES" convienen en que a falta de estipulación expresa en este Contrato Individual de Trabajo, se estará a lo dispuesto en el Reglamento Interior de Trabajo y en la contratación colectiva que rige en "EL PATRON" y supletoriamente a lo establecido por la Ley Federal del Trabajo y sus Reglamentos.')]),

        clausulaTitulo('DÉCIMA SEXTA.-'),
        cuerpo([r(`Con el objeto de que "EL TRABAJADOR" tenga posibilidades de una mejor integración familiar y por su parte "EL PATRON" de tener continuidad en los trabajos, las partes convienen de acuerdo con las necesidades y posibilidades de esta última, que los días de descanso obligatorio podrán ser cambiados para que sean disfrutados por "EL TRABAJADOR" en fecha distinta. De conformidad con lo establecido en el artículo 75 de la Ley Federal del Trabajo, cuando así lo requiera por escrito "EL PATRON", "EL TRABAJADOR" quedará obligado a prestar sus servicios en los días de descanso obligatorio con el pago del salario correspondiente.`)]),

        clausulaTitulo('DÉCIMA SÉPTIMA.-'),
        cuerpo([r(`Para la aplicación, interpretación y cumplimiento del presente Contrato las partes se someten expresamente a la Jurisdicción de los Tribunales Competentes en materia de Trabajo ubicados en ${D.patronCiudad}, renunciando desde ahora a cualquier fuero que pudiere corresponderle por razón de sus domicilios presentes o futuros.`)]),

        // ── FIRMAS ──
        new Paragraph({ children: [], spacing: { before: 80, after: 60 } }),
        cuerpo([r(`LEÍDO QUE FUE POR LAS PARTES EL PRESENTE CONTRATO, LO SUSCRIBEN RECIBIENDO COPIA DEL MISMO EN ${D.patronCiudad.toUpperCase()}, A ${fechaDoc.toUpperCase()}.`, false)]),
        new Paragraph({ children: [], spacing: { before: 120, after: 120 } }),
        firmaTable('EL PATRON', representante, 'EL TRABAJADOR', trabNombre),

        // ── ANEXO A ──
        new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),
        titulo('ANEXO A.'),
        cuerpo([r('El presente anexo es complemento y parte integrante del Contrato Individual de Trabajo de Capacitación Inicial celebrada entre "LAS PARTES", establece las funciones y/o actividades, a realizar por "EL TRABAJADOR" en los términos que convinieron "LAS PARTES".')]),
        new Paragraph({ children: [], spacing: { before: 60, after: 40 } }),
        cuerpo([r(`${D.patronCiudad}, ${fechaDoc}.`)]),
        new Paragraph({ children: [], spacing: { before: 40, after: 40 } }),
        cuerpo([r('PUESTO: ', true), r(D.condPuesto, true)]),
        new Paragraph({ children: [], spacing: { before: 60, after: 60 } }),
        tablaAnexoA(
          ['N°', 'Descripción del Puesto'],
          actividades.map((a: string, i: number) => [`${i + 1}.-`, a.trim()]),
          [600, 8760]
        ),
        new Paragraph({ children: [], spacing: { before: 200, after: 120 } }),
        firmaTable('EL PATRON', representante, 'EL TRABAJADOR', trabNombre),

        // ── ANEXO B ──
        new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),
        titulo('ANEXO B'),
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

        tablaAnexoA(
          ['AÑOS DE SERVICIOS', 'DIAS DE VACACIONES'],
          [['1', '12 días'], ['2', '14 días'], ['3', '16 días'], ['4', '18 días']],
          [4680, 4680]
        ),

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
        new Paragraph({ children: [], spacing: { before: 120, after: 120 } }),
        firmaTable('LA EMPRESA', representante, 'EL TRABAJADOR', trabNombre),

        // ── ANEXO C — AVISO DE PRIVACIDAD ──
        new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),
        titulo('AVISO DE PRIVACIDAD'),
        cuerpo([
          r(D.patronNombre, true),
          r(` ("LA EMPRESA"), con domicilio en ${D.patronDomicilio}, ${D.patronCiudad}, en cumplimiento a lo establecido en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento, pone a disposición del titular el presente Aviso de Privacidad.`),
        ]),
        clausulaTitulo('FINALIDADES DEL TRATAMIENTO:'),
        cuerpo([r('Los datos personales recabados serán utilizados para: (i) gestión de la relación laboral; (ii) cumplimiento de obligaciones fiscales y de seguridad social; (iii) pago de nómina y prestaciones; (iv) elaboración de expediente laboral.')]),
        clausulaTitulo('DATOS RECABADOS:'),
        cuerpo([r('Nombre completo, domicilio, RFC, CURP, número de seguridad social, fecha de nacimiento, datos bancarios y datos de familiares beneficiarios.')]),
        clausulaTitulo('TRANSFERENCIAS:'),
        cuerpo([r('Los datos podrán ser transferidos al IMSS, SAT, INFONAVIT, AFORE y demás autoridades competentes para el cumplimiento de obligaciones legales.')]),
        clausulaTitulo('DERECHOS ARCO:'),
        cuerpo([r(`El titular podrá ejercer sus derechos de Acceso, Rectificación, Cancelación u Oposición enviando solicitud a: ${D.patronCorreo || 'privacidad@empresa.com'} o en las oficinas de "LA EMPRESA".`)]),
        new Paragraph({ children: [], spacing: { before: 160, after: 60 } }),
        p([r('He leído y acepto el presente Aviso de Privacidad.')], { align: 'center' }),
        new Paragraph({ children: [], spacing: { before: 120, after: 60 } }),
        p([r('______________________________')], { align: 'center' }),
        p([r('"EL TRABAJADOR"', true)], { align: 'center' }),
        p([r(trabNombre, true)], { align: 'center' }),

        // ── ANEXO C — INSTRUCTIVO ──
        new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),
        titulo('ANEXO C'),
        subtitulo('INSTRUCTIVO PARA EL CORRECTO LLENADO DEL CONTRATO.'),
        pBullet('patron-bullets', 'El contrato deberá ser firmado por el trabajador al calce en cada hoja.'),
        pBullet('patron-bullets', 'El trabajador deberá de firmar cada uno de los anexos contenidos en el contrato.'),
        pBullet('patron-bullets', 'Es necesario que el trabajador firme el aviso de privacidad contenido en este contrato.'),
        pBullet('patron-bullets', 'Verificar que el salario pactado sea igual o superior al Salario Mínimo Vigente — www.gob.mx/conasami.'),
        pBullet('patron-bullets', `Este contrato es de ${D.duracion} días naturales. No puede prorrogarse bajo la misma modalidad — Art. 39-C LFT.`),
        pBullet('patron-bullets', 'Registrar al trabajador ante el IMSS el mismo día de inicio de la relación laboral — Art. 15 LSS.'),
        pBullet('patron-bullets', 'Conservar el original firmado en el expediente laboral del trabajador.'),
        new Paragraph({ children: [], spacing: { before: 200, after: 60 } }),
        p([r('______________________________')], { align: 'center' }),
        p([r('"EL TRABAJADOR"', true)], { align: 'center' }),
        p([r(trabNombre, true)], { align: 'center' }),
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
  const actividades = (D.condActividades || 'Actividades del puesto').split('\n').filter((a: string) => a.trim());

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'patron-bullets',
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
        titulo('CONTRATO INDIVIDUAL DE TRABAJO'),
        subtitulo('MODALIDAD POR OBRA DETERMINADA'),
        p([r('Artículos 35 y 36 de la Ley Federal del Trabajo', false, 18)], { align: 'center', before: 0, after: 160 }),

        cuerpo([
          r('CONTRATO INDIVIDUAL DE TRABAJO POR OBRA DETERMINADA QUE CELEBRAN POR UNA PARTE '),
          r(patronNombre, true),
          r(' QUIEN ACTUA POR SU PROPIO DERECHO Y A QUIEN EN LO SUCESIVO SE DENOMINARÁ "EL PATRON" Y POR LA OTRA '),
          r(trabNombre, true),
          r(' EN LO SUCESIVO "EL TRABAJADOR", AL TENOR DE LAS SIGUIENTES:'),
        ]),

        seccion('D E C L A R A C I O N E S'),
        cuerpo([r('DECLARACIONES DE "EL PATRON":', true)]),

        pBullet('patron-bullets', `Que es una persona ${D.patronTipo === 'fisica' ? 'física' : 'moral'} con capacidad legal para celebrar este contrato.`),
        pBullet('patron-bullets', `Que se encuentra inscrito en el RFC ${D.patronRFC}, con domicilio en ${D.patronDomicilio}, ${D.patronCiudad}.`),
        pBullet('patron-bullets', `Inscrito ante el IMSS con Registro Patronal número ${D.patronRegIMSS}.`),
        pBullet('patron-bullets', `Que requiere contratar personal para la obra: ${D.obraNombre}, ubicada en ${D.obraDomicilio}, Registro IMSS de obra: ${D.obraRegIMSS}.`),

        new Paragraph({ children: [], spacing: { before: 80, after: 40 } }),
        cuerpo([r('DECLARA "EL TRABAJADOR":', true)]),

        pBullet('patron-bullets', `Ser una persona física del sexo ${D.trabSexo === 'FEMENINO' ? 'femenino' : 'masculino'}, RFC: ${D.trabRFC}, CURP: ${D.trabCURP}, NSS: ${D.trabNSS}, con domicilio en ${D.trabDomicilio}.`),
        pBullet('patron-bullets', 'No tener impedimento alguno para celebrar el presente Contrato y contar con las capacidades y aptitudes requeridas para el desempeño del puesto contratado.'),

        seccion('C L Á U S U L A S'),

        clausulaTitulo('PRIMERA.- NATURALEZA Y OBJETO.-'),
        cuerpo([
          r('El presente contrato se celebra bajo la modalidad de Obra Determinada conforme a los Arts. 35 y 36 LFT. "EL TRABAJADOR" prestará sus servicios en el puesto de '),
          r(D.condPuesto, true),
          r(` en el Área de ${D.condArea}, en la obra denominada `),
          r(D.obraNombre, true),
          r(', ubicada en '),
          r(D.obraDomicilio, true),
          r(`. Fecha estimada de término: ${D.obraTermino}. Las actividades específicas se detallan en el Anexo "A".`),
        ]),

        clausulaTitulo('SEGUNDA.- DURACIÓN.-'),
        cuerpo([r('El presente contrato durará el tiempo necesario para concluir la obra antes señalada. Al terminarse la obra, la relación laboral concluye sin responsabilidad para ninguna de las partes — Arts. 35, 36, 53 fracc. III LFT.')]),

        clausulaTitulo('TERCERA.- JORNADA DE TRABAJO.-'),
        cuerpo([r(`La jornada será de tipo ${D.jornadaTipo}, con horario de ${D.jornadaEntrada} a ${D.jornadaSalida} horas, con descanso los días ${D.jornadaDescanso} — Arts. 60, 61 y 69 LFT.`)]),

        clausulaTitulo('CUARTA.- SALARIO Y FORMA DE PAGO.-'),
        cuerpo([
          r('"EL TRABAJADOR" percibirá un salario diario integrado de '),
          r(`$${D.condSalario} M.N.`, true),
          r(`, igual o superior al Salario Mínimo Vigente. Pago ${D.jornadaPago} — Art. 101 LFT.`),
        ]),

        clausulaTitulo('QUINTA.- PRESTACIONES.-'),
        cuerpo([
          r(`Aguinaldo: ${D.condAguinaldo} días — Art. 87 LFT. Prima vacacional: ${D.condPrima}% — Art. 80 LFT. Vacaciones conforme reforma 2023 (12-14-16-18 días para años 1-2-3-4) — Art. 76 LFT.`),
        ]),

        clausulaTitulo('SEXTA.- CONFIDENCIALIDAD.-'),
        cuerpo([r('"EL TRABAJADOR" se obliga a no divulgar información confidencial de "EL PATRON". Esta obligación permanece vigente durante 5 (cinco) años posteriores a la terminación de la relación laboral — Art. 47 LFT.')]),

        clausulaTitulo('SÉPTIMA.- PROPIEDAD INTELECTUAL.-'),
        cuerpo([r('Las creaciones intelectuales generadas en el ejercicio de las funciones contratadas serán propiedad de "EL PATRON" — Arts. 163 y 164 LFT.')]),

        clausulaTitulo('OCTAVA.- JURISDICCIÓN.-'),
        cuerpo([r(`Las partes se someten a los Tribunales laborales competentes de ${D.patronCiudad} — Art. 700 LFT.`)]),

        new Paragraph({ children: [], spacing: { before: 120, after: 60 } }),
        cuerpo([r(`LEÍDO QUE FUE POR LAS PARTES EL PRESENTE CONTRATO, LO SUSCRIBEN EN ${D.patronCiudad.toUpperCase()}, A ${fechaDoc.toUpperCase()}.`)]),
        new Paragraph({ children: [], spacing: { before: 120, after: 120 } }),
        firmaTable('EL PATRON', representante, 'EL TRABAJADOR', trabNombre),

        new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }),
        titulo('ANEXO A — DESCRIPCIÓN DEL PUESTO'),
        cuerpo([r(`Obra: `, true), r(D.obraNombre)]),
        cuerpo([r('Puesto: ', true), r(D.condPuesto), r('    Área: ', true), r(D.condArea)]),
        new Paragraph({ children: [], spacing: { before: 60, after: 60 } }),
        tablaAnexoA(
          ['N°', 'Actividades'],
          actividades.map((a: string, i: number) => [`${i + 1}.-`, a.trim()]),
          [600, 8760]
        ),
        new Paragraph({ children: [], spacing: { before: 200, after: 120 } }),
        firmaTable('EL PATRON', representante, 'EL TRABAJADOR', trabNombre),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}
