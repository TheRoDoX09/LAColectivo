# LA Colectivo — Tienda Colaborativa

Sitio web para el colectivo: catálogo de productos con etiquetas, pedidos (recoger o
domicilio, sin pago en línea), panel de administrador y un apartado de espacios en
renta para emprendedores.

## Stack

- React 19 + Vite
- React Router
- Supabase (base de datos, autenticación del admin, almacenamiento de imágenes)

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (gratis).
2. En **SQL Editor**, crea las tablas que usa la app (no hay un archivo de
   schema en este repo todavía, hay que crearlas a mano):
   `categorias`, `subcategorias`, `sub_subcategorias`, `productos`,
   `producto_variantes`, `pedidos` y `espacios_renta`.
3. En **Storage**, crea un bucket público llamado `imagenes` (ahí se suben
   las fotos de productos y espacios).
4. Ve a **Authentication → Users → Add user** y crea el usuario del dueño
   (correo + contraseña). Esa cuenta es el único acceso al panel admin.
5. Copia tu `Project URL` y tu `anon / publishable key` desde
   **Settings → API**.
6. Crea un archivo `.env` en la raíz del proyecto con:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxx
```

**El archivo `.env` nunca se sube a git** (ya está en `.gitignore`).

## 3. Correr en desarrollo

```bash
npm run dev
```

## 4. Panel de administrador

Entra en `/admin/login` con el correo y contraseña que creaste en el paso 2.3.
Desde ahí puedes:

- Agregar, editar y marcar productos como agotados
- Publicar y editar espacios de renta para emprendedores
- Ver y actualizar el estado de los pedidos

## 5. Logotipo

Ya integrado con los archivos reales del colectivo:

public/logo-icon.png → sello circular solo (navbar, footer, panel admin, favicon)
public/logo-full.png → sello + "COLECTIVO" (hero de Home)

Se usan a través de src/components/Logo.jsx con la prop variant="icon" (por defecto) o variant="full".

## 6. Contenido ya cargado

- `src/lib/constants.js` → ya tiene Instagram, TikTok, Facebook, correo y teléfono reales
- `src/components/Footer.jsx` → ya tiene la dirección y horario reales del local
