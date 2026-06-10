// Contrato Individual de Trabajo — Modalidad por Tiempo Indeterminado (Arts. 35 y 37 LFT).
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType,
} from 'docx';
import { r, p, cuerpo, clausulaTitulo, firmaTable } from './helpers';

const BLUE = '2563EB';
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export function generarIndeterminado(D: any): Promise<Buffer> {
  // Campo variable: negro si tiene valor, azul «placeholder» si está vacío.
  const cf = (val: string, ph: string) =>
    val ? new TextRun({ text: val, font: 'Arial', size: 20, bold: true, color: '000000' })
        : new TextRun({ text: `«${ph}»`, font: 'Arial', size: 20, bold: true, color: BLUE });
  const tit = (t: string) => new Paragraph({ children: [r(t, true, 24)], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 40 } });
  const sub = (t: string) => new Paragraph({ children: [r(t, true, 22)], alignment: AlignmentType.CENTER, spacing: { before: 20, after: 40 } });
  const seccion = (t: string) => new Paragraph({ children: [r(t, true, 21)], alignment: AlignmentType.CENTER, spacing: { before: 200, after: 120 } });
  const decl = (children: TextRun[]) => new Paragraph({ children, alignment: AlignmentType.BOTH, spacing: { before: 30, after: 30, line: 264 } });
  const inciso = (children: TextRun[]) => new Paragraph({ children, alignment: AlignmentType.BOTH, spacing: { before: 30, after: 30, line: 264 }, indent: { left: 360 } });
  const bullet = (children: TextRun[]) => new Paragraph({ children: [r('•  '), ...children], alignment: AlignmentType.BOTH, spacing: { before: 20, after: 20, line: 264 }, indent: { left: 360, hanging: 200 } });
  const anexoTit = (t: string) => new Paragraph({ children: [r(t, true, 22)], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 100 }, pageBreakBefore: true });

  const D2: any = D;
  const fechaDMA = (iso: string) => { if (!iso) return ''; const dt = new Date(iso + 'T00:00:00'); return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`; };
  const ingreso = D2.condInicio || '';
  const fi = ingreso ? new Date(ingreso + 'T00:00:00') : null;
  const diaTxt = fi ? String(fi.getDate()).padStart(2,'0') : '';
  const mesTxt = fi ? MESES[fi.getMonth()] : '';
  const anioTxt = fi ? String(fi.getFullYear()) : '';
  const salarioNum = D2.condSalario ? `$${Number(D2.condSalario).toFixed(2)}` : '';
  const pago = D2.jornadaPago === 'quincenalmente' ? 'QUINCENAL' : D2.jornadaPago === 'semanalmente' ? 'SEMANAL' : (D2.jornadaPago || '');
  const personaTipo = D2.patronTipo === 'fisica' ? 'física' : 'moral';
  const aguinaldo = D2.condAguinaldo || '15';
  const prima = D2.condPrima || '25';
  const descanso = D2.jornadaDescanso || '';
  const actividades: string[] = (D2.condActividades || '').split('\n').map((s: string) => s.trim()).filter(Boolean);

  // Cláusula de jornada (continua/discontinua, Art. 64 LFT).
  const jornadaClausula = () => {
    const entrada = D2.jornadaEntrada || ''; const salida = D2.jornadaSalida || '';
    const continua = D2.jornadaContinua === 'continua';
    const dur = Number(D2.jornadaDuracionComida || 60);
    const efectivas = typeof D2.horasEfectivas === 'number' ? D2.horasEfectivas : 8;
    const efTxt = Number.isInteger(efectivas) ? String(efectivas) : efectivas.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
    const durTxt = dur === 60 ? 'una hora' : dur === 30 ? 'media hora' : dur === 90 ? 'una hora y media' : dur === 120 ? 'dos horas' : `${dur} minutos`;
    if (continua) {
      return [
        r('La duración de la jornada de trabajo será la '), cf(D2.jornadaTipo || '', 'DIURNA / NOCTURNA / MIXTA'),
        r(`, con un horario de `), cf(entrada, 'HORA DE ENTRADA'), r(' a '), cf(salida, 'HORA DE SALIDA'),
        r(` horas. Dentro de dicha jornada continua “EL EMPLEADO” gozará de un descanso de ${durTxt} para tomar sus alimentos, de conformidad con el artículo 63 de la Ley Federal del Trabajo; al permanecer dentro del centro de trabajo durante dicho periodo, el mismo se computa como tiempo efectivo de la jornada en términos del artículo 64 de la propia Ley, resultando una jornada efectiva de ${efTxt} horas diarias.`),
      ];
    }
    return [
      r('La duración de la jornada de trabajo será la '), cf(D2.jornadaTipo || '', 'DIURNA / NOCTURNA / MIXTA'),
      r(`, con un horario de `), cf(entrada, 'HORA DE ENTRADA'), r(' a '), cf(salida, 'HORA DE SALIDA'),
      r(`, comprendiendo dentro de ese periodo un lapso de ${durTxt} destinado a que “EL EMPLEADO” tome sus alimentos fuera del centro de trabajo y fuera de la subordinación de “EL PATRÓN”, durante el cual podrá disponer libremente de su tiempo, por lo que dicho lapso no se computa como tiempo efectivo de la jornada laboral conforme a la interpretación a contrario sensu del artículo 64 de la Ley Federal del Trabajo, resultando una jornada efectiva de ${efTxt} horas diarias, dentro del máximo previsto por el artículo 61 de la propia Ley. En caso de que “EL EMPLEADO” no pudiera salir del centro de trabajo durante dicho lapso, el tiempo correspondiente se computará como tiempo efectivo de trabajo en términos del citado artículo 64.`),
    ];
  };

  // Tabla de vacaciones (3 columnas, reforma 2023).
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
  const bords = { top: b, bottom: b, left: b, right: b };
  const tcell = (children: any[], w: number, fill?: string) => new TableCell({ borders: bords, width: { size: w, type: WidthType.DXA }, shading: fill ? { fill, type: ShadingType.CLEAR } : undefined, margins: { top: 50, bottom: 50, left: 90, right: 90 }, children });
  const cCenter = (run: TextRun) => new Paragraph({ children: [run], alignment: AlignmentType.CENTER });
  const tablaVac = () => {
    const filas: [string, string][] = [['1','12 días'],['2','14 días'],['3','16 días'],['4','18 días'],['5 en adelante','+2 días c/5 años']];
    return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [2600, 3680, 3080], rows: [
      new TableRow({ tableHeader: true, children: [
        tcell([cCenter(r('Años de servicios', true))], 2600, 'D6DCE4'),
        tcell([cCenter(r('Días de vacaciones (mínimo legal)', true))], 3680, 'D6DCE4'),
        tcell([cCenter(r('Días otorgados por la empresa', true))], 3080, 'D6DCE4'),
      ]}),
      ...filas.map(([a, d]) => new TableRow({ children: [
        tcell([cCenter(r(a))], 2600), tcell([cCenter(r(d))], 3680), tcell([cCenter(cf('', '___'))], 3080),
      ]})),
    ]});
  };

  // Tabla de Anexo A (N° / Descripción / Frecuencia).
  const tablaActividades = () => {
    const filas = actividades.length ? actividades : [''];
    return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [700, 5860, 2800], rows: [
      new TableRow({ tableHeader: true, children: [
        tcell([cCenter(r('N°', true))], 700, 'D6DCE4'),
        tcell([cCenter(r('Descripción de actividades y responsabilidades', true))], 5860, 'D6DCE4'),
        tcell([cCenter(r('Frecuencia (diaria/semanal/eventual)', true))], 2800, 'D6DCE4'),
      ]}),
      ...filas.map((act, i) => new TableRow({ children: [
        tcell([cCenter(r(`${i + 1}.`))], 700),
        tcell([new Paragraph({ children: [act ? r(act) : cf('', '___')], alignment: AlignmentType.BOTH })], 5860),
        tcell([cCenter(cf('', '___'))], 2800),
      ]})),
    ]});
  };

  // Tabla de beneficiarios (Art. 501).
  const tablaBenef = () => {
    const bs = Array.isArray(D2.beneficiarios) ? D2.beneficiarios : [];
    return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4360, 2800, 2200], rows: [
      new TableRow({ tableHeader: true, children: [
        tcell([cCenter(r('Nombre completo del beneficiario', true))], 4360, 'D6DCE4'),
        tcell([cCenter(r('Parentesco', true))], 2800, 'D6DCE4'),
        tcell([cCenter(r('% de participación', true))], 2200, 'D6DCE4'),
      ]}),
      ...[0,1,2].map(i => {
        const x = bs[i] || {};
        return new TableRow({ children: [
          tcell([cCenter(cf(x.nombre || '', 'Nombre'))], 4360),
          tcell([cCenter(cf(x.parentesco || '', 'Parentesco'))], 2800),
          tcell([cCenter(cf(x.pct ? `${x.pct}%` : '', '___%'))], 2200),
        ]});
      }),
    ]});
  };

  const firma = (nombreRun: TextRun, label: string) => new TableCell({
    borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
    width: { size: 4680, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 60, right: 60 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 6 }, children: [r('______________________________')] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [nombreRun] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [r(label, true)] }),
    ],
  });
  const bloqueFirmas = (nombreEmpleado: TextRun, nombrePatron: TextRun) => new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
    rows: [new TableRow({ children: [firma(nombreEmpleado, 'EL EMPLEADO'), firma(nombrePatron, 'EL PATRÓN')] })],
  });

  const empleadoRun = () => cf(D2.trabNombre || '', 'NOMBRE COMPLETO DEL EMPLEADO');
  const patronRun = () => cf(D2.patronRepresentante || D2.patronNombre || '', 'NOMBRE DEL REPRESENTANTE / PATRÓN');

  const children: any[] = [
    tit('CONTRATO INDIVIDUAL DE TRABAJO'),
    sub('MODALIDAD POR TIEMPO INDETERMINADO'),
    new Paragraph({ children: [r('Artículos 35 y 37 de la Ley Federal del Trabajo')], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),

    seccion('D E C L A R A C I O N E S'),
    clausulaTitulo('I. DECLARACIONES DE “EL PATRÓN”:'),
    decl([r('Nombre / Razón social: ', true), cf(D2.patronNombre || '', 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN')]),
    decl([r('RFC: ', true), cf(D2.patronRFC || '', 'RFC DEL PATRÓN')]),
    decl([r('Registro Patronal IMSS: ', true), cf(D2.patronRegIMSS || '', 'NÚMERO DE REGISTRO PATRONAL')]),
    decl([r('Domicilio: ', true), cf(D2.patronDomicilio || '', 'DOMICILIO COMPLETO, COLONIA, C.P., ALCALDÍA/MUNICIPIO, CIUDAD')]),
    inciso([r(`a) Que es una persona ${personaTipo} con capacidad legal para celebrar el presente contrato, debidamente inscrita ante el Instituto Mexicano del Seguro Social y en el Registro Federal de Contribuyentes en los datos señalados.`)]),
    inciso([r('b) Que requiere los servicios personales y subordinados de “EL EMPLEADO” para el desempeño del puesto descrito en la Cláusula Primera, por tiempo indeterminado, de conformidad con el artículo 35 de la Ley Federal del Trabajo.')]),

    clausulaTitulo('II. DECLARACIONES DE “EL EMPLEADO”:'),
    decl([r('Nombre completo: ', true), cf(D2.trabNombre || '', 'NOMBRE COMPLETO DEL EMPLEADO')]),
    decl([r('Sexo: ', true), cf(D2.trabSexo || '', 'MASCULINO / FEMENINO'), r('     Fecha de nacimiento: ', true), cf(fechaDMA(D2.trabNacimiento), 'DD/MM/AAAA')]),
    decl([r('Nacionalidad: ', true), cf(D2.trabNacionalidad || '', 'NACIONALIDAD')]),
    decl([r('RFC: ', true), cf(D2.trabRFC || '', 'RFC'), r('     CURP: ', true), cf(D2.trabCURP || '', 'CURP')]),
    decl([r('Número de Seguridad Social (IMSS): ', true), cf(D2.trabNSS || '', 'NSS')]),
    decl([r('Domicilio: ', true), cf(D2.trabDomicilio || '', 'DOMICILIO COMPLETO, COLONIA, C.P., CIUDAD Y ESTADO')]),
    inciso([r('a) Que no tiene impedimento legal alguno para celebrar el presente contrato y que cuenta con la capacidad, aptitudes y disponibilidad para desempeñar el puesto de '), cf(D2.condPuesto || '', 'DENOMINACIÓN DEL PUESTO'), r(', cuyas actividades se describen en el Anexo “A”.')]),
    inciso([r('b) Que tiene los conocimientos, habilidades y experiencia necesarios para prestar los servicios requeridos, conforme a la declaración, bajo protesta de decir verdad, que formula al suscribir el presente instrumento.')]),

    clausulaTitulo('III. DECLARAN “LAS PARTES”:'),
    cuerpo([r('Que estando de acuerdo con las declaraciones anteriores, proceden a celebrar el presente contrato bajo las siguientes:')]),

    seccion('C L Á U S U L A S'),

    clausulaTitulo('PRIMERA. — NATURALEZA Y OBJETO DEL CONTRATO.'),
    cuerpo([r('“EL EMPLEADO” prestará sus servicios a “EL PATRÓN” de manera personal y bajo su subordinación y dirección, en el puesto de '), cf(D2.condPuesto || '', 'DENOMINACIÓN DEL PUESTO'), r(', área de '), cf(D2.condArea || '', 'ÁREA O DEPARTAMENTO'), r(', cuyas funciones y actividades específicas se detallan en el Anexo “A” del presente instrumento, el cual forma parte integrante del mismo.')]),
    cuerpo([r('Las actividades descritas son enunciativas y no limitativas; “EL EMPLEADO” deberá prestar cualquier otro servicio inherente al cargo. Dada la naturaleza de los servicios que presta “EL PATRÓN” a terceros, “EL EMPLEADO” podrá realizar sus actividades en instalaciones de clientes de “EL PATRÓN”, reconociendo expresamente que ello no crea vínculo laboral con dichos terceros.')]),

    clausulaTitulo('SEGUNDA. — LUGAR DE PRESTACIÓN DE SERVICIOS.'),
    cuerpo([r('“LAS PARTES” convienen que el lugar principal de prestación de servicios será el domicilio de “EL PATRÓN” señalado en las declaraciones. Por necesidades operativas debidamente justificadas, “EL PATRÓN” podrá asignar temporalmente a “EL EMPLEADO” a otro lugar de trabajo, notificándolo con al menos 5 días hábiles de anticipación y sin que dicho cambio implique una modificación sustancial de las condiciones de trabajo conforme al artículo 51, fracción VI de la LFT. “EL EMPLEADO” manifiesta su conformidad con lo anterior.')]),

    clausulaTitulo('TERCERA. — SALARIO.'),
    cuerpo([r('“EL PATRÓN” pagará a “EL EMPLEADO” un salario diario integrado de '), cf(salarioNum, '$____________'), r(' ('), cf('', 'CANTIDAD CON LETRA'), r(' M.N.), el cual es igual o superior al salario mínimo general vigente establecido por la Comisión Nacional de Salarios Mínimos. El pago se realizará de forma '), cf(pago, 'SEMANAL / QUINCENAL / MENSUAL'), r('.')]),
    cuerpo([r('Con el expreso consentimiento de “EL EMPLEADO”, “EL PATRÓN” podrá realizar el pago mediante depósito en cuenta bancaria, sirviendo el comprobante de depósito como constancia de pago. “EL PATRÓN” emitirá los Comprobantes Fiscales Digitales por Internet (CFDI) de nómina debidamente requisitados.')]),
    cuerpo([r('“EL PATRÓN” está autorizado para retener de los salarios únicamente los conceptos permitidos por el artículo 110 de la LFT, así como las retenciones fiscales, cuotas de seguridad social y, en su caso, descuentos por crédito INFONAVIT o FONACOT debidamente notificados.')]),

    clausulaTitulo('CUARTA. — JORNADA DE TRABAJO.'),
    cuerpo(jornadaClausula()),
    cuerpo([r('“EL PATRÓN” podrá ajustar los horarios y días laborables conforme a sus necesidades operativas, respetando los máximos legales y los días de descanso previstos en la LFT. Los ajustes que no impliquen modificación sustancial de condiciones de trabajo no requerirán nuevo consentimiento.')]),
    cuerpo([r('Cuando “EL PATRÓN” requiera tiempo extraordinario, lo hará del conocimiento de “EL EMPLEADO”. El tiempo extra efectivamente laborado será pagado conforme al artículo 67 de la LFT y podrá acreditarse por cualquier medio de prueba admitido en derecho, con el límite de 3 horas diarias y 3 veces por semana del artículo 66 LFT.')]),
    cuerpo([r('Las ausencias podrán justificarse con certificado de incapacidad del IMSS, permiso escrito concedido por “EL PATRÓN” o cualquier otra causa prevista en la Ley Federal del Trabajo.')]),

    clausulaTitulo('QUINTA. — DÍA DE DESCANSO SEMANAL.'),
    cuerpo([r('“LAS PARTES” convienen que el día de descanso semanal será el '), cf(descanso, 'DÍA DE LA SEMANA'), r('. Cuando las necesidades del servicio requieran que “EL EMPLEADO” labore en su día de descanso, “EL PATRÓN” lo notificará por escrito y cubrirá la prima dominical del 25% adicional sobre el salario ordinario, conforme al artículo 71 de la LFT.')]),

    clausulaTitulo('SEXTA. — AGUINALDO.'),
    cuerpo([r('“EL PATRÓN” pagará a “EL EMPLEADO” un aguinaldo de '), cf(aguinaldo, 'NÚMERO DE DÍAS, MÍNIMO 15'), r(' días de salario, antes del 20 de diciembre de cada año, conforme al artículo 87 de la LFT. Si “EL EMPLEADO” no presta servicios el año completo, recibirá la parte proporcional correspondiente.')]),

    clausulaTitulo('SÉPTIMA. — VACACIONES Y PRIMA VACACIONAL.'),
    cuerpo([r('“EL EMPLEADO” disfrutará de vacaciones conforme al artículo 76 de la LFT, según la siguiente tabla (reforma vigente desde 2023):')]),
    tablaVac(),
    cuerpo([r('Las vacaciones se disfrutarán en la fecha que se determine de común acuerdo con “EL PATRÓN”. “EL EMPLEADO” percibirá una prima vacacional del '), cf(prima, '% MÍNIMO 25'), r('% sobre los salarios correspondientes al periodo vacacional, conforme al artículo 80 LFT. “EL EMPLEADO” se obliga a firmar las constancias correspondientes.')]),

    clausulaTitulo('OCTAVA. — DÍAS DE DESCANSO OBLIGATORIO.'),
    cuerpo([r('Serán días de descanso obligatorio los señalados en el artículo 74 de la LFT. Cuando las necesidades del servicio requieran que “EL EMPLEADO” labore alguno de esos días, “EL PATRÓN” lo notificará por escrito y pagará el triple del salario ordinario conforme al artículo 73 LFT.')]),

    clausulaTitulo('NOVENA. — PRESTACIONES.'),
    cuerpo([r('“EL EMPLEADO” tendrá derecho a las prestaciones descritas en el Anexo “B” del presente contrato, las cuales son iguales o superiores a las establecidas en la LFT. “EL PATRÓN” cumplirá con todas las obligaciones de seguridad social, incluyendo la inscripción de “EL EMPLEADO” ante el IMSS el mismo día de inicio de la relación laboral, así como el entero de las cuotas ante el INFONAVIT y el SAR.')]),

    clausulaTitulo('DÉCIMA. — INSTRUMENTOS DE TRABAJO.'),
    cuerpo([r('“EL EMPLEADO” reconoce que todos los materiales, equipo de cómputo, documentos, formatos, mobiliario y demás bienes que “EL PATRÓN” le proporcione con motivo de la relación de trabajo son propiedad exclusiva de “EL PATRÓN”. Se obliga a conservarlos en buen estado, a utilizarlos exclusivamente para las actividades propias del contrato y a devolverlos al término de la relación laboral o cuando se le requiera.')]),
    cuerpo([r('El correo electrónico corporativo que, en su caso, se le asigne a “EL EMPLEADO” es una herramienta de trabajo de propiedad de “EL PATRÓN”. Podrá ser monitoreado con la finalidad exclusiva de verificar que se le dé un uso laboral adecuado, sin que ello implique la revisión de comunicaciones de carácter personal, sindical o protegidas por el derecho a la intimidad (artículo 16 CPEUM).')]),

    clausulaTitulo('DÉCIMA PRIMERA. — CONFIDENCIALIDAD.'),
    cuerpo([r('“EL EMPLEADO” se obliga a guardar absoluta confidencialidad respecto de toda la información a la que tenga acceso con motivo de sus funciones, incluyendo datos de clientes, estrategias comerciales, procesos, secretos industriales y cualquier información que represente una ventaja competitiva para “EL PATRÓN”, ya sea que dicha información le sea proporcionada de forma verbal, escrita, impresa o electrónica.')]),
    cuerpo([r('La violación de esta cláusula constituirá causa de rescisión sin responsabilidad para “EL PATRÓN” conforme al artículo 47 de la LFT, sin perjuicio de las acciones civiles, mercantiles y penales aplicables conforme al Código Penal Federal y la Ley Federal de Protección al Secreto Industrial.')]),
    cuerpo([r('La obligación de confidencialidad permanecerá vigente durante 5 años posteriores a la terminación de la relación laboral, únicamente respecto de información que conserve su carácter confidencial.')]),

    clausulaTitulo('DÉCIMA SEGUNDA. — PROPIEDAD INTELECTUAL.'),
    cuerpo([r('En el supuesto de que las funciones de “EL EMPLEADO” impliquen la creación de obras, invenciones, programas de cómputo, diseños o cualquier otro resultado intelectual protegible, “LAS PARTES” acuerdan que los derechos patrimoniales y de explotación sobre dichas creaciones corresponderán a “EL PATRÓN”, conforme a los artículos 84 de la Ley Federal del Derecho de Autor y 163 y 164 de la LFT. Esta cláusula aplicará únicamente respecto de creaciones directamente vinculadas con las funciones del puesto descrito en el Anexo “A”.')]),
    cuerpo([r('“EL EMPLEADO” se obliga a: (i) entregar a “EL PATRÓN”, en soporte material, los repositorios, documentación y respaldos de las creaciones generadas; (ii) no instalar en el equipo proporcionado por “EL PATRÓN” programas, aplicaciones o bases de datos no autorizados; y (iii) mantener a “EL PATRÓN” a salvo de cualquier reclamación por uso de derechos de terceros sin autorización.')]),

    clausulaTitulo('DÉCIMA TERCERA. — OBLIGACIONES DE “EL EMPLEADO”.'),
    cuerpo([r('Serán obligaciones de “EL EMPLEADO”, además de las previstas en el artículo 134 de la LFT, las siguientes:')]),
    bullet([r('Prestar el servicio de forma personal, con la más absoluta puntualidad y regularidad.')]),
    bullet([r('Someterse a exámenes médicos cada vez que “EL PATRÓN” lo requiera, conforme a la normativa sanitaria aplicable.')]),
    bullet([r('Tomar los cursos de capacitación y adiestramiento que se impartan en el horario y lugar que “EL PATRÓN” designe.')]),
    bullet([r('Observar todas las disposiciones de seguridad e higiene en el trabajo, así como las normas del Reglamento Interior de Trabajo y el Código de Ética, de los cuales declara tener pleno conocimiento y que se tienen por reproducidos como parte del presente contrato.')]),
    bullet([r('Informar a “EL PATRÓN” de cualquier problema, interferencia o sugerencia relacionada con el desempeño óptimo de su trabajo.')]),
    bullet([r('Responder por los daños causados a bienes propiedad de “EL PATRÓN” asignados a su cargo cuando medie dolo o negligencia grave, conforme al artículo 47, fracción IX de la LFT y la legislación civil aplicable.')]),
    bullet([r('Atender con respeto y buenos modales al personal, clientes y proveedores de “EL PATRÓN”.')]),
    bullet([r('No alterar la disciplina dentro de las instalaciones de la empresa ni incurrir en conductas discriminatorias, de acoso u hostigamiento laboral conforme a la NOM-035-STPS-2018.')]),
    bullet([r('En caso de tener asignado un vehículo de la empresa, responder de los daños y perjuicios que cause por accidente derivado de conducir sin licencia vigente, en estado de ebriedad o bajo el influjo de sustancias controladas.')]),

    clausulaTitulo('DÉCIMA CUARTA. — SEGURIDAD SOCIAL, CAPACITACIÓN Y ADIESTRAMIENTO.'),
    cuerpo([r('Para todo lo relativo a riesgos de trabajo, enfermedades y accidentes no profesionales, se estará a lo dispuesto por la Ley del Seguro Social y sus Reglamentos. “EL PATRÓN” inscribirá a “EL EMPLEADO” ante el IMSS el mismo día de inicio de la relación laboral.')]),
    cuerpo([r('“EL PATRÓN” proporcionará capacitación y adiestramiento conforme a los planes y programas establecidos y a las disposiciones de los artículos 153-A al 153-X de la LFT.')]),

    clausulaTitulo('DÉCIMA QUINTA. — CAUSAS DE RESCISIÓN SIN RESPONSABILIDAD PARA “EL PATRÓN”.'),
    cuerpo([r('El presente contrato podrá rescindirse sin responsabilidad para “EL PATRÓN” conforme a las causales establecidas en el artículo 47 de la LFT, cumpliendo con el procedimiento de aviso escrito previsto en dicho precepto.')]),

    clausulaTitulo('DÉCIMA SEXTA. — SUPLETORIEDAD.'),
    cuerpo([r('En lo no previsto por el presente contrato se estará a lo establecido por la Ley Federal del Trabajo, la Ley del Seguro Social, sus reglamentos y demás leyes aplicables.')]),

    clausulaTitulo('DÉCIMA SÉPTIMA. — DESIGNACIÓN DE BENEFICIARIOS.'),
    cuerpo([r('De conformidad con el artículo 501 de la LFT, “EL EMPLEADO” designa como beneficiarios para recibir las prestaciones e indemnizaciones en caso de muerte o desaparición derivada de un acto delictivo, a las siguientes personas:')]),
    tablaBenef(),
    cuerpo([r('El porcentaje total debe sumar el 100%. En caso de no designar beneficiarios o de que éstos hayan fallecido, se aplicará el orden de preferencia del artículo 501 LFT.')]),

    clausulaTitulo('DÉCIMA OCTAVA. — BUENA FE Y JURISDICCIÓN.'),
    cuerpo([r('Ambas partes declaran que el presente contrato se celebra de buena fe, con plena libertad de voluntades, sin presión ni dolo.')]),
    cuerpo([r('En caso de controversia, las partes procurarán la conciliación como primera vía de solución. De no ser posible, convienen en que los tribunales competentes en materia laboral serán, a elección de “EL EMPLEADO”, el lugar donde prestó el servicio o el domicilio de “EL PATRÓN”, conforme al artículo 700 de la LFT.')]),

    cuerpo([r('Leído que fue por las partes el presente contrato, lo suscriben en '), cf(D2.patronCiudad || '', 'CIUDAD'), r(', a '), cf(diaTxt, 'DÍA'), r(' de '), cf(mesTxt, 'MES'), r(' de '), cf(anioTxt, 'AÑO'), r(', recibiendo cada una copia del mismo incluyendo todos sus anexos.')]),
    new Paragraph({ children: [r('')], spacing: { before: 200, after: 0 } }),
    bloqueFirmas(empleadoRun(), patronRun()),

    // ── ANEXO A ──
    anexoTit('ANEXO A — DESCRIPCIÓN DEL PUESTO'),
    cuerpo([r('El presente Anexo es parte integrante del Contrato Individual de Trabajo por Tiempo Indeterminado. Describe las funciones y actividades que realizará “EL EMPLEADO” conforme a lo convenido por “LAS PARTES”.')]),
    decl([r('Ciudad: ', true), cf(D2.patronCiudad || '', 'CIUDAD'), r('     Fecha de ingreso: ', true), cf(fechaDMA(ingreso), 'DD/MM/AAAA')]),
    decl([r('Puesto: ', true), cf(D2.condPuesto || '', 'DENOMINACIÓN DEL PUESTO')]),
    decl([r('Área / Departamento: ', true), cf(D2.condArea || '', 'ÁREA O DEPARTAMENTO')]),
    decl([r('Jefe inmediato: ', true), cf(D2.condJefe || '', 'NOMBRE Y PUESTO DEL JEFE INMEDIATO')]),
    new Paragraph({ children: [r('')], spacing: { after: 60 } }),
    tablaActividades(),
    decl([r('Equipo / herramienta asignada: ', true), cf('', "DESCRIPCIÓN O 'Ninguno'")]),
    new Paragraph({ children: [r('')], spacing: { before: 300, after: 0 } }),
    bloqueFirmas(empleadoRun(), patronRun()),

    // ── ANEXO B ──
    anexoTit('ANEXO B — PRESTACIONES'),
    cuerpo([r('El presente Anexo es parte integrante del Contrato Individual de Trabajo por Tiempo Indeterminado. Establece las prestaciones a que tiene derecho “EL EMPLEADO”, las cuales son iguales o superiores a las establecidas en la LFT.')]),
    clausulaTitulo('AGUINALDO.'),
    cuerpo([r('“EL PATRÓN” pagará un aguinaldo de '), cf(aguinaldo, 'NÚMERO DE DÍAS, MÍNIMO 15'), r(' días de salario antes del 20 de diciembre de cada año, conforme al artículo 87 LFT, o su parte proporcional si no se presta servicio el año completo.')]),
    clausulaTitulo('VACACIONES.'),
    cuerpo([r('“EL EMPLEADO” disfrutará de vacaciones conforme a la siguiente tabla (mínimos reforma 2023):')]),
    tablaVac(),
    clausulaTitulo('PRIMA VACACIONAL.'),
    cuerpo([r('“EL EMPLEADO” percibirá una prima vacacional del '), cf(prima, '% MÍNIMO 25'), r('% sobre los salarios del periodo vacacional, conforme al artículo 80 LFT.')]),
    clausulaTitulo('DESCANSOS OBLIGATORIOS.'),
    cuerpo([r('Serán días de descanso obligatorio los señalados en el artículo 74 LFT.')]),
    clausulaTitulo('OTRAS PRESTACIONES.'),
    cuerpo([cf('', "DESCRIPCIÓN DE PRESTACIONES ADICIONALES O BIEN INDICAR: 'No existen prestaciones adicionales a las de Ley.'")]),
    decl([r('Ciudad: ', true), cf(D2.patronCiudad || '', 'CIUDAD'), r('     Fecha: ', true), cf(fechaDMA(ingreso), 'DD/MM/AAAA')]),
    new Paragraph({ children: [r('')], spacing: { before: 300, after: 0 } }),
    bloqueFirmas(empleadoRun(), patronRun()),

    // ── ANEXO C ──
    anexoTit('ANEXO C — INSTRUCTIVO DE LLENADO'),
    cuerpo([r('Para el correcto uso del presente formato, el área de Recursos Humanos deberá observar lo siguiente:')]),
    bullet([r('Sustituir todos los campos en color azul con los datos reales del patrón y del empleado antes de imprimir.')]),
    bullet([r('Verificar que el salario diario sea igual o superior al mínimo general vigente (consultar www.gob.mx/conasami).')]),
    bullet([r('El contrato debe ser firmado por el empleado al calce de cada hoja.')]),
    bullet([r('El empleado debe firmar los Anexos A, B y C por separado.')]),
    bullet([r('Ambas partes reciben copia firmada del contrato completo con todos sus anexos.')]),
    bullet([r('Conservar el original firmado en el expediente laboral del empleado.')]),
    bullet([r('Inscribir al empleado ante el IMSS el mismo día de inicio de la relación laboral.')]),
    bullet([r('En la Cláusula Séptima (vacaciones), completar la columna de días otorgados por la empresa — no pueden ser inferiores al mínimo legal.')]),
    bullet([r('La designación de beneficiarios (Cláusula Décima Séptima) debe completarse al momento de la firma; verificar que los porcentajes sumen el 100%.')]),
    bullet([r('En caso de asignar vehículo o equipo de cómputo, complementar con las Cartas Responsivas correspondientes.')]),
    bullet([r('Este contrato no debe mezclarse ni archivarse junto con contratos de prestación de servicios independientes del mismo trabajador.')]),
    new Paragraph({ children: [r('')], spacing: { before: 300, after: 0 } }),
    bloqueFirmas(empleadoRun(), patronRun()),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1418, right: 1418, bottom: 1418, left: 1418 } } }, children }],
  });
  return Packer.toBuffer(doc);
}
