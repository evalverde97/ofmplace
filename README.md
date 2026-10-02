# DOLL✦ARS / OFMPlace

Catálogo privado y adaptable a móviles. Google Forms → Google Sheets → aprobación administrativa → catálogo. Consultas por Telegram: @bossin_around.

## Desarrollo y validación

Node.js 22, sin dependencias. Ejecutar `node build.mjs`, `node verify.mjs` y `node verify-profiles.mjs`. Para vista local, configurar STORE_PASSWORD y ejecutar `node preview.mjs`. No incluir credenciales ni datos personales en Git.

## Activar Google

1. En la planilla de respuestas, abrir Extensiones → Apps Script. Entrar al editor con el icono <>. Reemplazar TODO Código.gs por google/Perfiles.gs, incluyendo la función inicial myFunction. El archivo debe empezar con el comentario y las constantes, sin envolverlo en otra función.
2. Guardar. Seleccionar prepararPerfiles y Ejecutar; autorizar el acceso a la planilla y a Drive. Se crean las columnas editoriales y de aprobación, IDs y el disparador para nuevas respuestas.
3. Implementar → Nueva implementación → Aplicación web. Ejecutar como el propietario; acceso Cualquier usuario. El conector exige además un secreto para consultar o modificar datos.
4. Copiar la URL terminada en /exec. En Configuración del proyecto → Propiedades de secuencia de comandos, buscar CATALOG_TOKEN. Configurar ambos en las variables privadas del sitio como CATALOG_ENDPOINT y CATALOG_TOKEN.
5. Si se actualiza una implementación existente: Administrar implementaciones → Editar → Nueva versión → Implementar.
6. Entrar a /admin, revisar una respuesta adulta, aprobarla y confirmar que aparezca en /catalogo. Una aprobación nueva activa disponibilidad. Puede desactivarse manteniendo el perfil publicado.

La conexión real todavía requiere estos pasos. Los tests usan datos sintéticos; no prueban acceso al Google Sheet del propietario. No se publica email, expectativa salarial ni referido. Los ingresos y suscriptores se completan por separado porque la respuesta original los combina.

## Idioma

La interfaz usa español si el primer idioma del navegador es español; inglés en los demás casos. Los valores del formulario conservan el texto original, sin traducción automática. Los títulos y etiquetas de detalle siguen los tres grupos solicitados.

## Netlify

Importar evalverde97/ofmplace como proyecto nuevo cuando Google esté conectado y validado. netlify.toml configura `node build.mjs` y `netlify/public`. La Edge Function atiende todas las rutas y utiliza el mismo servidor de autenticación del catálogo. El directorio público está vacío intencionalmente: las páginas y el catálogo se sirven tras la verificación de sesión.

Configurar como variables de entorno privadas de Netlify (disponibles en runtime): STORE_PASSWORD, SESSION_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD, CATALOG_ENDPOINT y CATALOG_TOKEN. ADMIN_USERNAME puede ser admin. Generar SESSION_SECRET aleatorio de al menos 32 bytes. Nunca poner contraseñas o tokens en netlify.toml o en el repositorio. La contraseña de acceso al catálogo y las del administrador se configuran únicamente en el proveedor.

Referencia: https://docs.netlify.com/build/edge-functions/environment-variables/

Antes de abrir el nuevo sitio: validar login correcto/incorrecto, aislamiento de admin, aprobación de adulto, rechazo de menor, disponibilidad y foto real desde Drive. El despliegue de Netlify permanece pendiente hasta validar la conexión real con Google.
