# Otra Vuelta

Tienda de segunda mano con React, TypeScript y **Tailwind CSS 4**. Catálogo, fotos, piezas únicas y panel de pedidos. Sin pagos online.

## Instalar y abrir

Requiere Node.js 22.13 o superior. Probado con Node.js 24 en Windows.

```powershell
cd C:\Users\Juan\Desktop\Programas\otra-vuelta
npm install
npm run dev
```

Abrí **http://localhost:5173**. El primer inicio genera la clave de administración y crea la base de datos automáticamente. No requiere cuenta de Cloudflare ni conexión con Sites para funcionar en tu computadora.

Al pie de la web, elegí **Administrar tienda**. La clave está en el archivo local `.dev.vars`, después de `ADMIN_KEY=`. Este archivo no se incluye en Git. Podés cambiarla editando ese archivo y reiniciando el servidor.

El catálogo comienza vacío. Agregá artículos desde **Nuevo artículo**, con hasta cinco fotos, categoría, precio, estado, talle o medidas y descripción.

## Otros comandos

```powershell
npm run typecheck
npm run build
npm start
```

`npm start` sirve la compilación en http://localhost:5173. Primero detené el servidor de desarrollo para liberar el puerto.

`npm run db:migrate` aplica solamente las migraciones locales pendientes. Si cambiás el esquema en `db/schema.ts`, usá `npm run db:generate` y luego `npm run db:migrate`.

## Archivos principales

- `app/store.tsx`: catálogo, selección, formularios y panel.
- `app/globals.css`: tema, componentes con `@apply` de Tailwind y estilos particulares de las ilustraciones.
- `app/api/`: productos, pedidos y fotos.
- `db/schema.ts` y `drizzle/`: esquema y migraciones.
- `vite.config.ts`, `worker.ts` y `wrangler.jsonc`: servidor local con Vinext y emulación de D1/R2.

## Datos y funcionamiento

Artículos, pedidos y fotos se guardan dentro de `.wrangler/state` en esta carpeta; persisten al cerrar y volver a abrir. Conservá una copia de esa carpeta si querés respaldar los datos locales. El servidor calcula los totales y evita reservar dos veces la misma pieza. Cancelar un pedido libera sus piezas; entregarlo las marca como vendidas.

Nombre provisional: **Otra Vuelta**. Moneda provisional: **UYU**. Los pedidos se revisan desde el panel; no se envían notificaciones automáticas ni se realizan cobros.

Esta es una instalación local. Para uso real con clientes, todavía hay que definir el hosting, la base de datos y el almacenamiento compartidos, el dominio y los datos comerciales. El teléfono y la computadora solo comparten datos cuando acceden al mismo servidor.
