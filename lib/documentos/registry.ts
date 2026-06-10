// Registro de generadores de documentos.
// Para agregar un tipo nuevo: crea su archivo y regístralo aquí en una línea.
import { generarCapacitacion } from './capacitacion';
import { generarObra } from './obra';
import { generarAvisoPrivacidad } from './aviso';
import { generarRenuncia } from './renuncia';
import { generarResponsivaEquipo } from './responsiva-equipo';
import { generarResponsivaVehiculo } from './responsiva-vehiculo';
import { generarIndeterminado } from './indeterminado';
import { generarPrueba } from './prueba';
import { generarFiniquito } from './finiquito';

export type Generador = (datos: any) => Promise<Buffer>;

export const generadores: Record<string, Generador> = {
  capacitacion: generarCapacitacion,
  obra: generarObra,
  aviso: generarAvisoPrivacidad,
  renuncia: generarRenuncia,
  responsiva_equipo: generarResponsivaEquipo,
  responsiva_vehiculo: generarResponsivaVehiculo,
  indeterminado: generarIndeterminado,
  prueba: generarPrueba,
  finiquito: generarFiniquito,
};
