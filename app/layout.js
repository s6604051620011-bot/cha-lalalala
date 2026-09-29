export const metadata = {
  title: 'cha_lalalala',
  description: 'ระบบสั่งเครื่องดื่มร้าน cha_lalalala',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body
        style={{
          margin: 0,
          fontFamily:
            '"Noto Sans Thai", "Sarabun", system-ui, -apple-system, "Segoe UI", sans-serif',
          background: '#fffaf3',
          color: '#2b2118',
        }}
      >
        {children}
      </body>
    </html>
  );
}
