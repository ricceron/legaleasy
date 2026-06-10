// Tipos, constantes y validaciones compartidas de LexByte.

export type Msg = { role: 'user' | 'assistant'; content: string };
export type Section = 'lex' | 'docs' | 'historial' | 'config';
export type DocTipo = 'capacitacion' | 'obra' | 'indeterminado' | 'aviso' | 'renuncia' | 'responsiva_equipo' | 'responsiva_vehiculo' | null;

export const V = '#39ff14';
export const F = '#060f1e';
export const SB = '#080f1c';

export function validarRFC(rfc: string) {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(rfc.trim());
}
export function validarCURP(curp: string) {
  return /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i.test(curp.trim());
}
export function validarNSS(nss: string) {
  return /^\d{11}$/.test(nss.replace(/\s/g, ''));
}
export function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
export function validarSalario(sal: string) {
  return parseFloat(sal) >= 248.93;
}

export const LIMITES_JORNADA: Record<string, number> = { diurna: 8, nocturna: 7, mixta: 7.5 };

// Jornada efectiva (Arts. 61, 63 y 64 LFT).
// Discontinua = el trabajador puede salir a comer fuera → la comida NO se computa (Art. 64 a contrario).
// Continua = no puede salir → la comida SÍ se computa como tiempo efectivo (Art. 64).
export function calcularJornada(entrada: string, salida: string, duracionComidaMin: number, continua: boolean) {
  if (!entrada || !salida) return { spanHoras: 0, horasEfectivas: 0 };
  const [hE, mE] = entrada.split(':').map(Number);
  const [hS, mS] = salida.split(':').map(Number);
  let spanMin = hS * 60 + mS - (hE * 60 + mE);
  if (spanMin <= 0) spanMin += 1440; // jornada que cruza medianoche
  const spanHoras = spanMin / 60;
  const horasEfectivas = continua ? spanHoras : spanHoras - duracionComidaMin / 60;
  return { spanHoras, horasEfectivas };
}

export interface ErrorMap { [key: string]: string }

export function validarPaso(paso: number, tipo: DocTipo, refs: any): ErrorMap {
  const errs: ErrorMap = {};
  const v = (ref: any) => ref?.current?.value?.trim() || '';
  if (paso === 0) {
    if (!v(refs.patronNombre)) errs.patronNombre = 'Requerido';
    if (!v(refs.patronRFC)) errs.patronRFC = 'Requerido';
    else if (!validarRFC(v(refs.patronRFC))) errs.patronRFC = 'Formato inválido (ej. EXY900101ABC)';
    if (!v(refs.patronRegIMSS)) errs.patronRegIMSS = 'Requerido';
    if (!v(refs.patronDomicilio)) errs.patronDomicilio = 'Requerido';
    if (!v(refs.patronCiudad)) errs.patronCiudad = 'Requerido';
    if (v(refs.patronCorreo) && !validarEmail(v(refs.patronCorreo))) errs.patronCorreo = 'Formato de correo inválido';
    if (tipo === 'obra') {
      if (!v(refs.obraNombre)) errs.obraNombre = 'Requerido';
      if (!v(refs.obraDomicilio)) errs.obraDomicilio = 'Requerido';
      if (!v(refs.obraTermino)) errs.obraTermino = 'Requerido';
    }
  }
  if (paso === 1) {
    if (!v(refs.trabNombre)) errs.trabNombre = 'Requerido';
    if (!v(refs.trabNacimiento)) errs.trabNacimiento = 'Requerido';
    else {
      const edad = Math.floor((Date.now() - new Date(v(refs.trabNacimiento)).getTime()) / 31557600000);
      if (edad < 15) errs.trabNacimiento = '⚠️ Trabajador menor de 15 años — Art. 22 LFT';
      if (edad > 100) errs.trabNacimiento = 'Fecha inválida';
    }
    if (!v(refs.trabRFC)) errs.trabRFC = 'Requerido';
    else if (!validarRFC(v(refs.trabRFC))) errs.trabRFC = 'Formato inválido (13 caracteres: XXXX000000XXX)';
    if (!v(refs.trabCURP)) errs.trabCURP = 'Requerido';
    else if (!validarCURP(v(refs.trabCURP))) errs.trabCURP = 'Formato inválido (18 caracteres)';
    if (!v(refs.trabNSS)) errs.trabNSS = 'Requerido';
    else if (!validarNSS(v(refs.trabNSS))) errs.trabNSS = 'Debe tener 11 dígitos — Art. 15 LSS';
    if (!v(refs.trabDomicilio)) errs.trabDomicilio = 'Requerido';
  }
  if (paso === 2) {
    if (!v(refs.condPuesto)) errs.condPuesto = 'Requerido';
    if (!v(refs.condArea)) errs.condArea = 'Requerido';
    if (!v(refs.condSalario)) errs.condSalario = 'Requerido';
    else if (!validarSalario(v(refs.condSalario))) errs.condSalario = '⚠️ Menor al SMV 2025 ($248.93) — Art. 85 LFT';
    if (tipo === 'capacitacion') {
      if (!v(refs.condInicio)) errs.condInicio = 'Requerido';
      if (!v(refs.condTermino)) errs.condTermino = 'Requerido';
      if (v(refs.condInicio) && v(refs.condTermino)) {
        if (new Date(v(refs.condTermino)) <= new Date(v(refs.condInicio))) errs.condTermino = 'La fecha de término debe ser posterior al inicio';
      }
    }
    if (tipo === 'indeterminado') {
      if (!v(refs.condInicio)) errs.condInicio = 'Requerido';
    }
    if (!v(refs.condActividades)) errs.condActividades = 'Describe al menos una actividad del puesto';
  }
  if (paso === 3) {
    if (!v(refs.jornadaEntrada)) errs.jornadaEntrada = 'Requerido';
    if (!v(refs.jornadaSalida)) errs.jornadaSalida = 'Requerido';
    if (v(refs.jornadaEntrada) && v(refs.jornadaSalida)) {
      const tipoJ = v(refs.jornadaTipo) || 'diurna';
      const continua = v(refs.jornadaContinua) === 'continua';
      const dur = Number(v(refs.jornadaDuracionComida) || '60');
      const limite = LIMITES_JORNADA[tipoJ] ?? 8;
      const { horasEfectivas } = calcularJornada(v(refs.jornadaEntrada), v(refs.jornadaSalida), dur, continua);
      if (horasEfectivas <= 0) {
        errs.jornadaSalida = '⚠️ La salida debe ser posterior a la entrada';
      } else if (horasEfectivas > limite + 0.001) {
        errs.jornadaSalida = `⚠️ Jornada efectiva de ${horasEfectivas.toFixed(2)} h excede el máximo de ${limite} h para jornada ${tipoJ} (Art. 61 LFT)`;
      }
      // Art. 63 LFT: descanso mínimo de 30 min en jornada continua
      if (continua && dur < 30) {
        errs.jornadaDuracionComida = '⚠️ La jornada continua requiere descanso mínimo de 30 min (Art. 63 LFT)';
      }
    }
  }
  return errs;
}
