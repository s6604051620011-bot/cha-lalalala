import Link from 'next/link';

const linkStyle = {
  display: 'block',
  padding: '14px 20px',
  borderRadius: 10,
  background: '#2b2118',
  color: '#fffaf3',
  textDecoration: 'none',
  textAlign: 'center',
  fontSize: 18,
};

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 40, margin: 0 }}>cha_lalalala</h1>
      <nav style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 320 }}>
        <Link href="/generate-qr" style={linkStyle}>
          สร้าง QR โต๊ะ
        </Link>
        <Link href="/kitchen" style={linkStyle}>
          หน้าชงเครื่องดื่ม
        </Link>
      </nav>
    </main>
  );
}
