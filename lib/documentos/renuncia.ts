// Carta de Renuncia Voluntaria (Art. 53, Fracc. I LFT).
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
} from 'docx';

export function generarRenuncia(D: any): Promise<Buffer> {
  const BLUE = '2563EB';
  const ra = (text: string, bold = false, italic = false) =>
    new TextRun({ text, font: 'Arial', size: 22, bold, italics: italic, color: '000000' });
  const campo = (val: string, ph: string) =>
    val ? new TextRun({ text: val, font: 'Arial', size: 22, bold: true, color: '000000' })
        : new TextRun({ text: `«${ph}»`, font: 'Arial', size: 22, bold: true, color: BLUE });
  const pa = (children: TextRun[], opts: any = {}) =>
    new Paragraph({ children, alignment: (opts.align || 'both') as any, spacing: { before: opts.before ?? 0, after: opts.after ?? 132, line: 260 } });
  const center = (children: TextRun[], opts: any = {}) =>
    new Paragraph({ children, alignment: AlignmentType.CENTER, spacing: { before: opts.before ?? 30, after: opts.after ?? 30 } });

  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const razon = D.patronNombre || '';
  const titular = D.trabNombre || '';
  const puesto = D.puesto || '';
  const area = D.area || '';
  const ciudad = D.ciudad || '';
  const hora = D.hora || '';

  const fr = D.fechaRenuncia ? new Date(D.fechaRenuncia + 'T00:00:00') : null;
  const dd = fr ? String(fr.getDate()).padStart(2, '0') : '';
  const mesNom = fr ? meses[fr.getMonth()] : '';
  const anio = fr ? String(fr.getFullYear()) : '';

  const fi = D.fechaIngreso ? new Date(D.fechaIngreso + 'T00:00:00') : null;
  const ingresoTxt = fi ? `${String(fi.getDate()).padStart(2, '0')}/${String(fi.getMonth() + 1).padStart(2, '0')}/${fi.getFullYear()}` : '';

  let antig = '';
  if (fi && fr) {
    let m = (fr.getFullYear() - fi.getFullYear()) * 12 + (fr.getMonth() - fi.getMonth());
    if (fr.getDate() < fi.getDate()) m--;
    if (m < 0) m = 0;
    const y = Math.floor(m / 12), mm = m % 12;
    const ys = y === 1 ? '1 año' : `${y} años`;
    const ms = mm === 1 ? '1 mes' : `${mm} meses`;
    antig = y && mm ? `${ys} y ${ms}` : y ? ys : ms;
  }

  const children: any[] = [
    center([ra('CARTA DE RENUNCIA VOLUNTARIA', true)], { after: 20 }),
    center([ra('Artículo 53, Fracción I de la Ley Federal del Trabajo', false, true)], { after: 190 }),

    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 170 }, children: [campo(ciudad, 'Ciudad'), ra(', a '), campo(dd, 'DD'), ra(' de '), campo(mesNom, 'mes'), ra(' de '), campo(anio, 'AAAA')] }),

    new Paragraph({ spacing: { after: 0, line: 264 }, children: [campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN')] }),
    new Paragraph({ spacing: { after: 150, line: 260 }, children: [ra('P r e s e n t e', true)] }),

    pa([
      ra('Por medio de la presente, yo '), campo(titular, 'NOMBRE COMPLETO DEL TRABAJADOR'),
      ra(', en mi carácter de '), campo(puesto, 'DENOMINACIÓN DEL PUESTO'),
      ra(' adscrito al área de '), campo(area, 'ÁREA O DEPARTAMENTO'),
      ra(', manifiesto de manera '), ra('libre y voluntaria', true),
      ra(', y por así convenir a mis intereses personales, mi decisión irrevocable de renunciar al trabajo que desempeñaba, dando por terminada la relación laboral que nos unía a partir del día '),
      campo(dd, 'DD'), ra(' de '), campo(mesNom, 'mes'), ra(' de '), campo(anio, 'AAAA'),
      ra(', fecha en que cuento con una antigüedad de '), campo(antig, 'X año(s) y X mes(es)'),
      ra(', contada desde el '), campo(ingresoTxt, 'fecha de ingreso DD/MM/AAAA'), ra('.'),
    ]),

    pa([
      ra('Manifiesto que '), campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN'),
      ra(' no me adeuda cantidad alguna por ningún concepto derivado de la relación laboral, incluyendo salarios ordinarios y extraordinarios, vacaciones, prima vacacional, aguinaldo, reparto de utilidades ni por ningún otro concepto nacido de la ley o de mi contrato individual de trabajo, habiendo recibido en tiempo y forma todas las prestaciones a que tuve derecho. En este acto otorgo el finiquito correspondiente conforme al artículo 53, fracción I de la Ley Federal del Trabajo.'),
    ]),

    pa([
      ra('Hago constar que durante el tiempo que presté mis servicios se cumplió en todo momento con la jornada y el horario de trabajo en los términos establecidos por la Ley Federal del Trabajo, sin que en ningún momento se me haya requerido laborar tiempo extraordinario sin la debida compensación.'),
    ]),

    pa([
      ra('Igualmente declaro que durante el tiempo que presté mis servicios recibí en todo momento un trato digno y respetuoso, '),
      ra('no siendo objeto en ningún momento de trato discriminatorio', true),
      ra(' por motivo de origen étnico o nacional, género, edad, discapacidad, condición social, condiciones de salud, religión, condición migratoria, opiniones, preferencia sexual o estado civil, en cumplimiento con la Ley Federal del Trabajo y la NOM-035-STPS-2018. Asimismo, tuve acceso a la seguridad social, percibí el salario convenido de manera puntual, recibí capacitación y adiestramiento conforme a los planes establecidos, y realicé mis labores en condiciones de seguridad e higiene adecuadas.'),
    ]),

    pa([
      ra('Doy por terminada toda relación con los clientes, proveedores y demás terceros con quienes haya tenido contacto con motivo de mis funciones, reconociendo que dicha relación existió siempre por orden, cuenta y subordinación de mi único patrón '),
      campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN'),
      ra(', sin que en ningún caso haya existido relación laboral directa con dichos terceros.'),
    ]),

    pa([
      ra('Reconozco y ratifico las obligaciones de confidencialidad asumidas durante la relación laboral respecto de la información, procesos, datos de clientes y demás activos de conocimiento de '),
      campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN'),
      ra(', las cuales subsistirán conforme a lo pactado en mi contrato individual de trabajo.'),
    ]),

    pa([
      ra('Extiendo la presente carta de renuncia voluntaria en la ciudad de '), campo(ciudad, 'Ciudad'),
      ra(', a '), campo(dd, 'DD'), ra(' de '), campo(mesNom, 'mes'), ra(' de '), campo(anio, 'AAAA'),
      ra(', siendo las '), campo(hora, 'HH:MM'),
      ra(' horas, en pleno uso de mis facultades y sin presión ni coacción de ninguna especie.'),
    ], { after: 60 }),

    new Paragraph({ spacing: { before: 90, after: 0, line: 260 }, children: [ra('Atentamente,')] }),
    center([ra('________________________________________')], { before: 300, after: 10 }),
    center([campo(titular, 'NOMBRE COMPLETO DEL TRABAJADOR')]),
    center([ra('Firma del trabajador', false, true)], { after: 0 }),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1418, right: 1418, bottom: 1418, left: 1418 } } },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}
