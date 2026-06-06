import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LexByte — Sistema Legal Laboral Inteligente',
  description: 'Genera contratos laborales con IA jurídica especializada',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0a0a0a', color: '#fff' }}>
        {children}
      </body>
    </html>
  )
}
