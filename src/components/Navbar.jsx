import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Logo from './Logo'
import { useCart } from '../context/CartContext'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/emprendedores', label: 'Emprendedores' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { count, setIsOpen } = useCart()

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <Logo />
          <span>LA Colectivo</span>
        </NavLink>

        <nav className={`navbar__links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <button
            className="icon-btn"
            onClick={() => setIsOpen(true)}
            aria-label="Ver carrito de compras"
          >
            🛍
            {count > 0 && <span className="icon-btn__badge">{count}</span>}
          </button>
          <button
            className="navbar__burger"
            onClick={() => setOpen((o) => !o)}
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  )
}
