'use client';
import { useState, useRef, useEffect } from 'react';
import { V, F } from './shared';

const SMG = 248.93;
const money = (n: any) => '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const CAUSAS: { v: string; label: string; liq: boolean }[] = [
  { v: 'renuncia', label: 'Renuncia voluntaria', liq: false },
  { v: 'mutuo', label: 'Terminación por mutuo acuerdo', liq: false },
  { v: 'conclusion', label: 'Conclusión de contrato (obra / tiempo determinado)', liq: false },
  { v: 'despido_justificado', label: 'Despido justificado (Art. 47 LFT)', liq: false },
  { v: 'despido_injustificado', label: 'Despido injustificado', liq: true },
  { v: 'rescision_trabajador', label: 'Rescisión por el trabajador con causa (Art. 51 LFT)', liq: true },
];
const vacacionesPorAnio = (anios: number) => {
  const a = Math.max(1, anios);
  if (a <= 5) return [12, 14, 16, 18, 20][a - 1];
  return 20 + Math.ceil((a - 5) / 5) * 2;
};

export function FormFiniquito() {
  const [generando, setGenerando] = useState(false);
  const [analisis, setAnalisis] = useState<any>(null);
  const [analizando, setAnalizando] = useState(false);
  const [conceptos, setConceptos] = useState<any[] | null>(null);
  const [resumen, setResumen] = useState<any>(null);

  const K = ['razonSocial','trabNombre','ciudad','representante','cargoRepresentante','causa','fechaIngreso','fechaBaja','fechaDocumento','salarioDiario','diasAguinaldo','primaPct','diasSalariosPendientes','diasVacPendientes'];
  const r2: any = {};
  K.forEach(k => { r2[k] = useRef<any>(null); });

  useEffect(() => {
    setTimeout(() => {
      const d: any = {
        razonSocial:'COMERCIALIZADORA NORTE S.A. DE C.V.', trabNombre:'MARÍA FERNANDA LÓPEZ REYES', ciudad:'Monterrey, Nuevo León',
        representante:'Lic. Roberto García Martínez', cargoRepresentante:'Gerente de Recursos Humanos', causa:'despido_injustificado',
        fechaIngreso:'2023-03-01', fechaBaja:'2026-06-10', fechaDocumento:new Date().toISOString().slice(0,10),
        salarioDiario:'350', diasAguinaldo:'15', primaPct:'25', diasSalariosPendientes:'9',
      };
      Object.entries(d).forEach(([k,val]) => { if (r2[k]?.current) r2[k].current.value = val as string; });
    }, 120);
  }, []);

  const antiguedadTexto = (di: Date, db: Date) => {
    let m = (db.getFullYear() - di.getFullYear()) * 12 + (db.getMonth() - di.getMonth());
    if (db.getDate() < di.getDate()) m--;
    if (m < 0) m = 0;
    const y = Math.floor(m / 12), mm = m % 12;
    const ys = y === 1 ? '1 año' : `${y} años`;
    const ms = mm === 1 ? '1 mes' : `${mm} meses`;
    return y && mm ? `${ys} y ${ms}` : y ? ys : ms;
  };

  const calcular = () => {
    const g = (k: string) => r2[k].current?.value || '';
    if (!g('fechaIngreso') || !g('fechaBaja') || !g('salarioDiario')) { alert('Captura al menos fecha de ingreso, fecha de baja y salario diario.'); return; }
    const causaObj = CAUSAS.find(c => c.v === g('causa')) || CAUSAS[0];
    const di = new Date(g('fechaIngreso') + 'T00:00:00'); const db = new Date(g('fechaBaja') + 'T00:00:00');
    const msDay = 86400000;
    const diasTotales = Math.max(0, Math.round((db.getTime() - di.getTime()) / msDay));
    const aniosFrac = diasTotales / 365;
    const aniosCompletos = Math.floor(aniosFrac);
    const SD = Number(g('salarioDiario')) || 0;
    const diasAg = Number(g('diasAguinaldo')) || 15;
    const primaP = Number(g('primaPct')) || 25;
    const vacAnio = vacacionesPorAnio(aniosCompletos);
    const factor = (365 + diasAg + vacAnio * (primaP / 100)) / 365;
    const SDI = SD * factor;

    const inicioAnio = new Date(db.getFullYear(), 0, 1);
    const arranque = di > inicioAnio ? di : inicioAnio;
    const diasAnioAg = Math.max(0, Math.round((db.getTime() - arranque.getTime()) / msDay) + 1);
    const aguinaldoProp = (diasAg / 365) * diasAnioAg * SD;

    const ultAniv = new Date(di); ultAniv.setFullYear(di.getFullYear() + aniosCompletos);
    let diasDesdeAniv = Math.round((db.getTime() - ultAniv.getTime()) / msDay); if (diasDesdeAniv < 0) diasDesdeAniv = 0;
    // Art. 78 LFT: al inicio de cada año el trabajador ya tiene derecho a los días del año que comienza.
    const vacParaPeriodo = aniosCompletos > 0 ? vacacionesPorAnio(aniosCompletos + 1) : vacacionesPorAnio(1);
    const vacDias = (vacParaPeriodo / 365) * diasDesdeAniv;
    const vacMonto = vacDias * SD;
    const diasVacPend = Number(g('diasVacPendientes')) || 0;
    const vacPendMonto = diasVacPend * SD;
    const primaVac = (vacMonto + vacPendMonto) * (primaP / 100);
    // Vacaciones pendientes: el sistema propone 0, RH captura los días reales no disfrutados
    const diasVacPend = Number(r2['diasVacPendientes'].current?.value || 0);
    const vacPendMonto = diasVacPend * SD;
    const primaVacPend = vacPendMonto * (primaP / 100);
    const vacMonto = vacDias * SD;
    const primaVac = vacMonto * (primaP / 100);
    const salariosPend = SD * (Number(g('diasSalariosPendientes')) || 0);

    const baseAntig = Math.min(SD, 2 * SMG);
    const primaAntig = 12 * aniosFrac * baseAntig;
    const aplicaPrimaAntig = ['despido_justificado','despido_injustificado','rescision_trabajador'].includes(causaObj.v) || (aniosFrac >= 15);

    const tresMeses = 90 * SDI;
    const veinteDias = 20 * aniosFrac * SDI;

    const arr: any[] = [
      { k:'salarios', label:'Salarios pendientes', detalle:`${Number(g('diasSalariosPendientes'))||0} días × ${money(SD)}`, monto: salariosPend },
      { k:'aguinaldo', label:'Aguinaldo proporcional', detalle:`${diasAg} días/año · ${diasAnioAg} días del año`, monto: aguinaldoProp },
      { k:'vacaciones', label:'Vacaciones proporcionales', detalle:`${vacDias.toFixed(1)} días (${vacParaPeriodo}/año, año ${aniosCompletos+1})`, monto: vacMonto },
      { k:'vac_pendientes', label:'Vacaciones pendientes (años anteriores)', detalle: diasVacPend > 0 ? `${diasVacPend} días × ${money(SD)}` : 'capturar días no disfrutados de años previos', monto: vacPendMonto },
      { k:'prima_vac', label:'Prima vacacional', detalle:`${primaP}% sobre vacaciones (proporcionales + pendientes)`, monto: primaVac },
    ];
    if (aplicaPrimaAntig) arr.push({ k:'prima_antig', label:'Prima de antigüedad', detalle:`12 días × ${aniosFrac.toFixed(2)} años · tope 2× SMG`, monto: primaAntig });
    if (causaObj.liq) {
      arr.push({ k:'tres_meses', label:'Indemnización 3 meses (Art. 48)', detalle:`90 días × SDI ${money(SDI)}`, monto: tresMeses });
      arr.push({ k:'veinte_dias', label:'20 días por año (Art. 50-II)', detalle:`20 días × ${aniosFrac.toFixed(2)} años × SDI`, monto: veinteDias });
      arr.push({ k:'salarios_vencidos', label:'Salarios vencidos (Art. 48)', detalle:'editar según fecha de pago · tope 12 meses', monto: 0 });
    }
    setConceptos(arr);
    setResumen({ tipo: causaObj.liq ? 'liquidacion' : 'finiquito', causaLabel: causaObj.label, antiguedadTxt: antiguedadTexto(di, db), SDI, SD, factor });
    setAnalisis(null);
  };

  const setMonto = (k: string, val: string) => setConceptos(cs => (cs || []).map(c => c.k === k ? { ...c, monto: val === '' ? 0 : Number(val) } : c));
  const total = (conceptos || []).reduce((s, c) => s + Number(c.monto || 0), 0);

  const getDatos = () => ({
    patronNombre: r2.razonSocial.current?.value || '', trabNombre: r2.trabNombre.current?.value || '',
    ciudad: r2.ciudad.current?.value || '', representante: r2.representante.current?.value || '', cargoRepresentante: r2.cargoRepresentante.current?.value || '',
    fechaBaja: r2.fechaBaja.current?.value || '', fechaIngreso: r2.fechaIngreso.current?.value || '', fechaDocumento: r2.fechaDocumento.current?.value || '',
    salarioDiario: r2.salarioDiario.current?.value || '',
    tipo: resumen?.tipo, causaLabel: resumen?.causaLabel, antiguedadTxt: resumen?.antiguedadTxt, sdi: resumen?.SDI,
    conceptos: (conceptos || []).map(c => ({ label: c.label, detalle: c.detalle, monto: c.monto })), total,
  });

  const analizar = async () => {
    setAnalizando(true); setAnalisis(null);
    try {
      const res = await fetch('/api/analizar-contrato', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tipo: resumen?.tipo === 'liquidacion' ? 'Convenio de Liquidación' : 'Finiquito', datos: getDatos() }) });
      setAnalisis(await res.json());
    } catch { setAnalisis({ puntaje:50, observaciones:[{tipo:'warn',texto:'No se pudo conectar con el análisis IA.'}], recomendacion:'' }); }
    setAnalizando(false);
  };

  const descargar = async () => {
    setGenerando(true);
    try {
      const res = await fetch('/api/generar-docx', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tipo:'finiquito', datos:getDatos() }) });
      if (!res.ok) throw new Error();
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `LexByte_${resumen?.tipo === 'liquidacion' ? 'liquidacion' : 'finiquito'}_${Date.now()}.docx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { alert('Error al generar. Intenta de nuevo.'); }
    setGenerando(false);
  };

  const inpSt:any={width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.05)',border:'0.5px solid rgba(57,255,20,0.2)',borderRadius:8,color:'#fff',fontSize:13,fontFamily:"'Sora',sans-serif",outline:'none'};
  const labSt:any={fontSize:10,color:'rgba(255,255,255,0.4)',fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'0.4px',marginBottom:5,display:'block'};
  const fldSt:any={marginBottom:14};
  const rowSt:any={display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14};
  const secSt:any={margin:'18px 0 12px',fontSize:11,fontWeight:600,color:V,textTransform:'uppercase' as const,letterSpacing:'0.5px'};

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:22}}>
        <div style={{marginBottom:12,padding:'8px 12px',background:'rgba(57,255,20,0.05)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:8,fontSize:11,color:'rgba(255,255,255,0.4)'}}>🧪 Datos de prueba — el tipo (finiquito o liquidación) se decide por la causa de terminación</div>

        <div style={secSt}>Partes</div>
        <div style={fldSt}><label style={labSt}>Razón social del patrón *</label><input ref={r2.razonSocial} placeholder="Empresa XYZ S.A. de C.V." style={inpSt}/></div>
        <div style={fldSt}><label style={labSt}>Nombre del trabajador *</label><input ref={r2.trabNombre} placeholder="Nombre completo del trabajador" style={inpSt}/></div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Representante del patrón</label><input ref={r2.representante} placeholder="Lic. Nombre Apellido" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Cargo del representante</label><input ref={r2.cargoRepresentante} placeholder="Gerente de RH" style={inpSt}/></div>
        </div>
        <div style={fldSt}><label style={labSt}>Ciudad</label><input ref={r2.ciudad} placeholder="Monterrey, Nuevo León" style={inpSt}/></div>

        <div style={secSt}>Terminación y cálculo</div>
        <div style={fldSt}><label style={labSt}>Causa de terminación *</label>
          <select ref={r2.causa} style={inpSt} defaultValue="renuncia">
            {CAUSAS.map(c => <option key={c.v} value={c.v}>{c.label}</option>)}
          </select>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:4}}>Las dos últimas generan liquidación (finiquito + indemnizaciones).</div>
        </div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Fecha de ingreso *</label><input ref={r2.fechaIngreso} type="date" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Fecha de baja *</label><input ref={r2.fechaBaja} type="date" style={inpSt}/></div>
        </div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Salario diario MXN *</label><input ref={r2.salarioDiario} type="number" step="0.01" placeholder="350.00" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Días de salario pendientes</label><input ref={r2.diasSalariosPendientes} type="number" placeholder="0" style={inpSt}/></div>
        </div>
        <div style={rowSt}>
          <div style={fldSt}><label style={labSt}>Días de aguinaldo</label><input ref={r2.diasAguinaldo} type="number" defaultValue="15" style={inpSt}/></div>
          <div style={fldSt}><label style={labSt}>Prima vacacional %</label><input ref={r2.primaPct} type="number" defaultValue="25" style={inpSt}/></div>
        </div>
        <div style={fldSt}><label style={labSt}>Días de vacaciones pendientes (años anteriores)</label><input ref={r2.diasVacPendientes} type="number" placeholder="0" style={inpSt}/><div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:4}}>Días generados en años previos que el trabajador nunca disfrutó. Déjalo en 0 si no aplica; lo demás (vacaciones proporcionales) se calcula solo.</div></div>
        <div style={fldSt}><label style={labSt}>Fecha del documento</label><input ref={r2.fechaDocumento} type="date" style={inpSt}/></div>

        <button onClick={calcular} style={{width:'100%',background:'rgba(57,255,20,0.12)',color:V,border:'0.5px solid rgba(57,255,20,0.35)',borderRadius:10,padding:'12px 0',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif",marginTop:4}}>🧮 Calcular {'\u2192'}</button>

        {conceptos && resumen && (
          <div style={{marginTop:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={secSt}>{resumen.tipo === 'liquidacion' ? 'Liquidación' : 'Finiquito'}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>Antigüedad: {resumen.antiguedadTxt} · SDI {money(resumen.SDI)}</div>
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:10}}>Puedes editar cualquier monto si tu contador trae otra cifra.</div>
            {conceptos.map((c) => (
              <div key={c.k} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'0.5px solid rgba(255,255,255,0.06)'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:'#fff'}}>{c.label}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{c.detalle}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
                  <span style={{color:'rgba(255,255,255,0.4)',fontSize:13}}>$</span>
                  <input type="number" step="0.01" value={c.monto} onChange={e=>setMonto(c.k, e.target.value)} style={{width:110,padding:'7px 9px',background:'rgba(255,255,255,0.05)',border:'0.5px solid rgba(57,255,20,0.2)',borderRadius:7,color:'#fff',fontSize:13,textAlign:'right',fontFamily:"'Sora',sans-serif",outline:'none'}}/>
                </div>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,padding:'10px 12px',background:'rgba(57,255,20,0.06)',borderRadius:8}}>
              <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>TOTAL</div>
              <div style={{fontSize:18,fontWeight:800,color:V}}>{money(total)}</div>
            </div>

            {analisis && !analizando && (
              <div style={{marginTop:18}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>Revisión jurídica</div><div style={{fontSize:18,fontWeight:800,color:analisis.puntaje>=80?V:analisis.puntaje>=60?'#facc15':'#ef4444'}}>{analisis.puntaje}/100</div></div>
                <div style={{height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden',marginBottom:14}}><div style={{height:'100%',width:`${analisis.puntaje}%`,background:analisis.puntaje>=80?V:analisis.puntaje>=60?'#facc15':'#ef4444',borderRadius:3}}/></div>
                {analisis.observaciones?.map((o:any,i:number)=>(<div key={i} style={{padding:'9px 12px',borderRadius:8,marginBottom:8,fontSize:12.5,lineHeight:1.55,background:o.tipo==='ok'?'rgba(57,255,20,0.08)':o.tipo==='error'?'rgba(239,68,68,0.08)':o.tipo==='warn'?'rgba(250,204,21,0.08)':'rgba(255,255,255,0.04)',border:`0.5px solid ${o.tipo==='ok'?'rgba(57,255,20,0.2)':o.tipo==='error'?'rgba(239,68,68,0.2)':o.tipo==='warn'?'rgba(250,204,21,0.2)':'rgba(255,255,255,0.1)'}`,color:o.tipo==='ok'?'#86efac':o.tipo==='error'?'#fca5a5':o.tipo==='warn'?'#fde68a':'rgba(255,255,255,0.7)'}}>{o.tipo==='ok'?'✅':o.tipo==='error'?'❌':o.tipo==='warn'?'⚠️':'ℹ️'} {o.texto}</div>))}
                {analisis.recomendacion && (<div style={{padding:'10px 14px',background:'rgba(255,255,255,0.03)',border:'0.5px solid rgba(57,255,20,0.1)',borderRadius:8,fontSize:12,color:'rgba(255,255,255,0.5)'}}><strong style={{color:'rgba(255,255,255,0.8)'}}>Recomendación:</strong> {analisis.recomendacion}</div>)}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{padding:'12px 22px 16px',borderTop:'0.5px solid rgba(57,255,20,0.08)',flexShrink:0}}>
        {conceptos && !analisis && (<button onClick={analizar} disabled={analizando} style={{width:'100%',background:V,color:F,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:analizando?'wait':'pointer',fontFamily:"'Sora',sans-serif"}}>{analizando?'Analizando con IA…':'⚖️ Revisar con IA →'}</button>)}
        {conceptos && analisis && (<><button onClick={descargar} disabled={generando} style={{width:'100%',background:generando?'rgba(57,255,20,0.3)':V,color:F,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:generando?'not-allowed':'pointer',fontFamily:"'Sora',sans-serif",marginBottom:8}}>{generando?'Generando DOCX…':`⬇️ Descargar ${resumen?.tipo === 'liquidacion' ? 'Liquidación' : 'Finiquito'} (DOCX)`}</button><button onClick={()=>setAnalisis(null)} style={{width:'100%',background:'transparent',color:'rgba(255,255,255,0.4)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 0',fontSize:12,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>Volver a analizar</button></>)}
        {!conceptos && (<div style={{textAlign:'center',fontSize:12,color:'rgba(255,255,255,0.35)'}}>Llena los datos y presiona "Calcular" para ver el desglose.</div>)}
      </div>
    </div>
  );
}
