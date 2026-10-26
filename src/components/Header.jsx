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
      <h1 className="brand__families">
        Nicholls <span className="brand__amp">&amp;</span> Moore
      </h1>
      <p className="brand__title">Secret Santa</p>
    </header>
  )
}
