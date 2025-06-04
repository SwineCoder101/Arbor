export default function BlockedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>Access Restricted</h1>
      <p style={{ marginTop: '1rem', fontSize: '1.2rem', color: '#334155' }}>
        Sorry, this application is not available in your region (UK).
      </p>
    </div>
  );
} 