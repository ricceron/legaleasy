'use client';

const docs = [
  { id: 'capacitacion', nombre: 'Capacitación Inicial', base: 'Art. 39-B LFT', status: 'ready' },
  { id: 'obra', nombre: 'Obra Determinada', base: 'Arts. 35-36 LFT', status: 'ready' },
  { id: 'indeterminado', nombre: 'Tiempo Indeterminado', base: 'Art. 35 LFT', status: 'soon' },
  { id: 'acta', nombre: 'Acta Administrativa', base: 'Art. 47 LFT', status: 'soon' },
  { id: 'renuncia', nombre: 'Renuncia Voluntaria', base: 'Art. 53 LFT', status: 'soon' },
  { id: 'finiquito', nombre: 'Finiquito y Liquidación', base: 'Arts. 48-50 LFT', status: 'soon' },
];

export default function Dashboard() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <header style={{ background: '#111', borderBottom: '1px solid #222', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Legal<span style={{ color: '#3B82F6' }}>Easy</span></div>
        <div style={{ fontSize: 13, color: '#888' }}>Panel de RRHH</div>
      </header>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: '0.5rem' }}>Documentos laborales</h2>
        <p style={{ color: '#888', fontSize: 14, marginBottom: '2rem' }}>Selecciona el documento que necesitas generar</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
          {docs.map(d => (
            <div key={d.id} style={{ background: '#111', border: `1px solid ${d.status === 'ready' ? '#1a3a5c' : '#222'}`, borderRadius: 12, padding: '1.25rem', opacity: d.status === 'ready' ? 1 : 0.5 }}>
              <div style={{ fontSize: 28, marginBottom: '0.5rem' }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '0.25rem' }}>{d.nombre}</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: '1rem' }}>{d.base}</div>
              {d.status === 'ready'
                ? <button style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>Generar</button>
                : <span style={{ fontSize: 12, color: '#555' }}>Próximamente</span>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
