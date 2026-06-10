'use client';
import { useState, useRef, useEffect } from 'react';
import { V, F, LIMITES_JORNADA, calcularJornada, validarPaso, type DocTipo, type ErrorMap } from './shared';

export function FormContrato({ tipo }: { tipo: DocTipo }) {
  const [paso, setPaso] = useState(0);
  const [errores, setErrores] = useState<ErrorMap>({});
  const [validandoPaso, setValidandoPaso] = useState(false);
  const [analisis, setAnalisis] = useState<any>(null);
  const [analizando, setAnalizando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [previewJornada, setPreviewJornada] = useState<{spanHoras:number;horasEfectivas:number}>({spanHoras:0,horasEfectivas:0});

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
    jornadaContinua: useRef<HTMLSelectElement>(null),
    jornadaDuracionComida: useRef<HTMLSelectElement>(null),
    jornadaInicioComida: useRef<HTMLInputElement>(null),
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
      jornadaInicioComida: '14:00',
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
      if (refs.jornadaContinua.current) refs.jornadaContinua.current.value = 'discontinua';
      if (refs.jornadaDuracionComida.current) refs.jornadaDuracionComida.current.value = '60';
      if (refs.jornadaDescanso.current) refs.jornadaDescanso.current.value = 'domingo';
      if (refs.jornadaPago.current) refs.jornadaPago.current.value = 'quincenalmente';
      recalcularJornada();
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
    jornadaContinua: refs.jornadaContinua.current?.value||'discontinua',
    jornadaDuracionComida: Number(refs.jornadaDuracionComida.current?.value||'60'),
    jornadaInicioComida: refs.jornadaInicioComida.current?.value||'14:00',
    horasEfectivas: calcularJornada(
      refs.jornadaEntrada.current?.value||'',
      refs.jornadaSalida.current?.value||'',
      Number(refs.jornadaDuracionComida.current?.value||'60'),
      (refs.jornadaContinua.current?.value||'discontinua') === 'continua',
    ).horasEfectivas,
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

  const recalcularJornada = () => {
    const continua = (refs.jornadaContinua.current?.value || 'discontinua') === 'continua';
    const dur = Number(refs.jornadaDuracionComida.current?.value || '60');
    setPreviewJornada(calcularJornada(
      refs.jornadaEntrada.current?.value || '',
      refs.jornadaSalida.current?.value || '',
      dur, continua,
    ));
  };

  const analizarContrato = async () => {
    setAnalizando(true); setAnalisis(null);
    try {
      const res = await fetch('/api/analizar-contrato', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipo==='capacitacion'?'Capacitación Inicial':tipo==='indeterminado'?'Tiempo Indeterminado':'Obra Determinada', datos: getDatos() }),
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
          {tipo==='indeterminado'&&<>
            <div style={fldSt}><label style={labSt}>Jefe inmediato</label><input ref={refs.condJefe} placeholder="Lic. Ana Ruiz — Gerente de Ventas" style={inpSt('')}/></div>
            <div style={fldSt}><label style={labSt}>Fecha de ingreso *</label><input ref={refs.condInicio} type="date" style={inpSt('condInicio')}/><ErrMsg campo="condInicio"/></div>
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
            <div style={fldSt}><label style={labSt}>Tipo de jornada</label><select ref={refs.jornadaTipo} onChange={recalcularJornada} style={inpSt('')} defaultValue="diurna"><option value="diurna">Diurna (máx. 8 h)</option><option value="nocturna">Nocturna (máx. 7 h)</option><option value="mixta">Mixta (máx. 7.5 h)</option></select></div>
            <div style={fldSt}><label style={labSt}>Día de descanso semanal</label><select ref={refs.jornadaDescanso} style={inpSt('')} defaultValue="domingo"><option value="lunes">Lunes</option><option value="martes">Martes</option><option value="miércoles">Miércoles</option><option value="jueves">Jueves</option><option value="viernes">Viernes</option><option value="sábado">Sábado</option><option value="domingo">Domingo</option></select></div>
          </div>
          <div style={rowSt}>
            <div style={fldSt}><label style={labSt}>Hora de entrada *</label><input ref={refs.jornadaEntrada} onChange={recalcularJornada} type="time" style={inpSt('jornadaEntrada')}/><ErrMsg campo="jornadaEntrada"/></div>
            <div style={fldSt}><label style={labSt}>Hora de salida *</label><input ref={refs.jornadaSalida} onChange={recalcularJornada} type="time" style={inpSt('jornadaSalida')}/><ErrMsg campo="jornadaSalida"/></div>
          </div>
          <div style={rowSt}>
            <div style={fldSt}>
              <label style={labSt}>¿Puede salir del centro a comer?</label>
              <select ref={refs.jornadaContinua} onChange={recalcularJornada} style={inpSt('')} defaultValue="discontinua">
                <option value="discontinua">Sí — sale a comer fuera (jornada discontinua)</option>
                <option value="continua">No — permanece en el lugar (jornada continua)</option>
              </select>
            </div>
            <div style={fldSt}>
              <label style={labSt}>Duración de la comida</label>
              <select ref={refs.jornadaDuracionComida} onChange={recalcularJornada} style={inpSt('jornadaDuracionComida')} defaultValue="60">
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1.5 horas</option>
                <option value="120">2 horas</option>
              </select>
              <ErrMsg campo="jornadaDuracionComida"/>
            </div>
          </div>
          <div style={fldSt}><label style={labSt}>Hora de inicio de la comida</label><input ref={refs.jornadaInicioComida} type="time" defaultValue="14:00" style={inpSt('')}/></div>
          {(() => {
            const tipoJ = refs.jornadaTipo.current?.value || 'diurna';
            const limite = LIMITES_JORNADA[tipoJ] ?? 8;
            const continua = (refs.jornadaContinua.current?.value || 'discontinua') === 'continua';
            const dur = Number(refs.jornadaDuracionComida.current?.value || '60');
            const ok = previewJornada.horasEfectivas > 0 && previewJornada.horasEfectivas <= limite + 0.001;
            const aviso = !continua && dur > 60;
            return (
              <div style={{marginTop:4,padding:'10px 14px',background:ok?'rgba(57,255,20,0.05)':'rgba(239,68,68,0.07)',border:`0.5px solid ${ok?'rgba(57,255,20,0.18)':'rgba(239,68,68,0.25)'}`,borderRadius:8,fontSize:12.5,color:'rgba(255,255,255,0.6)'}}>
                <div>Presencia: <strong style={{color:'#fff'}}>{previewJornada.spanHoras.toFixed(2)} h</strong> · Jornada efectiva: <strong style={{color:ok?V:'#fca5a5'}}>{previewJornada.horasEfectivas.toFixed(2)} h</strong> (límite {tipoJ}: {limite} h) {ok?'✅':'❌'}</div>
                {aviso && <div style={{marginTop:6,fontSize:11.5,color:'#fde68a'}}>⚠️ Comida mayor a 1 h: verifica que refleje la operación real; una comida larga "a modo" puede recaracterizarse como tiempo efectivo (simulación).</div>}
              </div>
            );
          })()}
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
