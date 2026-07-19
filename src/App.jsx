import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import Entrepreneurs from './pages/Entrepreneurs'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/catalogo/:categoriaSlug" element={<Catalog />} />
        <Route path="/catalogo/:categoriaSlug/:subcategoriaSlug" element={<Catalog />} />
        <Route path="/catalogo/:categoriaSlug/:subcategoriaSlug/:subSubcategoriaSlug" element={<Catalog />} />
        <Route path="/emprendedores" element={<Entrepreneurs />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      {!isAdmin && <Footer />}
      {!isAdmin && <CartDrawer />}
    </>
  )
}
