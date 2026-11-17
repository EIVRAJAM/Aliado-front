# F06 — Compatibilidad y oportunidades (app móvil)

**Estado:** tablero, detalle y bandeja de avisos implementados contra el contrato real del backend. La iteración visual reduce la carga del tablero con filtros en modal y reorganiza el detalle en una lectura compacta. La UI se verificó en emulador Android con los datos locales `[DEMO LOCAL F06]`; no se crearon ni modificaron datos. No se usan mocks ni fixtures en la integración.

## Alcance móvil

Cubre SPEC-06 para el rol **Prestador**:

- pestaña **Oportunidades** en la barra inferior, con Inicio, Oportunidades, Profesional y Mi perfil;
- tablero de solicitudes compatibles calculado por el servidor;
- filtros opcionales por categoría y urgencia enviados a la API desde un botón compacto y un modal;
- detalle de una oportunidad con encabezado compacto, descripción completa, referencia de solicitud, fecha y cantidad de fotos como metadatos secundarios;
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
- El tablero abre los filtros en un modal con cierre por botón, toque fuera y botón Atrás de Android.
- El botón de filtros muestra un punto discreto cuando hay filtros activos.
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

- `OpportunitiesScreen`: carga el tablero y el catálogo, muestra un botón de filtros con indicador de estado activo, y concentra la selección de categoría, urgencia, aplicación y limpieza en un modal. El conteo aparece una sola vez junto a las acciones; el subtítulo es la única explicación general de compatibilidad y se retiró la tarjeta redundante de alcance.
- `OpportunityFilterModal`: usa el patrón modal de la app, respeta safe areas, cierra con botón, overlay y Atrás, y mantiene áreas táctiles de al menos 44 puntos.
- `OpportunityDetailScreen`: vuelve a consultar `GET /oportunidades/{solicitudId}` al recibir foco y presenta un único bloque con categoría, urgencia, zona aproximada, descripción completa, fecha, referencia corta de `solicitudId` y cantidad de fotos. No repite campos y usa un aviso compacto para privacidad y límites del contrato.
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
- **La propuesta se implementa desde F07.** El detalle ofrece **Enviar propuesta** y abre el flujo de F07. La contratación y la recepción/comparación de propuestas para Cliente pertenecen a F08 y no se simulan.

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

Sin sesión, los tres endpoints respondieron `401 NO_AUTENTICADO`. Los datos demo locales tenían `4` usuarios, `3` perfiles profesionales, `4` solicitudes publicadas, `0` notificaciones y `0` fotos. No se crearon ni modificaron registros durante esta iteración.

### UI en emulador Android

La sesión Prestador existente se usó contra los datos `[DEMO LOCAL F06]`:

- tablero sin filtros: `4` oportunidades, con el conteo una sola vez en la cabecera y sin encabezado de resultados duplicado ni tarjeta de alcance;
- modal abierto/cerrado con botón de cierre, toque fuera y botón Atrás de Android;
- filtro por urgencia `Urgente`: `1` oportunidad, con indicador activo y un solo conteo;
- filtro combinado `Aire acondicionado` + `Urgente`: `1` oportunidad; al reabrir el modal, ambas selecciones se conservaron;
- limpiar desde el modal: volvió a `4` oportunidades y retiró el indicador;
- filtro `Pintura`: `0` resultados con estado vacío; la acción de limpiar devolvió las `4` oportunidades;
- detalle de una oportunidad demo: categoría, urgencia, zona aproximada, descripción completa, fecha de publicación, referencia `Ref. 66000000…0001`, “Sin fotos” y aviso compacto de privacidad y límites; sin campos repetidos.

Los datos demo no incluyen descripciones nulas/vacías, saltos de línea ni fotos, por lo que no se pudieron verificar visualmente esos estados. La UI implementa el texto de reemplazo para descripción ausente y la nota de fotos no descargables; no se crearon registros para forzarlos. Tampoco se repitieron el `404` unificado, la notificación real ni la denegación `403`, que no forman parte de este ajuste.

## Enlaces

- [Arquitectura móvil](../architecture/MOBILE_ARCHITECTURE.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
- [F07 — Propuestas](proposals.md)
- [Solicitudes de corrección backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
