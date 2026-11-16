# F06 — Compatibilidad y oportunidades (app móvil)

**Estado:** tablero, detalle y bandeja de avisos implementados contra el contrato real del backend. La verificación con datos reales está bloqueada porque el entorno local no tiene usuarios, perfiles profesionales ni solicitudes, y no se crearon datos ni cuentas para forzar escenarios. No se usan mocks ni fixtures en la integración.

## Alcance móvil

Cubre SPEC-06 para el rol **Prestador**:

- pestaña **Oportunidades** en la barra inferior, con Inicio, Oportunidades, Profesional y Mi perfil;
- tablero de solicitudes compatibles calculado por el servidor;
- filtros opcionales por categoría y urgencia enviados a la API;
- detalle de una oportunidad con categoría, zona aproximada, urgencia, descripción, fecha y referencia de fotos;
- bandeja de avisos `NUEVA_OPORTUNIDAD` consultada desde la API, sin simular push, polling ni notificaciones locales;
- estados de carga, error recuperable, vacío, resultados y sesión expirada;
- control de rol en navegación y pantallas, con el backend como autoridad final.

El Cliente no ve la pestaña ni tiene registradas las pantallas de oportunidades en el stack autenticado. Las pantallas vuelven a comprobar el rol y los hooks no consultan la API si el rol no es `PRESTADOR`.

## Contratos integrados

Todas las operaciones requieren sesión bearer. El tablero, el detalle y los avisos exigen rol `PRESTADOR`.

| Operación | Endpoint real | Request | Respuesta usada |
|---|---|---|---|
| Catálogo de categorías | `GET /api/v1/catalogo/categorias` | — | `{ id, nombre }[]` para el filtro. |
| Tablero | `GET /api/v1/oportunidades` | Query opcional `categoria` y `urgencia`. | `OportunidadResponse[]`. |
| Detalle | `GET /api/v1/oportunidades/{solicitudId}` | Path UUID. | `OportunidadResponse`. |
| Avisos | `GET /api/v1/notificaciones/oportunidades` | — | `NotificacionResponse[]` de tipo `NUEVA_OPORTUNIDAD`. |

`OportunidadResponse` observado en el backend:

```json
{
  "solicitudId": "uuid",
  "categoria": "nombre de categoría",
  "zonaAproximada": "nombre de zona",
  "urgencia": "BAJA | MEDIA | ALTA | URGENTE | null",
  "descripcion": "texto o null",
  "fechaCreacion": "OffsetDateTime",
  "fotos": ["clave-interna"]
}
```

`NotificacionResponse` observado para los avisos:

```json
{
  "id": "uuid",
  "tipo": "NUEVA_OPORTUNIDAD",
  "servicioId": null,
  "solicitudId": "uuid",
  "detalle": "Nueva oportunidad compatible con tu perfil.",
  "estadoEntrega": "PENDIENTE | ENTREGADA | FALLIDA",
  "fechaGeneracion": "OffsetDateTime"
}
```

### Filtros

- `categoria` acepta el UUID de una categoría o su nombre exacto; la app envía el UUID del catálogo.
- `urgencia` acepta los nombres exactos `BAJA`, `MEDIA`, `ALTA` y `URGENTE`.
- Los filtros se envían al servidor; la app no filtra localmente el resultado ni cambia el cálculo de compatibilidad.
- La opción “Todas” no envía el parámetro correspondiente.
- Una categoría desconocida devuelve una lista vacía; no se inventan coincidencias.

### Errores y sesión

- `401`: se presenta “Sesión expirada”, se limpia la sesión en memoria y se vuelve al acceso.
- `403`: se muestra que la sección requiere rol Prestador; no se altera la sesión.
- `404` en detalle: mensaje unificado “Oportunidad no disponible” para inexistente o no compatible, sin distinguir la causa.
- `400`: se informa que los filtros o la oportunidad no son válidos.
- Red/timeout: error recuperable con reintento manual.
- La app no interpreta los datos de navegación o de una notificación como autorización: solo conserva el `solicitudId` y vuelve a consultar el detalle.

## Implementación

```text
src/features/opportunities/
├── components/       # tarjeta, filtros, estado y aviso
├── hooks/            # tablero, detalle, avisos y manejo de sesión
├── screens/          # Oportunidades, detalle y avisos
├── services/         # gateway y adaptador HTTP
├── types/            # DTO, filtros y errores
└── utils/            # formato y mensajes
```

- `OpportunitiesScreen`: carga el tablero y el catálogo de categorías, aplica filtros contra la API, muestra resultados, vacío, error y acceso a avisos.
- `OpportunityDetailScreen`: vuelve a consultar `GET /oportunidades/{solicitudId}` cada vez que la pantalla recibe foco.
- `OpportunityNotificationsScreen`: consulta la bandeja al abrir y al actualizar; cada aviso abre el detalle, que se valida de nuevo en el servidor.
- No se muestra identidad, correo, teléfono ni dirección exacta del Cliente; el DTO real tampoco los expone.

## Diferencias con el plan y límites reales

- **No existe un estado “no evaluable” en la respuesta.** El backend excluye las solicitudes sin datos suficientes y devuelve solo las compatibles. La app no puede distinguir “sin coincidencias”, “sin perfil público” y “solicitud no evaluable”; el vacío se presenta sin afirmar una causa.
- **La disponibilidad no es una ventana temporal.** El backend considera disponible al perfil que tiene al menos un bloque declarado; no hay comparación horaria. La app no promete coincidencia temporal.
- **No hay paginación ni orden documentado.** Se muestra la lista completa que entrega el servidor.
- **El detalle y el tablero comparten DTO.** No hay datos adicionales de contacto ni de Cliente.
- **Fotos sin contrato de descarga.** La oportunidad entrega solo claves internas (`archivoKey`). La descarga existente exige `solicitudId` y `fotoId`, pero el DTO de oportunidad no expone `fotoId` ni una URL. La app muestra el número de fotos y advierte que aún no pueden visualizarse; no inventa URLs ni consulta endpoints por clave.
- **Notificaciones sin push.** El endpoint es una bandeja persistida. No se implementa polling, WebSocket, push ni notificaciones locales porque el mecanismo de entrega (D-08) no está definido. `estadoEntrega` es un estado del worker del backend, no una confirmación de push.
- **El plan fuente menciona “401 sin rol Prestador”.** En el backend real, una sesión autenticada con rol distinto recibe `403`; sin sesión, `401`.
- **El plan fuente describe casos de uso y puertos internos.** El backend actual expone un `OportunidadService` concreto y un `NotificacionController`; el cliente consume HTTP, no esos contratos internos.
- **No se implementa propuesta ni contratación.** Pertenecen a F07/F08 y no se ofrecen botones que simulen esas operaciones.

## Verificación

### Estática

- `npm run typecheck` → `0`.
- `npm run verify:config` → configuración Expo válida (`3067` bytes).
- `npm run doctor` → `20/20` comprobaciones; sin fallo de red.
- `npx expo export --platform android` → `0`, bundle Android de `994` módulos.
- `git diff --check` → `0`.

### API local

El backend arrancó en `8080` y el OpenAPI confirmó:

- `GET /api/v1/oportunidades` con `categoria` y `urgencia` opcionales;
- `GET /api/v1/oportunidades/{solicitudId}`;
- `GET /api/v1/notificaciones/oportunidades`.

Sin sesión, los tres endpoints respondieron `401 NO_AUTENTICADO`. La base local tenía `3` usuarios, `0` perfiles profesionales, `0` solicitudes y `0` notificaciones. No se encontraron credenciales autorizadas para iniciar sesión con esos usuarios y no se crearon cuentas ni datos.

### Pendiente de verificación con datos reales

No había emulador disponible (`adb devices` vacío) ni una sesión Prestador autenticada. No se declara revisión visual. Quedan sin verificar:

- tablero con oportunidades compatibles y sin coincidencias;
- filtro por categoría, por urgencia y combinado, incluyendo vacío sin error;
- detalle autorizado y `404` unificado para no compatible/inexistente;
- notificación `NUEVA_OPORTUNIDAD` que abre el detalle y vuelve a validar;
- acceso Cliente al tablero y al detalle: pestaña ausente, rutas no registradas y respuesta `403` si se intenta la API;
- fotos: bloqueo hasta que exista contrato de descarga por foto.

## Enlaces

- [Arquitectura móvil](../architecture/MOBILE_ARCHITECTURE.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
- [Solicitudes de corrección backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
