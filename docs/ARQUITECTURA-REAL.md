# Arquitectura real de Bazar Viral

## Objetivo

Convertir el prototipo aprobado en una plataforma persistente sin activar cobros. La primera versión real permitirá registro, perfiles por rol, productos, contenido, campañas y revisión administrativa.

## Orden de implementación

1. **Identidad:** registro, inicio de sesión, recuperación y varios roles por cuenta.
2. **Perfiles:** datos privados separados de tiendas y perfiles creativos públicos.
3. **Catálogo:** productos físicos o digitales, medios, inventario y revisión.
4. **Comunidad:** videos, avisos comerciales, campañas y moderación.
5. **Pedidos de prueba:** carrito por cuenta y estados, todavía sin pagos.
6. **Administración:** colas de revisión, decisiones, reportes y auditoría.

## Niveles de información

| Nivel | Ejemplos | Acceso |
| --- | --- | --- |
| Pública | Perfil, tienda, productos, videos y reseñas | Visitantes |
| Operativa | Pedidos, campañas, atribuciones y revisiones | Personas involucradas y administración |
| Privada | Correo, teléfono, verificación y datos fiscales | Titular y personal autorizado |
| Sensible | Credenciales y secretos | Solo el servidor |

## Reglas esenciales

- Cada persona modifica únicamente sus propios perfiles y publicaciones.
- Un vendedor recibe solo los datos necesarios para completar una entrega.
- Un creador ve únicamente sus atribuciones y comisiones.
- Un cambio importante a una publicación aprobada vuelve a revisión.
- Las acciones administrativas sensibles registran quién actuó, cuándo y por qué.
- El rol de administrador nunca se elige desde el registro público.

## Capacidades externas necesarias

- Base de datos relacional compatible con PostgreSQL.
- Autenticación segura con sesiones.
- Almacenamiento de imágenes, documentos y videos.
- Alojamiento del sitio y funciones del servidor.

La selección del proveedor se hará tras verificar plan gratuito, límites, exportación, ubicación de datos y facilidad de administración. No se activarán pagos en esta fase.

## Primera meta real

Una cuenta nueva puede registrarse, elegir rol, completar un perfil, guardar un producto o video, enviarlo a revisión y recibir una decisión administrativa. La información permanece después de cerrar el navegador.
