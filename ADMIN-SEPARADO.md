# Panel independiente

El marketplace despliega `dist/catalog/index.js`, sin archivos `/admin/*`. Su función fija SITE_ROLE=catalog y devuelve 404 para todas esas rutas, incluso con una cookie de administrador válida. Una cookie admin no habilita el catálogo. No se publica un enlace hacia el panel.

El segundo proyecto Netlify utiliza el mismo repositorio, paquete `admin-site`, base raíz y configuración `admin-site/netlify.toml`. Ejecuta todas las pruebas y despliega únicamente `admin-site/netlify/edge-functions`, que importa `dist/admin/index.js`. La raíz `/` muestra el login o panel. Las operaciones y recursos internos conservan `/admin/*` exclusivamente en ese dominio independiente.

Variables privadas del proyecto admin: SESSION_SECRET (distinto al del marketplace), ADMIN_USERNAME, ADMIN_PASSWORD, CATALOG_ENDPOINT, CATALOG_TOKEN. No necesita STORE_PASSWORD. No guardar valores en Git ni en el navegador. Las cookies son HttpOnly, Secure, SameSite=Lax y sin atributo Domain, por lo que no se comparten entre sitios. El conector Google y su token no cambian.

El dominio separado reduce exposición pero no sustituye controles de acceso. Sigue pendiente limitar intentos de login, usuarios individuales/MFA y revocación de sesiones. Netlify y Google requieren acceso administrativo privado independientemente de la URL.

Validación: `node test.mjs` incluye verify-separation.mjs, que verifica bloqueo de todas las rutas admin del marketplace, ausencia de recursos admin en su paquete, separación de sesiones, API protegida y acceso del admin desde la raíz sin contraseña de catálogo.
