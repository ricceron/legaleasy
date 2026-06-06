'use client';
import { useState, useRef, useEffect } from 'react';
import { V, F } from './shared';

export function FormAviso() {
  const [generando, setGenerando] = useState(false);
  const r2: any = {
    razonSocial: useRef<HTMLInputElement>(null),
    domicilio: useRef<HTMLInputElement>(null),
    correo: useRef<HTMLInputElement>(null),
    titular: useRef<HTMLInputElement>(null),
    ciudad: useRef<HTMLInputElement>(null),
    fecha: useRef<HTMLInputElement>(null),
  };

  // ── DATOS DE PRUEBA — eliminar antes de producción ──
  useEffect(() => {
    setTimeout(() => {
      const d: any = {
        razonSocial: 'COMERCIALIZADORA NORTE S.A. DE C.V.',
        domicilio: 'Av. Constitución 1500, Col. Centro, C.P. 64000, Monterrey, N.L.',
        correo: 'privacidad@comercializadora.com',
        titular: 'MARÍA FERNANDA LÓPEZ REYES',
        ciudad: 'Monterrey, Nuevo León',
        fecha: new Date().toISOString().slice(0, 10),
      };
      Object.entries(d).forEach(([k, val]) => { if (r2[k]?.current) r2[k].current.value = val as string; });
    }, 120);
  }, []);
  // ── FIN DATOS DE PRUEBA ──

  const getDatos = () => ({
    patronNombre: r2.razonSocial.current?.value || '',
    patronDomicilio: r2.domicilio.current?.value || '',
    patronCorreo: r2.correo.current?.value || '',
    trabNombre: r2.titular.current?.value || '',
    ciudad: r2.ciudad.current?.value || '',
    avisoFecha: r2.fecha.current?.value || '',
  });

  const descargar = async () => {
    if (!r2.razonSocial.current?.value || !r2.domicilio.current?.value || !r2.correo.current?.value) {
      alert('Completa razón social, domicilio y correo de privacidad.'); return;
    }
    setGenerando(true);
    try {
      const res = await fetch('/api/generar-docx', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'aviso', datos: getDatos() }),
      });
      if (!res.ok) throw new Error('Error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `LexByte_aviso_${Date.now()}.docx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert('Error al generar. Intenta de nuevo.'); }
    setGenerando(false);
  };

  const inpSt: any = { width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.05)', border:'0.5px solid rgba(57,255,20,0.2)', borderRadius:8, color:'#fff', fontSize:13, fontFamily:"'Sora',sans-serif", outline:'none' };
  const labSt: any = { fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.4px', marginBottom:5, display:'block' };
  const fldSt: any = { marginBottom:14 };
  const rowSt: any = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:22}}>
        <div style={{marginBottom:12,padding:'8px 12px',background:'rgba(57,255,20,0.05)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:8,fontSize:11,color:'rgba(255,255,255,0.4)'}}>
          🧪 Datos de prueba cargados — aviso integral conforme a la LFPDPPP (formato laboral aprobado)
        </div>
        <div style={fldSt}><label style={labSt}>Razón social del patrón *</label><input ref={r2.razonSocial} placeholder="Empresa XYZ S.A. de C.V." style={inpSt}/></div>
        <div style={fldSt}><label style={labSt}>Domicilio completo *</label><input ref={r2.domicilio} placeholder="Calle, número, colonia, C.P., ciudad, estado" style={inpSt}/></div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Correo de privacidad (ARCO) *</label><input ref={r2.correo} type="email" placeholder="privacidad@empresa.com" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Ciudad (lugar de firma)</label><input ref={r2.ciudad} placeholder="Monterrey, Nuevo León" style={inpSt}/></div>
        </div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Nombre del trabajador (titular)</label><input ref={r2.titular} placeholder="Nombre del trabajador" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Fecha del aviso</label><input ref={r2.fecha} type="date" style={inpSt}/></div>
        </div>
        <div style={{marginTop:8,padding:'10px 14px',background:'rgba(57,255,20,0.04)',border:'0.5px solid rgba(57,255,20,0.12)',borderRadius:8,fontSize:11.5,color:'rgba(255,255,255,0.45)',lineHeight:1.6}}>
          El aviso integral incluye automáticamente las 12 secciones del formato laboral: datos recabados, datos sensibles, finalidades primarias y secundarias, transferencias (Art. 37 LFPDPPP), encargados del tratamiento (Art. 50 Reglamento), medidas de seguridad, plazos de conservación, derechos ARCO y consentimiento. Los campos que dejes en blanco aparecerán como «PLACEHOLDER» en azul para completarse a mano.
        </div>
      </div>
      <div style={{padding:'12px 22px 16px',borderTop:'0.5px solid rgba(57,255,20,0.08)',flexShrink:0}}>
        <button onClick={descargar} disabled={generando}
          style={{width:'100%',background:generando?'rgba(57,255,20,0.3)':V,color:F,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:generando?'not-allowed':'pointer',fontFamily:"'Sora',sans-serif"}}>
          {generando?'Generando DOCX...':'⬇️ Descargar Aviso de Privacidad (DOCX)'}
        </button>
      </div>
    </div>
  );
}
