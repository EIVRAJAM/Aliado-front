# F05 — Perfil profesional (app móvil)

**Estado:** implementación frontend ampliada contra la rama backend `feature/mvp-backend-corrections`. La creación incluye una descripción profesional opcional; el perfil existente hidrata esa descripción desde `GET /api/v1/perfiles/mio` y permite editarla con `PUT /api/v1/perfiles/mio`; la vista pública solo muestra `descripcion` entre los datos generales. El contrato y la corrección JSONB aún no están integrados en `develop` ni desplegados. Experiencia, portafolio, disponibilidad y mutaciones de agenda siguen fuera de esta integración. No se usan mocks ni datos simulados. Seguimiento: [solicitudes de corrección y contrato backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-05--esquema-de-datosgenerales).

## Alcance y corrección del diagnóstico inicial

SPEC-05 cubre la creación y gestión del perfil profesional del Prestador: categorías y zonas obligatorias, experiencia opcional, portafolio, disponibilidad, agenda y vista previa pública.

Correcciones al diagnóstico anterior:

- **`GET /api/v1/perfiles/mio/agenda` sí existe** y permite consultar los compromisos del Prestador autenticado. La agenda no está bloqueada por la falta de lectura del perfil completo; se puede cargar de forma independiente.
- **`GET /api/v1/perfiles/mio` existe en la rama backend de correcciones** y el frontend lo consume para hidratar la descripción profesional. Aún no está integrado en `develop` ni desplegado. La agenda y la vista previa conservan su lectura independiente.
- **`GET /api/v1/perfiles/mio/vista-previa` sí existe** y devuelve la proyección pública que consume descubrimiento, incluida disponibilidad, reputación, verificación y reseñas visibles.
- El backend ya dispone del módulo `perfiles`, migración V3, controlador, servicio, dominio y persistencia. La rama de correcciones añade el contrato mínimo de `datosGenerales` y la lectura propia.

### Descripción profesional (BE-05)

Contrato mínimo definido en `feature/mvp-backend-corrections`:

- `datosGenerales.descripcion`: string opcional, recortado, máximo 1000 caracteres, visible en la vista pública.
- No se incluye `anosExperiencia` ni otros campos de la lista blanca técnica.
- Las claves desconocidas se ignoran en escrituras nuevas; las claves heredadas se conservan en el backend pero no se publican.
- No duplica categorías, zonas, experiencia, portafolio, disponibilidad ni agenda.

Implementación frontend:

- La creación incluye un campo opcional “Descripción profesional” con contador y límite de 1000 caracteres.
- El perfil existente carga la descripción desde `GET /api/v1/perfiles/mio` y permite editarla con `PUT /api/v1/perfiles/mio`.
- La vista pública muestra `descripcion` cuando tiene contenido y no muestra teléfono, correo, dirección exacta, documentos ni claves heredadas.
- Se mantienen carga, error, reintento y sesión expirada con los patrones existentes.

La integración depende de que la rama backend se integre y despliegue; la experiencia, el portafolio y la disponibilidad siguen en sus flujos pendientes.

## Operaciones reales disponibles

Todas exigen rol `PRESTADOR` y sesión bearer.

| Operación | Endpoint | Respuesta real | Uso actual en la app |
|---|---|---|---|
| Crear perfil | `POST /api/v1/perfiles` | `201 PerfilResponse` | **Implementado** con `categoriaIds`, `zonaIds` y `datosGenerales.descripcion` opcional; la experiencia se omite. |
| Consultar perfil propio | `GET /api/v1/perfiles/mio` | `200 PerfilResponse` | **Implementado** para hidratar la descripción, categorías/zonas y estado del perfil. |
| Editar datos generales | `PUT /api/v1/perfiles/mio` | `200 PerfilResponse` | **Implementado** para `datosGenerales.descripcion`; no hay otros campos en el contrato MVP. |
| Actualizar categorías | `PUT /api/v1/perfiles/mio/categorias` | `200 PerfilResponse` | Endpoint disponible; edición no implementada en esta integración. |
| Actualizar zonas | `PUT /api/v1/perfiles/mio/zonas` | `200 PerfilResponse` | Endpoint disponible; edición no implementada en esta integración. |
| Agregar experiencia | `POST /api/v1/perfiles/mio/experiencia` | `201 ExperienciaResponse` | Lectura incluida en `GET /mio`; edición no implementada. |
| Agregar portafolio | `POST /api/v1/perfiles/mio/portafolio` multipart | `201 PortafolioResponse` | Lectura incluida en `GET /mio`; edición y evidencia siguen pendientes (D-07). |
| Eliminar portafolio | `DELETE /api/v1/perfiles/mio/portafolio/{id}` | `204` | No implementado en esta integración. |
| Consultar disponibilidad | Incluida en `PerfilResponse` | — | Se hidrata con `GET /mio`; la edición sigue pendiente de D-03. |
| Actualizar disponibilidad | `PUT /api/v1/perfiles/mio/disponibilidad` | `200 PerfilResponse` | No implementado; D-03 pendiente. |
| Consultar agenda | `GET /api/v1/perfiles/mio/agenda` | `200 CompromisoResponse[]` | **Implementado en modo consulta.** |
| Crear compromiso | `POST /api/v1/perfiles/mio/agenda` | `201 CompromisoResponse` | Bloqueado: D-03 y regla de zona horaria pendientes. |
| Editar compromiso | `PUT /api/v1/perfiles/mio/agenda` | `200 CompromisoResponse` | Bloqueado: mismas reglas temporales. |
| Vista previa pública | `GET /api/v1/perfiles/mio/vista-previa` | `200 VistaPreviaResponse` | **Implementado en modo consulta; entre los datos generales solo se muestra `descripcion`.** |
| Exposición pública | `PUT /api/v1/perfiles/mio/exposicion` | `200 PerfilResponse` | No implementado en esta fase. |

## Diferencias OpenAPI / backend / tarea

| Tema | OpenAPI o tarea | Backend real | Tratamiento |
|---|---|---|---|
| Alta de perfil | `200` y `CrearRequest { motivo }` por colisión de esquema | `201 PerfilResponse`; request real `{ datosGenerales, categoriaIds, zonaIds, experiencia? }` | No usar el esquema genérico de OpenAPI; seguir el controlador real. |
| Respuesta de alta | Tarea: `{ id }` | `PerfilResponse` completo | El cliente debería consumir el perfil real si se habilita la creación. |
| Portafolio | `200`; tarea con `evidencia[]` | `201 PortafolioResponse`; multipart `descripcion` + `archivo` opcional | No se implementa hasta resolver lectura de portafolio y D-07. |
| Agenda POST | OpenAPI `200` | `201 CompromisoResponse` | Sin implementación de mutación. |
| Lectura del perfil propio | Presente en la rama de correcciones | `GET /mio` responde `200` | Implementada en el frontend para hidratar la descripción y el estado del perfil. |
| `GET /mio/agenda` | Presente | Presente | Implementado. |
| `GET /mio/vista-previa` | Presente | Presente | Implementado. |
| Exposición | Presente y no listada en la tarea | `PUBLICO`/`OCULTO` | Se documenta; no se implementa ahora. |
| Evidencia de portafolio | `evidenciaKey` | Solo clave, sin endpoint de descarga | No se puede previsualizar. |
| Datos generales | `DatosGeneralesRequest/Response` | Solo `descripcion` opcional, recortada, máximo 1000; claves desconocidas ignoradas y legadas conservadas sin publicar | Implementado contra la rama backend. |
| Vista previa | `VistaPreviaResponse` | Incluye categorías/zonas/disponibilidad/confianza/reseñas; datos generales solo con `descripcion` | Se muestra exactamente lo disponible y se advierte la omisión. |

## Implementación frontend actual

- Entrada **“Profesional”** en la barra inferior para el rol `PRESTADOR`; las subpantallas de creación se abren fuera de la barra.
- Pantalla `ProfessionalProfileCreateScreen`:
  - Carga real de catálogos, selección múltiple, validación local y POST de creación.
  - Incluye una descripción profesional opcional, con contador, recorte y máximo de 1000 caracteres.
  - Manejo de carga, error, `400`, `401`, `403`, `409`, resultado incierto y reconciliación por vista previa.
- Pantalla `ProfessionalProfileScreen`:
  - Hidrata el perfil propio con `GET /api/v1/perfiles/mio` y permite editar la descripción con `PUT /api/v1/perfiles/mio`.
  - La vista previa pública muestra únicamente `descripcion` entre los datos generales; también incluye categorías, zonas, disponibilidad, reputación, nivel de verificación y reseñas visibles (texto, estrellas y fecha).
  - Tarjeta de verificación F10: consulta `GET /verificaciones/mia`, muestra ausencia, pendiente, aprobada o rechazada y permite seleccionar documentos con `expo-document-picker` y enviarlos como multipart `documentos`. No fija MIME, tamaño ni cantidad locales.
  - Acción **Reportar** en reseñas visibles; envía únicamente el motivo al endpoint real.
  - Agenda real desde `GET /api/v1/perfiles/mio/agenda`, con estado vacío, error, carga y ausencia de perfil.
  - Estado “Sin perfil profesional” cuando `GET /api/v1/perfiles/mio` responde `404`.
  - La descripción se puede editar aunque la vista previa pública no esté disponible; el resto de apartados conserva sus límites.

### Flujo de creación inicial

- En el estado “Sin perfil profesional” aparece el botón primario “Crear mi perfil profesional” dentro del mismo recuadro.
- La pantalla de creación carga categorías y zonas desde `GET /api/v1/catalogo/categorias` y `GET /api/v1/catalogo/zonas` con la sesión actual.
- Permite seleccionar una o varias categorías y zonas, muestra el nombre y la cobertura recibidos, y exige al menos una de cada una.
- Envía `{ categoriaIds, zonaIds, datosGenerales: { descripcion? } }` a `POST /api/v1/perfiles`; no añade experiencia ni claves desconocidas.
- Tras `201`, vuelve a la pantalla de consulta, que recarga vista previa y agenda con sus endpoints reales.
- Un `409` no repite el POST: informa que el perfil existe y vuelve a la consulta para cargar el perfil.
- Un resultado incierto por timeout, desconexión o error de servidor no permite reenviar el formulario automáticamente. La app consulta una vez `GET /api/v1/perfiles/mio` para reconciliar y distingue tres estados:
  - **Perfil encontrado:** `GET /mio` devuelve el perfil; se permite volver a la vista previa y agenda.
  - **Perfil no encontrado (`404`):** la consulta confirma que no existe perfil. Si el POST había respondido `5xx`, la app muestra que el servidor tuvo un error al crearlo, sin detalles SQL. Las categorías y zonas se conservan y el reintento es manual y explícito.
  - **Verificación no disponible:** si la consulta falla por red o servidor, se muestra “Resultado pendiente” sin ofrecer un nuevo envío de creación.
- La prueba local del 2026-11-13 registró un `500` por SQLState `42804` en el backend anterior. La rama de correcciones incluye la persistencia JSONB corregida; la integración debe verificarse al desplegar esa rama. La UI conserva selección y descripción, y no repite el POST automáticamente ante un resultado incierto.
- La descripción general es opcional; si queda vacía no se envía. La experiencia no se solicita en este paso.

### Presentación de datos públicos

- Solo se renderiza `datosGenerales.descripcion` cuando tiene contenido. El backend no publica `anosExperiencia`, teléfono, correo, dirección exacta, documentos ni claves heredadas.
- La etiqueta visible es “Descripción profesional”; no se inventan campos adicionales.
- Un valor ausente o vacío no se muestra; no se interpretan arrays ni números como datos generales.
- Las reseñas se muestran con su texto, calificación en estrellas y fecha. Si no hay reseñas visibles, aparece un estado vacío. F10 agrega la acción de reporte sin comprobante.
- La vista previa no incluye el listado de experiencia, portafolio ni compromisos; no se presenta como una vista pública completa más allá de lo que devuelve el contrato.
- No se agregan mocks, datos demo, persistencia local ni formularios que simulen operaciones bloqueadas.
- No se muestran el listado de experiencia, el portafolio ni los compromisos. La descripción se presenta en la vista previa pública y en el perfil público de descubrimiento.

## Estructura

```text
src/features/professional-profile/
├── components/        # vista previa pública y agenda
├── hooks/             # carga independiente de vista previa y agenda
├── screens/           # perfil profesional
├── services/          # gateway y adaptador HTTP
├── types/             # respuestas reales y errores
└── utils/             # formato de agenda, verificación y errores
```

La ruta `ProfessionalProfile` se registra en la navegación autenticada y la pantalla vuelve a comprobar el rol. El backend sigue siendo la autoridad de autorización.

## Validación y límites

- **Estática:** `npm run typecheck`, `npm run verify:config`, `git diff --check` y export Android correctos con Node 24.
- **Integración API:** contra la rama backend en entorno efímero se comprobó creación con descripción, `GET /mio`, edición, descripción vacía, límite de 1000/1001 caracteres, claves desconocidas y compatibilidad con claves heredadas.
- **Visual Android:** con Metro y backend temporales dedicados se verificó la descripción inicial, edición, guardado, recarga desde `GET /mio` y persistencia SQL exacta. La captura y el informe están en `/tmp/aliado-f05-description-save/`.
- La vista previa pública respondió `404 PERFIL_NO_DISPONIBLE` por falta de perfil base/disponibilidad; la app mostró el estado informativo. No se configuró D-03.
- El máximo exacto de 1000 caracteres no se comprobó visualmente: la inyección ADB se truncó. Queda cubierto por `maxLength`, contador, pruebas estáticas y API 1000/1001.
- La agenda se presenta en la hora local del dispositivo; la regla de zona horaria y los solapes formales siguen pendientes de D-03.
- La creación y la edición de la descripción están implementadas contra la rama backend. La experiencia, el portafolio, la disponibilidad y las mutaciones de agenda siguen pendientes de sus contratos/decisiones.

## Dependencias y decisiones abiertas

- F01 identidad/roles y F04 catálogo/storage: disponibles.
- D-02: granularidad de catálogo, oferta y portafolio.
- D-03: regla temporal y zona horaria para disponibilidad/agenda.
- D-06/D-07: storage productivo y límites/MIME de evidencias; la app no impone reglas locales de verificación.
- F10 requiere reconstruir el development build para incluir `expo-document-picker`.
- `GET /api/v1/perfiles/mio` está implementado en la rama backend de correcciones; falta integrarlo y desplegarlo.
- Falta descarga de evidencia del portafolio.
- BE-05 está concretado como `descripcion` opcional de hasta 1000 caracteres; no hay otros campos de datos generales en el MVP.

## Enlaces

- [F10 — Calificaciones, reseñas y verificación](trust.md)
- [Arquitectura móvil](../architecture/MOBILE_ARCHITECTURE.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
- [Solicitudes y decisiones backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
