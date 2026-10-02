# DOLL ARS · Catálogo de perfiles

## Actualización

- Acceso inicial con el monograma D y contraseña validada en el servidor.
- Contraseña guardada como secreto de Sites, fuera del código enviado al navegador.
- Sesión firmada de 12 horas, cookie HttpOnly/Secure y botón Salir.
- Telegram: @bossin_around.
- Diseño pensado para celulares, filtros por país e inglés y tarjetas redondeadas.
- Campos visibles: foto, nombre, país e inglés. No se exponen edad, correo, ingresos, disponibilidad, contenido ni referencias.
- Solo perfiles con edad válida mayor o igual a 18 y casilla Publicar marcada.

## Pendiente: activar la conexión de Google

La hoja y el formulario requieren iniciar sesión. Todavía no están conectados al sitio. No se cambió su contenido ni sus permisos. El catálogo está vacío hasta conectar la fuente real.

Hoja: https://docs.google.com/spreadsheets/d/1TVEuvhJtnvHDB12x0hrebl6QGKrdfMmpAJaSxFkMycQ/edit
Formulario: https://docs.google.com/forms/d/e/1FAIpQLSf05LfnkVDeruGWfxHy214i8HSIWTIU7yJgYbUmUc2_qVYhiQ/viewform

### Instalación en tu cuenta

1. Abrí la hoja y entrá a **Extensiones > Apps Script**.
2. Pegá el archivo **google/Perfiles.gs** en un proyecto vinculado a esa hoja. No pegues el antiguo Code.gs para productos; ambos definen funciones de entrada diferentes.
3. Ejecutá **prepararPerfiles** y autorizá Google. Agrega las columnas **Publicar** y **Perfil ID**; conserva las respuestas existentes. Los nuevos envíos quedan sin aprobar. Solo marcá Publicar en perfiles cuya información y fotos autorizás a mostrar.
4. En **Configuración del proyecto > Propiedades del script**, encontrá **CATALOG_TOKEN**. Es un secreto: no lo pongas en la hoja ni en el formulario.
5. Elegí **Implementar > Nueva implementación > Aplicación web**. Ejecutar como vos y acceso Cualquier usuario. Este punto habilita la URL del conector, no publica la planilla ni sus fotos. El conector exige el secreto para responder a cada consulta. Si tu organización no permite esa opción, se necesita otra forma de conexión autenticada.
6. Configurá en Sites dos secretos: **CATALOG_ENDPOINT**, con la URL terminada en /exec, y **CATALOG_TOKEN**, con el valor del paso 4. Volvé a publicar la versión para aplicar esos secretos.
7. Probá un perfil aprobado de una persona mayor de 18 años. Comprobá su foto, nombre, país e inglés. Desmarcá Publicar y recargá: tiene que desaparecer. Un perfil menor de 18 o con edad ambigua queda excluido incluso si se marca Publicar.

Las fotos deben ser archivos de Google Drive accesibles por la cuenta que ejecuta el script. Se usa la primera foto y una miniatura, si Drive la ofrece. Los archivos no tienen que ser públicos. Se permiten JPEG, PNG y WebP hasta 2 MB después de obtener la miniatura. Otros formatos muestran Foto no disponible.

El sitio consulta al conector desde el servidor. El navegador no recibe el secreto, el enlace de la hoja ni las columnas privadas. La aprobación también se verifica al pedir cada foto. Las actualizaciones se leen al recargar el catálogo. Revocar un perfil no borra información que un visitante haya guardado previamente.

## Archivos

- web/: interfaz editable.
- worker.mjs: acceso, sesión y conexión privada con Google.
- google/Perfiles.gs: conector para el formulario actual.
- google/Code.gs: versión anterior para formularios de productos; no usar para perfiles.
- build.mjs: empaqueta interfaz y recursos en el Worker.
- verify.mjs: comprobaciones de acceso.

Construir: node build.mjs. Validar: node verify.mjs.
Vista previa: configurar STORE_PASSWORD como variable de entorno y ejecutar node preview.mjs. No guardar secretos en el repositorio.

La privacidad de Sites se conserva: el sitio sigue siendo privado de su propietario. La contraseña propia es una capa adicional; para compartirlo con otras personas habrá que configurar la audiencia de Sites.
