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
2. Ve a **SQL Editor** → pega y ejecuta todo el contenido de `supabase_schema.sql`.
3. Pega y ejecuta también `supabase_migration_v2.sql` (agrega categorías,
   subcategorías, variantes de producto y cantidades — ya viene con las
   categorías del colectivo precargadas).
4. Ve a **Authentication → Users → Add user** y crea el usuario del dueño
   (correo + contraseña). Esa cuenta es el único acceso al panel admin.
5. Copia tu `Project URL` y tu `anon / publishable key` desde
   **Settings → API**.
6. Crea un archivo `.env` en la raíz del proyecto (usa `.env.example` como base):

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

Mientras no haya logotipo definitivo, se muestra un marcador de posición
(`src/components/Logo.jsx`). Cuando el cliente lo entregue:

1. Coloca el archivo en `public/logo.svg` (o `.png`)
2. Reemplaza el contenido de `Logo.jsx` por `<img src="/logo.svg" alt="LA Colectivo" />`

## 6. Contenido ya cargado

- `src/lib/constants.js` → ya tiene Instagram, TikTok, Facebook, correo y teléfono reales
- Categorías y subcategorías del colectivo ya vienen precargadas por `supabase_migration_v2.sql`

## 7. Pendiente

- `src/components/Footer.jsx` → agrega la dirección y horario reales del local
