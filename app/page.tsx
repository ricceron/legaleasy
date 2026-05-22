'use client';
import { useState, useRef, useEffect } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
type Section = 'lex' | 'docs' | 'historial' | 'config';

export default function LexByte() {
  const [section, setSection] = useState<Section>('lex');
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: '¡Bienvenido a **LexByte**! Soy **Lex**, tu asistente jurídico laboral especializado en la Ley Federal del Trabajo.\n\nPuedo ayudarte con contratos, rescisiones, actas, incapacidades, finiquitos y más.\n\n¿Qué necesitas saber hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [freeLeft, setFreeLeft] = useState(3);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    if (freeLeft <= 0) {
      setMsgs(m => [...m, { role: 'assistant', content: 'Has agotado tus consultas gratuitas. Suscríbete desde **$799 MXN/mes** para acceso ilimitado.' }]);
      return;
    }
    const userMsg: Msg = { role: 'user', content: input };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setLoading(true);
    setFreeLeft(f => f - 1);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMsgs(m => [...m, { role: 'assistant', content: data.reply || 'Error al procesar.' }]);
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'Error de conexión.' }]);
    }
    setLoading(false);
  };

  const fmt = (t: string) => t
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  const sugs = [
    '¿Puedo despedir a un trabajador que llegó borracho?',
    '¿3 retardos equivalen a una falta?',
    '¿Cuánto dura la incapacidad por maternidad?',
    '¿Cuáles son los días de descanso obligatorio?',
    '¿Qué pago en un despido injustificado?',
  ];

  const docs = [
    { id: 'cap', nombre: 'Capacitación Inicial', base: 'Art. 39-B LFT', ready: true, icon: 'ti-file-check' },
    { id: 'obra', nombre: 'Obra Determinada', base: 'Arts. 35-36 LFT', ready: true, icon: 'ti-building' },
    { id: 'ind', nombre: 'Tiempo Indeterminado', base: 'Art. 35 LFT', ready: false, icon: 'ti-file-text' },
    { id: 'acta', nombre: 'Acta Administrativa', base: 'Art. 47 LFT', ready: false, icon: 'ti-scale' },
    { id: 'ren', nombre: 'Renuncia Voluntaria', base: 'Art. 53 LFT', ready: false, icon: 'ti-signature' },
    { id: 'fin', nombre: 'Finiquito y Liquidación', base: 'Arts. 48-50 LFT', ready: false, icon: 'ti-cash' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:#060f1e;color:#fff}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(57,255,20,0.25);border-radius:2px}
        @keyframes pulse{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .nav-item:hover{background:rgba(57,255,20,0.05)!important;color:rgba(255,255,255,0.75)!important}
        .sug-btn:hover{border-color:#39ff14!important;color:#39ff14!important}
        .doc-card:hover{border-color:rgba(57,255,20,0.4)!important;background:rgba(57,255,20,0.04)!important}
        .inp:focus{border-color:#39ff14!important;outline:none}
      `}</style>

      <div style={{ display:'flex', height:'100vh', background:'#060f1e', fontFamily:"'Sora',sans-serif", overflow:'hidden' }}>

        {/* SIDEBAR */}
        <div style={{ width:230, flexShrink:0, background:'#080f1c', borderRight:'0.5px solid rgba(57,255,20,0.1)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'20px 16px 16px', borderBottom:'0.5px solid rgba(57,255,20,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, background:'#39ff14', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, color:'#060f1e', flexShrink:0 }}>L</div>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:'#fff', letterSpacing:'-0.3px' }}>Lex<span style={{ color:'#39ff14' }}>Byte</span></div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:500, marginTop:1 }}>Sistema Legal IA</div>
              </div>
            </div>
          </div>

          <nav style={{ flex:1, padding:'12px 8px' }}>
            {[
              { id:'lex', icon:'ti-scale', label:'Asistente Lex' },
              { id:'docs', icon:'ti-files', label:'Documentos' },
              { id:'historial', icon:'ti-folder', label:'Historial' },
              { id:'config', icon:'ti-settings', label:'Configuración' },
            ].map(item => (
              <div key={item.id} className="nav-item" onClick={() => setSection(item.id as Section)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, cursor:'pointer', fontSize:12.5, fontWeight: section===item.id ? 600 : 400, color: section===item.id ? '#39ff14' : 'rgba(255,255,255,0.4)', background: section===item.id ? 'rgba(57,255,20,0.07)' : 'transparent', borderLeft:`2px solid ${section===item.id ? '#39ff14' : 'transparent'}`, marginBottom:3, transition:'all 0.15s' }}>
                <i className={`ti ${item.icon}`} style={{ fontSize:16, flexShrink:0 }} aria-hidden="true" />
                {item.label}
              </div>
            ))}
          </nav>

          <div style={{ margin:'0 12px 16px', background:'rgba(57,255,20,0.05)', border:'0.5px solid rgba(57,255,20,0.15)', borderRadius:10, padding:12 }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Plan actual</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#39ff14' }}>Demo Gratuita</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{freeLeft} consultas restantes</div>
            <button style={{ marginTop:10, width:'100%', background:'#39ff14', color:'#060f1e', border:'none', borderRadius:7, padding:'7px 0', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:"'Sora',sans-serif" }}>Suscribirme →</button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'14px 22px', borderBottom:'0.5px solid rgba(57,255,20,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#060f1e', flexShrink:0 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'#fff' }}>
                {section==='lex'&&'Asistente Jurídico Lex'}{section==='docs'&&'Generador de Documentos'}{section==='historial'&&'Historial de Documentos'}{section==='config'&&'Configuración'}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>
                {section==='lex'&&'Consultas laborales con fundamento en la LFT'}{section==='docs'&&'Contratos, actas y finiquitos listos para firmar'}{section==='historial'&&'Documentos generados por tu empresa'}{section==='config'&&'Datos de tu empresa y preferencias'}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:10, background:'rgba(57,255,20,0.08)', border:'0.5px solid rgba(57,255,20,0.2)', color:'#39ff14', padding:'4px 12px', borderRadius:20, fontWeight:600 }}>{freeLeft} consultas gratis</div>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(57,255,20,0.1)', border:'0.5px solid rgba(57,255,20,0.25)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <i className="ti ti-user" style={{ fontSize:15, color:'rgba(255,255,255,0.5)' }} aria-hidden="true" />
              </div>
            </div>
          </div>

          {section==='lex' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ flex:1, overflowY:'auto', padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ display:'flex', gap:10, justifyContent: m.role==='user'?'flex-end':'flex-start', animation:'fadeUp 0.25s ease', maxWidth:'80%', alignSelf: m.role==='user'?'flex-end':'flex-start' }}>
                    {m.role==='assistant' && <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(57,255,20,0.1)', border:'0.5px solid rgba(57,255,20,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, marginTop:2 }}>⚖️</div>}
                    <div style={{ padding:'10px 14px', borderRadius: m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px', fontSize:13, lineHeight:1.7, background: m.role==='user'?'#39ff14':'rgba(255,255,255,0.04)', color: m.role==='user'?'#060f1e':'#fff', border: m.role==='assistant'?'0.5px solid rgba(57,255,20,0.1)':'none', fontWeight: m.role==='user'?600:400 }} dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
                    {m.role==='user' && <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}><i className="ti ti-user" style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }} aria-hidden="true" /></div>}
                  </div>
                ))}
                {loading && (
                  <div style={{ display:'flex', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(57,255,20,0.1)', border:'0.5px solid rgba(57,255,20,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>⚖️</div>
                    <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(57,255,20,0.1)', borderRadius:'14px 14px 14px 4px', display:'flex', gap:5, alignItems:'center' }}>
                      {[0,0.15,0.3].map((d,i) => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#39ff14', animation:`pulse 1.2s ${d}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {msgs.length<=1 && (
                <div style={{ padding:'0 22px 10px', display:'flex', flexWrap:'wrap', gap:7 }}>
                  {sugs.map(s => <button key={s} className="sug-btn" onClick={() => setInput(s)} style={{ fontSize:11.5, padding:'5px 13px', borderRadius:20, border:'0.5px solid rgba(57,255,20,0.2)', background:'rgba(57,255,20,0.04)', color:'rgba(255,255,255,0.45)', cursor:'pointer', fontFamily:"'Sora',sans-serif", transition:'all 0.15s' }}>{s}</button>)}
                </div>
              )}

              <div style={{ padding:'12px 22px 18px', borderTop:'0.5px solid rgba(57,255,20,0.08)', display:'flex', gap:10 }}>
                <input className="inp" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&send()} placeholder="Escribe tu consulta laboral..."
                  style={{ flex:1, padding:'11px 15px', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(57,255,20,0.2)', borderRadius:10, color:'#fff', fontSize:13, fontFamily:"'Sora',sans-serif" }} />
                <button onClick={send} disabled={loading||!input.trim()} style={{ background: input.trim()&&!loading?'#39ff14':'rgba(57,255,20,0.25)', color:'#060f1e', border:'none', borderRadius:10, padding:'11px 22px', fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:13, cursor: input.trim()&&!loading?'pointer':'not-allowed', transition:'all 0.15s' }}>
                  {loading?'...':'Enviar →'}
                </button>
              </div>
            </div>
          )}

          {section==='docs' && (
            <div style={{ flex:1, overflowY:'auto', padding:22 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
                {docs.map(d => (
                  <div key={d.id} className={d.ready?'doc-card':''} style={{ background:'rgba(255,255,255,0.03)', border:`0.5px solid ${d.ready?'rgba(57,255,20,0.2)':'rgba(255,255,255,0.06)'}`, borderRadius:12, padding:'18px 16px', opacity:d.ready?1:0.45, cursor:d.ready?'pointer':'default', transition:'all 0.2s' }}>
                    <i className={`ti ${d.icon}`} style={{ fontSize:24, color:d.ready?'#39ff14':'rgba(255,255,255,0.3)', marginBottom:10, display:'block' }} aria-hidden="true" />
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:4, color:'#fff' }}>{d.nombre}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:14 }}>{d.base}</div>
                    {d.ready ? <button style={{ background:'#39ff14', color:'#060f1e', border:'none', borderRadius:7, padding:'6px 14px', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:"'Sora',sans-serif" }}>Generar →</button>
                    : <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:500 }}>Próximamente</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section==='historial' && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
              <i className="ti ti-folder-open" style={{ fontSize:44, color:'rgba(57,255,20,0.2)' }} aria-hidden="true" />
              <div style={{ fontWeight:600, fontSize:14, color:'rgba(255,255,255,0.4)' }}>Sin documentos aún</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>Los contratos generados aparecerán aquí</div>
            </div>
          )}

          {section==='config' && (
            <div style={{ flex:1, overflowY:'auto', padding:22 }}>
              <div style={{ maxWidth:480 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'#fff', marginBottom:18 }}>Datos de la empresa</div>
                {['Nombre o razón social','RFC','Registro patronal IMSS','Correo de contacto','Ciudad / Estado'].map(label => (
                  <div key={label} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{label}</div>
                    <input placeholder={`Ingresa ${label.toLowerCase()}`} style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(57,255,20,0.15)', borderRadius:9, color:'#fff', fontSize:13, fontFamily:"'Sora',sans-serif", outline:'none' }} />
                  </div>
                ))}
                <button style={{ background:'#39ff14', color:'#060f1e', border:'none', borderRadius:9, padding:'11px 26px', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:"'Sora',sans-serif", marginTop:8 }}>Guardar cambios</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

