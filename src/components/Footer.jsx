import { Link } from 'react-router-dom'
import Logo from './Logo'
import { CONTACTO } from '../lib/constants'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__col">
          <div className="footer__brand">
            <Logo />
            <h4>LA Colectivo</h4>
          </div>
          <p>Tienda colaborativa de emprendedores locales.</p>
          <p>Ropa, accesorios, figuras, perfumes y más.</p>
        </div>
        <div className="footer__col">
          <h4>Visítanos</h4>
          <p>Lázaro Cárdenas A y B y calle 42</p>
          <p>Horario: Lun–Sáb, 12:00–8:00 pm</p>
        </div>
        <div className="footer__col">
          <h4>Contacto</h4>
          <a href={CONTACTO.instagram} target="_blank" rel="noreferrer">Instagram</a>
          <a href={CONTACTO.tiktok} target="_blank" rel="noreferrer">TikTok</a>
          <a href={CONTACTO.facebook} target="_blank" rel="noreferrer">Facebook</a>
          <span>{CONTACTO.correo}</span>
          <span>{CONTACTO.telefono}</span>
        </div>
        <div className="footer__col">
          <h4>Emprendedores</h4>
          <Link to="/emprendedores">Renta un espacio</Link>
          <Link to="/admin/login">Acceso administrador</Link>
        </div>
      </div>
      <div className="footer__bottom">© {new Date().getFullYear()} LA Colectivo — Todos los derechos reservados</div>
    </footer>
  )
}
