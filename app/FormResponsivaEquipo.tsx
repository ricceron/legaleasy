'use client';
import { useState, useRef, useEffect } from 'react';
import { V, F } from './shared';

export function FormResponsivaEquipo() {
  const [generando, setGenerando] = useState(false);
  const [analisis, setAnalisis] = useState<any>(null);
  const [analizando, setAnalizando] = useState(false);

  const K = ['razonSocial','titular','puesto','ciudad','fecha','representante','cargoRepresentante','compTipo','compMarca','compModelo','compSerie','compSO','compAccesorios','telMarca','telModelo','telSerie','telNumero','telAccesorios','otro1','otro2'];
  const r2: any = {};
  K.forEach(k => { r2[k] = useRef<HTMLInputElement>(null); });

  useEffect(() => {
    setTimeout(() => {
      const d: any = {
        razonSocial:'COMERCIALIZADORA NORTE S.A. DE C.V.', titular:'MARÍA FERNANDA LÓPEZ REYES', puesto:'Ejecutivo de Ventas',
        ciudad:'Monterrey, Nuevo León', fecha:new Date().toISOString().slice(0,10), representante:'Lic. Roberto García Martínez', cargoRepresentante:'Gerente de Recursos Humanos',
        compTipo:'Laptop', compMarca:'Dell', compModelo:'Latitude 5440', compSerie:'SN-DL5440-00123', compSO:'Windows 11 Pro', compAccesorios:'Cargador y mochila',
        telMarca:'Samsung', telModelo:'Galaxy A55', telSerie:'IMEI 359...12', telNumero:'81-0000-0000', telAccesorios:'Cargador y funda',
        otro1:'Ninguno', otro2:'Ninguno',
      };
      Object.entries(d).forEach(([k,val]) => { if (r2[k]?.current) r2[k].current.value = val as string; });
    }, 120);
  }, []);

  const getDatos = () => {
    const o: any = {}; K.forEach(k => { o[k] = r2[k].current?.value || ''; });
    return { patronNombre:o.razonSocial, trabNombre:o.titular, ...o };
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
  const fldSt:any={marginBottom:14};
  const rowSt:any={display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14};
  const secSt:any={margin:'18px 0 12px',fontSize:11,fontWeight:600,color:V,textTransform:'uppercase' as const,letterSpacing:'0.5px'};
  const Fld=({k,label,ph}:{k:string;label:string;ph:string})=>(<div style={fldSt}><label style={labSt}>{label}</label><input ref={r2[k]} placeholder={ph} style={inpSt}/></div>);

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:22}}>
        <div style={{marginBottom:12,padding:'8px 12px',background:'rgba(57,255,20,0.05)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:8,fontSize:11,color:'rgba(255,255,255,0.4)'}}>🧪 Datos de prueba cargados — responsiva de equipo (Arts. 134-VI y 135-IX LFT)</div>
        <div style={secSt}>Partes y fecha</div>
        <Fld k="razonSocial" label="Razón social del patrón *" ph="Empresa XYZ S.A. de C.V."/>
        <Fld k="titular" label="Nombre del trabajador *" ph="Nombre completo del trabajador/a"/>
        <div style={rowSt}><Fld k="puesto" label="Puesto" ph="Ejecutivo de Ventas"/><div style={fldSt}><label style={labSt}>Ciudad</label><input ref={r2.ciudad} placeholder="Monterrey, Nuevo León" style={inpSt}/></div></div>
        <div style={rowSt}><div style={fldSt}><label style={labSt}>Fecha</label><input ref={r2.fecha} type="date" style={inpSt}/></div><Fld k="cargoRepresentante" label="Cargo del representante" ph="Gerente de RH"/></div>
        <Fld k="representante" label="Nombre del representante del patrón" ph="Lic. Nombre Apellido"/>

        <div style={secSt}>Equipo de cómputo</div>
        <div style={rowSt}><Fld k="compTipo" label="Tipo" ph="Laptop / Desktop / Tablet"/><Fld k="compMarca" label="Marca" ph="Dell"/></div>
        <div style={rowSt}><Fld k="compModelo" label="Modelo" ph="Latitude 5440"/><Fld k="compSerie" label="Número de serie" ph="SN-..."/></div>
        <div style={rowSt}><Fld k="compSO" label="Sistema operativo" ph="Windows 11 Pro"/><Fld k="compAccesorios" label="Accesorios" ph="Cargador, mouse, mochila"/></div>

        <div style={secSt}>Equipo telefónico</div>
        <div style={rowSt}><Fld k="telMarca" label="Marca" ph="Samsung"/><Fld k="telModelo" label="Modelo" ph="Galaxy A55"/></div>
        <div style={rowSt}><Fld k="telSerie" label="Serie / IMEI" ph="IMEI ..."/><Fld k="telNumero" label="Número asignado" ph="81-... o 'No aplica'"/></div>
        <Fld k="telAccesorios" label="Accesorios" ph="Cargador, funda"/>

        <div style={secSt}>Otros equipos o herramientas</div>
        <Fld k="otro1" label="Descripción 1" ph="Descripción, marca, serie — o 'Ninguno'"/>
        <Fld k="otro2" label="Descripción 2" ph="Descripción, marca, serie — o 'Ninguno'"/>

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
