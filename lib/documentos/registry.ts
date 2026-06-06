// Registro de generadores de documentos.
// Para agregar un tipo nuevo: crea su archivo y regístralo aquí en una línea.
import { generarCapacitacion } from './capacitacion';
import { generarObra } from './obra';
import { generarAvisoPrivacidad } from './aviso';

export type Generador = (datos: any) => Promise<Buffer>;

export const generadores: Record<string, Generador> = {
  capacitacion: generarCapacitacion,
  obra: generarObra,
  aviso: generarAvisoPrivacidad,
};
