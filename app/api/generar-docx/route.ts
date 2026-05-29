import { NextRequest, NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, PageBreak,
} from 'docx';

function txt(text: string, opts: {bold?:boolean; size?:number; color?:string} = {}) {
  return new TextRun({ text, font:'Arial', size: opts.size||20, bold: opts.bold||false, color: opts.color||'000000' });
}
function par(children: TextRun[], opts: {align?:string; before?:number; after?:number} = {}) {
  return new Paragraph({
    children,
    alignment: (opts.align||'both') as any,
    spacing: { before: opts.before??80, after: opts.after??80, line:276 },
  });
}
function cen(children: TextRun[], opts = {}) { return par(children, { ...opts, align:'center' }); }

function firmaTable(izq: string, der: string) {
  const b = { style: BorderStyle.NONE, size:0, color:'FFFFFF' };
  const bords = { top:b, bottom:b, left:b, right:b };
  return new Table({
    width: { size:9360, type:WidthType.DXA },
    columnWidths: [4680,4680],
    rows: [new TableRow({ children: [
      new TableCell({ borders:bords, width:{size:4680,type:WidthType.DXA}, children:[
        new Paragraph({ children:[txt('_'.repeat(38))], alignment:AlignmentType.CENTER }),
        new Paragraph({ children:[txt(izq,{bold:true})], alignment:AlignmentType.CENTER, spacing:{before:60} }),
      ]}),
      new TableCell({ borders:bords, width:{size:4680,type:WidthType.DXA}, children:[
        new Paragraph({ children:[txt('_'.repeat(38))], alignment:AlignmentType.CENTER }),
        new Paragraph({ children:[txt(der,{bold:true})], alignment:AlignmentType.CENTER, spacing:{before:60} }),
      ]}),
    ]})],
  });
}

function tablaSimple(headers: string[], rows: string[][], widths: number[]) {
  const b = { style:BorderStyle.SINGLE, size:4, color:'CCCCCC' };
  const bords = { top:b, bottom:b, left:b, right:b };
  return new Table({
    width: { size:widths.reduce((a,v)=>a+v,0), type:WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h,i) => new TableCell({
        borders:bords, width:{size:widths[i],type:WidthType.DXA},
        shading:{fill:'D6E4F0',type:ShadingType.CLEAR},
        margins:{top:60,bottom:60,left:100,right:100},
        children:[new Paragraph({children:[txt(h,{bold:true})],alignment:AlignmentType.CENTER})],
      })) }),
      ...rows.map(row => new TableRow({ children: row.map((cell,i) => new TableCell({
        borders:bords, width:{size:widths[i],type:WidthType.DXA},
        margins:{top:60,bottom:60,left:100,right:100},
        children:[new Paragraph({children:[txt(cell)],alignment:AlignmentType.CENTER})],
      })) })),
    ],
  });
}

function sep() {
  return new Paragraph({ children:[], border:{ bottom:{style:BorderStyle.SINGLE,size:4,color:'CCCCCC'} }, spacing:{before:120,after:120} });
}

function clausula(num: string, nombre: string, ...cuerpos: string[]) {
  return [
    par([txt(`${num}. — ${nombre}.`,{bold:true,size:22})],{before:160,after:60}),
    ...cuerpos.map(c => par([txt(c)],{before:40,after:40})),
  ];
}

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

async function generarCapacitacion(D: any): Promise<Buffer> {
  const durLetra = D.duracion==='30'?'TREINTA (30)':D.duracion==='60'?'SESENTA (60)':'NOVENTA (90)';

  const children = [
    cen([txt('CONTRATO INDIVIDUAL DE TRABAJO',{bold:true,size:28})],{before:160,after:60}),
    cen([txt(`MODALIDAD CAPACITACIÓN INICIAL (${durLetra} DÍAS)`,{bold:true,size:24})],{after:40}),
    cen([txt('Artículo 39-B de la Ley Federal del Trabajo',{size:20,color:'555555'})],{after:160}),
    sep(),
    cen([txt('D E C L A R A C I O N E S',{bold:true,size:22})],{before:120,after:100}),

    par([txt('I. DECLARACIONES DE "EL PATRÓN":', {bold:true})],{before:80,after:40}),
    par([txt('Nombre / Razón social: '),txt(D.patronNombre,{bold:true})]),
    par([txt('RFC: '),txt(D.patronRFC,{bold:true}),txt('    Registro Patronal IMSS: '),txt(D.patronRegIMSS,{bold:true})]),
    par([txt('Domicilio: '),txt(`${D.patronDomicilio}, ${D.patronCiudad}`,{bold:true})]),
    par([txt('Persona '),txt(D.patronTipo,{bold:true}),txt(' con capacidad legal para celebrar este contrato.')]),

    par([txt('II. DECLARACIONES DE "EL TRABAJADOR":', {bold:true})],{before:80,after:40}),
    par([txt('Nombre completo: '),txt(D.trabNombre,{bold:true})]),
    par([txt('Sexo: '),txt(D.trabSexo,{bold:true}),txt('    Nacimiento: '),txt(D.trabNacimiento,{bold:true})]),
    par([txt('RFC: '),txt(D.trabRFC,{bold:true}),txt('    CURP: '),txt(D.trabCURP,{bold:true})]),
    par([txt('NSS: '),txt(D.trabNSS,{bold:true})]),
    par([txt('Domicilio: '),txt(D.trabDomicilio,{bold:true})]),

    sep(),
    cen([txt('C L Á U S U L A S',{bold:true,size:22})],{before:120,after:100}),

    ...clausula('PRIMERA','OBJETO Y MODALIDAD',
      `"EL PATRÓN" contrata los servicios de "EL TRABAJADOR" bajo modalidad de Capacitación Inicial de ${durLetra} días conforme al Art. 39-B LFT, para el puesto de ${D.condPuesto} (Área: ${D.condArea}).`,
      `El periodo vencerá el ${D.condTermino}. Al concluir, "EL PATRÓN" comunicará por escrito su decisión de continuar o terminar la relación laboral — Art. 39-B LFT.`,
      `Las partes acuerdan que la duración es de ${D.duracion} días naturales sin posibilidad de prórroga bajo esta modalidad — Art. 39-C LFT.`
    ),
    ...clausula('SEGUNDA','RESCISIÓN POR FALTA DE CAPACIDAD',
      '"EL PATRÓN" podrá rescindir sin responsabilidad si "EL TRABAJADOR" demuestra falta de capacidad manifiesta o engaño en certificados — Art. 47 LFT.'
    ),
    ...clausula('TERCERA','LUGAR DE PRESTACIÓN DE SERVICIOS',
      `El lugar principal será el domicilio de "EL PATRÓN" en ${D.patronCiudad}. Por necesidades operativas podrá asignarse otro domicilio con 5 días hábiles de anticipación — Art. 51 LFT.`
    ),
    ...clausula('CUARTA','JORNADA DE TRABAJO',
      `Jornada ${D.jornadaTipo} (máx. ${D.jornadaTipo==='diurna'?'8':D.jornadaTipo==='nocturna'?'7':'7.5'} horas diarias), horario de ${D.jornadaEntrada} a ${D.jornadaSalida} hrs, descanso los ${D.jornadaDescanso} — Arts. 60, 61 y 69 LFT.`
    ),
    ...clausula('QUINTA','SALARIO Y FORMA DE PAGO',
      `"EL TRABAJADOR" percibirá $${D.condSalario} M.N. como salario diario, igual o superior al SMV vigente CONASAMI. Pago ${D.jornadaPago} — Art. 101 LFT.`
    ),
    ...clausula('SEXTA','PRESTACIONES',
      `Aguinaldo: ${D.condAguinaldo} días — Art. 87 LFT. Prima vacacional: ${D.condPrima}% — Art. 80 LFT. Vacaciones conforme reforma 2023 — Art. 76 LFT.`
    ),
    ...clausula('SÉPTIMA','CONFIDENCIALIDAD',
      '"EL TRABAJADOR" no divulgará información confidencial, datos de clientes o procesos sin autorización expresa. Esta obligación permanece vigente durante 5 (cinco) años posteriores a la terminación — Art. 47 LFT.'
    ),
    ...clausula('OCTAVA','PROPIEDAD INTELECTUAL',
      'Las creaciones intelectuales generadas en el ejercicio de funciones serán propiedad de "EL PATRÓN" — Arts. 163 y 164 LFT.'
    ),
    ...clausula('NOVENA','DÍAS DE DESCANSO OBLIGATORIO',
      'Los señalados en el Art. 74 LFT. Si se laboran, se pagará el triple del salario — Art. 73 LFT.'
    ),
    ...clausula('DÉCIMA','SUPLETORIEDAD',
      'A falta de estipulación expresa se estará a la LFT, LSS y demás leyes aplicables.'
    ),

    par([txt('DÉCIMA PRIMERA. — DESIGNACIÓN DE BENEFICIARIOS.',{bold:true,size:22})],{before:160,after:60}),
    par([txt('Conforme al Art. 501 LFT, "EL TRABAJADOR" designa:')],{before:40,after:80}),
    tablaSimple(
      ['Nombre completo','Parentesco','% de participación'],
      D.beneficiarios.map((b: any) => [b.nombre||'—', b.parentesco||'—', b.pct||'—']),
      [5000,2500,1860]
    ),

    ...clausula('DÉCIMA SEGUNDA','JURISDICCIÓN',
      `Las partes se someten a los Tribunales laborales de ${D.patronCiudad} — Art. 700 LFT.`
    ),

    sep(),
    par([txt(`Leído el presente contrato, lo suscriben en ${D.patronCiudad}, a ${new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}.`)],{before:120,after:240}),
    firmaTable('"EL TRABAJADOR"','"EL PATRÓN"'),
    cen([txt(D.trabNombre,{bold:true})],{before:40}),
    cen([txt(D.patronRepresentante||D.patronNombre,{bold:true})]),

    new Paragraph({children:[new PageBreak()]}),
    cen([txt('ANEXO A — DESCRIPCIÓN DEL PUESTO',{bold:true,size:22})],{before:0,after:60}),
    par([txt('Puesto: '),txt(D.condPuesto,{bold:true}),txt('    Área: '),txt(D.condArea,{bold:true})],{after:80}),
    tablaSimple(
      ['N°','Descripción de actividades'],
      (D.condActividades||'Sin descripción').split('\n').filter((a:string)=>a.trim()).map((a:string,i:number)=>[`${i+1}.`,a.trim()]),
      [600,8760]
    ),
    new Paragraph({children:[],spacing:{before:200}}),
    firmaTable('"EL TRABAJADOR"','"EL PATRÓN"'),

    new Paragraph({children:[new PageBreak()]}),
    cen([txt('ANEXO B — PRESTACIONES',{bold:true,size:22})],{before:0,after:60}),
    par([txt('AGUINALDO: '),txt(`${D.condAguinaldo} días — Art. 87 LFT.`)]),
    par([txt('PRIMA VACACIONAL: '),txt(`${D.condPrima}% — Art. 80 LFT.`)]),
    par([txt('VACACIONES (reforma 2023): '),txt('12-14-16-18 días (años 1-2-3-4) — Art. 76 LFT.')]),
    par([txt('DÍAS DE DESCANSO: '),txt('Los del Art. 74 LFT.')]),
    new Paragraph({children:[],spacing:{before:160}}),
    firmaTable('"EL TRABAJADOR"','"EL PATRÓN"'),

    new Paragraph({children:[new PageBreak()]}),
    cen([txt('ANEXO C — AVISO DE PRIVACIDAD',{bold:true,size:22})],{before:0,after:80}),
    par([txt(D.patronNombre,{bold:true}),txt(' ("LA EMPRESA"), con domicilio en '),txt(`${D.patronDomicilio}, ${D.patronCiudad}`,{bold:true}),txt(', pone a su disposición el presente Aviso de Privacidad conforme a la LFPDPPP.')]),
    par([txt('Finalidades: '),txt('gestión de la relación laboral; cumplimiento de obligaciones fiscales y de seguridad social; pago de nómina y prestaciones.')],{before:60}),
    par([txt('Datos recabados: '),txt('nombre, domicilio, RFC, CURP, NSS, fecha de nacimiento, datos bancarios y datos de familiares beneficiarios.')],{before:60}),
    par([txt('Transferencias: '),txt('IMSS, SAT, INFONAVIT, AFORE y autoridades competentes.')],{before:60}),
    par([txt('Derechos ARCO: '),txt(`Solicitud a ${D.patronCorreo||'recursos.humanos@empresa.com'} o en las oficinas de "LA EMPRESA".`)],{before:60,after:120}),
    cen([txt('_'.repeat(40))],{before:120}),
    cen([txt('"EL TRABAJADOR"',{bold:true})]),
    cen([txt(D.trabNombre,{bold:true})]),

    new Paragraph({children:[new PageBreak()]}),
    cen([txt('ANEXO D — INSTRUCTIVO DE LLENADO',{bold:true,size:22})],{before:0,after:80}),
    ...[
      'Sustituir campos en «chevrones» con datos reales antes de imprimir.',
      `Este contrato es de ${D.duracion} días naturales. No puede prorrogarse bajo la misma modalidad — Art. 39-C LFT.`,
      'Verificar salario igual o superior al SMV vigente — www.gob.mx/conasami.',
      'El trabajador debe firmar al calce de cada hoja y en todos los Anexos.',
      'Conservar el original firmado en el expediente laboral.',
      'Registrar al trabajador ante el IMSS el mismo día de inicio.',
      'Verificar que los porcentajes de beneficiarios sumen 100%.',
      'La confidencialidad post-contrato es de 5 años — no modificar.',
    ].map(item => new Paragraph({children:[txt(`• ${item}`)],spacing:{before:60,after:60,line:276}})),
    new Paragraph({children:[],spacing:{before:200}}),
    firmaTable('"EL TRABAJADOR"','"EL PATRÓN"'),
  ];

  const doc = new Document({
    styles:{default:{document:{run:{font:'Arial',size:20}}}},
    sections:[{
      properties:{page:{size:{width:12240,height:15840},margin:{top:1440,right:1260,bottom:1440,left:1440}}},
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}

async function generarObra(D: any): Promise<Buffer> {
  const children = [
    cen([txt('CONTRATO INDIVIDUAL DE TRABAJO',{bold:true,size:28})],{before:160,after:60}),
    cen([txt('MODALIDAD POR OBRA DETERMINADA',{bold:true,size:24})],{after:40}),
    cen([txt('Artículos 35 y 36 de la Ley Federal del Trabajo',{size:20,color:'555555'})],{after:160}),
    sep(),
    cen([txt('D E C L A R A C I O N E S',{bold:true,size:22})],{before:120,after:100}),

    par([txt('I. DECLARACIONES DE "EL PATRÓN":', {bold:true})],{before:80,after:40}),
    par([txt('Nombre: '),txt(D.patronNombre,{bold:true})]),
    par([txt('RFC: '),txt(D.patronRFC,{bold:true}),txt('    Reg. Patronal: '),txt(D.patronRegIMSS,{bold:true})]),
    par([txt('Domicilio: '),txt(`${D.patronDomicilio}, ${D.patronCiudad}`,{bold:true})]),

    par([txt('II. DECLARACIONES DE "EL EMPLEADO":', {bold:true})],{before:80,after:40}),
    par([txt('Nombre: '),txt(D.trabNombre,{bold:true})]),
    par([txt('RFC: '),txt(D.trabRFC,{bold:true}),txt('    CURP: '),txt(D.trabCURP,{bold:true})]),
    par([txt('NSS: '),txt(D.trabNSS,{bold:true})]),

    sep(),
    cen([txt('C L Á U S U L A S',{bold:true,size:22})],{before:120,after:100}),

    ...clausula('PRIMERA','NATURALEZA Y OBJETO',
      `Contrato por Obra Determinada conforme Arts. 35 y 36 LFT. Obra: ${D.obraNombre}, ubicada en ${D.obraDomicilio}. Registro IMSS de obra: ${D.obraRegIMSS}. Fecha estimada de término: ${D.obraTermino}.`,
      `"EL EMPLEADO" desempeñará el puesto de ${D.condPuesto} (Área: ${D.condArea}). Actividades en Anexo "A".`
    ),
    ...clausula('SEGUNDA','DURACIÓN',
      'El contrato durará el tiempo necesario para concluir la obra. Al terminarse, la relación laboral concluye — Arts. 35, 36, 53 fracc. III LFT.'
    ),
    ...clausula('TERCERA','JORNADA DE TRABAJO',
      `Jornada ${D.jornadaTipo}, horario de ${D.jornadaEntrada} a ${D.jornadaSalida} hrs, descanso los ${D.jornadaDescanso} — Arts. 60, 61 y 69 LFT.`
    ),
    ...clausula('CUARTA','SALARIO Y FORMA DE PAGO',
      `Salario diario integrado: $${D.condSalario} M.N., igual o superior al SMV vigente. Pago ${D.jornadaPago} — Art. 101 LFT.`
    ),
    ...clausula('QUINTA','PRESTACIONES',
      `Aguinaldo: ${D.condAguinaldo} días. Prima vacacional: ${D.condPrima}%. Vacaciones conforme reforma 2023 — Arts. 76, 80, 87 LFT.`
    ),
    ...clausula('SEXTA','CONFIDENCIALIDAD',
      'Obligación de confidencialidad durante la relación y 5 (cinco) años posteriores a su término — Art. 47 LFT.'
    ),
    ...clausula('SÉPTIMA','PROPIEDAD INTELECTUAL',
      'Las creaciones generadas en el ejercicio de funciones serán propiedad de "EL PATRÓN" — Arts. 163 y 164 LFT.'
    ),
    ...clausula('OCTAVA','DÍAS DE DESCANSO OBLIGATORIO',
      'Los del Art. 74 LFT. Si se laboran, se pagará el triple — Art. 73 LFT.'
    ),

    par([txt('NOVENA. — DESIGNACIÓN DE BENEFICIARIOS.',{bold:true,size:22})],{before:160,after:60}),
    par([txt('Conforme al Art. 501 LFT, "EL EMPLEADO" designa:')],{before:40,after:80}),
    tablaSimple(
      ['Nombre completo','Parentesco','% de participación'],
      D.beneficiarios.map((b:any)=>[b.nombre||'—',b.parentesco||'—',b.pct||'—']),
      [5000,2500,1860]
    ),

    ...clausula('DÉCIMA','JURISDICCIÓN',
      `Las partes se someten a los Tribunales laborales de ${D.patronCiudad} — Art. 700 LFT.`
    ),

    sep(),
    par([txt(`Leído el presente contrato, lo suscriben en ${D.patronCiudad}, a ${new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}.`)],{before:120,after:240}),
    firmaTable('"EL EMPLEADO"','"EL PATRÓN"'),
    cen([txt(D.trabNombre,{bold:true})],{before:40}),
    cen([txt(D.patronRepresentante||D.patronNombre,{bold:true})]),

    new Paragraph({children:[new PageBreak()]}),
    cen([txt('ANEXO A — DESCRIPCIÓN DEL PUESTO',{bold:true,size:22})],{before:0,after:60}),
    par([txt('Obra: '),txt(D.obraNombre,{bold:true})]),
    par([txt('Puesto: '),txt(D.condPuesto,{bold:true}),txt('    Área: '),txt(D.condArea,{bold:true})],{after:80}),
    tablaSimple(
      ['N°','Actividades'],
      (D.condActividades||'Sin descripción').split('\n').filter((a:string)=>a.trim()).map((a:string,i:number)=>[`${i+1}.`,a.trim()]),
      [600,8760]
    ),
    new Paragraph({children:[],spacing:{before:200}}),
    firmaTable('"EL EMPLEADO"','"EL PATRÓN"'),
  ];

  const doc = new Document({
    styles:{default:{document:{run:{font:'Arial',size:20}}}},
    sections:[{
      properties:{page:{size:{width:12240,height:15840},margin:{top:1440,right:1260,bottom:1440,left:1440}}},
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}
