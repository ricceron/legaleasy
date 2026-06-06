// Aviso de Privacidad Integral — Relación Laboral (LFPDPPP).
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat,
} from 'docx';

export function generarAvisoPrivacidad(D: any): Promise<Buffer> {
  const BLUE = '2563EB';
  const ra = (text: string, bold = false) => new TextRun({ text, font: 'Arial', size: 22, bold, color: '000000' });
  const campo = (val: string, ph: string) =>
    val ? new TextRun({ text: val, font: 'Arial', size: 22, bold: true, color: '000000' })
        : new TextRun({ text: `«${ph}»`, font: 'Arial', size: 22, bold: true, color: BLUE });
  const pa = (children: TextRun[], opts: any = {}) =>
    new Paragraph({ children, alignment: (opts.align || 'both') as any, spacing: { before: opts.before ?? 60, after: opts.after ?? 60, line: 276 } });
  const sec = (text: string) =>
    new Paragraph({ children: [ra(text, true)], alignment: AlignmentType.BOTH, spacing: { before: 220, after: 90 } });
  const bullet = (children: TextRun[]) =>
    new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children, spacing: { before: 50, after: 50, line: 276 }, alignment: AlignmentType.BOTH });
  const center = (children: TextRun[], opts: any = {}) =>
    new Paragraph({ children, alignment: AlignmentType.CENTER, spacing: { before: opts.before ?? 40, after: opts.after ?? 40 } });

  const tb = { style: BorderStyle.SINGLE, size: 1, color: 'BBBBBB' };
  const celdaW = (children: TextRun[], w: number, header = false) =>
    new TableCell({
      borders: { top: tb, bottom: tb, left: tb, right: tb },
      width: { size: w, type: WidthType.DXA },
      shading: header ? { fill: 'D6DCE4', type: ShadingType.CLEAR } : undefined,
      margins: { top: 80, bottom: 80, left: 140, right: 140 },
      children: [new Paragraph({ children, alignment: AlignmentType.BOTH })],
    });
  const tabla = (headers: string[], rows: TextRun[][][], widths: number[]) =>
    new Table({
      width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
      columnWidths: widths,
      rows: [
        new TableRow({ children: headers.map((h, i) => celdaW([ra(h, true)], widths[i], true)) }),
        ...rows.map(rw => new TableRow({ children: rw.map((cell, i) => celdaW(cell, widths[i], false)) })),
      ],
    });

  // ── Variables ──
  const razon = D.patronNombre || '';
  const domicilio = D.patronDomicilio || '';
  const correo = D.patronCorreo || '';
  const titular = D.trabNombre || '';
  const ciudad = D.ciudad || '';
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fb = D.avisoFecha ? new Date(D.avisoFecha + 'T00:00:00') : new Date();
  const dd = String(fb.getDate()).padStart(2, '0');
  const mm = String(fb.getMonth() + 1).padStart(2, '0');
  const anio = String(fb.getFullYear());
  const fechaCorta = `${dd}/${mm}/${anio}`;
  const mesNom = meses[fb.getMonth()];

  const children: any[] = [
    center([new TextRun({ text: 'AVISO DE PRIVACIDAD INTEGRAL', font: 'Arial', size: 30, bold: true, color: '000000' })], { before: 0, after: 40 }),
    center([new TextRun({ text: 'RELACIÓN LABORAL', font: 'Arial', size: 26, bold: true, color: '000000' })], { after: 40 }),
    center([ra('Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento')], { after: 160 }),

    sec('I. IDENTIDAD Y DOMICILIO DEL RESPONSABLE'),
    pa([campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN'), ra(' (en lo sucesivo '), ra('“EL RESPONSABLE”', true), ra('), con domicilio en '), campo(domicilio, 'DOMICILIO COMPLETO, COLONIA, C.P., CIUDAD, ESTADO'), ra(', es responsable del tratamiento y protección de sus datos personales conforme a la LFPDPPP, su Reglamento y demás normatividad aplicable.')]),
    pa([ra('Para todo lo relacionado con este aviso de privacidad, puede contactarnos en: '), campo(correo, 'CORREO ELECTRÓNICO DE PRIVACIDAD'), ra(' o en el domicilio señalado.')]),

    sec('II. DATOS PERSONALES QUE SE RECABAN'),
    pa([ra('Para las finalidades descritas en el presente aviso, '), ra('“EL RESPONSABLE”', true), ra(' recabará y tratará las siguientes categorías de datos personales:')]),
    tabla(['Categoría', 'Datos incluidos'], [
      [[ra('Identificación')], [ra('Nombre completo, fecha y lugar de nacimiento, nacionalidad, sexo, RFC, CURP, NSS, fotografía y firma.')]],
      [[ra('Contacto')], [ra('Domicilio particular, teléfono fijo y móvil, correo electrónico personal.')]],
      [[ra('Laborales')], [ra('Puesto, área, fecha de ingreso, antecedentes laborales, referencias, evaluaciones de desempeño y resultados de capacitación.')]],
      [[ra('Académicos')], [ra('Escolaridad, títulos, cédula profesional y certificaciones.')]],
      [[ra('Patrimoniales y financieros')], [ra('Cuenta bancaria (CLABE interbancaria) para pago de nómina e información fiscal.')]],
      [[ra('Beneficiarios')], [ra('Nombre, parentesco y datos de contacto de las personas designadas conforme al artículo 501 LFT.')]],
    ], [2340, 7020]),
    pa([ra('DATOS PERSONALES SENSIBLES', true), ra(' — El tratamiento de los siguientes datos requiere su consentimiento expreso:')], { before: 160 }),
    bullet([ra('Estado de salud: ', true), ra('resultados de exámenes médicos de ingreso y periódicos, incapacidades médicas e información clínica necesaria para el cumplimiento de las obligaciones en materia de seguridad social y salud ocupacional.')]),
    bullet([ra('Datos biométricos: ', true), ra('huella dactilar y/o reconocimiento facial, utilizados exclusivamente para el control de asistencia.')]),
    bullet([ra('Información migratoria: ', true), ra('en caso de trabajadores extranjeros, documentos migratorios y permiso de trabajo.')]),
    pa([ra('Su consentimiento para el tratamiento de datos sensibles se otorga mediante la firma del presente aviso. El tratamiento se realizará únicamente para las finalidades descritas y con las medidas de seguridad exigidas por la LFPDPPP y su Reglamento.')]),

    sec('III. FINALIDADES PRIMARIAS DEL TRATAMIENTO'),
    pa([ra('Sus datos personales serán utilizados para las siguientes finalidades '), ra('necesarias para la relación laboral', true), ra(', sin las cuales no podría existir la misma:')]),
    bullet([ra('Celebración, administración y cumplimiento del contrato individual de trabajo y de las obligaciones derivadas del mismo.')]),
    bullet([ra('Gestión de nómina, pago de salarios, prestaciones, aguinaldo, vacaciones y demás conceptos laborales.')]),
    bullet([ra('Inscripción y trámites ante el IMSS, INFONAVIT, AFORE, SAT y demás autoridades competentes.')]),
    bullet([ra('Elaboración y actualización del expediente laboral, contratos, constancias y documentos relacionados con la relación de trabajo.')]),
    bullet([ra('Control de asistencia, puntualidad y cumplimiento del Reglamento Interior de Trabajo.')]),
    bullet([ra('Capacitación, adiestramiento y evaluación del desempeño conforme a los planes y programas establecidos.')]),
    bullet([ra('Gestión de riesgos de trabajo, accidentes, enfermedades profesionales y prestaciones de seguridad social correspondientes.')]),
    bullet([ra('Designación y actualización de beneficiarios conforme al artículo 501 de la Ley Federal del Trabajo.')]),
    bullet([ra('Timbrado y expedición de Comprobantes Fiscales Digitales por Internet (CFDI) de nómina.')]),
    bullet([ra('Cumplimiento de obligaciones legales, requerimientos de autoridades laborales, fiscales, judiciales o administrativas.')]),

    sec('IV. FINALIDADES SECUNDARIAS'),
    pa([ra('De manera adicional, y solo si usted no manifiesta su negativa, sus datos podrán utilizarse para las siguientes finalidades que '), ra('no son necesarias', true), ra(' para la existencia de la relación laboral:')]),
    bullet([ra('Encuestas internas de clima laboral, satisfacción y bienestar organizacional.')]),
    bullet([ra('Programas voluntarios de desarrollo profesional y personal.')]),
    bullet([ra('Actividades de integración, comunicación interna y eventos corporativos.')]),
    bullet([ra('Publicación de reconocimientos o logros del trabajador en medios internos de comunicación de la empresa.')]),
    pa([ra('Si usted no desea que sus datos sean tratados para estas finalidades secundarias, puede manifestar su negativa enviando un correo a '), campo(correo, 'CORREO DE PRIVACIDAD'), ra(' dentro de los '), ra('cinco días hábiles siguientes', true), ra(' a la firma del presente aviso. Su negativa no será motivo de afectación, discriminación ni terminación de la relación laboral.')]),

    sec('V. TRANSFERENCIAS DE DATOS PERSONALES'),
    pa([ra('Las siguientes transferencias son necesarias para el cumplimiento de obligaciones legales derivadas de la relación laboral y '), ra('no requieren de su consentimiento', true), ra(' conforme al artículo 37 de la LFPDPPP:')]),
    tabla(['Destinatario', 'Finalidad', 'Requiere consentimiento'], [
      [[ra('IMSS')], [ra('Alta, bajas, incapacidades y cuotas obrero-patronales.')], [ra('No (obligación legal)')]],
      [[ra('INFONAVIT')], [ra('Aportaciones y créditos de vivienda.')], [ra('No (obligación legal)')]],
      [[ra('SAT')], [ra('Timbrado de CFDI de nómina y obligaciones fiscales.')], [ra('No (obligación legal)')]],
      [[ra('AFORE / SAR')], [ra('Aportaciones al sistema de ahorro para el retiro.')], [ra('No (obligación legal)')]],
      [[ra('Institución bancaria')], [ra('Dispersión y pago de nómina.')], [ra('No (ejecución del contrato)')]],
      [[ra('Autoridades laborales, fiscales y judiciales')], [ra('Atención de requerimientos y cumplimiento de resoluciones.')], [ra('No (obligación legal)')]],
      [[ra('Encargados del tratamiento (proveedores de software, plataformas tecnológicas y prestadores de servicios que actúen por cuenta de “EL RESPONSABLE”)', true)], [ra('Procesamiento de nómina, administración de expedientes laborales digitales, generación y resguardo de contratos, cálculo de finiquitos y liquidaciones, gestión documental de la relación de trabajo y cualquier otro servicio tecnológico contratado por “EL RESPONSABLE” para administrar la relación laboral. Estos proveedores actúan exclusivamente como encargados del tratamiento conforme al artículo 50 del Reglamento de la LFPDPPP, bajo las instrucciones de “EL RESPONSABLE”, quien conserva en todo momento la calidad de responsable de los datos personales.')], [ra('No requiere consentimiento adicional del trabajador. La remisión al encargado está amparada por la relación jurídica entre “EL RESPONSABLE” y el proveedor, la cual debe formalizarse mediante un contrato de encargado del tratamiento que garantice confidencialidad y medidas de seguridad equivalentes.')]],
    ], [3120, 3120, 3120]),
    pa([ra('“EL RESPONSABLE” se obliga a formalizar con todo proveedor que actúe como encargado del tratamiento un contrato específico conforme al artículo 50 del Reglamento de la LFPDPPP. Dicho contrato deberá incluir como mínimo: (i) la prohibición de tratar los datos personales para fines distintos a los instruidos por “EL RESPONSABLE”; (ii) obligaciones de confidencialidad y medidas de seguridad equivalentes a las del presente aviso; (iii) la obligación de devolver o destruir de forma certificada los datos al término de la relación con el proveedor; y (iv) la notificación inmediata a “EL RESPONSABLE” ante cualquier vulneración de seguridad. La relación de encargados del tratamiento activos estará disponible para consulta del titular en el domicilio de “EL RESPONSABLE” o a través del correo de privacidad señalado en el apartado I.')], { before: 120 }),

    sec('VI. MEDIDAS DE SEGURIDAD'),
    pa([ra('“EL RESPONSABLE” ha implementado medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales contra acceso no autorizado, pérdida, alteración o destrucción, entre las que se incluyen:')]),
    bullet([ra('Administrativas: ', true), ra('políticas internas de privacidad, acuerdos de confidencialidad con el personal, capacitación en protección de datos y procedimientos de gestión de incidentes.')]),
    bullet([ra('Técnicas: ', true), ra('control de accesos a sistemas, cifrado de información sensible, copias de seguridad periódicas y auditorías de seguridad informática.')]),
    bullet([ra('Físicas: ', true), ra('acceso restringido a áreas donde se almacena información personal, resguardo de expedientes en archivos seguros y destrucción certificada de documentos.')]),
    pa([ra('En caso de que ocurra una vulneración de seguridad que afecte de forma significativa sus derechos patrimoniales o morales, “EL RESPONSABLE” le notificará de forma inmediata por los medios de contacto registrados en su expediente, para que pueda tomar las medidas necesarias para la defensa de sus derechos, conforme al artículo 20 de la LFPDPPP.')]),

    sec('VII. PLAZO DE CONSERVACIÓN DE LOS DATOS'),
    pa([ra('Sus datos personales serán conservados durante el tiempo que dure la relación laboral y, una vez concluida ésta, durante los plazos que establezcan las leyes aplicables, considerando los siguientes criterios:')]),
    tabla(['Tipo de dato', 'Plazo de conservación', 'Fundamento'], [
      [[ra('Expediente laboral general')], [ra('10 años posteriores a la terminación')], [ra('Art. 804 LFT')]],
      [[ra('Recibos de nómina y CFDI')], [ra('5 años (prescripción fiscal)')], [ra('Código Fiscal de la Federación')]],
      [[ra('Registros de seguridad social')], [ra('5 años posteriores a la baja')], [ra('Ley del Seguro Social')]],
      [[ra('Datos biométricos')], [ra('Durante la vigencia de la relación laboral')], [ra('Art. 9 LFPDPPP')]],
      [[ra('Datos de salud / incapacidades')], [ra('5 años o lo que establezca la NOM aplicable')], [ra('Ley del IMSS / NOM-035')]],
      [[ra('Expediente de litigio o reclamación')], [ra('Hasta la conclusión del procedimiento + 5 años')], [ra('LFT / LFPDPPP')]],
    ], [3120, 3120, 3120]),
    pa([ra('Una vez concluidos los plazos anteriores, sus datos serán bloqueados y posteriormente suprimidos o anonimizados, salvo que exista obligación legal de conservación por un periodo mayor.')], { before: 120 }),

    sec('VIII. DERECHOS ARCO Y REVOCACIÓN DEL CONSENTIMIENTO'),
    pa([ra('Usted tiene derecho a '), ra('Acceder, Rectificar, Cancelar u Oponerse', true), ra(' (derechos ARCO) al tratamiento de sus datos personales, así como a revocar en cualquier momento el consentimiento otorgado, en los términos de los artículos 28, 29 y 37 de la LFPDPPP.')]),
    pa([ra('Procedimiento para ejercer sus derechos:', true)]),
    bullet([ra('Canal: ', true), ra('solicitud escrita o por correo electrónico a '), campo(correo, 'CORREO DE PRIVACIDAD'), ra('.')]),
    bullet([ra('Contenido de la solicitud: ', true), ra('nombre completo, copia de identificación oficial, descripción del derecho que desea ejercer y, en su caso, la información o datos respecto de los cuales se busca ejercer el derecho.')]),
    bullet([ra('Plazos de respuesta: ', true), ra('“EL RESPONSABLE” responderá dentro de los '), ra('20 días hábiles', true), ra(' siguientes a la recepción de la solicitud completa. Si resulta procedente, se hará efectiva dentro de los '), ra('15 días hábiles', true), ra(' siguientes.')]),
    bullet([ra('Solicitud incompleta: ', true), ra('“EL RESPONSABLE” tendrá '), ra('10 días hábiles', true), ra(' para requerir la información faltante. Si no se subsana en el plazo indicado, la solicitud se tendrá por no presentada.')]),
    bullet([ra('Negativa fundada: ', true), ra('en caso de que “EL RESPONSABLE” no pueda atender su solicitud, le informará los motivos y usted podrá acudir al Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI).')]),
    pa([ra('La revocación del consentimiento no tendrá efectos retroactivos y podrá no ser procedente cuando el tratamiento sea necesario para cumplir obligaciones legales derivadas de la relación laboral.')]),

    sec('IX. LIMITACIÓN DEL USO Y DIVULGACIÓN'),
    pa([ra('Para limitar el uso o divulgación de sus datos personales para finalidades distintas a las necesarias para la relación laboral, puede presentar su solicitud a través de los canales descritos en el apartado VIII. “EL RESPONSABLE” evaluará la procedencia de su solicitud conforme a la LFPDPPP y dará respuesta en los plazos legales.')]),

    sec('X. TRATAMIENTO DE DATOS DE MENORES DE EDAD'),
    pa([ra('En cumplimiento del artículo 22 de la Ley Federal del Trabajo, no se contratará a menores de 15 años bajo ninguna circunstancia. En el caso de trabajadores mayores de 15 y menores de 18 años, el tratamiento de sus datos personales se realizará con el consentimiento expreso de quien ejerza la patria potestad o tutela, y únicamente para las finalidades necesarias derivadas de la relación laboral.')]),
    pa([ra('Los datos de menores de edad que figuren como beneficiarios designados conforme al artículo 501 LFT serán tratados exclusivamente para esa finalidad y serán suprimidos una vez cumplida la misma.')]),

    sec('XI. CAMBIOS AL AVISO DE PRIVACIDAD'),
    pa([ra('“EL RESPONSABLE” se reserva el derecho de actualizar el presente aviso de privacidad en cualquier momento, para atender reformas legislativas, criterios del INAI, políticas internas o nuevos requerimientos operativos.')]),
    pa([ra('Cualquier modificación será comunicada mediante: (i) aviso en el domicilio del patrón; (ii) correo electrónico al último registrado en el expediente del trabajador; o (iii) comunicación interna de la empresa. Cuando los cambios sean sustanciales — nueva categoría de datos sensibles, nuevas transferencias a terceros no previstos o cambio de finalidades esenciales — se requerirá un nuevo consentimiento expreso del titular.')]),
    pa([ra('La fecha de última actualización del presente aviso es: '), campo(fechaCorta, 'DD/MM/AAAA'), ra('.')]),

    sec('XII. CONSENTIMIENTO DEL TITULAR'),
    pa([ra('El que suscribe, '), campo(titular, 'NOMBRE COMPLETO DEL TRABAJADOR'), ra(', manifiesto que:')]),
    bullet([ra('He leído y comprendido en su totalidad el presente Aviso de Privacidad Integral.')]),
    bullet([ra('Otorgo mi consentimiento libre, informado, específico e inequívoco para el tratamiento de mis datos personales, incluidos mis datos personales sensibles, conforme a las finalidades, transferencias y condiciones aquí descritas.')]),
    bullet([ra('Conozco los canales y procedimientos para ejercer mis derechos ARCO y revocar mi consentimiento en cualquier momento, dirigiéndome a '), campo(correo, 'CORREO DE PRIVACIDAD'), ra('.')]),
    bullet([ra('Entiendo que la negativa para el tratamiento de datos necesarios para la relación laboral podría impedir la celebración o continuación de la misma, mientras que la negativa para finalidades secundarias no tendrá consecuencia alguna sobre mi relación de trabajo.')]),
    pa([ra('Lugar y fecha: '), campo(ciudad, 'CIUDAD'), ra(', a '), campo(dd, 'DD'), ra(' de '), campo(mesNom, 'MES'), ra(' de '), campo(anio, 'AÑO'), ra('.')], { before: 160 }),

    center([ra('________________________________________')], { before: 360, after: 20 }),
    center([ra('Titular de los datos personales', true)]),
    center([ra('________________________________________')], { before: 360, after: 20 }),
    center([ra('En representación de ', true), campo(razon, 'NOMBRE O RAZÓN SOCIAL DEL PATRÓN')]),
  ];

  const doc = new Document({
    numbering: {
      config: [
        { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '-', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 360 } } } }] },
      ],
    },
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1260, bottom: 1440, left: 1440 } } },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}
