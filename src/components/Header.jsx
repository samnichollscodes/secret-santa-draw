export default function Header({ small = false }) {
  return (
    <header className={`brand ${small ? 'brand--small' : ''}`}>
      <div className="brand__holly" aria-hidden="true">
        <span className="leaf leaf--l" />
        <span className="berry" />
        <span className="berry" />
        <span className="berry" />
        <span className="leaf leaf--r" />
      </div>
      <p className="brand__eyebrow">The Christmas Draw</p>
      <h1 className="brand__title">Secret Santa</h1>
    </header>
  )
}
