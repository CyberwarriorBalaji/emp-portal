export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', gap: '16px', background: 'var(--bg)'
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--indigo)',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading EmpPortal…</span>
    </div>
  )
}
