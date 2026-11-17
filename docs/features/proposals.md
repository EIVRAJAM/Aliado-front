# F07 — Creación, edición y retiro de propuestas (app móvil)

**Estado:** flujo Prestador implementado en UI y gateway contra el controlador/DTO reales. La creación no envía `Idempotency-Key` mientras BE-02 siga abierto. La validación estática y las respuestas de autenticación son favorables; no se validaron mutaciones autenticadas ni la revisión visual del formulario/estado porque no se autorizó crear propuestas y el dev client no pudo cargar el bundle nuevo sin recargar y perder la sesión en memoria. No se usan mocks ni datos ficticios.

## Alcance móvil

Cubre SPEC-07 para el rol **Prestador**:

- acción **Enviar propuesta** desde el detalle de una oportunidad compatible;
- formulario con disponibilidad obligatoria y mensaje opcional;
- creación, edición y retiro mientras la propuesta siga `ACTIVA`;
- confirmación explícita antes de retirar;
- estados de envío, éxito, validación, error recuperable, sesión expirada y permisos;
- conservación del `id` devuelto por el servidor dentro del flujo actual.

No incluye recepción, comparación, aceptación o rechazo de propuestas por parte del Cliente; eso corresponde a F08. No se añade precio, moneda, identidad ni contacto del Cliente.

## Contratos reales integrados

Todas las mutaciones requieren rol `PRESTADOR` y sesión bearer.

| Operación | Endpoint | Request | Respuesta usada |
|---|---|---|---|
| Crear | `POST /api/v1/propuestas` | `{ solicitudId, disponibilidad, mensaje? }` | `201 { id, solicitudId, prestadorId, disponibilidad, mensaje, estado }` |
| Editar | `PUT /api/v1/propuestas/{id}` | `{ disponibilidad, mensaje }` | `200` con el mismo DTO. |
| Retirar | `POST /api/v1/propuestas/{id}/retirar` | — | `200 { id, estado: "RETIRADA" }` |
| Listar propias | **No existe** | — | No se inventa endpoint ni almacenamiento. |
| Propuestas de una solicitud | `GET /api/v1/solicitudes/{solicitudId}/propuestas` | — | Exclusivo de `CLIENTE`; no se usa en el flujo Prestador. |

El DTO real es `PropuestaResponse(id, solicitudId, prestadorId, disponibilidad, mensaje, estado)`. Los estados observados en el dominio son `ACTIVA`, `RETIRADA`, `ACEPTADA` y `CERRADA`.

### Relación con OpenAPI

OpenAPI no es autoridad para F07 en esta copia:

- declara `200` para la creación, pero el controlador responde `201` mediante `BaseController`;
- el esquema `CrearRequest` de OpenAPI muestra `motivo`, aunque el DTO real exige `solicitudId` y `disponibilidad`;
- el esquema `EditarRequest` de OpenAPI muestra campos de solicitud, aunque el DTO real usa `disponibilidad` y `mensaje`.

El cliente sigue el controlador/DTO entregados. La sincronización de OpenAPI sigue registrada en BE-06.

## Reglas y validaciones

- **Disponibilidad:** obligatoria y no vacía. El backend de creación exige texto no vacío; la edición valida además máximo 255 caracteres. La UI limita a 255 en ambos formularios por la columna `VARCHAR(255)` y valida el valor recortado.
- **Mensaje:** opcional, máximo 1000 caracteres. Al editar, un mensaje vacío se envía para limpiar el valor.
- **Creación:** solo sobre solicitud publicada y compatible; el backend puede responder `409` por solicitud cerrada, no compatible o propuesta activa duplicada.
- **Edición/retiro:** solo propuesta propia y `ACTIVA`. Un `409 PROPUESTA_NO_ACTIVA` o un `404` deja el estado local como no confirmado, oculta las acciones y no se presenta como activa.
- **Idempotencia desactivada:** la creación **no envía** `Idempotency-Key` mientras el backend no corrija y valide el defecto compartido de `idempotency_keys.respuesta` (`JSONB`/`varchar`) documentado en BE-02 y observado en F04. La corrección corresponde al backend; el cliente no promete reintentos seguros ni idempotencia. Si la creación termina con un resultado incierto, el formulario se conserva bloqueado y no se reenvía.
- **Precio:** no existe en el modelo ni en el contrato; no se muestra ni se solicita.

## Implementación

```text
src/features/proposals/
├── components/       # campos compartidos y badge de estado
├── hooks/            # sesión expirada y errores de propuesta
├── screens/          # ProposalFlowScreen
├── services/         # gateway y adaptador HTTP
├── types/            # DTO, comandos y errores
├── utils/            # formato y mensajes
└── validation/       # disponibilidad y mensaje
```

- `OpportunityDetailScreen` muestra **Enviar propuesta** y abre `ProposalFlow` con el `solicitudId`.
- `ProposalFlowScreen` mantiene un flujo único y valida que las respuestas de las mutaciones correspondan al recurso solicitado:
  - formulario de creación;
  - estado de la propuesta con disponibilidad, mensaje y referencia;
  - edición inline con los mismos campos;
  - retiro con confirmación.
- El `id` real se conserva en el estado local del flujo. No se persiste en almacenamiento, no se simula una lista y no se consulta un endpoint inexistente.
- El estado no confirmado por `409/404` o por una respuesta contractual inválida se muestra como “Estado no disponible”; se ocultan editar/retirar y se ofrece volver a la oportunidad para que F06 vuelva a consultar el estado de la solicitud.

## Límite de recuperación y D-09

No existe un endpoint para listar propuestas propias ni para recuperar una propuesta por `solicitudId`. Por tanto:

- al salir de `ProposalFlow`, la app pierde el `id` y no puede volver a editar o retirar esa propuesta;
- si la creación devuelve `409 PROPUESTA_DUPLICADA`, la app no puede recuperar la propuesta existente;
- no se usa AsyncStorage, caché persistente ni un endpoint inventado para ocultar esta limitación.

La pantalla lo advierte explícitamente. La recuperación y la política de propuestas duplicadas pertenecen a D-09 y no se resuelven en el cliente.

## Errores y estados

- Resultado incierto en creación: el formulario permanece visible, los campos y el envío se bloquean, y se informa que no se pudo confirmar si la propuesta se registró. No se reintenta automáticamente ni se afirma que no se creó.
- `401`: se limpia la sesión y se vuelve al acceso.
- `403`: mensaje de permiso; la sesión se conserva.
- `400`: se muestran los mensajes de validación del servidor cuando existen.
- `404`: solicitud/propuesta no disponible; en edición/retiro el estado queda no confirmado.
- `409`: conflicto de estado o duplicado. En edición/retiro se ocultan las acciones y no se asume que la propuesta siga activa.
- Respuesta inválida de mutación: en creación se exige que `solicitudId` coincida; en edición, el ID esperado y la misma solicitud/prestador; en retiro, el ID esperado y `estado: RETIRADA`. Cualquier contradicción deja el estado no confirmado.
- Red/timeout: error recuperable; se conserva el formulario o la acción para reintento manual.
- Éxito de creación/edición: mensaje de confirmación y estado actualizado con la respuesta real.
- Éxito de retiro: estado `RETIRADA` y acciones ocultas.

## Verificación

### Estática

- `npm run typecheck` → `0`.
- `npm run verify:config` → configuración Expo válida (`3067` bytes).
- `npm run doctor` → `20/20`, sin fallo de red.
- `npx expo export --platform android` → `0`, bundle Android de `1005` módulos.
- `git diff --check` → `0`.
- Validación pura de campos: disponibilidad vacía/256 caracteres y mensaje de 1001 caracteres producen errores; disponibilidad válida y mensaje normal pasan.

### API local sin sesión

- `POST /api/v1/propuestas` → `401 NO_AUTENTICADO`.
- `PUT /api/v1/propuestas/{id}` → `401 NO_AUTENTICADO`.
- `POST /api/v1/propuestas/{id}/retirar` → `401 NO_AUTENTICADO`.

No se crearon propuestas ni cuentas. La tabla `propuestas` permaneció con `0` filas.

### No verificado

- creación exitosa, `201`, obtención del `id` y transición al estado;
- edición `PUT`, retiro y confirmación;
- `409` real de solicitud cerrada/no compatible/duplicada y refresco del estado;
- idempotencia/replay: no aplica mientras BE-02 siga abierto;
- revisión visual del formulario y del estado en emulador. El dev client disponible conservó un bundle anterior; recargarlo habría descartado la sesión en memoria y no había credenciales Prestador para reautenticar. No se crearon datos para forzar estas pruebas.

## Fuera de alcance

F08 (recepción y comparación de propuestas para Cliente) no se implementa. Tampoco se añaden notificaciones locales, precios, contacto del Cliente ni recuperación persistente de propuestas.

## Enlaces

- [Oportunidades/F06](opportunities.md)
- [Arquitectura móvil](../architecture/MOBILE_ARCHITECTURE.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
- [Solicitudes de corrección backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
