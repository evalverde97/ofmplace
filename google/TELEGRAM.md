# Activar publicaciones de Telegram

1. En Apps Script, reemplazar todo Código.gs con Perfiles.gs actualizado.
2. Guardar y ejecutar prepararPerfiles. Se agrega Listing Price USD sin alterar respuestas.
3. Configuración del proyecto → Propiedades de secuencia de comandos: agregar TELEGRAM_BOT_TOKEN con el token del bot Dollars_manager_bot. Conservar CATALOG_TOKEN. Nunca pegar el token en Código.gs.
4. Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar. Conservar la URL y la configuración de acceso actuales.
5. En /admin, Actualizar, revisar un perfil aprobado, completar Listing Price (USD) y Guardar cambios. Abrir Revisar nuevamente y Preparar publicación en inglés.
6. Revisar y corregir la traducción; Publicar en @dollarsofm envía el texto y después las fotos guardadas en orden, en grupos de hasta diez. Los datos faltantes se indican como Not provided.

La vista previa vence en diez minutos. Los cambios posteriores al perfil requieren una nueva vista previa. El bot debe tener permiso para publicar en el canal. El envío se registra antes de contactar Telegram para evitar duplicados ante resultados inciertos. Al guardar un precio nuevo en un perfil aprobado desde el panel actualizado, se prepara y envía automáticamente. Si ya existe un mensaje del perfil se actualiza su texto; las fotos de la publicación anterior se conservan. La publicación manual de un perfil ya enviado queda bloqueada para repetición; revisar el canal ante un error de red. La integración no modifica ni retira publicaciones existentes al cambiar disponibilidad.

La traducción usa LanguageApp de Google Apps Script. El primer uso puede requerir autorizar los permisos solicitados por Google. Las cuotas y fallas de traducción se informan antes del envío. No se publican correo electrónico, referidos ni expectativa salarial.

## Descripción de la primera foto
Las publicaciones nuevas con fotos adjuntan el texto a la primera imagen del álbum. Telegram admite 1024 caracteres en esa descripción; el excedente continúa en una respuesta vinculada a la primera foto. Los perfiles sin fotos se envían como texto. Al actualizar el precio se edita la descripción para los mensajes nuevos y el texto para las publicaciones antiguas. No se migran publicaciones ya enviadas ni se duplican álbumes.
