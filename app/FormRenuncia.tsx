'use client';
import { useState, useRef, useEffect } from 'react';
import { V, F } from './shared';

export function FormRenuncia() {
  const [generando, setGenerando] = useState(false);
  const [analisis, setAnalisis] = useState<any>(null);
  const [analizando, setAnalizando] = useState(false);

  const r2: any = {
    razonSocial: useRef<HTMLInputElement>(null),
    titular: useRef<HTMLInputElement>(null),
    puesto: useRef<HTMLInputElement>(null),
    area: useRef<HTMLInputElement>(null),
    fechaIngreso: useRef<HTMLInputElement>(null),
    fechaRenuncia: useRef<HTMLInputElement>(null),
    ciudad: useRef<HTMLInputElement>(null),
    hora: useRef<HTMLInputElement>(null),
  };

  // ── DATOS DE PRUEBA — eliminar antes de producción ──
  useEffect(() => {
    setTimeout(() => {
      const d: any = {
        razonSocial: 'COMERCIALIZADORA NORTE S.A. DE C.V.',
        titular: 'MARÍA FERNANDA LÓPEZ REYES',
        puesto: 'Ejecutivo de Ventas',
        area: 'Ventas',
        fechaIngreso: '2023-03-01',
        fechaRenuncia: new Date().toISOString().slice(0, 10),
        ciudad: 'Monterrey, Nuevo León',
        hora: '14:30',
      };
      Object.entries(d).forEach(([k, val]) => { if (r2[k]?.current) r2[k].current.value = val as string; });
    }, 120);
  }, []);
  // ── FIN DATOS DE PRUEBA ──

  const getDatos = () => ({
    patronNombre: r2.razonSocial.current?.value || '',
    trabNombre: r2.titular.current?.value || '',
    puesto: r2.puesto.current?.value || '',
    area: r2.area.current?.value || '',
    fechaIngreso: r2.fechaIngreso.current?.value || '',
    fechaRenuncia: r2.fechaRenuncia.current?.value || '',
    ciudad: r2.ciudad.current?.value || '',
    hora: r2.hora.current?.value || '',
  });

  const analizar = async () => {
    if (!r2.razonSocial.current?.value || !r2.titular.current?.value) {
      alert('Completa al menos la razón social y el nombre del trabajador.'); return;
    }
    setAnalizando(true); setAnalisis(null);
    try {
      const res = await fetch('/api/analizar-contrato', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'Renuncia Voluntaria', datos: getDatos() }),
      });
      const data = await res.json();
      setAnalisis(data);
    } catch {
      setAnalisis({ puntaje: 50, observaciones: [{ tipo: 'warn', texto: 'No se pudo conectar con el análisis IA.' }], recomendacion: '' });
    }
    setAnalizando(false);
  };

  const descargar = async () => {
    setGenerando(true);
    try {
      const res = await fetch('/api/generar-docx', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'renuncia', datos: getDatos() }),
      });
      if (!res.ok) throw new Error('Error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `LexByte_renuncia_${Date.now()}.docx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert('Error al generar. Intenta de nuevo.'); }
    setGenerando(false);
  };

  const inpSt: any = { width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.05)', border:'0.5px solid rgba(57,255,20,0.2)', borderRadius:8, color:'#fff', fontSize:13, fontFamily:"'Sora',sans-serif", outline:'none' };
  const labSt: any = { fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.4px', marginBottom:5, display:'block' };
  const fldSt: any = { marginBottom:14 };
  const rowSt: any = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 };
  const secSt: any = { margin:'18px 0 12px', fontSize:11, fontWeight:600, color:V, textTransform:'uppercase' as const, letterSpacing:'0.5px' };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:22}}>
        <div style={{marginBottom:12,padding:'8px 12px',background:'rgba(57,255,20,0.05)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:8,fontSize:11,color:'rgba(255,255,255,0.4)'}}>
          🧪 Datos de prueba cargados — carta de renuncia voluntaria (Art. 53 Fracc. I LFT)
        </div>
        <div style={secSt}>Partes</div>
        <div style={fldSt}><label style={labSt}>Razón social del patrón *</label><input ref={r2.razonSocial} placeholder="Empresa XYZ S.A. de C.V." style={inpSt}/></div>
        <div style={fldSt}><label style={labSt}>Nombre del trabajador *</label><input ref={r2.titular} placeholder="Nombre completo del trabajador" style={inpSt}/></div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Puesto</label><input ref={r2.puesto} placeholder="Ejecutivo de Ventas" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Área / Departamento</label><input ref={r2.area} placeholder="Ventas" style={inpSt}/></div>
        </div>

        <div style={secSt}>Fechas y lugar</div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Fecha de ingreso</label><input ref={r2.fechaIngreso} type="date" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Fecha de la renuncia</label><input ref={r2.fechaRenuncia} type="date" style={inpSt}/></div>
        </div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Ciudad</label><input ref={r2.ciudad} placeholder="Monterrey, Nuevo León" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Hora de la carta</label><input ref={r2.hora} type="time" style={inpSt}/></div>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:-6}}>La antigüedad (años y meses) se calcula sola entre la fecha de ingreso y la de renuncia.</div>

        {analisis && !analizando && (
          <div style={{marginTop:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>Solidez jurídica</div>
              <div style={{fontSize:18,fontWeight:800,color:analisis.puntaje>=80?V:analisis.puntaje>=60?'#facc15':'#ef4444'}}>{analisis.puntaje}/100</div>
            </div>
            <div style={{height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden',marginBottom:14}}>
              <div style={{height:'100%',width:`${analisis.puntaje}%`,background:analisis.puntaje>=80?V:analisis.puntaje>=60?'#facc15':'#ef4444',borderRadius:3}}/>
            </div>
            {analisis.observaciones?.map((o:any,i:number)=>(
              <div key={i} style={{padding:'9px 12px',borderRadius:8,marginBottom:8,fontSize:12.5,lineHeight:1.55,
                background:o.tipo==='ok'?'rgba(57,255,20,0.08)':o.tipo==='error'?'rgba(239,68,68,0.08)':o.tipo==='warn'?'rgba(250,204,21,0.08)':'rgba(255,255,255,0.04)',
                border:`0.5px solid ${o.tipo==='ok'?'rgba(57,255,20,0.2)':o.tipo==='error'?'rgba(239,68,68,0.2)':o.tipo==='warn'?'rgba(250,204,21,0.2)':'rgba(255,255,255,0.1)'}`,
                color:o.tipo==='ok'?'#86efac':o.tipo==='error'?'#fca5a5':o.tipo==='warn'?'#fde68a':'rgba(255,255,255,0.7)'}}>
                {o.tipo==='ok'?'✅':o.tipo==='error'?'❌':o.tipo==='warn'?'⚠️':'ℹ️'} {o.texto}
              </div>
            ))}
            {analisis.recomendacion && (
              <div style={{padding:'10px 14px',background:'rgba(255,255,255,0.03)',border:'0.5px solid rgba(57,255,20,0.1)',borderRadius:8,fontSize:12,color:'rgba(255,255,255,0.5)'}}>
                <strong style={{color:'rgba(255,255,255,0.8)'}}>Recomendación:</strong> {analisis.recomendacion}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{padding:'12px 22px 16px',borderTop:'0.5px solid rgba(57,255,20,0.08)',flexShrink:0}}>
        {!analisis && (
          <button onClick={analizar} disabled={analizando}
            style={{width:'100%',background:V,color:F,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:analizando?'wait':'pointer',fontFamily:"'Sora',sans-serif"}}>
            {analizando?'Analizando con IA…':'⚖️ Analizar carta con IA →'}
          </button>
        )}
        {analisis && (
          <>
            <button onClick={descargar} disabled={generando}
              style={{width:'100%',background:generando?'rgba(57,255,20,0.3)':V,color:F,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:generando?'not-allowed':'pointer',fontFamily:"'Sora',sans-serif",marginBottom:8}}>
              {generando?'Generando DOCX…':'⬇️ Descargar Carta de Renuncia (DOCX)'}
            </button>
            <button onClick={()=>setAnalisis(null)} style={{width:'100%',background:'transparent',color:'rgba(255,255,255,0.4)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 0',fontSize:12,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>
              Volver a analizar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
