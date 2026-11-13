# F03 — Descubrimiento y perfil público (app móvil)

**Estado:** frontend implementado contra el contrato real. La búsqueda y el detalle público funcionan con datos reales; la verificación de resultados con prestadores queda limitada porque la creación de perfiles F05 está bloqueada por BE-01 y el entorno local no tiene perfiles profesionales. No se usan mocks ni datos demo.

## Alcance

Cubre SPEC-03 para el rol **Cliente**:

- búsqueda por categoría y zona usando los IDs del catálogo real;
- resultados con categorías, zonas, reputación, verificación y disponibilidad;
- detalle público reutilizando el mismo DTO;
- estado vacío, sugerencias, error, carga y perfil no disponible genérico;
- acceso desde la pestaña **Buscar** del Cliente y protección de rutas.

No incluye coincidencia por cercanía, búsqueda parcial por nombre, paginación local ni datos de contacto/privados. Esas capacidades no están en el contrato disponible.

## Contrato integrado

Todas las operaciones exigen rol `CLIENTE` y sesión bearer.

| Operación | Endpoint | Respuesta real | Uso |
|---|---|---|---|
| Catálogo de categorías | `GET /api/v1/catalogo/categorias` | `{ id, nombre }[]` | Selector de categoría. |
| Catálogo de zonas | `GET /api/v1/catalogo/zonas` | `{ id, nombre, coberturaGeografica }[]` | Selector de zona. |
| Buscar | `GET /api/v1/descubrimiento/prestadores?categoria={id}&zona={id}` | `{ prestadores, sugerencias }` | Resultados y sugerencias. |
| Detalle público | `GET /api/v1/descubrimiento/prestadores/{id}/perfil` | `PrestadorPublicoResponse` | Detalle directo o desde resultados. |

El DTO público contiene `id`, `categorias`, `zonas`, `reputacionAgregada`, `cantidadCalificaciones`, `nivelVerificacion`, `disponibilidad`, `datosGenerales` y `resenas`.

## Implementación

- Entrada **“Buscar prestadores”** en la sesión para `CLIENTE`.
- `DiscoveryScreen`: filtros con `select` modal, validación de categoría y zona, búsqueda, sugerencias, estados de carga/error/sin resultados y ajuste de criterios.
- `ProviderProfileScreen`: carga directa por ID, mismo DTO, estado genérico `404` sin revelar la causa.
- `ProviderResultCard`: título derivado de las categorías, porque el DTO público no incluye nombre; reputación, verificación, zonas y disponibilidad reales.
- `ProviderPublicProfileView`: categorías, zonas, disponibilidad, reputación, verificación, datos públicos confirmados y reseñas con texto/estrellas/fecha.
- No se muestran teléfono, correo, dirección exacta, contacto ni otros datos privados.

## Límites y discrepancias

- **Sin nombre público en el DTO:** la UI deriva “Prestador de {categoría}” de las categorías reales; no inventa un nombre. El contrato público no expone nombre, contacto ni dirección exacta.
- **Sin portafolio, experiencia, servicios ofertados ni trabajos completados:** el DTO de descubrimiento no los devuelve. No se muestran ni se simulan.
- **Sin paginación:** el backend no expone paginación para esta búsqueda; no se implementa paginación local ni se inventan parámetros.
- **SC-005 abierta:** la política de catálogo/coincidencia sigue pendiente. La app usa IDs de catálogo y delega la coincidencia exacta al backend; no implementa cercanía, coincidencia parcial ni reglas adicionales.
- **Resultados reales no verificables localmente:** F05 no puede crear perfiles por BE-01, por lo que no hay prestadores reales que descubrir. La búsqueda con filtros válidos devuelve lista vacía y no se presentan resultados ficticios.
- La búsqueda con categoría/zona desconocida devuelve `200` con `sugerencias`; la app las muestra sin inventar una selección automática.
- El detalle `404` se muestra como “Perfil no disponible” sin distinguir perfil inexistente, oculto o incompleto.

## Enlace directo al perfil

- Esquema: `aliado://prestadores/{providerId}`.
- React Navigation resuelve la ruta `ProviderProfile` desde `linking` y entrega `providerId`.
- Si la app está abierta con sesión Cliente, el enlace abre el detalle directamente.
- Si no hay sesión, se conserva el ID pendiente y se muestra el acceso. Tras iniciar sesión se navega al perfil solo cuando la sesión ya existe; la pantalla vuelve a comprobar el rol.
- Con rol distinto de Cliente se muestra acceso no permitido y el hook de detalle no se monta, por lo que no se ejecuta `GET /perfil`.
- El `404` se sigue mostrando como “Perfil no disponible” sin revelar la causa.

## Verificación realizada

- API de solo lectura con sesión Cliente:
  - catálogo de categorías y zonas disponible;
  - búsqueda con IDs válidos: `200`, 0 prestadores y 0 sugerencias;
  - categoría inexistente: `200`, 0 prestadores y 7 sugerencias;
  - detalle con ID inexistente: `404 PERFIL_NO_DISPONIBLE`;
  - búsqueda sin sesión: `401 NO_AUTENTICADO`.
- UI en emulador Android con sesión Cliente:
  - pantalla inicial con filtros reales;
  - selección de categoría y zona;
  - búsqueda ejecutada y estado “Sin resultados”;
  - acción “Ajustar criterios”.
- Deep link `aliado://prestadores/22222222-2222-4222-8222-222222222222` sin sesión: se mantuvo en login y no consultó el perfil.
- Tras iniciar sesión Cliente, el mismo enlace pendiente abrió el detalle y mostró el `404` genérico “Perfil no disponible”.
- Deep link con sesión Cliente ya abierta: abrió el detalle directamente.
- No se pudo verificar el deep link con sesión Prestador: no había credenciales disponibles y no se modificaron cuentas. La protección está implementada con el wrapper de rol que evita montar el hook de detalle.
- No se pudo verificar una búsqueda con resultados ni el detalle público en UI porque no existen perfiles profesionales en el entorno y F05 sigue bloqueada por BE-01. Tampoco se crearon datos para forzarlo.
- No se probó la denegación UI para Prestador; el backend y la comprobación de pantalla están implementados, pero no se dispone de una sesión Prestador verificada en esta prueba.

## Enlaces

- [Solicitud BE-01: persistencia JSONB del perfil profesional](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-01--persistencia-jsonb-del-perfil-profesional) — bloquea la generación de resultados reales.
- [Solicitud BE-06: sincronización OpenAPI](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-06--sincronización-openapi-con-el-backend-real) — referencia de contrato.
