import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { esEmailValido, limpiarTexto } from '../lib/validation'

export default function AdminLogin() {
  const { session, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!esEmailValido(email)) {
      setError('Escribe un correo válido.')
      return
    }
    if (!password) {
      setError('La contraseña es obligatoria.')
      return
    }

    setLoading(true)
    const err = await login(email, password)
    setLoading(false)
    if (err) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    navigate('/admin')
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div style={{ marginBottom: '1rem' }}>
          <Logo />
        </div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1.2rem' }}>Acceso administrador</h1>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(limpiarTexto(e.target.value))} required />
          </div>
          <div className="form-field">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn--brown btn--full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
