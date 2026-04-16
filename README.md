# Delicias Leto — Sistema de Control Administrativo

Sistema administrativo web construido especialmente para "Delicias Leto".  
Permite llevar el registro diario de ventas, controlar surtidos, gastos extras y pago de nómina, entregando resúmenes estructurados semanales y mensuales con cálculo automático de utilidad y ganancia por socio.

## Características

* **Registro Diario:** Registra las ventas por categoría (salchipapas, hamburguesas, picadas, gaseosas) y calcula automáticamente la caja neta del día.
* **Control de Costos:** Sistema diferenciado para Surtidos y Gastos Extras permitiendo un control simple sin inventarios complejos.
* **Nómina Semanal:** Registro ágil del pago para los dos trabajadores base.
* **Alertas y Rentabilidad:** El sistema avisa si la utilidad está bajando, si el surtido consume más del 60% de las ventas, o si los gastos extra están por encima del 20%.
* **Resúmenes Automáticos:** Fórmulas integradas que calculan la Utilidad Semanal, Útilidad Mensual y lo dividen automáticamente entre los socios configurados.

## Stack Tecnológico

* Next.js 15 (App Router, Edge Runtime)
* TypeScript
* Tailwind CSS v4
* Supabase (PostgreSQL + Auth)
* Listo para desplegar gratis en Cloudflare Pages

---

## Guía Rápida de Instalación (Local)

1. **Instalar dependencias necesarias**
   Asegúrate de tener Node.js instalado, luego entra al proyecto:
   ```bash
   cd delicias-leto-admin
   npm install
   ```

2. **Configurar Supabase**
   - Entra a [Supabase](https://supabase.com) y crea un nuevo proyecto (es gratis).
   - En el menú principal, ve a la sección **SQL Editor**.
   - Copia el contenido del archivo `supabase/schema.sql` y ejecútalo. (Esto creará tus tablas).
   - *Opcional:* Copia y ejecuta el archivo `supabase/seed.sql` si quieres llenar la base con datos de prueba (3 semanas de simulación).
   - Ve a **Authentication > Users** y crea un usuario manual (ej. `admin@deliciasleto.com` y una contraseña). Este será tu usuario de acceso.

3. **Variables de Entorno**
   - Copia el archivo de ejemplo:
     ```bash
     cp .env.local.example .env.local
     ```
   - Rellena el archivo `.env.local` con la URL y la Key anónima de tu proyecto (las encuentras en Settings > API en Supabase).

4. **Correr Localmente**
   ```bash
   npm run dev
   ```
   Entra a `http://localhost:3000` y regístrate con el usuario que creaste.

---

## Guía de Despliegue Gratis (Cloudflare)

El proyecto está preparado para funcionar en la red global y gratuita de Cloudflare a través de **Cloudflare Pages** y **Workers**.

1. **Sube el código a GitHub**
   Crea un repositorio en GitHub (privado o público) y haz push de este código.

2. **Conecta en Cloudflare**
   - Entra a tu dashboard de Cloudflare.
   - Ve a **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
   - Selecciona tu repositorio de Delicias Leto.

3. **Configura el Build**
   - Framework preset: Selecciona `Next.js (Edge)`
   - El comando de build que usará internamente es `npx @cloudflare/next-on-pages@1`
   - Build output directory: `.vercel/output/static`

4. **Variables de entorno en Cloudflare**
   Antes de guardar, expande **Environment variables (advanced)** y añade:
   - `NEXT_PUBLIC_SUPABASE_URL` = (tu url)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (tu key)

5. Dale a **Save and Deploy**. En minutos tendrás tu app viva y gratis.
