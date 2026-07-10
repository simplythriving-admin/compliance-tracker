# Compliance Tracker — Guía de configuración

Esta carpeta contiene tu tracker de compliance:

- `admin.html` — donde tú agregas empleados, marcas requerimientos completados, etc. (solo tú puedes entrar aquí).
- `viewer.html` — la vista de solo lectura que compartes con tu equipo administrativo.
- `shared/` — archivos de configuración y lógica que usan ambas páginas (no los borres ni muevas).

Antes de usarla necesitas crear un proyecto gratuito de Firebase (es de Google, es donde se guardan los datos). Toma unos 10 minutos, una sola vez.

## Paso 1 — Crear el proyecto de Firebase

1. Ve a https://console.firebase.google.com y entra con la cuenta de Google Workspace st-admin@simplythriving.com.
2. Clic en **"Agregar proyecto"**. Ponle un nombre, ej. `compliance-tracker`.
3. Puedes desactivar Google Analytics (no lo necesitas). Clic en "Crear proyecto".

## Paso 2 — Activar Firestore (la base de datos)

1. En el menú izquierdo, ve a **Compilación > Firestore Database**.
2. Clic en **"Crear base de datos"**.
3. Elige **modo de producción** (no "modo de prueba") y la ubicación más cercana a ti.
4. Cuando termine, ve a la pestaña **"Reglas"** y reemplaza el contenido por esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == "st-admin@simplythriving.com";
    }
  }
}
```

5. Clic en **"Publicar"**.

Esto significa: cualquiera con el link puede *ver* los datos, pero solo tu cuenta puede *escribir/editar*.

## Paso 3 — Activar el inicio de sesión con Google

1. En el menú izquierdo, ve a **Compilación > Authentication**.
2. Clic en **"Comenzar"** (Get started).
3. En la lista de proveedores, activa **Google**. Guarda.

## Paso 4 — Registrar tu app web y copiar la configuración

1. En el menú izquierdo, clic en el ícono de engranaje ⚙️ junto a "Descripción general del proyecto" > **"Configuración del proyecto"**.
2. Baja hasta **"Tus apps"** y clic en el ícono `</>` (Web).
3. Ponle un nombre, ej. `compliance-web`, y clic en "Registrar app". **No** actives Firebase Hosting en este paso (lo puedes hacer después si quieres).
4. Copia el bloque `firebaseConfig = {...}` que te muestra.
5. Abre el archivo `shared/firebase-config.js` de esta carpeta y reemplaza el objeto `firebaseConfig` con el que copiaste. El `ADMIN_EMAIL` déjalo como está (ya tiene st-admin@simplythriving.com).

## Paso 5 — Autorizar el dominio donde vas a publicar la página

1. En **Authentication > Settings > Authorized domains**, agrega el dominio donde vayas a subir los archivos (ver Paso 6). Si vas a probarlo primero en tu compu, `localhost` ya viene autorizado por defecto.

## Paso 6 — Publicar la página para que tenga un link

Necesitas subir esta carpeta a algún lugar que la sirva como página web. Dos opciones simples y gratis:

**Opción A — Firebase Hosting (recomendado, mismo proyecto):**
1. Instala las herramientas de Firebase (requiere Node.js): abre una terminal y ejecuta `npm install -g firebase-tools`.
2. Dentro de esta carpeta, ejecuta `firebase login`, luego `firebase init hosting` (selecciona tu proyecto, carpeta pública = la carpeta actual, configúralo como single-page app = No).
3. Ejecuta `firebase deploy`. Te dará una URL tipo `https://tu-proyecto.web.app`.
4. Tu link de administración será `https://tu-proyecto.web.app/admin.html` y el de tus colegas `https://tu-proyecto.web.app/viewer.html`.

**Opción B — GitHub Pages:** sube la carpeta a un repositorio de GitHub (puede ser privado) y activa GitHub Pages en la configuración del repo. Ten en cuenta que si el repositorio es público, cualquiera podría ver el código (no los datos, esos siguen protegidos por las reglas de Firestore) — si prefieres mantenerlo privado, usa la Opción A.

## Cómo compartir

- **Tú (administrador):** entra a `admin.html`, inicia sesión con Google usando st-admin@simplythriving.com.
- **Tu equipo (hasta 4 personas):** comparte el link de `viewer.html`. No necesitan cuenta ni contraseña, solo pueden ver.
- **Los empleados:** no reciben ningún link.

## Supuestos que hice al construir el calendario (ajustables si me dices)

- Los requerimientos con "renovación anual" (EVV, Acuity) se repiten cada año en la misma fecha desde su primer vencimiento.
- "Firma de bitácoras semanales" vence cada 7 días desde la fecha de inicio del empleado, de forma indefinida.
- "Monthly exclusion check" vence cada mes desde la fecha de inicio, de forma indefinida.
- El calendario muestra vencimientos desde la fecha de inicio del empleado hasta 180 días hacia el futuro (se recalcula cada vez que abres la página).
- "CDS 189 day modules" lo programé a 180 días (así lo indicaba la nota entre paréntesis en tu documento, aunque el nombre dice "189"); si el vencimiento real es a los 189 días, dímelo y ajusto el número en `shared/requirements-data.js`.

Si alguno de estos supuestos no es correcto, dime y lo ajusto.
