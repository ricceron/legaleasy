'use client';
import { useState, useRef, useEffect } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function Home() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: '¡Bienvenido a **LegalEasy**! Soy **Lex**, tu asistente jurídico laboral.\n\nPuedo ayudarte con contratos, rescisiones, actas, incapacidades y más.\n\n¿Qué necesitas saber hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [freeLeft, setFreeLeft] = useState(3);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    if (freeLeft <= 0) {
      setMsgs(m => [...m, { role: 'assistant', content: 'Has agotado tus consultas gratuitas. Suscríbete desde **$799 MXN/mes**.' }]);
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

  const fmt = (t: string) => t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

  const sugs = [
    '¿Puedo despedir a un trabajador que llegó borracho?',
    '¿3 retardos equivalen a una falta?',
    '¿Cuánto dura la incapacidad por maternidad?',
    '¿Cuáles son los días de descanso obligatorio?',
    '¿Qué pago en un despido injustificado?',
  ];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#111', borderBottom: '1px solid #222', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Legal<span style={{ color: '#3B82F6' }}>Easy</span></div>
        <button style={{ background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 14, cursor: 'pointer' }}>Iniciar sesión</button>
      </header>

      <section style={{ textAlign: 'center', padding: '3rem 2rem 1.5rem', background: 'linear-gradient(180deg,#111 0%,#0a0a0a 100%)' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#3B82F6', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Asistente Jurídico Laboral con IA</div>
        <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 700, margin: '0 0 1rem', lineHeight: 1.2 }}>
          El abogado laboral de tu<br /><span style={{ color: '#3B82F6' }}>departamento de RRHH</span>
        </h1>
        <p style={{ color: '#888', fontSize: 16, maxWidth: 520, margin: '0 auto 2rem' }}>
          Consultas jurídicas ilimitadas + generación de contratos, actas y finiquitos.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Starter $799/mes', 'Business $1,499/mes', 'Enterprise $2,999/mes'].map(p => (
            <div key={p} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#aaa' }}>{p}</div>
          ))}
        </div>
      </section>

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: 720, background: '#111', border: '1px solid #222', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 480 }}>
          <div style={{ background: '#1a3a5c', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚖️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Lex — Asistente Jurídico Laboral</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Especialista en Ley Federal del Trabajo · México</div>
            </div>
            <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 20 }}>
              {freeLeft > 0 ? `${freeLeft} consulta${freeLeft !== 1 ? 's' : ''} gratis` : 'Límite alcanzado'}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12, background: '#0d0d0d' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, marginTop: 2 }}>⚖️</div>
                )}
                <div style={{ maxWidth: '80%', padding: '9px 13px', borderRadius: 12, fontSize: 13, lineHeight: 1.65, background: m.role === 'user' ? '#2563EB' : '#1a1a1a', border: m.role === 'assistant' ? '1px solid #222' : 'none', borderBottomLeftRadius: m.role === 'assistant' ? 4 : 12, borderBottomRightRadius: m.role === 'user' ? 4 : 12 }}
                  dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>⚖️</div>
                <div style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 12, borderBottomLeftRadius: 4, padding: '12px 16px', display: 'flex', gap: 4 }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#3B82F6', opacity: 0.4, animation: `pulse 1.2s ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {msgs.length <= 1 && (
            <div style={{ padding: '0.5rem 1rem', display: 'flex', flexWrap: 'wrap', gap: 6, background: '#0d0d0d', borderTop: '1px solid #1a1a1a' }}>
              {sugs.map(s => (
                <button key={s} onClick={() => setInput(s)} style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 20, border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
          )}

          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 8, background: '#111' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Escribe tu pregunta laboral..."
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #333', background: '#0d0d0d', color: '#fff', fontSize: 13, fontFamily: 'system-ui' }} />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
              Enviar
            </button>
          </div>
        </div>
        <p style={{ color: '#555', fontSize: 12, marginTop: '0.75rem' }}>3 consultas gratuitas · Sin registro · Fundamento en LFT</p>
      </section>

      <style>{`@keyframes pulse{0%,80%,100%{opacity:.4}40%{opacity:1}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#333;border-radius:2px}`}</style>
    </main>
  );
}
