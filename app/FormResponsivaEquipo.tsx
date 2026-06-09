'use client';
import { useState, useRef, useEffect } from 'react';
import { V, F } from './shared';

// Esquemas de equipo: al elegir el tipo, cambian los campos que se piden.
const SCHEMAS: any = {
  computo: { titulo: 'EQUIPO DE CÓMPUTO:', label: 'Equipo de cómputo', campos: [
    { k: 'subtipo', label: 'Tipo de equipo', ph: 'LAPTOP / DESKTOP / TABLET' },
    { k: 'marca', label: 'Marca', ph: 'MARCA' },
    { k: 'modelo', label: 'Modelo', ph: 'MODELO' },
    { k: 'serie', label: 'Número de serie', ph: 'NÚMERO DE SERIE' },
    { k: 'so', label: 'Sistema operativo', ph: 'SISTEMA OPERATIVO Y VERSIÓN' },
    { k: 'accesorios', label: 'Accesorios incluidos', ph: 'CARGADOR / MOUSE / MOCHILA / OTROS' },
  ]},
  telefono: { titulo: 'EQUIPO TELEFÓNICO:', label: 'Equipo telefónico', campos: [
    { k: 'marca', label: 'Marca', ph: 'MARCA' },
    { k: 'modelo', label: 'Modelo', ph: 'MODELO' },
    { k: 'serie', label: 'Número de serie / IMEI', ph: 'NÚMERO DE SERIE / IMEI' },
    { k: 'numero', label: 'Número asignado', ph: "NÚMERO TELEFÓNICO CORPORATIVO O 'NO APLICA'" },
    { k: 'accesorios', label: 'Accesorios incluidos', ph: 'CARGADOR / FUNDA / OTROS' },
  ]},
  tablet: { titulo: 'TABLET:', label: 'Tablet', campos: [
    { k: 'marca', label: 'Marca', ph: 'MARCA' },
    { k: 'modelo', label: 'Modelo', ph: 'MODELO' },
    { k: 'serie', label: 'Número de serie', ph: 'NÚMERO DE SERIE' },
    { k: 'so', label: 'Sistema operativo', ph: 'SISTEMA OPERATIVO' },
    { k: 'accesorios', label: 'Accesorios incluidos', ph: 'CARGADOR / FUNDA / OTROS' },
  ]},
  monitor: { titulo: 'MONITOR / PANTALLA:', label: 'Monitor / Pantalla', campos: [
    { k: 'marca', label: 'Marca', ph: 'MARCA' },
    { k: 'modelo', label: 'Modelo', ph: 'MODELO' },
    { k: 'serie', label: 'Número de serie', ph: 'NÚMERO DE SERIE' },
    { k: 'tam', label: 'Tamaño', ph: '24" / 27"' },
    { k: 'accesorios', label: 'Accesorios incluidos', ph: 'CABLES / BASE / OTROS' },
  ]},
  otro: { titulo: 'OTRO EQUIPO O HERRAMIENTA:', label: 'Otro equipo o herramienta', campos: [
    { k: 'descripcion', label: 'Descripción del bien', ph: 'DESCRIPCIÓN DEL BIEN' },
    { k: 'marca', label: 'Marca', ph: 'MARCA' },
    { k: 'modelo', label: 'Modelo', ph: 'MODELO' },
    { k: 'serie', label: 'Número de serie', ph: "NÚMERO DE SERIE O 'NO APLICA'" },
    { k: 'accesorios', label: 'Accesorios incluidos', ph: "ACCESORIOS O 'NINGUNO'" },
  ]},
};
const TIPOS: [string, string][] = [['computo','Equipo de cómputo'],['telefono','Equipo telefónico'],['tablet','Tablet'],['monitor','Monitor / Pantalla'],['otro','Otro equipo o herramienta']];

export function FormResponsivaEquipo() {
  const [generando, setGenerando] = useState(false);
  const [analisis, setAnalisis] = useState<any>(null);
  const [analizando, setAnalizando] = useState(false);
  const [equipos, setEquipos] = useState<any[]>([
    { id: 'it_1', tipo: 'computo', campos: { subtipo: 'Laptop', marca: 'Dell', modelo: 'Latitude 5440', serie: 'SN-DL5440-00123', so: 'Windows 11 Pro', accesorios: 'Cargador y mochila' } },
    { id: 'it_2', tipo: 'telefono', campos: { marca: 'Samsung', modelo: 'Galaxy A55', serie: 'IMEI 359...12', numero: '81-0000-0000', accesorios: 'Cargador y funda' } },
  ]);
  const idRef = useRef(3);

  const C = ['razonSocial','titular','puesto','ciudad','fecha','representante','cargoRepresentante'];
  const r2: any = {};
  C.forEach(k => { r2[k] = useRef<HTMLInputElement>(null); });

  useEffect(() => {
    setTimeout(() => {
      const d: any = { razonSocial:'COMERCIALIZADORA NORTE S.A. DE C.V.', titular:'MARÍA FERNANDA LÓPEZ REYES', puesto:'Ejecutivo de Ventas', ciudad:'Monterrey, Nuevo León', fecha:new Date().toISOString().slice(0,10), representante:'Lic. Roberto García Martínez', cargoRepresentante:'Gerente de Recursos Humanos' };
      Object.entries(d).forEach(([k,val]) => { if (r2[k]?.current) r2[k].current.value = val as string; });
    }, 120);
  }, []);

  const addEquipo = () => setEquipos(e => [...e, { id: 'it_' + (idRef.current++), tipo: 'computo', campos: {} }]);
  const removeEquipo = (id: string) => setEquipos(e => e.filter(x => x.id !== id));
  const setTipo = (id: string, tipo: string) => setEquipos(e => e.map(x => x.id === id ? { ...x, tipo, campos: {} } : x));
  const setCampo = (id: string, k: string, val: string) => setEquipos(e => e.map(x => x.id === id ? { ...x, campos: { ...x.campos, [k]: val } } : x));

  const getDatos = () => {
    const o: any = {}; C.forEach(k => { o[k] = r2[k].current?.value || ''; });
    return {
      patronNombre: o.razonSocial, trabNombre: o.titular, ...o,
      equipos: equipos.map(it => {
        const s = SCHEMAS[it.tipo];
        return { titulo: s.titulo, tipo: s.label, filas: s.campos.map((c: any) => [c.label + ':', it.campos[c.k] || '', c.ph]) };
      }),
    };
  };

  const analizar = async () => {
    if (!r2.razonSocial.current?.value || !r2.titular.current?.value) { alert('Completa al menos la razón social y el nombre del trabajador.'); return; }
    setAnalizando(true); setAnalisis(null);
    try {
      const res = await fetch('/api/analizar-contrato', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tipo:'Carta Responsiva de Equipo', datos:getDatos() }) });
      setAnalisis(await res.json());
    } catch { setAnalisis({ puntaje:50, observaciones:[{tipo:'warn',texto:'No se pudo conectar con el análisis IA.'}], recomendacion:'' }); }
    setAnalizando(false);
  };

  const descargar = async () => {
    setGenerando(true);
    try {
      const res = await fetch('/api/generar-docx', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tipo:'responsiva_equipo', datos:getDatos() }) });
      if (!res.ok) throw new Error();
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `LexByte_responsiva_equipo_${Date.now()}.docx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { alert('Error al generar. Intenta de nuevo.'); }
    setGenerando(false);
  };

  const inpSt:any={width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.05)',border:'0.5px solid rgba(57,255,20,0.2)',borderRadius:8,color:'#fff',fontSize:13,fontFamily:"'Sora',sans-serif",outline:'none'};
  const labSt:any={fontSize:10,color:'rgba(255,255,255,0.4)',fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'0.4px',marginBottom:5,display:'block'};
  const fldSt:any={marginBottom:12};
  const rowSt:any={display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12};
  const secSt:any={margin:'18px 0 12px',fontSize:11,fontWeight:600,color:V,textTransform:'uppercase' as const,letterSpacing:'0.5px'};

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:22}}>
        <div style={{marginBottom:12,padding:'8px 12px',background:'rgba(57,255,20,0.05)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:8,fontSize:11,color:'rgba(255,255,255,0.4)'}}>🧪 Datos de prueba cargados — responsiva de equipo (Arts. 134-VI y 135-IX LFT)</div>

        <div style={secSt}>Partes y fecha</div>
        <div style={fldSt}><label style={labSt}>Razón social del patrón *</label><input ref={r2.razonSocial} placeholder="Empresa XYZ S.A. de C.V." style={inpSt}/></div>
        <div style={fldSt}><label style={labSt}>Nombre del trabajador *</label><input ref={r2.titular} placeholder="Nombre completo del trabajador/a" style={inpSt}/></div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Puesto</label><input ref={r2.puesto} placeholder="Ejecutivo de Ventas" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Ciudad</label><input ref={r2.ciudad} placeholder="Monterrey, Nuevo León" style={inpSt}/></div>
        </div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Fecha</label><input ref={r2.fecha} type="date" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Cargo del representante</label><input ref={r2.cargoRepresentante} placeholder="Gerente de RH" style={inpSt}/></div>
        </div>
        <div style={fldSt}><label style={labSt}>Nombre del representante del patrón</label><input ref={r2.representante} placeholder="Lic. Nombre Apellido" style={inpSt}/></div>

        <div style={{...secSt,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Equipo asignado ({equipos.length})</span>
          <button onClick={addEquipo} style={{background:'rgba(57,255,20,0.1)',color:V,border:'0.5px solid rgba(57,255,20,0.3)',borderRadius:7,padding:'5px 12px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Sora',sans-serif",textTransform:'none'}}>+ Agregar equipo</button>
        </div>

        {equipos.map((it) => (
          <div key={it.id} style={{border:'0.5px solid rgba(57,255,20,0.18)',borderRadius:10,padding:14,marginBottom:12,background:'rgba(255,255,255,0.02)'}}>
            <div style={{display:'flex',gap:10,alignItems:'flex-end',marginBottom:10}}>
              <div style={{flex:1}}>
                <label style={labSt}>Tipo de equipo</label>
                <select value={it.tipo} onChange={e=>setTipo(it.id, e.target.value)} style={inpSt}>
                  {TIPOS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {equipos.length>1 && (
                <button onClick={()=>removeEquipo(it.id)} style={{background:'rgba(239,68,68,0.1)',color:'#fca5a5',border:'0.5px solid rgba(239,68,68,0.3)',borderRadius:7,padding:'9px 12px',fontSize:12,cursor:'pointer',fontFamily:"'Sora',sans-serif",flexShrink:0}}>Quitar</button>
              )}
            </div>
            {SCHEMAS[it.tipo].campos.map((c:any)=>(
              <div key={c.k} style={fldSt}>
                <label style={labSt}>{c.label}</label>
                <input value={it.campos[c.k]||''} onChange={e=>setCampo(it.id, c.k, e.target.value)} placeholder={c.ph} style={inpSt}/>
              </div>
            ))}
          </div>
        ))}

        {analisis && !analizando && (
          <div style={{marginTop:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>Solidez jurídica</div><div style={{fontSize:18,fontWeight:800,color:analisis.puntaje>=80?V:analisis.puntaje>=60?'#facc15':'#ef4444'}}>{analisis.puntaje}/100</div></div>
            <div style={{height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden',marginBottom:14}}><div style={{height:'100%',width:`${analisis.puntaje}%`,background:analisis.puntaje>=80?V:analisis.puntaje>=60?'#facc15':'#ef4444',borderRadius:3}}/></div>
            {analisis.observaciones?.map((o:any,i:number)=>(<div key={i} style={{padding:'9px 12px',borderRadius:8,marginBottom:8,fontSize:12.5,lineHeight:1.55,background:o.tipo==='ok'?'rgba(57,255,20,0.08)':o.tipo==='error'?'rgba(239,68,68,0.08)':o.tipo==='warn'?'rgba(250,204,21,0.08)':'rgba(255,255,255,0.04)',border:`0.5px solid ${o.tipo==='ok'?'rgba(57,255,20,0.2)':o.tipo==='error'?'rgba(239,68,68,0.2)':o.tipo==='warn'?'rgba(250,204,21,0.2)':'rgba(255,255,255,0.1)'}`,color:o.tipo==='ok'?'#86efac':o.tipo==='error'?'#fca5a5':o.tipo==='warn'?'#fde68a':'rgba(255,255,255,0.7)'}}>{o.tipo==='ok'?'✅':o.tipo==='error'?'❌':o.tipo==='warn'?'⚠️':'ℹ️'} {o.texto}</div>))}
            {analisis.recomendacion && (<div style={{padding:'10px 14px',background:'rgba(255,255,255,0.03)',border:'0.5px solid rgba(57,255,20,0.1)',borderRadius:8,fontSize:12,color:'rgba(255,255,255,0.5)'}}><strong style={{color:'rgba(255,255,255,0.8)'}}>Recomendación:</strong> {analisis.recomendacion}</div>)}
          </div>
        )}
      </div>
      <div style={{padding:'12px 22px 16px',borderTop:'0.5px solid rgba(57,255,20,0.08)',flexShrink:0}}>
        {!analisis && (<button onClick={analizar} disabled={analizando} style={{width:'100%',background:V,color:F,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:analizando?'wait':'pointer',fontFamily:"'Sora',sans-serif"}}>{analizando?'Analizando con IA…':'⚖️ Analizar carta con IA →'}</button>)}
        {analisis && (<><button onClick={descargar} disabled={generando} style={{width:'100%',background:generando?'rgba(57,255,20,0.3)':V,color:F,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:generando?'not-allowed':'pointer',fontFamily:"'Sora',sans-serif",marginBottom:8}}>{generando?'Generando DOCX…':'⬇️ Descargar Carta Responsiva (DOCX)'}</button><button onClick={()=>setAnalisis(null)} style={{width:'100%',background:'transparent',color:'rgba(255,255,255,0.4)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 0',fontSize:12,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>Volver a analizar</button></>)}
      </div>
    </div>
  );
}
