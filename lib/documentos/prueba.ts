// Contrato Individual de Trabajo — Modalidad Periodo de Prueba (30 días, Art. 39-A LFT).
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType,
} from 'docx';
import { r, cuerpo, clausulaTitulo } from './helpers';

const BLUE = '2563EB';
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export function generarPrueba(D: any): Promise<Buffer> {
  const D2: any = D;
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
  const subA = (t: string) => new Paragraph({ children: [r(t, true, 20)], spacing: { before: 120, after: 60 } });

  const fechaDMA = (iso: string) => { if (!iso) return ''; const dt = new Date(iso + 'T00:00:00'); return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`; };
  const ingreso = D2.condInicio || '';
  const dias = Number(D2.duracion || 30);
  const fi = ingreso ? new Date(ingreso + 'T00:00:00') : null;
  const diaTxt = fi ? String(fi.getDate()).padStart(2,'0') : '';
  const mesTxt = fi ? MESES[fi.getMonth()] : '';
  const anioTxt = fi ? String(fi.getFullYear()) : '';
  // Término = inicio + duración (días naturales)
  const ft = fi ? new Date(fi.getTime() + dias * 24 * 60 * 60 * 1000) : null;
  const terminoTxt = ft ? `${String(ft.getDate()).padStart(2,'0')}/${String(ft.getMonth()+1).padStart(2,'0')}/${ft.getFullYear()}` : '';

  const salarioNum = D2.condSalario ? `$${Number(D2.condSalario).toFixed(2)}` : '';
  const pago = D2.jornadaPago === 'quincenalmente' ? 'QUINCENALMENTE' : D2.jornadaPago === 'semanalmente' ? 'SEMANALMENTE' : (D2.jornadaPago || '');
  const personaTipo = D2.patronTipo === 'fisica' ? 'física' : 'moral';
  const descanso = D2.jornadaDescanso || '';
  const actividades: string[] = (D2.condActividades || '').split('\n').map((s: string) => s.trim()).filter(Boolean);

  const jornadaClausula = () => {
    const entrada = D2.jornadaEntrada || ''; const salida = D2.jornadaSalida || '';
    const continua = D2.jornadaContinua === 'continua';
    const dur = Number(D2.jornadaDuracionComida || 60);
    const efectivas = typeof D2.horasEfectivas === 'number' ? D2.horasEfectivas : 8;
    const efTxt = Number.isInteger(efectivas) ? String(efectivas) : efectivas.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
    const durTxt = dur === 60 ? 'una hora' : dur === 30 ? 'media hora' : dur === 90 ? 'una hora y media' : dur === 120 ? 'dos horas' : `${dur} minutos`;
    if (continua) {
      return [
        r('La jornada será la '), cf(D2.jornadaTipo || '', 'DIURNA / NOCTURNA / MIXTA'),
        r(', con horario de '), cf(entrada, 'HORA DE ENTRADA'), r(' a '), cf(salida, 'HORA DE SALIDA'),
        r(` horas. Dentro de dicha jornada continua “EL TRABAJADOR” gozará de un descanso de ${durTxt} para tomar sus alimentos conforme al artículo 63 de la LFT; al permanecer en el centro de trabajo durante ese lapso, el mismo se computa como tiempo efectivo en términos del artículo 64 de la propia Ley, resultando una jornada efectiva de ${efTxt} horas diarias.`),
      ];
    }
    return [
      r('La jornada será la '), cf(D2.jornadaTipo || '', 'DIURNA / NOCTURNA / MIXTA'),
      r(', con horario de '), cf(entrada, 'HORA DE ENTRADA'), r(' a '), cf(salida, 'HORA DE SALIDA'),
      r(`, con un lapso de ${durTxt} destinado a que “EL TRABAJADOR” tome sus alimentos fuera del centro de trabajo y fuera de la subordinación de “EL PATRÓN”, durante el cual podrá disponer libremente de su tiempo, por lo que no se computa como tiempo efectivo de la jornada conforme a la interpretación a contrario sensu del artículo 64 de la LFT, resultando una jornada efectiva de ${efTxt} horas diarias, dentro del máximo previsto por el artículo 61 de la propia Ley. Si “EL TRABAJADOR” no pudiera salir del centro de trabajo durante dicho lapso, el tiempo correspondiente se computará como efectivo conforme al citado artículo 64.`),
    ];
  };

  const b = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
  const bords = { top: b, bottom: b, left: b, right: b };
  const tcell = (children: any[], w: number, fill?: string) => new TableCell({ borders: bords, width: { size: w, type: WidthType.DXA }, shading: fill ? { fill, type: ShadingType.CLEAR } : undefined, margins: { top: 50, bottom: 50, left: 90, right: 90 }, children });
  const cC = (run: TextRun) => new Paragraph({ children: [run], alignment: AlignmentType.CENTER });
  const cL = (run: TextRun) => new Paragraph({ children: [run], alignment: AlignmentType.LEFT });

  const tablaActividades = () => {
    const filas = actividades.length ? actividades : [''];
    return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [700, 5860, 2800], rows: [
      new TableRow({ tableHeader: true, children: [
        tcell([cC(r('N°', true))], 700, 'D6DCE4'),
        tcell([cC(r('Descripción de actividades y responsabilidades', true))], 5860, 'D6DCE4'),
        tcell([cC(r('Frecuencia (diaria/semanal/eventual)', true))], 2800, 'D6DCE4'),
      ]}),
      ...filas.map((act, i) => new TableRow({ children: [
        tcell([cC(r(`${i + 1}.`))], 700),
        tcell([new Paragraph({ children: [act ? r(act) : cf('', '___')], alignment: AlignmentType.BOTH })], 5860),
        tcell([cC(cf('', '___'))], 2800),
      ]})),
    ]});
  };

  const tablaCriterios = () => {
    const filas: [string, string][] = [
      ['Conocimientos técnicos del puesto', '25%'],
      ['Calidad del trabajo', '25%'],
      ['Productividad y cumplimiento de objetivos', '20%'],
      ['Conducta, disciplina y puntualidad', '15%'],
      ['Adaptación al entorno laboral', '15%'],
    ];
    return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3600, 1600, 4160], rows: [
      new TableRow({ tableHeader: true, children: [
        tcell([cC(r('Criterio de evaluación', true))], 3600, 'D6DCE4'),
        tcell([cC(r('Ponderación', true))], 1600, 'D6DCE4'),
        tcell([cC(r('Descripción del resultado esperado', true))], 4160, 'D6DCE4'),
      ]}),
      ...filas.map(([c, p]) => new TableRow({ children: [
        tcell([cL(r(c))], 3600), tcell([cC(r(p))], 1600), tcell([cC(cf('', '___'))], 4160),
      ]})),
      new TableRow({ children: [
        tcell([cC(r('TOTAL', true))], 3600, 'F2F4F7'), tcell([cC(r('100%', true))], 1600, 'F2F4F7'), tcell([cC(r(''))], 4160, 'F2F4F7'),
      ]}),
    ]});
  };

  const tablaBenef = () => {
    const bs = Array.isArray(D2.beneficiarios) ? D2.beneficiarios : [];
    return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4360, 2800, 2200], rows: [
      new TableRow({ tableHeader: true, children: [
        tcell([cC(r('Nombre completo del beneficiario', true))], 4360, 'D6DCE4'),
        tcell([cC(r('Parentesco', true))], 2800, 'D6DCE4'),
        tcell([cC(r('% de participación', true))], 2200, 'D6DCE4'),
      ]}),
      ...[0,1,2].map(i => { const x = bs[i] || {}; return new TableRow({ children: [
        tcell([cC(cf(x.nombre || '', 'Nombre'))], 4360),
        tcell([cC(cf(x.parentesco || '', 'Parentesco'))], 2800),
        tcell([cC(cf(x.pct ? `${x.pct}%` : '', '___%'))], 2200),
      ]}); }),
    ]});
  };

  const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const firma = (nombreRun: TextRun, label: string) => new TableCell({
    borders: { top: nb, bottom: nb, left: nb, right: nb }, width: { size: 4680, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 60, right: 60 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 6 }, children: [r('______________________________')] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [nombreRun] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [r(label, true)] }),
    ],
  });
  const bloqueFirmas = () => new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
    rows: [new TableRow({ children: [firma(cf(D2.trabNombre || '', 'NOMBRE COMPLETO DEL TRABAJADOR'), 'EL TRABAJADOR'), firma(cf(D2.patronRepresentante || D2.patronNombre || '', 'NOMBRE DEL REPRESENTANTE / PATRÓN'), 'EL PATRÓN')] })] });

  const children: any[] = [
    tit('CONTRATO INDIVIDUAL DE TRABAJO'),
    sub(`MODALIDAD PERIODO DE PRUEBA (${dias} DÍAS)`),
    new Paragraph({ children: [r('Artículo 39-A de la Ley Federal del Trabajo')], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),

    seccion('D E C L A R A C I O N E S'),
    clausulaTitulo('I. DECLARACIONES DE “EL PATRÓN”:'),
    decl([r('Nombre / Razón social: ', true), cf(D2.patronNombre || '', 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN')]),
    decl([r('RFC: ', true), cf(D2.patronRFC || '', 'RFC DEL PATRÓN')]),
    decl([r('Registro Patronal IMSS: ', true), cf(D2.patronRegIMSS || '', 'NÚMERO DE REGISTRO PATRONAL')]),
    decl([r('Domicilio: ', true), cf(D2.patronDomicilio || '', 'DOMICILIO COMPLETO, COLONIA, C.P., ALCALDÍA/MUNICIPIO, CIUDAD')]),
    inciso([r(`a) Que es una persona ${personaTipo} con capacidad legal para celebrar este contrato, debidamente inscrita ante el Instituto Mexicano del Seguro Social y en el Registro Federal de Contribuyentes en los datos señalados.`)]),
    inciso([r('b) Que requiere verificar que “EL TRABAJADOR” cumple con los requisitos, conocimientos y aptitudes necesarios para el desempeño del puesto descrito en la Cláusula Primera, mediante el periodo de prueba previsto en el artículo 39-A de la Ley Federal del Trabajo.')]),

    clausulaTitulo('II. DECLARACIONES DE “EL TRABAJADOR”:'),
    decl([r('Nombre completo: ', true), cf(D2.trabNombre || '', 'NOMBRE COMPLETO DEL TRABAJADOR')]),
    decl([r('Sexo: ', true), cf(D2.trabSexo || '', 'MASCULINO / FEMENINO'), r('     Fecha de nacimiento: ', true), cf(fechaDMA(D2.trabNacimiento), 'DD/MM/AAAA')]),
    decl([r('Nacionalidad: ', true), cf(D2.trabNacionalidad || '', 'NACIONALIDAD')]),
    decl([r('RFC: ', true), cf(D2.trabRFC || '', 'RFC'), r('     CURP: ', true), cf(D2.trabCURP || '', 'CURP')]),
    decl([r('NSS (IMSS): ', true), cf(D2.trabNSS || '', 'NÚMERO DE SEGURIDAD SOCIAL')]),
    decl([r('Domicilio: ', true), cf(D2.trabDomicilio || '', 'DOMICILIO COMPLETO, COLONIA, C.P., CIUDAD Y ESTADO')]),
    inciso([r('a) Que no tiene impedimento legal alguno para celebrar el presente contrato, que cuenta con los conocimientos, habilidades y experiencia necesarios para el puesto referido en la Cláusula Primera, y que los datos, certificados y referencias proporcionadas a “EL PATRÓN” son veraces.')]),
    inciso([r('b) Que tiene pleno conocimiento de las características del puesto detalladas en el Anexo “A”, y acepta someterse al periodo de prueba para demostrar que cumple con los requisitos y aptitudes requeridos.')]),

    clausulaTitulo('III. DECLARAN “LAS PARTES”:'),
    cuerpo([r('Que estando de acuerdo con las declaraciones anteriores, proceden a celebrar el presente contrato bajo las siguientes:')]),

    seccion('C L Á U S U L A S'),

    clausulaTitulo('PRIMERA. — OBJETO Y MODALIDAD.'),
    cuerpo([r('“EL PATRÓN” contrata a “EL TRABAJADOR” bajo la modalidad de '), r('Periodo de Prueba', true), r(', al amparo del artículo 39-A de la Ley Federal del Trabajo, con la finalidad única de verificar que “EL TRABAJADOR” cumple con los requisitos, conocimientos y aptitudes necesarios para el desempeño del puesto de '), cf(D2.condPuesto || '', 'DENOMINACIÓN DEL PUESTO'), r(', cuyas funciones y actividades específicas se detallan en el Anexo “A” del presente instrumento.')]),
    cuerpo([r('Las partes reconocen expresamente que la finalidad del periodo de prueba es la verificación de aptitudes ya existentes en “EL TRABAJADOR”, y que esta modalidad es distinta e independiente al periodo de capacitación inicial previsto en el artículo 39-B de la LFT. Conforme al artículo 39-C de la LFT, ambas modalidades no podrán aplicarse de manera simultánea, ni podrá celebrarse más de un contrato de periodo de prueba con el mismo trabajador para el mismo puesto.')]),
    cuerpo([r('Las actividades descritas en el Anexo “A” son enunciativas y no limitativas; “EL TRABAJADOR” deberá prestar cualquier otro servicio inherente al cargo que sea razonablemente compatible con el mismo.')]),

    clausulaTitulo('SEGUNDA. — DURACIÓN Y TERMINACIÓN.'),
    cuerpo([r('El presente contrato tendrá una duración de '), r(`${dias} días naturales`, true), r(', contados a partir del día '), cf(diaTxt, 'DD'), r(' de '), cf(mesTxt, 'MES'), r(' de '), cf(anioTxt, 'AÑO'), r(', y concluirá el día '), cf(terminoTxt, 'FECHA DE TÉRMINO DD/MM/AAAA'), r('. Este plazo es improrrogable bajo esta misma modalidad.')]),
    ...(dias > 30 ? [cuerpo([r('“LAS PARTES” reconocen que el presente periodo de prueba excede de 30 días por tratarse de un puesto de dirección, gerencial, o para desempeñar labores técnicas o profesionales especializadas, supuesto en el cual el segundo párrafo del artículo 39-A de la LFT permite un periodo de prueba de hasta 180 días.')])] : []),
    cuerpo([r('Al concluir el periodo de prueba, “EL PATRÓN” podrá dar por terminada la relación laboral o comunicar su decisión de continuar con la misma bajo contrato por tiempo indeterminado. Para que la terminación sea válida y sin responsabilidad para “EL PATRÓN”, deberá notificarse a “EL TRABAJADOR” por escrito con al menos '), r('3 días hábiles de anticipación', true), r(' al vencimiento, fundando la decisión en el resultado de la evaluación referida en la Cláusula Tercera.')]),
    cuerpo([r('Si al vencimiento del plazo “EL PATRÓN” no notifica su decisión y “EL TRABAJADOR” continúa laborando, el contrato se convertirá automáticamente en uno por tiempo indeterminado desde el primer día, conforme al artículo 39-C de la LFT.')]),

    clausulaTitulo('TERCERA. — EVALUACIÓN DE APTITUDES.'),
    cuerpo([r('“EL PATRÓN”, a través del jefe inmediato de “EL TRABAJADOR” y/o del área de Recursos Humanos, podrá realizar durante el periodo de prueba las evaluaciones que considere pertinentes para verificar que “EL TRABAJADOR” cumple con los requisitos, conocimientos y aptitudes necesarios para el desempeño del puesto descrito en el Anexo “A”.')]),
    cuerpo([r('Al concluir el periodo, “EL PATRÓN” comunicará por escrito a “EL TRABAJADOR” su decisión de continuar o dar por terminada la relación laboral, pudiendo fundarse dicha decisión en los resultados de las evaluaciones practicadas, en la observación directa del desempeño o en cualquier otro elemento objetivo que “EL PATRÓN” estime relevante.')]),
    cuerpo([r('Si durante el periodo de prueba se detecta que los certificados, referencias o datos proporcionados por “EL TRABAJADOR” son falsos o engañosos, “EL PATRÓN” podrá rescindir el contrato sin responsabilidad conforme al artículo 47, fracción I de la LFT, independientemente del tiempo transcurrido.')]),

    clausulaTitulo('CUARTA. — LUGAR DE PRESTACIÓN DE SERVICIOS.'),
    cuerpo([r('El lugar de prestación de servicios será el domicilio de “EL PATRÓN” señalado en las declaraciones. Por necesidades operativas, “EL PATRÓN” podrá asignar temporalmente a “EL TRABAJADOR” a otro domicilio, notificándolo con al menos 5 días hábiles de anticipación y sin que ello implique modificación sustancial de las condiciones de trabajo.')]),

    clausulaTitulo('QUINTA. — SALARIO.'),
    cuerpo([r('“EL PATRÓN” pagará a “EL TRABAJADOR” un salario diario integrado de '), cf(salarioNum, '$____________'), r(' ('), cf('', 'CANTIDAD CON LETRA'), r(' M.N.), el cual es igual o superior al salario mínimo general vigente. El pago se realizará '), cf(pago, 'SEMANALMENTE / QUINCENALMENTE'), r('.')]),
    cuerpo([r('Con consentimiento de “EL TRABAJADOR”, “EL PATRÓN” podrá pagar mediante depósito bancario. “EL PATRÓN” emitirá los CFDI de nómina correspondientes y solo realizará descuentos autorizados por el artículo 110 de la LFT, retenciones fiscales y cuotas de seguridad social.')]),

    clausulaTitulo('SEXTA. — JORNADA DE TRABAJO.'),
    cuerpo(jornadaClausula()),
    cuerpo([r('Cuando “EL PATRÓN” requiera tiempo extraordinario, lo notificará a “EL TRABAJADOR”. El tiempo extra efectivamente laborado será pagado conforme al artículo 67 LFT y podrá acreditarse por cualquier medio de prueba admitido en derecho, con el límite del artículo 66 LFT.')]),
    cuerpo([r('Las ausencias podrán justificarse con certificado de incapacidad del IMSS, permiso escrito de “EL PATRÓN” o cualquier otra causa prevista en la LFT.')]),

    clausulaTitulo('SÉPTIMA. — DÍA DE DESCANSO SEMANAL.'),
    cuerpo([r('El día de descanso semanal será el '), cf(descanso, 'DÍA DE LA SEMANA'), r('. Si las necesidades del servicio requieren laborarlo, “EL PATRÓN” lo notificará por escrito y cubrirá la prima dominical del 25% adicional conforme al artículo 71 LFT.')]),

    clausulaTitulo('OCTAVA. — PRESTACIONES.'),
    cuerpo([r('“EL TRABAJADOR” tendrá derecho a las prestaciones descritas en el Anexo “B”, las cuales son iguales o superiores a las establecidas en la LFT. “EL PATRÓN” inscribirá a “EL TRABAJADOR” ante el IMSS el mismo día de inicio de la relación laboral y enterará las cuotas correspondientes ante el INFONAVIT y el SAR durante toda la vigencia del contrato.')]),

    clausulaTitulo('NOVENA. — SEGURIDAD SOCIAL Y CAPACITACIÓN.'),
    cuerpo([r('Para todo lo relativo a riesgos de trabajo, enfermedades y accidentes no profesionales se estará a lo dispuesto por la Ley del Seguro Social. “EL PATRÓN” proporcionará a “EL TRABAJADOR” la orientación e instrucción necesarias para el correcto desempeño de sus funciones durante el periodo de prueba.')]),

    clausulaTitulo('DÉCIMA. — OBLIGACIONES DE “EL TRABAJADOR”.'),
    cuerpo([r('Serán obligaciones de “EL TRABAJADOR”, además de las previstas en el artículo 134 de la LFT, las siguientes:')]),
    bullet([r('Prestar el servicio de forma personal, con puntualidad y regularidad desde el primer día del periodo de prueba.')]),
    bullet([r('Demostrar activamente los conocimientos, aptitudes y habilidades requeridos para el puesto durante todo el periodo.')]),
    bullet([r('Someterse a los exámenes médicos que “EL PATRÓN” requiera conforme a la normativa sanitaria aplicable.')]),
    bullet([r('Observar las disposiciones de seguridad e higiene, el Reglamento Interior de Trabajo y el Código de Ética vigentes.')]),
    bullet([r('Informar de inmediato a su jefe inmediato de cualquier problema u obstaculización para el correcto desempeño de sus funciones.')]),
    bullet([r('No alterar la disciplina en las instalaciones ni incurrir en conductas discriminatorias, de acoso u hostigamiento conforme a la NOM-035-STPS-2018.')]),
    bullet([r('Atender con respeto y buenos modales al personal, clientes y proveedores de “EL PATRÓN”.')]),

    clausulaTitulo('DÉCIMA PRIMERA. — INSTRUMENTOS DE TRABAJO.'),
    cuerpo([r('“EL TRABAJADOR” reconoce que todos los materiales, equipos, documentos y demás bienes que “EL PATRÓN” le proporcione son propiedad exclusiva de “EL PATRÓN”. Se obliga a conservarlos en buen estado, utilizarlos solo para las actividades del contrato y devolverlos al término de la relación laboral o cuando se le requiera, conforme al artículo 134, fracción VI de la LFT.')]),

    clausulaTitulo('DÉCIMA SEGUNDA. — CONFIDENCIALIDAD.'),
    cuerpo([r('“EL TRABAJADOR” se obliga a guardar absoluta confidencialidad respecto de toda la información a la que tenga acceso con motivo de sus funciones, incluyendo datos de clientes, procesos, estrategias comerciales y demás información sensible de “EL PATRÓN”, ya sea que le sea proporcionada en forma verbal, escrita o electrónica. La violación de esta cláusula constituirá causa de rescisión sin responsabilidad para “EL PATRÓN” conforme al artículo 47 LFT.')]),
    cuerpo([r('La obligación de confidencialidad subsistirá durante '), cf('', '2 / 3'), r(' años posteriores a la terminación de la relación laboral, respecto de información que conserve su carácter confidencial.')]),

    clausulaTitulo('DÉCIMA TERCERA. — CAUSAS DE RESCISIÓN SIN RESPONSABILIDAD PARA “EL PATRÓN”.'),
    cuerpo([r('El presente contrato podrá rescindirse sin responsabilidad para “EL PATRÓN” conforme a las causales del artículo 47 de la LFT, cumpliendo el procedimiento de aviso escrito previsto en dicho precepto. Adicionalmente, “EL PATRÓN” podrá darlo por terminado al vencimiento del plazo conforme a la Cláusula Segunda, sin que ello genere responsabilidad a su cargo, siempre que se cumpla con el procedimiento de notificación establecido en dicha cláusula.')]),

    clausulaTitulo('DÉCIMA CUARTA. — DESIGNACIÓN DE BENEFICIARIOS.'),
    cuerpo([r('De conformidad con el artículo 501 de la LFT, “EL TRABAJADOR” designa como beneficiarios para recibir las prestaciones e indemnizaciones en caso de muerte o desaparición derivada de un acto delictivo, a las siguientes personas:')]),
    tablaBenef(),
    cuerpo([r('El porcentaje total debe sumar el 100%. En caso de no designar beneficiarios o de que éstos hayan fallecido, se aplicará el orden de preferencia del artículo 501 LFT.')]),

    clausulaTitulo('DÉCIMA QUINTA. — SUPLETORIEDAD.'),
    cuerpo([r('En lo no previsto por el presente contrato se estará a lo establecido por la Ley Federal del Trabajo, la Ley del Seguro Social, sus reglamentos y demás leyes aplicables.')]),

    clausulaTitulo('DÉCIMA SEXTA. — BUENA FE Y JURISDICCIÓN.'),
    cuerpo([r('Ambas partes declaran que el presente contrato se celebra de buena fe y con plena libertad de voluntades, sin presión ni dolo.')]),
    cuerpo([r('En caso de controversia, los tribunales competentes en materia laboral serán, a elección de “EL TRABAJADOR”, el lugar donde prestó el servicio o el domicilio de “EL PATRÓN”, conforme al artículo 700 de la LFT.')]),

    cuerpo([r('Leído que fue por las partes el presente contrato, lo suscriben en '), cf(D2.patronCiudad || '', 'CIUDAD'), r(', a '), cf(diaTxt, 'DÍA'), r(' de '), cf(mesTxt, 'MES'), r(' de '), cf(anioTxt, 'AÑO'), r(', recibiendo cada una copia del mismo incluyendo todos sus anexos.')]),
    new Paragraph({ children: [r('')], spacing: { before: 200 } }),
    bloqueFirmas(),

    // ── ANEXO A ──
    anexoTit('ANEXO A — DESCRIPCIÓN DEL PUESTO Y CRITERIOS DE EVALUACIÓN'),
    cuerpo([r('El presente Anexo es parte integrante del Contrato Individual de Trabajo por Periodo de Prueba. Establece las funciones del puesto y los criterios específicos de evaluación que se aplicarán durante el periodo de prueba conforme a la Cláusula Tercera.')]),
    decl([r('Ciudad: ', true), cf(D2.patronCiudad || '', 'CIUDAD'), r('     Fecha de ingreso: ', true), cf(fechaDMA(ingreso), 'DD/MM/AAAA'), r('     Fecha de término: ', true), cf(terminoTxt, 'DD/MM/AAAA')]),
    decl([r('Puesto: ', true), cf(D2.condPuesto || '', 'DENOMINACIÓN DEL PUESTO')]),
    decl([r('Área / Departamento: ', true), cf(D2.condArea || '', 'ÁREA O DEPARTAMENTO')]),
    decl([r('Evaluador / Jefe inmediato: ', true), cf(D2.condJefe || '', 'NOMBRE Y PUESTO DEL EVALUADOR')]),
    subA('ACTIVIDADES Y RESPONSABILIDADES DEL PUESTO:'),
    tablaActividades(),
    subA('CRITERIOS DE EVALUACIÓN Y PONDERACIÓN:'),
    tablaCriterios(),
    subA('RESULTADO MÍNIMO APROBATORIO:'),
    cuerpo([r('Para que “EL PATRÓN” decida continuar la relación laboral al término del periodo de prueba, “EL TRABAJADOR” deberá obtener una calificación global mínima de '), cf('', '70 / 75 / 80'), r(' puntos sobre 100, conforme a la ponderación anterior.')]),
    new Paragraph({ children: [r('')], spacing: { before: 240 } }),
    bloqueFirmas(),

    // ── ANEXO B ──
    anexoTit('ANEXO B — PRESTACIONES'),
    cuerpo([r('El presente Anexo es parte integrante del Contrato Individual de Trabajo por Periodo de Prueba. Establece las prestaciones a que tiene derecho “EL TRABAJADOR” durante la vigencia del contrato, las cuales son iguales o superiores a las establecidas en la LFT.')]),
    clausulaTitulo('AGUINALDO.'),
    cuerpo([r('“EL PATRÓN” pagará aguinaldo proporcional de '), cf(D2.condAguinaldo || '', 'MÍNIMO 15 DÍAS ANUALES'), r(' días anuales al término del periodo o al 20 de diciembre, conforme al artículo 87 LFT.')]),
    clausulaTitulo('VACACIONES.'),
    cuerpo([r('Dado que el periodo de prueba es de '+dias+' días, “EL TRABAJADOR” tendrá derecho a la parte proporcional de vacaciones que corresponda conforme al artículo 76 LFT, en caso de que la relación laboral concluya sin que se convierta en indefinida.')]),
    clausulaTitulo('PRIMA VACACIONAL.'),
    cuerpo([r('Prima vacacional del '), cf(D2.condPrima || '', '% MÍNIMO 25'), r('% sobre los salarios del periodo vacacional proporcional, conforme al artículo 80 LFT.')]),
    clausulaTitulo('DESCANSOS OBLIGATORIOS.'),
    cuerpo([r('Serán días de descanso obligatorio los señalados en el artículo 74 LFT.')]),
    clausulaTitulo('OTRAS PRESTACIONES.'),
    cuerpo([cf('', "DESCRIPCIÓN O BIEN INDICAR: 'No existen prestaciones adicionales a las de Ley.'")]),
    decl([r('Ciudad: ', true), cf(D2.patronCiudad || '', 'CIUDAD'), r('     Fecha: ', true), cf(fechaDMA(ingreso), 'DD/MM/AAAA')]),
    new Paragraph({ children: [r('')], spacing: { before: 240 } }),
    bloqueFirmas(),

    // ── ANEXO C ──
    anexoTit('ANEXO C — INSTRUCTIVO DE LLENADO'),
    cuerpo([r('Para el correcto uso del presente formato, el área de Recursos Humanos deberá observar lo siguiente:')]),
    bullet([r('Sustituir todos los campos en color azul con los datos reales del patrón y del trabajador antes de imprimir.')]),
    bullet([r('Verificar que el salario diario sea igual o superior al mínimo general vigente (consultar www.gob.mx/conasami).')]),
    bullet([r('Completar la fecha de término exacta del periodo de '+dias+' días en la Cláusula Segunda y en el encabezado del Anexo “A”.')]),
    bullet([r('Llenar la tabla de criterios de evaluación del Anexo “A” antes de la firma, incluyendo la descripción del resultado esperado por criterio.')]),
    bullet([r('Definir la calificación mínima aprobatoria en el Anexo “A”.')]),
    bullet([r('El contrato debe ser firmado por el trabajador al calce de cada hoja.')]),
    bullet([r('El trabajador debe firmar los Anexos A, B y C por separado.')]),
    bullet([r('Ambas partes reciben copia firmada del contrato completo con todos sus anexos.')]),
    bullet([r('Inscribir al trabajador ante el IMSS el mismo día de inicio de la relación laboral.')]),
    bullet([r('Con al menos 3 días hábiles de anticipación al vencimiento, el evaluador deberá emitir el resultado por escrito y notificar al trabajador la decisión de continuar o terminar la relación laboral.')]),
    bullet([r('Si al vencimiento no se notifica y el trabajador sigue laborando, el contrato se convierte automáticamente en indefinido. Registrar la fecha de notificación en el expediente.')]),
    bullet([r('Este contrato de periodo de prueba (art. 39-A) no puede celebrarse de forma simultánea con un contrato de capacitación inicial (art. 39-B) para el mismo trabajador y puesto, ni repetirse más de una vez.')]),
    bullet([r('Conservar el original firmado y el resultado de la evaluación en el expediente laboral del trabajador.')]),
    new Paragraph({ children: [r('')], spacing: { before: 240 } }),
    bloqueFirmas(),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1418, right: 1418, bottom: 1418, left: 1418 } } }, children }],
  });
  return Packer.toBuffer(doc);
}
