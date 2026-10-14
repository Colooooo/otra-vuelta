# Otra Vuelta

Tienda de segunda mano con **Next.js**, React, TypeScript y Tailwind CSS 4. Catálogo, fotos y panel de pedidos, sin pagos online. Hosting en **Vercel**; base de datos Postgres y fotos en **Supabase**.

## Configurar Supabase y Vercel

1. Creá o elegí el proyecto Supabase que usará la tienda.
2. Copiá ".env.example" a ".env.local" y completá:
   - **ADMIN_KEY**: una clave larga y aleatoria para el panel actual.
   - **DATABASE_URL**: Supabase → Connect → **Transaction pooler**, puerto 6543. Reemplazá la contraseña y codificá los caracteres especiales de la contraseña como URL. El cliente desactiva prepared statements para admitir este pooler.
   - **SUPABASE_URL**: URL del proyecto.
   - **SUPABASE_SECRET_KEY**: Supabase → Settings → API Keys → Secret keys (sb_secret_...). Se usa solamente en el servidor para Storage.
   - **MIGRATION_DATABASE_URL** (opcional): conexión directa o Session pooler para las migraciones. Si no está definida, se usa DATABASE_URL.
3. Ejecutá **npm run db:migrate** desde tu computadora. Crea el esquema privado "store", sus tablas y el bucket privado "otra-vuelta-photos". El comando registra las migraciones aplicadas y es idempotente. Modifica la base indicada en tus variables: usá proyectos distintos para pruebas y producción.
4. En Vercel → Settings → Environment Variables, cargá ADMIN_KEY, DATABASE_URL, SUPABASE_URL y SUPABASE_SECRET_KEY en los entornos correspondientes. Ninguna de estas claves lleva prefijo NEXT_PUBLIC_.
5. Subí los cambios a GitHub y volvé a desplegar. El repositorio configura **Next.js**, Node.js **24.x**, build **npm run build** y salida **.next** en vercel.json. Quitá overrides antiguos incompatibles en el panel de Vercel.

El build anterior usaba vinext y generaba un Worker Cloudflare. Vercel buscaba .next/routes-manifest.json. Ahora se ejecuta **next build**, que genera la salida esperada. No se necesita Turso, Vercel Blob ni una cuenta Cloudflare.

La compilación no necesita credenciales ni modifica Supabase. Las API requieren el proyecto configurado y las migraciones aplicadas. No se aplica ninguna migración automáticamente durante builds, inicios o previews.

## Seguridad y datos

El navegador habla con las rutas de Next.js. Las tablas están en el esquema privado "store", con RLS habilitada y acceso revocado a anon y authenticated. No expongas ese esquema en la Data API. El backend usa la conexión Postgres del proyecto; mantené esa contraseña únicamente en el servidor.

Las fotos se guardan en un bucket privado, sin políticas públicas de escritura, y se sirven por /api/image/:id para el catálogo público. La secret key nunca llega al navegador. La administración mantiene el sistema actual de clave ADMIN_KEY; esta migración no introduce cuentas de Supabase Auth.

El servidor calcula los totales y usa transacciones Postgres y una reserva única por pieza para evitar pedidos duplicados. Cancelar libera la pieza; entregarla la marca vendida.

El navegador comprime las fotos antes de subirlas. El máximo es **4 MB por archivo**, para entrar en el [límite de Vercel Functions](https://vercel.com/docs/functions/limitations#request-body-size).

## Instalar y abrir

Requiere **Node.js 24.x**.

~~~powershell
npm install
# Completar .env.local y aplicar la migración antes de usar la tienda.
npm run db:migrate
npm run dev
~~~

Abrí **http://localhost:5173**. Si falta ADMIN_KEY, el primer inicio genera una clave en .env.local y conserva la anterior de .dev.vars si existía. Al pie de la web, elegí **Administrar tienda** e ingresá esa clave.

El desarrollo utiliza el proyecto Supabase configurado. Si omitís ambas variables de Storage fuera de Vercel, las fotos se guardan en .data/photos para pruebas locales. En Vercel las credenciales de Supabase Storage son obligatorias y nunca se escriben fotos en disco efímero.

## Verificación y migraciones

~~~powershell
npm run typecheck
npm run build
npm run test:integration
npm start
~~~

Las pruebas arrancan la compilación de producción con un Postgres temporal basado en PGlite. Verifican migraciones idempotentes, RLS, permisos, fotos locales, administración, reservas simultáneas, rollback, cancelaciones y entregas. No acceden a tu proyecto Supabase. La prueba no sustituye la verificación de conexión y Storage en el proyecto real.

Para un cambio de esquema, creá un archivo con **npm run db:generate -- nombre_del_cambio**, escribí SQL Postgres en el archivo generado dentro de supabase/migrations y ejecutá **npm run db:migrate**. No edites migraciones ya aplicadas. Este proyecto usa ese comando como registro de migraciones; no alternes con supabase db push sin reconciliar el historial.

## Archivos principales

- app/store.tsx: catálogo, formularios y panel.
- app/globals.css: tema y estilos.
- app/api/: productos, pedidos y fotos.
- db/index.ts: conexión Postgres y transacciones.
- lib/photos.ts: cliente de Supabase Storage en el servidor.
- supabase/migrations/: esquema Postgres, permisos y bucket.
- vercel.json: despliegue.
- .env.example: variables de configuración sin secretos reales.

## Datos de la versión anterior

Los datos de Cloudflare siguen intactos en .wrangler/state, pero **no se importan automáticamente** a Supabase. Conservá esa carpeta si ya cargaste artículos. Una migración de datos debe trasladar también las fotos y conservar sus identificadores.

Moneda: **UYU**. Los pedidos se revisan en el panel, sin cobros ni notificaciones automáticas. El teléfono y la computadora comparten datos al acceder al mismo despliegue.
