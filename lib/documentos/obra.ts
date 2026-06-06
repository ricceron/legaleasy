// Contrato — Obra Determinada (Arts. 35-36 LFT).
import {
  Document, Packer, Paragraph, AlignmentType, PageBreak, LevelFormat,
} from 'docx';
import { r, p, pBullet, titulo, subtitulo, seccion, clausulaTitulo, cuerpo, fmtHoras, textoJornada, linea, firmaTable, tablaVacaciones, tablaAnexoA } from './helpers';

export async function generarObra(D: any): Promise<Buffer> {
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


// ── AVISO DE PRIVACIDAD INTEGRAL — RELACIÓN LABORAL (LFPDPPP) ─────
// Reproduce el formato aprobado (Aviso_Privacidad_Laboral_FORMATO).
