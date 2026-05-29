'use client';
import { useState, useRef, useEffect } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
type Section = 'lex' | 'docs' | 'historial' | 'config';
type DocTipo = 'capacitacion' | 'obra' | null;

const V = '#39ff14';
const F = '#060f1e';
const SB = '#080f1c';

// ── VALIDADORES LOCALES ──────────────────────────────────────────
function validarRFC(rfc: string) {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(rfc.trim());
}
function validarCURP(curp: string) {
  return /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i.test(curp.trim());
}
function validarNSS(nss: string) {
  return /^\d{11}$/.test(nss.replace(/\s/g, ''));
}
function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function validarFecha(fecha: string) {
  if (!fecha) return false;
  const d = new Date(fecha);
  return !isNaN(d.getTime());
}
function validarSalario(sal: string) {
  return parseFloat(sal) >= 248.93;
}

interface ErrorMap { [key: string]: string }

function validarPaso(paso: number, tipo: DocTipo, refs: any): ErrorMap {
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
    else if (!validarSalario(v(refs.condSalario))) errs.condSalario = `⚠️ Menor al SMV 2025 ($248.93) — Art. 85 LFT`;
    if (tipo === 'capacitacion') {
      if (!v(refs.condInicio)) errs.condInicio = 'Requerido';
      if (!v(refs.condTermino)) errs.condTermino = 'Requerido';
      if (v(refs.condInicio) && v(refs.condTermino)) {
        if (new Date(v(refs.condTermino)) <= new Date(v(refs.condInicio))) errs.condTermino = 'La fecha de término debe ser posterior al inicio';
      }
    }
    if (!v(refs.condActividades)) errs.condActividades = 'Describe al menos una actividad del puesto';
  }
  if (paso === 3) {
    if (!v(refs.jornadaEntrada)) errs.jornadaEntrada = 'Requerido';
    if (!v(refs.jornadaSalida)) errs.jornadaSalida = 'Requerido';
    if (v(refs.jornadaEntrada) && v(refs.jornadaSalida)) {
      if (v(refs.jornadaEntrada) >= v(refs.jornadaSalida)) errs.jornadaSalida = '⚠️ La salida debe ser posterior a la entrada';
    }
  }
  return errs;
}

// ── COMPONENTE FORMULARIO ────────────────────────────────────────
function FormContrato({ tipo }: { tipo: DocTipo }) {
  const [paso, setPaso] = useState(0);
  const [errores, setErrores] = useState<ErrorMap>({});
  const [validandoPaso, setValidandoPaso] = useState(false);
  const [analisis, setAnalisis] = useState<any>(null);
  const [analizando, setAnalizando] = useState(false);
  const [generando, setGenerando] = useState(false);

  const refs: any = {
    patronNombre: useRef<HTMLInputElement>(null),
    patronRFC: useRef<HTMLInputElement>(null),
    patronRegIMSS: useRef<HTMLInputElement>(null),
    patronTipo: useRef<HTMLSelectElement>(null),
    patronDomicilio: useRef<HTMLInputElement>(null),
    patronCiudad: useRef<HTMLInputElement>(null),
    patronCorreo: useRef<HTMLInputElement>(null),
    patronRepresentante: useRef<HTMLInputElement>(null),
    obraNombre: useRef<HTMLInputElement>(null),
    obraDomicilio: useRef<HTMLInputElement>(null),
    obraRegIMSS: useRef<HTMLInputElement>(null),
    obraTermino: useRef<HTMLInputElement>(null),
    trabNombre: useRef<HTMLInputElement>(null),
    trabSexo: useRef<HTMLSelectElement>(null),
    trabNacimiento: useRef<HTMLInputElement>(null),
    trabNacionalidad: useRef<HTMLInputElement>(null),
    trabRFC: useRef<HTMLInputElement>(null),
    trabCURP: useRef<HTMLInputElement>(null),
    trabNSS: useRef<HTMLInputElement>(null),
    trabDomicilio: useRef<HTMLInputElement>(null),
    condPuesto: useRef<HTMLInputElement>(null),
    condArea: useRef<HTMLInputElement>(null),
    condJefe: useRef<HTMLInputElement>(null),
    duracion: useRef<HTMLSelectElement>(null),
    condInicio: useRef<HTMLInputElement>(null),
    condTermino: useRef<HTMLInputElement>(null),
    condSalario: useRef<HTMLInputElement>(null),
    condAguinaldo: useRef<HTMLInputElement>(null),
    condPrima: useRef<HTMLInputElement>(null),
    condActividades: useRef<HTMLTextAreaElement>(null),
    jornadaTipo: useRef<HTMLSelectElement>(null),
    jornadaEntrada: useRef<HTMLInputElement>(null),
    jornadaSalida: useRef<HTMLInputElement>(null),
    jornadaDescanso: useRef<HTMLSelectElement>(null),
    jornadaPago: useRef<HTMLSelectElement>(null),
    benef0nombre: useRef<HTMLInputElement>(null),
    benef0parentesco: useRef<HTMLInputElement>(null),
    benef0pct: useRef<HTMLInputElement>(null),
    benef1nombre: useRef<HTMLInputElement>(null),
    benef1parentesco: useRef<HTMLInputElement>(null),
    benef1pct: useRef<HTMLInputElement>(null),
    benef2nombre: useRef<HTMLInputElement>(null),
    benef2parentesco: useRef<HTMLInputElement>(null),
    benef2pct: useRef<HTMLInputElement>(null),
  };

  const getDatos = () => ({
    patronNombre: refs.patronNombre.current?.value||'',
    patronRFC: refs.patronRFC.current?.value||'',
    patronRegIMSS: refs.patronRegIMSS.current?.value||'',
    patronTipo: refs.patronTipo.current?.value||'moral',
    patronDomicilio: refs.patronDomicilio.current?.value||'',
    patronCiudad: refs.patronCiudad.current?.value||'',
    patronCorreo: refs.patronCorreo.current?.value||'',
    patronRepresentante: refs.patronRepresentante.current?.value||'',
    obraNombre: refs.obraNombre.current?.value||'',
    obraDomicilio: refs.obraDomicilio.current?.value||'',
    obraRegIMSS: refs.obraRegIMSS.current?.value||'',
    obraTermino: refs.obraTermino.current?.value||'',
    trabNombre: refs.trabNombre.current?.value||'',
    trabSexo: refs.trabSexo.current?.value||'MASCULINO',
    trabNacimiento: refs.trabNacimiento.current?.value||'',
    trabNacionalidad: refs.trabNacionalidad.current?.value||'México',
    trabRFC: refs.trabRFC.current?.value||'',
    trabCURP: refs.trabCURP.current?.value||'',
    trabNSS: refs.trabNSS.current?.value||'',
    trabDomicilio: refs.trabDomicilio.current?.value||'',
    condPuesto: refs.condPuesto.current?.value||'',
    condArea: refs.condArea.current?.value||'',
    condJefe: refs.condJefe.current?.value||'',
    duracion: refs.duracion.current?.value||'90',
    condInicio: refs.condInicio.current?.value||'',
    condTermino: refs.condTermino.current?.value||'',
    condSalario: refs.condSalario.current?.value||'',
    condAguinaldo: refs.condAguinaldo.current?.value||'15',
    condPrima: refs.condPrima.current?.value||'25',
    condActividades: refs.condActividades.current?.value||'',
    jornadaTipo: refs.jornadaTipo.current?.value||'diurna',
    jornadaEntrada: refs.jornadaEntrada.current?.value||'',
    jornadaSalida: refs.jornadaSalida.current?.value||'',
    jornadaDescanso: refs.jornadaDescanso.current?.value||'domingo',
    jornadaPago: refs.jornadaPago.current?.value||'semanalmente',
    beneficiarios: [0,1,2].map(i=>({
      nombre: refs[`benef${i}nombre`].current?.value||'',
      parentesco: refs[`benef${i}parentesco`].current?.value||'',
      pct: refs[`benef${i}pct`].current?.value||'',
    })).filter(b=>b.nombre),
  });

  const avanzarPaso = async () => {
    // 1. Validación local
    const errs = validarPaso(paso, tipo, refs);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      return;
    }
    setErrores({});
    setPaso(p => p + 1);
  };

  const analizarContrato = async () => {
    setAnalizando(true);
    setAnalisis(null);
    try {
      const res = await fetch('/api/analizar-contrato', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipo==='capacitacion'?'Capacitación Inicial':'Obra Determinada', datos: getDatos() }),
      });
      const data = await res.json();
      setAnalisis(data);
    } catch {
      setAnalisis({ puntaje:50, observaciones:[{tipo:'warn',texto:'No se pudo conectar con el análisis IA.'}], recomendacion:'' });
    }
    setAnalizando(false);
  };

  const descargarDocx = async () => {
    setGenerando(true);
    try {
      const res = await fetch('/api/generar-docx', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, datos: getDatos() }),
      });
      if (!res.ok) throw new Error('Error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LexByte_${tipo}_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert('Error al generar. Intenta de nuevo.'); }
    setGenerando(false);
  };

  const inpSt: any = (campo: string) => ({
    width:'100%', padding:'9px 12px',
    background: errores[campo] ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
    border: `0.5px solid ${errores[campo] ? '#ef4444' : 'rgba(57,255,20,0.2)'}`,
    borderRadius:8, color:'#fff', fontSize:13, fontFamily:"'Sora',sans-serif", outline:'none',
  });
  const labSt: any = { fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.4px', marginBottom:5, display:'block' };
  const fldSt: any = { marginBottom:14 };
  const rowSt: any = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 };

  const ErrMsg = ({ campo }: { campo: string }) => errores[campo]
    ? <div style={{fontSize:11,color:'#fca5a5',marginTop:4}}>⚠️ {errores[campo]}</div>
    : null;

  const pasosTitulos = ['Patrón','Trabajador','Condiciones','Jornada','Revisión IA'];

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'0.5px solid rgba(57,255,20,0.08)',flexShrink:0,padding:'0 22px',overflowX:'auto'}}>
        {pasosTitulos.map((t,i)=>(
          <div key={i} onClick={()=>{if(i<paso)setPaso(i);}}
            style={{padding:'10px 14px',fontSize:12,cursor:i<paso?'pointer':'default',borderBottom:`2px solid ${i===paso?V:'transparent'}`,color:i===paso?V:i<paso?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.25)',fontWeight:i===paso?600:400,transition:'all 0.15s',whiteSpace:'nowrap' as const}}>
            {i<paso?'✓ ':''}{t}
          </div>
        ))}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:22}}>

        {/* PASO 0 — PATRÓN */}
        <div style={{display:paso===0?'block':'none'}}>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Nombre o razón social *</label><input ref={refs.patronNombre} placeholder="Empresa XYZ S.A. de C.V." style={inpSt('patronNombre')}/><ErrMsg campo="patronNombre"/></div>
            <div style={fldSt}><label style={labSt}>RFC del patrón *</label><input ref={refs.patronRFC} placeholder="EXY900101ABC" maxLength={13} style={{...inpSt('patronRFC'),textTransform:'uppercase'}}/><ErrMsg campo="patronRFC"/></div>
          </div>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Registro patronal IMSS *</label><input ref={refs.patronRegIMSS} placeholder="B12345678104" style={inpSt('patronRegIMSS')}/><ErrMsg campo="patronRegIMSS"/></div>
            <div style={fldSt}><label style={labSt}>Tipo de persona</label><select ref={refs.patronTipo} style={inpSt('')} defaultValue="moral"><option value="moral">Persona moral</option><option value="fisica">Persona física</option></select></div>
          </div>
          <div style={fldSt}><label style={labSt}>Domicilio fiscal *</label><input ref={refs.patronDomicilio} placeholder="Calle, número, colonia, C.P." style={inpSt('patronDomicilio')}/><ErrMsg campo="patronDomicilio"/></div>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Ciudad / Estado *</label><input ref={refs.patronCiudad} placeholder="Monterrey, Nuevo León" style={inpSt('patronCiudad')}/><ErrMsg campo="patronCiudad"/></div>
            <div style={fldSt}><label style={labSt}>Correo de privacidad</label><input ref={refs.patronCorreo} type="email" placeholder="privacidad@empresa.com" style={inpSt('patronCorreo')}/><ErrMsg campo="patronCorreo"/></div>
          </div>
          <div style={fldSt}><label style={labSt}>Representante legal</label><input ref={refs.patronRepresentante} placeholder="Lic. Roberto García Martínez" style={inpSt('')}/></div>
          {tipo==='obra'&&<>
            <div style={{margin:'16px 0 12px',fontSize:11,fontWeight:600,color:V,textTransform:'uppercase',letterSpacing:'0.5px'}}>Datos de la obra</div>
            <div style={fldSt}><label style={labSt}>Nombre de la obra *</label><input ref={refs.obraNombre} placeholder="Construcción Torre Corporativa Norte" style={inpSt('obraNombre')}/><ErrMsg campo="obraNombre"/></div>
            <div style={fldSt}><label style={labSt}>Domicilio de la obra *</label><input ref={refs.obraDomicilio} placeholder="Calle, colonia, C.P., ciudad" style={inpSt('obraDomicilio')}/><ErrMsg campo="obraDomicilio"/></div>
            <div style={rowSt}>
              <div style={fldSt}><label style={labSt}>Registro IMSS de la obra</label><input ref={refs.obraRegIMSS} placeholder="12-345678-10-0" style={inpSt('')}/></div>
              <div style={fldSt}><label style={labSt}>Fecha estimada de término *</label><input ref={refs.obraTermino} type="date" style={inpSt('obraTermino')}/><ErrMsg campo="obraTermino"/></div>
            </div>
          </>}
        </div>

        {/* PASO 1 — TRABAJADOR */}
        <div style={{display:paso===1?'block':'none'}}>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Nombre completo *</label><input ref={refs.trabNombre} placeholder="Nombre Apellido Apellido" style={inpSt('trabNombre')}/><ErrMsg campo="trabNombre"/></div>
            <div style={fldSt}><label style={labSt}>Sexo</label><select ref={refs.trabSexo} style={inpSt('')} defaultValue="MASCULINO"><option value="MASCULINO">Masculino</option><option value="FEMENINO">Femenino</option></select></div>
          </div>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Fecha de nacimiento *</label><input ref={refs.trabNacimiento} type="date" style={inpSt('trabNacimiento')}/><ErrMsg campo="trabNacimiento"/></div>
            <div style={fldSt}><label style={labSt}>Nacionalidad</label><input ref={refs.trabNacionalidad} placeholder="México" defaultValue="México" style={inpSt('')}/></div>
          </div>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>RFC * (13 caracteres)</label><input ref={refs.trabRFC} placeholder="GOPM950315XYZ" maxLength={13} style={{...inpSt('trabRFC'),textTransform:'uppercase'}}/><ErrMsg campo="trabRFC"/></div>
            <div style={fldSt}><label style={labSt}>CURP * (18 caracteres)</label><input ref={refs.trabCURP} placeholder="GOPM950315MNLNRR09" maxLength={18} style={{...inpSt('trabCURP'),textTransform:'uppercase'}}/><ErrMsg campo="trabCURP"/></div>
          </div>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>NSS IMSS * (11 dígitos)</label><input ref={refs.trabNSS} placeholder="45 67 89 1234 5" style={inpSt('trabNSS')}/><ErrMsg campo="trabNSS"/></div>
          </div>
          <div style={fldSt}><label style={labSt}>Domicilio del trabajador *</label><input ref={refs.trabDomicilio} placeholder="Calle, colonia, C.P., ciudad, estado" style={inpSt('trabDomicilio')}/><ErrMsg campo="trabDomicilio"/></div>
        </div>

        {/* PASO 2 — CONDICIONES */}
        <div style={{display:paso===2?'block':'none'}}>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Denominación del puesto *</label><input ref={refs.condPuesto} placeholder="Analista de RRHH" style={inpSt('condPuesto')}/><ErrMsg campo="condPuesto"/></div>
            <div style={fldSt}><label style={labSt}>Área / Departamento *</label><input ref={refs.condArea} placeholder="Recursos Humanos" style={inpSt('condArea')}/><ErrMsg campo="condArea"/></div>
          </div>
          {tipo==='capacitacion'&&<div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Duración del contrato</label><select ref={refs.duracion} style={inpSt('')} defaultValue="90"><option value="30">30 días</option><option value="60">60 días</option><option value="90">90 días</option></select></div>
            <div style={fldSt}><label style={labSt}>Fecha de inicio *</label><input ref={refs.condInicio} type="date" style={inpSt('condInicio')}/><ErrMsg campo="condInicio"/></div>
          </div>}
          {tipo==='capacitacion'&&<div style={fldSt}><label style={labSt}>Fecha de término *</label><input ref={refs.condTermino} type="date" style={inpSt('condTermino')}/><ErrMsg campo="condTermino"/></div>}
          {tipo==='obra'&&<>
            <div style={fldSt}><label style={labSt}>Jefe inmediato</label><input ref={refs.condJefe} placeholder="Ing. Juan López — Director de Obra" style={inpSt('')}/></div>
            <div style={fldSt}><label style={labSt}>Fecha de inicio *</label><input ref={refs.condInicio} type="date" style={inpSt('condInicio')}/><ErrMsg campo="condInicio"/></div>
          </>}
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Salario diario MXN * (mín. $248.93)</label><input ref={refs.condSalario} type="number" placeholder="350.00" step="0.01" style={inpSt('condSalario')}/><ErrMsg campo="condSalario"/></div>
            <div style={fldSt}><label style={labSt}>Días de aguinaldo (mín. 15)</label><input ref={refs.condAguinaldo} type="number" defaultValue="15" style={inpSt('')}/></div>
          </div>
          <div style={fldSt}><label style={labSt}>Prima vacacional % (mín. 25)</label><input ref={refs.condPrima} type="number" defaultValue="25" style={inpSt('')}/></div>
          <div style={fldSt}><label style={labSt}>Actividades del puesto * (una por línea)</label>
            <textarea ref={refs.condActividades} placeholder={"Reclutamiento y selección de personal\nElaboración de contratos laborales\nControl de expedientes del personal"} rows={4} style={{...inpSt('condActividades'),resize:'vertical' as const}}/>
            <ErrMsg campo="condActividades"/>
          </div>
        </div>

        {/* PASO 3 — JORNADA */}
        <div style={{display:paso===3?'block':'none'}}>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Tipo de jornada</label><select ref={refs.jornadaTipo} style={inpSt('')} defaultValue="diurna"><option value="diurna">Diurna (máx. 8 h)</option><option value="nocturna">Nocturna (máx. 7 h)</option><option value="mixta">Mixta (máx. 7.5 h)</option></select></div>
            <div style={fldSt}><label style={labSt}>Día de descanso semanal</label><select ref={refs.jornadaDescanso} style={inpSt('')} defaultValue="domingo"><option value="lunes">Lunes</option><option value="martes">Martes</option><option value="miércoles">Miércoles</option><option value="jueves">Jueves</option><option value="viernes">Viernes</option><option value="sábado">Sábado</option><option value="domingo">Domingo</option></select></div>
          </div>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Hora de entrada *</label><input ref={refs.jornadaEntrada} type="time" style={inpSt('jornadaEntrada')}/><ErrMsg campo="jornadaEntrada"/></div>
            <div style={fldSt}><label style={labSt}>Hora de salida *</label><input ref={refs.jornadaSalida} type="time" style={inpSt('jornadaSalida')}/><ErrMsg campo="jornadaSalida"/></div>
          </div>
          <div style={fldSt}><label style={labSt}>Periodicidad de pago</label><select ref={refs.jornadaPago} style={inpSt('')} defaultValue="semanalmente"><option value="semanalmente">Semanal</option><option value="quincenalmente">Quincenal</option></select></div>
          <div style={{marginTop:12,padding:'10px 14px',background:'rgba(57,255,20,0.05)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:8,fontSize:12,color:'rgba(255,255,255,0.5)'}}>
            🔒 Confidencialidad post-contrato: <strong style={{color:V}}>5 años</strong> — estándar LexByte para todos los contratos.
          </div>
        </div>

        {/* PASO 4 — BENEFICIARIOS + ANÁLISIS */}
        <div style={{display:paso===4?'block':'none'}}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:600,color:V,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Beneficiarios — Art. 501 LFT</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:14}}>Los porcentajes deben sumar 100%. Si no hay beneficiarios aplica el Art. 501 LFT.</div>
            {[0,1,2].map(i=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 80px',gap:8,marginBottom:10,alignItems:'end'}}>
                <div><label style={{...labSt,fontSize:9}}>Nombre completo</label><input ref={refs[`benef${i}nombre`]} placeholder="Nombre Apellido" style={inpSt('')}/></div>
                <div><label style={{...labSt,fontSize:9}}>Parentesco</label><input ref={refs[`benef${i}parentesco`]} placeholder="Cónyuge" style={inpSt('')}/></div>
                <div><label style={{...labSt,fontSize:9}}>%</label><input ref={refs[`benef${i}pct`]} type="number" placeholder="100" min="0" max="100" style={inpSt('')}/></div>
              </div>
            ))}
          </div>

          {!analisis&&!analizando&&(
            <button onClick={analizarContrato} style={{width:'100%',background:V,color:F,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>
              ⚖️ Analizar contrato con IA →
            </button>
          )}

          {analizando&&(
            <div style={{textAlign:'center',padding:'30px 0'}}>
              <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:12}}>
                {[0,0.15,0.3].map((d,i)=><div key={i} style={{width:10,height:10,borderRadius:'50%',background:V,opacity:0.4,animation:`pulse 1.2s ${d}s infinite`}}/>)}
              </div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>Analizando contrato con IA jurídica...</div>
            </div>
          )}

          {analisis&&!analizando&&(
            <div>
              <div style={{marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>Solidez jurídica</div>
                  <div style={{fontSize:18,fontWeight:800,color:analisis.puntaje>=80?V:analisis.puntaje>=60?'#facc15':'#ef4444'}}>{analisis.puntaje}/100</div>
                </div>
                <div style={{height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${analisis.puntaje}%`,background:analisis.puntaje>=80?V:analisis.puntaje>=60?'#facc15':'#ef4444',borderRadius:3}}/>
                </div>
              </div>
              {analisis.observaciones?.map((o:any,i:number)=>(
                <div key={i} style={{padding:'9px 12px',borderRadius:8,marginBottom:8,fontSize:12.5,lineHeight:1.55,
                  background:o.tipo==='ok'?'rgba(57,255,20,0.08)':o.tipo==='error'?'rgba(239,68,68,0.08)':o.tipo==='warn'?'rgba(250,204,21,0.08)':'rgba(255,255,255,0.04)',
                  border:`0.5px solid ${o.tipo==='ok'?'rgba(57,255,20,0.2)':o.tipo==='error'?'rgba(239,68,68,0.2)':o.tipo==='warn'?'rgba(250,204,21,0.2)':'rgba(255,255,255,0.1)'}`,
                  color:o.tipo==='ok'?'#86efac':o.tipo==='error'?'#fca5a5':o.tipo==='warn'?'#fde68a':'rgba(255,255,255,0.7)'}}>
                  {o.tipo==='ok'?'✅':o.tipo==='error'?'❌':o.tipo==='warn'?'⚠️':'ℹ️'} {o.texto}
                </div>
              ))}
              {analisis.recomendacion&&(
                <div style={{marginBottom:16,padding:'10px 14px',background:'rgba(255,255,255,0.03)',border:'0.5px solid rgba(57,255,20,0.1)',borderRadius:8,fontSize:12,color:'rgba(255,255,255,0.5)'}}>
                  <strong style={{color:'rgba(255,255,255,0.8)'}}>Recomendación:</strong> {analisis.recomendacion}
                </div>
              )}
              <button onClick={descargarDocx} disabled={generando}
                style={{width:'100%',background:generando?'rgba(57,255,20,0.3)':V,color:F,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:generando?'not-allowed':'pointer',fontFamily:"'Sora',sans-serif",marginBottom:8}}>
                {generando?'Generando DOCX...':'⬇️ Descargar DOCX'}
              </button>
              <button onClick={()=>setAnalisis(null)} style={{width:'100%',background:'transparent',color:'rgba(255,255,255,0.4)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 0',fontSize:12,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>
                Volver a analizar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{padding:'12px 22px 16px',borderTop:'0.5px solid rgba(57,255,20,0.08)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <button onClick={()=>{if(paso>0){setPaso(p=>p-1);setErrores({});}}}
          style={{background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.6)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 18px',fontSize:12,cursor:paso===0?'not-allowed':'pointer',fontFamily:"'Sora',sans-serif",opacity:paso===0?0.4:1}}>
          ← Atrás
        </button>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Paso {paso+1} de 5</div>
        {paso<4&&(
          <button onClick={avanzarPaso} disabled={validandoPaso}
            style={{background:V,color:F,border:'none',borderRadius:8,padding:'9px 20px',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>
            {validandoPaso?'Validando...':'Siguiente →'}
          </button>
        )}
        {paso===4&&<div style={{width:90}}/>}
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────────
export default function LexByte() {
  const [section, setSection] = useState<Section>('lex');
  const [docTipo, setDocTipo] = useState<DocTipo>(null);
  const [msgs, setMsgs] = useState<Msg[]>([
    {role:'assistant',content:'¡Bienvenido a **LexByte**! Soy **Lex**, tu asistente jurídico laboral.\n\nPuedo ayudarte con contratos, rescisiones, actas, incapacidades, IMSS, INFONAVIT y más.\n\n¿Qué necesitas saber hoy?'}
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [freeLeft, setFreeLeft] = useState(3);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[msgs]);

  const send = async () => {
    if (!input.trim()||loading) return;
    if (freeLeft<=0){setMsgs(m=>[...m,{role:'assistant',content:'Has agotado tus consultas gratuitas. Suscríbete desde **$799 MXN/mes**.'}]);return;}
    const userMsg:Msg={role:'user',content:input};
    const newMsgs=[...msgs,userMsg];
    setMsgs(newMsgs);setInput('');setLoading(true);setFreeLeft(f=>f-1);
    try {
      const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:newMsgs.map(m=>({role:m.role,content:m.content}))})});
      const data=await res.json();
      setMsgs(m=>[...m,{role:'assistant',content:data.reply||'Error al procesar.'}]);
    } catch {setMsgs(m=>[...m,{role:'assistant',content:'Error de conexión.'}]);}
    setLoading(false);
  };

  const fmt=(t:string)=>t
    .replace(/^### (.*$)/gim,'<span style="display:block;font-size:13px;font-weight:700;color:rgba(255,255,255,0.9);margin-top:8px;margin-bottom:4px">$1</span>')
    .replace(/^## (.*$)/gim,'<span style="display:block;font-size:14px;font-weight:700;color:#39ff14;margin-top:10px;margin-bottom:4px">$1</span>')
    .replace(/^# (.*$)/gim,'<span style="display:block;font-size:15px;font-weight:800;color:#39ff14;margin-top:10px;margin-bottom:6px">$1</span>')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em style="color:rgba(255,255,255,0.8)">$1</em>')
    .replace(/^- (.*$)/gim,'<span style="display:block;padding-left:12px;margin-top:3px">• $1</span>')
    .replace(/✅/g,'<span style="color:#39ff14">✅</span>')
    .replace(/⚠️/g,'<span style="color:#facc15">⚠️</span>')
    .replace(/\n/g,'<br>');

  const sugs=['¿Puedo despedir a un trabajador que llegó borracho?','¿3 retardos equivalen a una falta?','¿Cuánto dura la incapacidad por maternidad?','¿Cuáles son los días de descanso obligatorio?','¿Qué pago en un despido injustificado?'];
  const docs=[
    {id:'capacitacion',nombre:'Capacitación Inicial',base:'Art. 39-B LFT',ready:true,icon:'ti-file-check'},
    {id:'obra',nombre:'Obra Determinada',base:'Arts. 35-36 LFT',ready:true,icon:'ti-building'},
    {id:'ind',nombre:'Tiempo Indeterminado',base:'Art. 35 LFT',ready:false,icon:'ti-file-text'},
    {id:'acta',nombre:'Acta Administrativa',base:'Art. 47 LFT',ready:false,icon:'ti-scale'},
    {id:'ren',nombre:'Renuncia Voluntaria',base:'Art. 53 LFT',ready:false,icon:'ti-signature'},
    {id:'fin',nombre:'Finiquito y Liquidación',base:'Arts. 48-50 LFT',ready:false,icon:'ti-cash'},
  ];
  const navItems=[{id:'lex',icon:'ti-scale',label:'Asistente Lex'},{id:'docs',icon:'ti-files',label:'Documentos'},{id:'historial',icon:'ti-folder',label:'Historial'},{id:'config',icon:'ti-settings',label:'Configuración'}];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:${F};color:#fff}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(57,255,20,0.25);border-radius:2px}
        @keyframes pulse{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .nav-item:hover{background:rgba(57,255,20,0.05)!important;color:rgba(255,255,255,0.75)!important}
        .sug-btn:hover{border-color:#39ff14!important;color:#39ff14!important}
        .doc-card:hover{border-color:rgba(57,255,20,0.4)!important;background:rgba(57,255,20,0.04)!important}
        input,select,textarea{font-family:'Sora',sans-serif!important}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3)!important}
        select option{background:#0b1a2e;color:#fff}
      `}</style>

      <div style={{display:'flex',height:'100vh',background:F,fontFamily:"'Sora',sans-serif",overflow:'hidden'}}>
        {/* SIDEBAR */}
        <div style={{width:230,flexShrink:0,background:SB,borderRight:'0.5px solid rgba(57,255,20,0.1)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'20px 16px 16px',borderBottom:'0.5px solid rgba(57,255,20,0.08)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,background:V,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,color:F,flexShrink:0}}>L</div>
              <div>
                <div style={{fontWeight:800,fontSize:15,color:'#fff',letterSpacing:'-0.3px'}}>Lex<span style={{color:V}}>Byte</span></div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontWeight:500,marginTop:1}}>Sistema Legal IA</div>
              </div>
            </div>
          </div>
          <nav style={{flex:1,padding:'12px 8px'}}>
            {navItems.map(item=>(
              <div key={item.id} className="nav-item" onClick={()=>{setSection(item.id as Section);setDocTipo(null);}}
                style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:8,cursor:'pointer',fontSize:12.5,fontWeight:section===item.id?600:400,color:section===item.id?V:'rgba(255,255,255,0.4)',background:section===item.id?'rgba(57,255,20,0.07)':'transparent',borderLeft:`2px solid ${section===item.id?V:'transparent'}`,marginBottom:3,transition:'all 0.15s'}}>
                <i className={`ti ${item.icon}`} style={{fontSize:16,flexShrink:0}} aria-hidden="true"/>{item.label}
              </div>
            ))}
          </nav>
          <div style={{margin:'0 12px 16px',background:'rgba(57,255,20,0.05)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:10,padding:12}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Plan actual</div>
            <div style={{fontSize:13,fontWeight:700,color:V}}>Demo Gratuita</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:2}}>{freeLeft} consultas restantes</div>
            <button style={{marginTop:10,width:'100%',background:V,color:F,border:'none',borderRadius:7,padding:'7px 0',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>Suscribirme →</button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'14px 22px',borderBottom:'0.5px solid rgba(57,255,20,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between',background:F,flexShrink:0}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:'#fff'}}>
                {section==='lex'&&'Asistente Jurídico Lex'}
                {section==='docs'&&(docTipo?`Contrato — ${docTipo==='capacitacion'?'Capacitación Inicial':'Obra Determinada'}`:'Generador de Documentos')}
                {section==='historial'&&'Historial de Documentos'}
                {section==='config'&&'Configuración'}
              </div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:2}}>
                {section==='lex'&&'LFT · LSS · INFONAVIT · SAR · NOM-035'}
                {section==='docs'&&(docTipo?'Completa los datos — los campos se validan antes de avanzar':'Selecciona el documento que necesitas')}
                {section==='historial'&&'Documentos generados por tu empresa'}
                {section==='config'&&'Datos de tu empresa y preferencias'}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {docTipo&&<button onClick={()=>setDocTipo(null)} style={{background:'transparent',color:'rgba(255,255,255,0.4)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'6px 14px',fontSize:12,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>← Documentos</button>}
              <div style={{fontSize:10,background:'rgba(57,255,20,0.08)',border:'0.5px solid rgba(57,255,20,0.2)',color:V,padding:'4px 12px',borderRadius:20,fontWeight:600}}>{freeLeft} consultas gratis</div>
              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(57,255,20,0.1)',border:'0.5px solid rgba(57,255,20,0.25)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <i className="ti ti-user" style={{fontSize:15,color:'rgba(255,255,255,0.5)'}} aria-hidden="true"/>
              </div>
            </div>
          </div>

          {/* CHAT */}
          {section==='lex'&&(
            <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{flex:1,overflowY:'auto',padding:'18px 22px',display:'flex',flexDirection:'column',gap:14}}>
                {msgs.map((m,i)=>(
                  <div key={i} style={{display:'flex',gap:10,justifyContent:m.role==='user'?'flex-end':'flex-start',animation:'fadeUp 0.25s ease',maxWidth:'82%',alignSelf:m.role==='user'?'flex-end':'flex-start'}}>
                    {m.role==='assistant'&&<div style={{width:28,height:28,borderRadius:'50%',background:'rgba(57,255,20,0.1)',border:'0.5px solid rgba(57,255,20,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,marginTop:2}}>⚖️</div>}
                    <div style={{padding:'11px 15px',borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',fontSize:13,lineHeight:1.75,background:m.role==='user'?V:'rgba(255,255,255,0.04)',color:m.role==='user'?F:'#fff',border:m.role==='assistant'?'0.5px solid rgba(57,255,20,0.1)':'none',fontWeight:m.role==='user'?600:400}}
                      dangerouslySetInnerHTML={{__html:fmt(m.content)}}/>
                    {m.role==='user'&&<div style={{width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}><i className="ti ti-user" style={{fontSize:13,color:'rgba(255,255,255,0.4)'}} aria-hidden="true"/></div>}
                  </div>
                ))}
                {loading&&<div style={{display:'flex',gap:10}}><div style={{width:28,height:28,borderRadius:'50%',background:'rgba(57,255,20,0.1)',border:'0.5px solid rgba(57,255,20,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>⚖️</div><div style={{padding:'12px 16px',background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(57,255,20,0.1)',borderRadius:'14px 14px 14px 4px',display:'flex',gap:5,alignItems:'center'}}>{[0,0.15,0.3].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:V,animation:`pulse 1.2s ${d}s infinite`}}/>)}</div></div>}
                <div ref={bottomRef}/>
              </div>
              {msgs.length<=1&&<div style={{padding:'0 22px 10px',display:'flex',flexWrap:'wrap',gap:7}}>{sugs.map(s=><button key={s} className="sug-btn" onClick={()=>setInput(s)} style={{fontSize:11.5,padding:'5px 13px',borderRadius:20,border:'0.5px solid rgba(57,255,20,0.2)',background:'rgba(57,255,20,0.04)',color:'rgba(255,255,255,0.45)',cursor:'pointer',fontFamily:"'Sora',sans-serif",transition:'all 0.15s'}}>{s}</button>)}</div>}
              <div style={{padding:'12px 22px 18px',borderTop:'0.5px solid rgba(57,255,20,0.08)',display:'flex',gap:10}}>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Escribe tu consulta laboral..."
                  style={{flex:1,padding:'11px 15px',background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(57,255,20,0.2)',borderRadius:10,color:'#fff',fontSize:13,fontFamily:"'Sora',sans-serif",width:'auto',outline:'none'}}/>
                <button onClick={send} disabled={loading||!input.trim()} style={{background:input.trim()&&!loading?V:'rgba(57,255,20,0.25)',color:F,border:'none',borderRadius:10,padding:'11px 22px',fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:13,cursor:input.trim()&&!loading?'pointer':'not-allowed',transition:'all 0.15s',flexShrink:0}}>
                  {loading?'...':'Enviar →'}
                </button>
              </div>
            </div>
          )}

          {/* CATÁLOGO */}
          {section==='docs'&&!docTipo&&(
            <div style={{flex:1,overflowY:'auto',padding:22}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
                {docs.map(d=>(
                  <div key={d.id} className={d.ready?'doc-card':''} onClick={()=>{if(d.ready)setDocTipo(d.id as DocTipo);}}
                    style={{background:'rgba(255,255,255,0.03)',border:`0.5px solid ${d.ready?'rgba(57,255,20,0.2)':'rgba(255,255,255,0.06)'}`,borderRadius:12,padding:'18px 16px',opacity:d.ready?1:0.45,cursor:d.ready?'pointer':'default',transition:'all 0.2s'}}>
                    <i className={`ti ${d.icon}`} style={{fontSize:24,color:d.ready?V:'rgba(255,255,255,0.3)',marginBottom:10,display:'block'}} aria-hidden="true"/>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:'#fff'}}>{d.nombre}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:14}}>{d.base}</div>
                    {d.ready?<button style={{background:V,color:F,border:'none',borderRadius:7,padding:'6px 14px',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>Generar →</button>
                    :<span style={{fontSize:11,color:'rgba(255,255,255,0.25)',fontWeight:500}}>Próximamente</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FORMULARIO */}
          {section==='docs'&&docTipo&&<FormContrato key={docTipo} tipo={docTipo}/>}

          {/* HISTORIAL */}
          {section==='historial'&&<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}><i className="ti ti-folder-open" style={{fontSize:44,color:'rgba(57,255,20,0.2)'}} aria-hidden="true"/><div style={{fontWeight:600,fontSize:14,color:'rgba(255,255,255,0.4)'}}>Sin documentos aún</div><div style={{fontSize:12,color:'rgba(255,255,255,0.25)'}}>Los contratos generados aparecerán aquí</div></div>}

          {/* CONFIG */}
          {section==='config'&&(
            <div style={{flex:1,overflowY:'auto',padding:22}}>
              <div style={{maxWidth:480}}>
                <div style={{fontWeight:700,fontSize:14,color:'#fff',marginBottom:18}}>Datos de la empresa</div>
                {['Nombre o razón social','RFC','Registro patronal IMSS','Correo de contacto','Ciudad / Estado'].map(label=>(
                  <div key={label} style={{marginBottom:14}}>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>{label}</div>
                    <input placeholder={`Ingresa ${label.toLowerCase()}`} style={{width:'100%',padding:'10px 14px',background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:9,color:'#fff',fontSize:13,fontFamily:"'Sora',sans-serif",outline:'none'}}/>
                  </div>
                ))}
                <button style={{background:V,color:F,border:'none',borderRadius:9,padding:'11px 26px',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif",marginTop:8}}>Guardar cambios</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
