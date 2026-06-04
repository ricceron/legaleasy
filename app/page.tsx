'use client';
import { useState, useRef, useEffect } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
type Section = 'lex' | 'docs' | 'historial' | 'config';
type DocTipo = 'capacitacion' | 'obra' | null;

const V = '#39ff14';
const F = '#060f1e';
const SB = '#080f1c';

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
    else if (!validarSalario(v(refs.condSalario))) errs.condSalario = '⚠️ Menor al SMV 2025 ($248.93) — Art. 85 LFT';
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

  // ── DATOS DE PRUEBA — eliminar antes de producción ──
  useEffect(() => {
    const defaults: any = {
      patronNombre: 'COMERCIALIZADORA NORTE S.A. DE C.V.',
      patronRFC: 'CNO900101ABC',
      patronRegIMSS: 'B12345678104',
      patronDomicilio: 'Av. Constitución 1500, Col. Centro, C.P. 64000',
      patronCiudad: 'Monterrey, Nuevo León',
      patronCorreo: 'privacidad@comercializadora.com',
      patronRepresentante: 'Lic. Roberto García Martínez',
      trabNombre: 'MARÍA FERNANDA LÓPEZ REYES',
      trabNacimiento: '1995-06-15',
      trabNacionalidad: 'México',
      trabRFC: 'LORM950615MNL',
      trabCURP: 'LORM950615MNLPRY09',
      trabNSS: '45678912345',
      trabDomicilio: 'Calle Roble 234, Col. Jardines, C.P. 64500, Monterrey, N.L.',
      condPuesto: 'Ejecutivo de Ventas',
      condArea: 'Ventas',
      condInicio: '2026-06-01',
      condTermino: '2026-08-29',
      condSalario: '350',
      condAguinaldo: '15',
      condPrima: '25',
      condActividades: 'Atención y seguimiento a clientes\nElaboración de cotizaciones\nCierre de ventas y negociación\nReporte semanal de resultados',
      jornadaEntrada: '09:00',
      jornadaSalida: '18:00',
      benef0nombre: 'Carlos López Martínez',
      benef0parentesco: 'Cónyuge',
      benef0pct: '100',
    };
    setTimeout(() => {
      Object.entries(defaults).forEach(([key, val]) => {
        const ref = refs[key];
        if (ref?.current) ref.current.value = val as string;
      });
      // Selects
      if (refs.patronTipo.current) refs.patronTipo.current.value = 'moral';
      if (refs.trabSexo.current) refs.trabSexo.current.value = 'FEMENINO';
      if (refs.duracion.current) refs.duracion.current.value = '90';
      if (refs.jornadaTipo.current) refs.jornadaTipo.current.value = 'diurna';
      if (refs.jornadaDescanso.current) refs.jornadaDescanso.current.value = 'domingo';
      if (refs.jornadaPago.current) refs.jornadaPago.current.value = 'quincenalmente';
    }, 150);
  }, []);
  // ── FIN DATOS DE PRUEBA ──

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
    const errs = validarPaso(paso, tipo, refs);
    if (Object.keys(errs).length > 0) { setErrores(errs); return; }
    setErrores({});
    setPaso(p => p + 1);
  };

  const analizarContrato = async () => {
    setAnalizando(true); setAnalisis(null);
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
  const ErrMsg = ({ campo }: { campo: string }) => errores[campo] ? <div style={{fontSize:11,color:'#fca5a5',marginTop:4}}>⚠️ {errores[campo]}</div> : null;
  const pasosTitulos = ['Patrón','Trabajador','Condiciones','Jornada','Revisión IA'];

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
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
          <div style={{marginBottom:12,padding:'8px 12px',background:'rgba(57,255,20,0.05)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:8,fontSize:11,color:'rgba(255,255,255,0.4)'}}>
            🧪 Datos de prueba cargados — modifica lo que necesites
          </div>
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
