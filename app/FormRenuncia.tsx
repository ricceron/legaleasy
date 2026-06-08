'use client';
import { useState, useRef, useEffect } from 'react';
import { V, F } from './shared';

export function FormRenuncia() {
  const [generando, setGenerando] = useState(false);
  const r2: any = {
    razonSocial: useRef<HTMLInputElement>(null),
    titular: useRef<HTMLInputElement>(null),
    puesto: useRef<HTMLInputElement>(null),
    area: useRef<HTMLInputElement>(null),
    fechaIngreso: useRef<HTMLInputElement>(null),
    fechaRenuncia: useRef<HTMLInputElement>(null),
    ciudad: useRef<HTMLInputElement>(null),
    hora: useRef<HTMLInputElement>(null),
    jornadaTipo: useRef<HTMLSelectElement>(null),
    jornadaEntrada: useRef<HTMLInputElement>(null),
    jornadaSalida: useRef<HTMLInputElement>(null),
    jornadaDuracionComida: useRef<HTMLSelectElement>(null),
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
        jornadaEntrada: '09:00',
        jornadaSalida: '18:00',
      };
      Object.entries(d).forEach(([k, val]) => { if (r2[k]?.current) r2[k].current.value = val as string; });
      if (r2.jornadaTipo.current) r2.jornadaTipo.current.value = 'diurna';
      if (r2.jornadaDuracionComida.current) r2.jornadaDuracionComida.current.value = '60';
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
    jornadaTipo: r2.jornadaTipo.current?.value || 'diurna',
    jornadaEntrada: r2.jornadaEntrada.current?.value || '',
    jornadaSalida: r2.jornadaSalida.current?.value || '',
    jornadaDuracionComida: Number(r2.jornadaDuracionComida.current?.value || '60'),
  });

  const descargar = async () => {
    if (!r2.razonSocial.current?.value || !r2.titular.current?.value) {
      alert('Completa al menos la razón social y el nombre del trabajador.'); return;
    }
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

        <div style={secSt}>Fechas</div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Fecha de ingreso</label><input ref={r2.fechaIngreso} type="date" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Fecha de la renuncia</label><input ref={r2.fechaRenuncia} type="date" style={inpSt}/></div>
        </div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Ciudad</label><input ref={r2.ciudad} placeholder="Monterrey, Nuevo León" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Hora de la carta</label><input ref={r2.hora} type="time" style={inpSt}/></div>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:-6,marginBottom:8}}>La antigüedad (años y meses) se calcula sola entre la fecha de ingreso y la de renuncia.</div>

        <div style={secSt}>Jornada (para la declaración de la carta)</div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Tipo de jornada</label><select ref={r2.jornadaTipo} style={inpSt} defaultValue="diurna"><option value="diurna">Diurna</option><option value="nocturna">Nocturna</option><option value="mixta">Mixta</option></select></div>
          <div style={fldSt}><label style={labSt}>Duración de la comida</label><select ref={r2.jornadaDuracionComida} style={inpSt} defaultValue="60"><option value="30">30 minutos</option><option value="60">1 hora</option><option value="90">1.5 horas</option><option value="120">2 horas</option></select></div>
        </div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Hora de entrada</label><input ref={r2.jornadaEntrada} type="time" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Hora de salida</label><input ref={r2.jornadaSalida} type="time" style={inpSt}/></div>
        </div>
      </div>
      <div style={{padding:'12px 22px 16px',borderTop:'0.5px solid rgba(57,255,20,0.08)',flexShrink:0}}>
        <button onClick={descargar} disabled={generando}
          style={{width:'100%',background:generando?'rgba(57,255,20,0.3)':V,color:F,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:generando?'not-allowed':'pointer',fontFamily:"'Sora',sans-serif"}}>
          {generando?'Generando DOCX...':'⬇️ Descargar Carta de Renuncia (DOCX)'}
        </button>
      </div>
    </div>
  );
}
