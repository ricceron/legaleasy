'use client';
import { useState, useRef, useEffect } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
type Section = 'lex' | 'docs' | 'historial' | 'config';
type DocTipo = 'capacitacion' | 'obra' | null;

const VERDE = '#39ff14';
const FONDO = '#060f1e';
const SIDEBAR = '#080f1c';

export default function LexByte() {
  const [section, setSection] = useState<Section>('lex');
  const [docTipo, setDocTipo] = useState<DocTipo>(null);
  const [paso, setPaso] = useState(0);
  const [formData, setFormData] = useState<any>({
    duracion:'90',
    patronTipo:'moral',
    trabSexo:'MASCULINO',
    trabNacionalidad:'México',
    jornadaTipo:'diurna',
    jornadaDescanso:'domingo',
    jornadaPago:'semanalmente',
    condAguinaldo:'15',
    condPrima:'25',
    beneficiarios:[{nombre:'',parentesco:'',pct:''}],
  });
  const [analisis, setAnalisis] = useState<any>(null);
  const [analizando, setAnalizando] = useState(false);
  const [generando, setGenerando] = useState(false);

  const [msgs, setMsgs] = useState<Msg[]>([
    { role:'assistant', content:'¡Bienvenido a **LexByte**! Soy **Lex**, tu asistente jurídico laboral.\n\nPuedo ayudarte con contratos, rescisiones, actas, incapacidades, IMSS, INFONAVIT y más.\n\n¿Qué necesitas saber hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [freeLeft, setFreeLeft] = useState(3);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const upd = (key: string, val: any) => setFormData((p: any) => ({ ...p, [key]: val }));

  const send = async () => {
    if (!input.trim() || loading) return;
    if (freeLeft <= 0) {
      setMsgs(m => [...m, { role:'assistant', content:'Has agotado tus consultas gratuitas. Suscríbete desde **$799 MXN/mes**.' }]);
      return;
    }
    const userMsg: Msg = { role:'user', content:input };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setLoading(true);
    setFreeLeft(f => f - 1);
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role:m.role, content:m.content })) }),
      });
      const data = await res.json();
      setMsgs(m => [...m, { role:'assistant', content: data.reply || 'Error al procesar.' }]);
    } catch { setMsgs(m => [...m, { role:'assistant', content:'Error de conexión.' }]); }
    setLoading(false);
  };

  const fmt = (t: string) => t
    .replace(/^### (.*$)/gim,'<span style="display:block;font-size:13px;font-weight:700;color:rgba(255,255,255,0.9);margin-top:8px;margin-bottom:4px">$1</span>')
    .replace(/^## (.*$)/gim,'<span style="display:block;font-size:14px;font-weight:700;color:#39ff14;margin-top:10px;margin-bottom:4px">$1</span>')
    .replace(/^# (.*$)/gim,'<span style="display:block;font-size:15px;font-weight:800;color:#39ff14;margin-top:10px;margin-bottom:6px">$1</span>')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em style="color:rgba(255,255,255,0.8)">$1</em>')
    .replace(/^- (.*$)/gim,'<span style="display:block;padding-left:12px;margin-top:3px">• $1</span>')
    .replace(/✅/g,'<span style="color:#39ff14">✅</span>')
    .replace(/⚠️/g,'<span style="color:#facc15">⚠️</span>')
    .replace(/\n/g,'<br>');

  const analizarContrato = async () => {
    setAnalizando(true);
    try {
      const res = await fetch('/api/analizar-contrato', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tipo: docTipo==='capacitacion'?'Capacitación Inicial':'Obra Determinada', datos: formData }),
      });
      const data = await res.json();
      setAnalisis(data);
    } catch { setAnalisis({ puntaje:50, observaciones:[{tipo:'warn',texto:'No se pudo conectar con el análisis IA.'}], recomendacion:'' }); }
    setAnalizando(false);
  };

  const descargarDocx = async () => {
    setGenerando(true);
    try {
      const res = await fetch('/api/generar-docx', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tipo: docTipo, datos: formData }),
      });
      if (!res.ok) throw new Error('Error al generar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LexByte_${docTipo}_${Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Error al generar el documento. Intenta de nuevo.'); }
    setGenerando(false);
  };

  const totalPasos = docTipo === 'capacitacion' ? 5 : 5;
  const pasosTitulos = ['Patrón','Trabajador','Condiciones','Jornada','Beneficiarios'];

  const inpSt: any = { width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`0.5px solid rgba(57,255,20,0.2)`, borderRadius:8, color:'#fff', fontSize:12.5, fontFamily:"'Sora',sans-serif", outline:'none' };
  const labSt: any = { fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5, display:'block' };
  const rowSt: any = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 };

  const Campo = ({ label, campo, type='text', placeholder='' }: any) => (
    <div>
      <span style={labSt}>{label}</span>
      <input type={type} value={formData[campo]||''} onChange={e=>upd(campo,e.target.value)} placeholder={placeholder} style={inpSt} />
    </div>
  );

  const Select = ({ label, campo, opts }: any) => (
    <div>
      <span style={labSt}>{label}</span>
      <select value={formData[campo]||''} onChange={e=>upd(campo,e.target.value)} style={{...inpSt, cursor:'pointer'}}>
        {opts.map(([v,l]: any) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  const renderPaso = () => {
    if (paso === 0) return (
      <div>
        <div style={rowSt}>
          <Campo label="Nombre o razón social" campo="patronNombre" placeholder="Empresa XYZ S.A. de C.V." />
          <Campo label="RFC del patrón" campo="patronRFC" placeholder="EXY900101ABC" />
        </div>
        <div style={rowSt}>
          <Campo label="Registro patronal IMSS" campo="patronRegIMSS" placeholder="B12345678104" />
          <Select label="Tipo de persona" campo="patronTipo" opts={[['moral','Persona moral'],['fisica','Persona física']]} />
        </div>
        <div style={{marginBottom:14}}>
          <Campo label="Domicilio fiscal completo" campo="patronDomicilio" placeholder="Calle, número, colonia, C.P." />
        </div>
        <div style={rowSt}>
          <Campo label="Ciudad / Estado" campo="patronCiudad" placeholder="Monterrey, Nuevo León" />
          <Campo label="Correo de privacidad" campo="patronCorreo" placeholder="privacidad@empresa.com" type="email" />
        </div>
        <Campo label="Representante legal" campo="patronRepresentante" placeholder="Lic. Roberto García Martínez" />
        {docTipo === 'obra' && (
          <>
            <div style={{marginTop:16,marginBottom:12,fontSize:11,fontWeight:600,color:VERDE,textTransform:'uppercase',letterSpacing:'0.5px'}}>Datos de la obra</div>
            <div style={{marginBottom:14}}><Campo label="Nombre de la obra" campo="obraNombre" placeholder="Construcción Torre Corporativa Norte" /></div>
            <div style={{marginBottom:14}}><Campo label="Domicilio de la obra" campo="obraDomicilio" placeholder="Calle, colonia, C.P., ciudad" /></div>
            <div style={rowSt}>
              <Campo label="Registro IMSS de la obra" campo="obraRegIMSS" placeholder="12-345678-10-0" />
              <Campo label="Fecha estimada de término" campo="obraTermino" type="date" />
            </div>
          </>
        )}
      </div>
    );

    if (paso === 1) return (
      <div>
        <div style={rowSt}>
          <Campo label="Nombre completo del trabajador" campo="trabNombre" placeholder="Nombre Apellido Apellido" />
          <Select label="Sexo" campo="trabSexo" opts={[['MASCULINO','Masculino'],['FEMENINO','Femenino']]} />
        </div>
        <div style={rowSt}>
          <Campo label="Fecha de nacimiento" campo="trabNacimiento" type="date" />
          <Campo label="Nacionalidad" campo="trabNacionalidad" placeholder="México" />
        </div>
        <div style={rowSt}>
          <Campo label="RFC" campo="trabRFC" placeholder="XXXX000000XXX" />
          <Campo label="CURP" campo="trabCURP" placeholder="XXXX000000XXXXXX00" />
        </div>
        <div style={{marginBottom:14}}><Campo label="NSS (IMSS)" campo="trabNSS" placeholder="00 00 00 0000 0" /></div>
        <Campo label="Domicilio del trabajador" campo="trabDomicilio" placeholder="Calle, colonia, C.P., ciudad, estado" />
      </div>
    );

    if (paso === 2) return (
      <div>
        <div style={rowSt}>
          <Campo label="Denominación del puesto" campo="condPuesto" placeholder="Analista de RRHH" />
          <Campo label="Área / Departamento" campo="condArea" placeholder="Recursos Humanos" />
        </div>
        {docTipo === 'capacitacion' && (
          <div style={rowSt}>
            <Select label="Duración del contrato" campo="duracion" opts={[['30','30 días'],['60','60 días'],['90','90 días']]} />
            <Campo label="Fecha de inicio" campo="condInicio" type="date" />
          </div>
        )}
        {docTipo === 'obra' && (
          <Campo label="Jefe inmediato (nombre y puesto)" campo="condJefe" placeholder="Ing. Juan López — Director de Obra" />
        )}
        <div style={rowSt}>
          <Campo label="Salario diario (MXN)" campo="condSalario" type="number" placeholder="Mín. $248.93" />
          <Campo label={docTipo==='capacitacion'?'Fecha de término':'Fecha de ingreso'} campo={docTipo==='capacitacion'?'condTermino':'condInicio'} type="date" />
        </div>
        <div style={rowSt}>
          <Campo label="Días de aguinaldo (mín. 15)" campo="condAguinaldo" type="number" placeholder="15" />
          <Campo label="Prima vacacional % (mín. 25)" campo="condPrima" type="number" placeholder="25" />
        </div>
        <div style={{marginBottom:14}}>
          <span style={labSt}>Actividades del puesto (una por línea)</span>
          <textarea value={formData.condActividades||''} onChange={e=>upd('condActividades',e.target.value)}
            placeholder="Reclutamiento y selección de personal&#10;Elaboración de contratos&#10;Control de expedientes"
            rows={4} style={{...inpSt, resize:'vertical'}} />
        </div>
        {docTipo === 'obra' && (
          <div style={{marginBottom:14}}>
            <span style={labSt}>Equipo entregado (descripción | N° serie)</span>
            <textarea value={formData.equipoDescripcion||''} onChange={e=>upd('equipoDescripcion',e.target.value)}
              placeholder="Laptop Dell XPS | SN-12345&#10;Casco de seguridad | N/A"
              rows={3} style={{...inpSt, resize:'vertical'}} />
          </div>
        )}
      </div>
    );

    if (paso === 3) return (
      <div>
        <div style={rowSt}>
          <Select label="Tipo de jornada" campo="jornadaTipo" opts={[['diurna','Diurna (8 h)'],['nocturna','Nocturna (7 h)'],['mixta','Mixta (7.5 h)']]} />
          <Select label="Día de descanso semanal" campo="jornadaDescanso" opts={[['lunes','Lunes'],['martes','Martes'],['miércoles','Miércoles'],['jueves','Jueves'],['viernes','Viernes'],['sábado','Sábado'],['domingo','Domingo']]} />
        </div>
        <div style={rowSt}>
          <Campo label="Hora de entrada" campo="jornadaEntrada" type="time" />
          <Campo label="Hora de salida" campo="jornadaSalida" type="time" />
        </div>
        <div style={rowSt}>
          <Select label="Periodicidad de pago" campo="jornadaPago" opts={[['semanalmente','Semanal'],['quincenalmente','Quincenal']]} />
        </div>
        <div style={{marginTop:12,padding:'10px 14px',background:'rgba(57,255,20,0.05)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:8,fontSize:12,color:'rgba(255,255,255,0.5)'}}>
          🔒 Confidencialidad post-contrato: <strong style={{color:VERDE}}>5 años</strong> — estándar LexByte para todos los contratos.
        </div>
      </div>
    );

    if (paso === 4) {
      if (analizando) return (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:'40px 0'}}>
          <div style={{display:'flex',gap:6}}>
            {[0,0.15,0.3].map((d,i)=><div key={i} style={{width:10,height:10,borderRadius:'50%',background:VERDE,animation:`pulse 1.2s ${d}s infinite`}}/>)}
          </div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>Analizando contrato con IA jurídica...</div>
        </div>
      );

      if (!analisis) return (
        <div style={{textAlign:'center',padding:'40px 0'}}>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.6)',marginBottom:20}}>¿Listo para el análisis jurídico?</div>
          <button onClick={analizarContrato} style={{background:VERDE,color:FONDO,border:'none',borderRadius:10,padding:'12px 28px',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>
            ⚖️ Analizar con IA →
          </button>
        </div>
      );

      const color = analisis.puntaje>=80?'#39ff14':analisis.puntaje>=60?'#facc15':'#ef4444';
      const iconos: any = {ok:'✅',warn:'⚠️',error:'❌',info:'ℹ️'};
      return (
        <div>
          <div style={{marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>Solidez jurídica</div>
              <div style={{fontSize:16,fontWeight:800,color}}>{analisis.puntaje}/100</div>
            </div>
            <div style={{height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${analisis.puntaje}%`,background:color,borderRadius:3,transition:'width 1s ease'}}/>
            </div>
          </div>
          {analisis.observaciones?.map((o: any, i: number) => (
            <div key={i} style={{padding:'9px 12px',borderRadius:8,marginBottom:8,fontSize:12.5,lineHeight:1.55,
              background: o.tipo==='ok'?'rgba(57,255,20,0.08)':o.tipo==='error'?'rgba(239,68,68,0.08)':o.tipo==='warn'?'rgba(250,204,21,0.08)':'rgba(255,255,255,0.04)',
              border: `0.5px solid ${o.tipo==='ok'?'rgba(57,255,20,0.2)':o.tipo==='error'?'rgba(239,68,68,0.2)':o.tipo==='warn'?'rgba(250,204,21,0.2)':'rgba(255,255,255,0.1)'}`,
              color: o.tipo==='ok'?'#86efac':o.tipo==='error'?'#fca5a5':o.tipo==='warn'?'#fde68a':'rgba(255,255,255,0.7)',
            }}>
              {iconos[o.tipo]} {o.texto}
            </div>
          ))}
          {analisis.recomendacion && (
            <div style={{marginTop:12,padding:'10px 14px',background:'rgba(255,255,255,0.03)',border:'0.5px solid rgba(57,255,20,0.1)',borderRadius:8,fontSize:12,color:'rgba(255,255,255,0.5)'}}>
              <strong style={{color:'rgba(255,255,255,0.8)'}}>Recomendación:</strong> {analisis.recomendacion}
            </div>
          )}
          <button onClick={descargarDocx} disabled={generando}
            style={{marginTop:16,width:'100%',background:generando?'rgba(57,255,20,0.3)':VERDE,color:FONDO,border:'none',borderRadius:10,padding:'13px 0',fontSize:14,fontWeight:800,cursor:generando?'not-allowed':'pointer',fontFamily:"'Sora',sans-serif"}}>
            {generando?'Generando...':'⬇️ Descargar DOCX'}
          </button>
        </div>
      );
    }

    return null;
  };

  const docs = [
    { id:'capacitacion', nombre:'Capacitación Inicial', base:'Art. 39-B LFT', ready:true, icon:'ti-file-check' },
    { id:'obra', nombre:'Obra Determinada', base:'Arts. 35-36 LFT', ready:true, icon:'ti-building' },
    { id:'ind', nombre:'Tiempo Indeterminado', base:'Art. 35 LFT', ready:false, icon:'ti-file-text' },
    { id:'acta', nombre:'Acta Administrativa', base:'Art. 47 LFT', ready:false, icon:'ti-scale' },
    { id:'ren', nombre:'Renuncia Voluntaria', base:'Art. 53 LFT', ready:false, icon:'ti-signature' },
    { id:'fin', nombre:'Finiquito y Liquidación', base:'Arts. 48-50 LFT', ready:false, icon:'ti-cash' },
  ];

  const sugs = [
    '¿Puedo despedir a un trabajador que llegó borracho?',
    '¿3 retardos equivalen a una falta?',
    '¿Cuánto dura la incapacidad por maternidad?',
    '¿Cuáles son los días de descanso obligatorio?',
    '¿Qué pago en un despido injustificado?',
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:${FONDO};color:#fff}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(57,255,20,0.25);border-radius:2px}
        @keyframes pulse{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .nav-item:hover{background:rgba(57,255,20,0.05)!important;color:rgba(255,255,255,0.75)!important}
        .sug-btn:hover{border-color:#39ff14!important;color:#39ff14!important}
        .doc-card:hover{border-color:rgba(57,255,20,0.4)!important;background:rgba(57,255,20,0.04)!important}
        .inp:focus{border-color:#39ff14!important;outline:none}
        input,select,textarea{color:#fff!important}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3)!important}
      `}</style>

      <div style={{display:'flex',height:'100vh',background:FONDO,fontFamily:"'Sora',sans-serif",overflow:'hidden'}}>

        {/* SIDEBAR */}
        <div style={{width:230,flexShrink:0,background:SIDEBAR,borderRight:'0.5px solid rgba(57,255,20,0.1)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'20px 16px 16px',borderBottom:'0.5px solid rgba(57,255,20,0.08)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,background:VERDE,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,color:FONDO,flexShrink:0}}>L</div>
              <div>
                <div style={{fontWeight:800,fontSize:15,color:'#fff',letterSpacing:'-0.3px'}}>Lex<span style={{color:VERDE}}>Byte</span></div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontWeight:500,marginTop:1}}>Sistema Legal IA</div>
              </div>
            </div>
          </div>
          <nav style={{flex:1,padding:'12px 8px'}}>
            {[{id:'lex',icon:'ti-scale',label:'Asistente Lex'},{id:'docs',icon:'ti-files',label:'Documentos'},{id:'historial',icon:'ti-folder',label:'Historial'},{id:'config',icon:'ti-settings',label:'Configuración'}].map(item=>(
              <div key={item.id} className="nav-item" onClick={()=>{setSection(item.id as Section);setDocTipo(null);setPaso(0);setAnalisis(null);}}
                style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:8,cursor:'pointer',fontSize:12.5,fontWeight:section===item.id?600:400,color:section===item.id?VERDE:'rgba(255,255,255,0.4)',background:section===item.id?'rgba(57,255,20,0.07)':'transparent',borderLeft:`2px solid ${section===item.id?VERDE:'transparent'}`,marginBottom:3,transition:'all 0.15s'}}>
                <i className={`ti ${item.icon}`} style={{fontSize:16,flexShrink:0}} aria-hidden="true"/>
                {item.label}
              </div>
            ))}
          </nav>
          <div style={{margin:'0 12px 16px',background:'rgba(57,255,20,0.05)',border:'0.5px solid rgba(57,255,20,0.15)',borderRadius:10,padding:12}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Plan actual</div>
            <div style={{fontSize:13,fontWeight:700,color:VERDE}}>Demo Gratuita</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:2}}>{freeLeft} consultas restantes</div>
            <button style={{marginTop:10,width:'100%',background:VERDE,color:FONDO,border:'none',borderRadius:7,padding:'7px 0',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>Suscribirme →</button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'14px 22px',borderBottom:'0.5px solid rgba(57,255,20,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between',background:FONDO,flexShrink:0}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:'#fff'}}>
                {section==='lex'&&'Asistente Jurídico Lex'}
                {section==='docs'&&(docTipo?`Contrato — ${docTipo==='capacitacion'?'Capacitación Inicial':'Obra Determinada'}`:'Generador de Documentos')}
                {section==='historial'&&'Historial de Documentos'}
                {section==='config'&&'Configuración'}
              </div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:2}}>
                {section==='lex'&&'LFT · LSS · INFONAVIT · SAR · NOM-035'}
                {section==='docs'&&(docTipo?`Paso ${paso+1} de 5 — ${pasosTitulos[paso]}`:'Selecciona el documento que necesitas')}
                {section==='historial'&&'Documentos generados por tu empresa'}
                {section==='config'&&'Datos de tu empresa y preferencias'}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontSize:10,background:'rgba(57,255,20,0.08)',border:'0.5px solid rgba(57,255,20,0.2)',color:VERDE,padding:'4px 12px',borderRadius:20,fontWeight:600}}>{freeLeft} consultas gratis</div>
              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(57,255,20,0.1)',border:'0.5px solid rgba(57,255,20,0.25)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <i className="ti ti-user" style={{fontSize:15,color:'rgba(255,255,255,0.5)'}} aria-hidden="true"/>
              </div>
            </div>
          </div>

          {/* CHAT LEX */}
          {section==='lex' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{flex:1,overflowY:'auto',padding:'18px 22px',display:'flex',flexDirection:'column',gap:14}}>
                {msgs.map((m,i)=>(
                  <div key={i} style={{display:'flex',gap:10,justifyContent:m.role==='user'?'flex-end':'flex-start',animation:'fadeUp 0.25s ease',maxWidth:'82%',alignSelf:m.role==='user'?'flex-end':'flex-start'}}>
                    {m.role==='assistant'&&<div style={{width:28,height:28,borderRadius:'50%',background:'rgba(57,255,20,0.1)',border:'0.5px solid rgba(57,255,20,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,marginTop:2}}>⚖️</div>}
                    <div style={{padding:'11px 15px',borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',fontSize:13,lineHeight:1.75,background:m.role==='user'?VERDE:'rgba(255,255,255,0.04)',color:m.role==='user'?FONDO:'#fff',border:m.role==='assistant'?'0.5px solid rgba(57,255,20,0.1)':'none',fontWeight:m.role==='user'?600:400}}
                      dangerouslySetInnerHTML={{__html:fmt(m.content)}}/>
                    {m.role==='user'&&<div style={{width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}><i className="ti ti-user" style={{fontSize:13,color:'rgba(255,255,255,0.4)'}} aria-hidden="true"/></div>}
                  </div>
                ))}
                {loading&&<div style={{display:'flex',gap:10}}><div style={{width:28,height:28,borderRadius:'50%',background:'rgba(57,255,20,0.1)',border:'0.5px solid rgba(57,255,20,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>⚖️</div><div style={{padding:'12px 16px',background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(57,255,20,0.1)',borderRadius:'14px 14px 14px 4px',display:'flex',gap:5,alignItems:'center'}}>{[0,0.15,0.3].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:VERDE,animation:`pulse 1.2s ${d}s infinite`}}/>)}</div></div>}
                <div ref={bottomRef}/>
              </div>
              {msgs.length<=1&&<div style={{padding:'0 22px 10px',display:'flex',flexWrap:'wrap',gap:7}}>{sugs.map(s=><button key={s} className="sug-btn" onClick={()=>setInput(s)} style={{fontSize:11.5,padding:'5px 13px',borderRadius:20,border:'0.5px solid rgba(57,255,20,0.2)',background:'rgba(57,255,20,0.04)',color:'rgba(255,255,255,0.45)',cursor:'pointer',fontFamily:"'Sora',sans-serif",transition:'all 0.15s'}}>{s}</button>)}</div>}
              <div style={{padding:'12px 22px 18px',borderTop:'0.5px solid rgba(57,255,20,0.08)',display:'flex',gap:10}}>
                <input className="inp" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Escribe tu consulta laboral..."
                  style={{flex:1,padding:'11px 15px',background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(57,255,20,0.2)',borderRadius:10,color:'#fff',fontSize:13,fontFamily:"'Sora',sans-serif"}}/>
                <button onClick={send} disabled={loading||!input.trim()} style={{background:input.trim()&&!loading?VERDE:'rgba(57,255,20,0.25)',color:FONDO,border:'none',borderRadius:10,padding:'11px 22px',fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:13,cursor:input.trim()&&!loading?'pointer':'not-allowed',transition:'all 0.15s'}}>
                  {loading?'...':'Enviar →'}
                </button>
              </div>
            </div>
          )}

          {/* DOCUMENTOS */}
          {section==='docs' && !docTipo && (
            <div style={{flex:1,overflowY:'auto',padding:22}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
                {docs.map(d=>(
                  <div key={d.id} className={d.ready?'doc-card':''} onClick={()=>{if(d.ready){setDocTipo(d.id as DocTipo);setPaso(0);setAnalisis(null);}}}
                    style={{background:'rgba(255,255,255,0.03)',border:`0.5px solid ${d.ready?'rgba(57,255,20,0.2)':'rgba(255,255,255,0.06)'}`,borderRadius:12,padding:'18px 16px',opacity:d.ready?1:0.45,cursor:d.ready?'pointer':'default',transition:'all 0.2s'}}>
                    <i className={`ti ${d.icon}`} style={{fontSize:24,color:d.ready?VERDE:'rgba(255,255,255,0.3)',marginBottom:10,display:'block'}} aria-hidden="true"/>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:'#fff'}}>{d.nombre}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:14}}>{d.base}</div>
                    {d.ready?<button style={{background:VERDE,color:FONDO,border:'none',borderRadius:7,padding:'6px 14px',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>Generar →</button>
                    :<span style={{fontSize:11,color:'rgba(255,255,255,0.25)',fontWeight:500}}>Próximamente</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FORMULARIO CONTRATO */}
          {section==='docs' && docTipo && (
            <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
              {/* Progress tabs */}
              <div style={{display:'flex',borderBottom:'0.5px solid rgba(57,255,20,0.08)',flexShrink:0,padding:'0 22px'}}>
                {pasosTitulos.map((t,i)=>(
                  <div key={i} onClick={()=>{if(i<paso)setPaso(i);}}
                    style={{padding:'10px 14px',fontSize:12,cursor:i<paso?'pointer':'default',borderBottom:`2px solid ${i===paso?VERDE:'transparent'}`,color:i===paso?VERDE:i<paso?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.25)',fontWeight:i===paso?600:400,transition:'all 0.15s',whiteSpace:'nowrap'}}>
                    {i<paso?'✓ ':''}{t}
                  </div>
                ))}
              </div>

              <div style={{flex:1,overflowY:'auto',padding:22}}>
                {renderPaso()}
              </div>

              <div style={{padding:'12px 22px 16px',borderTop:'0.5px solid rgba(57,255,20,0.08)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
                <button onClick={()=>{if(paso===0){setDocTipo(null);}else{setPaso(p=>p-1);}}}
                  style={{background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.6)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 18px',fontSize:12,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>
                  ← {paso===0?'Cancelar':'Atrás'}
                </button>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Paso {paso+1} de 5</div>
                {paso < 4 && (
                  <button onClick={()=>{ if(paso===3){setPaso(4);analizarContrato();}else{setPaso(p=>p+1);}}}
                    style={{background:VERDE,color:FONDO,border:'none',borderRadius:8,padding:'9px 20px',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>
                    {paso===3?'Ver análisis IA →':'Siguiente →'}
                  </button>
                )}
              </div>
            </div>
          )}

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
                <button style={{background:VERDE,color:FONDO,border:'none',borderRadius:9,padding:'11px 26px',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:"'Sora',sans-serif",marginTop:8}}>Guardar cambios</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
