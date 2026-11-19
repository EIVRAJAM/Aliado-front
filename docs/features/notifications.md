# F09 — Notificaciones (app móvil)

**Estado:** bandeja unificada implementada contra `GET /api/v1/notificaciones`; consume los avisos persistidos de F06, F08 y F09 aunque no exista push. Validada manualmente en emulador Android contra el backend local, incluidos los dos accesos del Prestador. No se implementan tokens de dispositivo, permisos push, marcación de lectura ni recuperación de IDs no expuestos por el DTO.

## Alcance móvil

- Una sola bandeja para Cliente y Prestador. En Prestador se abre desde la campana de **Inicio** o desde la campana de **Oportunidades**.
- Incluye `NUEVA_OPORTUNIDAD`, `PROPUESTA_RECIBIDA`, `ACEPTACION_PROPUESTA`, `CAMBIO_ESTADO_SERVICIO` y `AVISO_SEGURIDAD_CUENTA` cuando el servidor los entregue.
- Orden cronológico descendente calculado en el cliente a partir de `fechaGeneracion`.
- Navegación solo cuando el DTO entrega un identificador válido o existe un fallback seguro.
- Carga al enfocar, actualización manual, estados de carga, vacío, error y reintento.

No se añaden contadores de no leídos, estado leído/no leído, push, polling, WebSocket, tokens de dispositivo ni endpoints nuevos. F06 no mantiene una bandeja filtrada paralela: su campana abre esta misma pantalla.

## Contrato real

| Operación | Endpoint | Respuesta usada |
|---|---|---|
| Notificaciones propias | `GET /api/v1/notificaciones` | `NotificacionResponse[]` con `id`, `tipo`, `servicioId`, `solicitudId`, `detalle`, `estadoEntrega`, `fechaGeneracion`. |

Tipos reconocidos:

| Tipo | IDs disponibles | Destino |
|---|---|---|
| `NUEVA_OPORTUNIDAD` | `solicitudId` | `OpportunityDetail` para Prestador. Sin ID no hay acción. |
| `PROPUESTA_RECIBIDA` | `solicitudId` opcional | Cliente: `ReceivedProposals` si hay `solicitudId`; si no, pestaña Solicitudes. |
| `ACEPTACION_PROPUESTA` | `servicioId` | `ServiceDetail`. Sin ID no hay acción. |
| `CAMBIO_ESTADO_SERVICIO` | `servicioId` | `ServiceDetail`. Sin ID no hay acción. |
| `AVISO_SEGURIDAD_CUENTA` | Ninguno | Informativo, sin navegación. |

`estadoEntrega` es un estado del worker del backend; no confirma push ni se muestra como estado de lectura. El DTO actual no expone un `propuestaId` navegable.

## Comportamiento

- Las campanas de Inicio y Oportunidades usan la etiqueta accesible **Notificaciones** y abren `Notifications`.
- Las tarjetas con destino son botones; las informativas o sin ID no exponen acción y no muestran chevron.
- `PROPUESTA_RECIBIDA` sin `solicitudId` usa Solicitudes como salida segura. No se inventa el identificador de la propuesta.
- La lista no se pagina ni se filtra localmente por tipo: se muestran todos los tipos reconocidos que el servidor entrega.
- No hay refresco automático mientras la pantalla permanece abierta; se recarga al recuperar foco o con el botón de actualización.
- Un `401` limpia la sesión y vuelve al acceso. Los errores recuperables conservan la pantalla y ofrecen reintento.

## Límites y dependencias

- **Push/tokens:** F09-FE-02 y F09-FE-03 no se implementan mientras D-08 siga abierta. La bandeja funciona sin push y no promete entrega en tiempo real.
- **Sin leído/no leído:** F09-FE-04 se respeta; el modelo y el contrato no tienen ese campo.
- **Propuestas sin ID:** el DTO de `PROPUESTA_RECIBIDA` no entrega `solicitudId` ni `propuestaId`; la app abre Solicitudes. Si el backend amplía el DTO, la tarjeta abrirá propuestas recibidas cuando exista `solicitudId`.
- **Servicios sin listado:** BE-07 sigue abierto. Las notificaciones de aceptación/cambio solo pueden abrir el servicio cuando traen `servicioId`.
- **Aviso de seguridad:** no tiene destino definido en el alcance F09; se presenta como informativo.
- **Sin paginación:** se muestra la lista completa entregada por el servidor.

## Implementación

```text
src/features/notifications/
├── components/       # tarjeta de notificación
├── hooks/            # carga al foco y error de sesión
├── screens/          # bandeja unificada
├── services/         # gateway HTTP y parseo del DTO
├── types/            # tipos, error y guardas
└── utils/            # etiquetas, fecha y mensajes
```

- `NotificationsScreen` reemplaza las antiguas bandejas de servicio y de oportunidades; ambas campanas abren esta pantalla.
- `HttpNotificationGateway` valida el DTO, descarta tipos no reconocidos y ordena por fecha descendente.
- La ruta, pantalla, hook, tarjeta y operación de gateway `OpportunityNotifications` se retiraron de F06 al quedar sin uso.
- `ServiceNotificationsScreen` y su hook/gateway se retiraron de `features/services` para evitar bandejas paralelas.

## Errores

- `401`: sesión expirada; se limpia y se vuelve al acceso.
- `403`: no se muestran notificaciones ajenas; se informa permiso insuficiente.
- Red/timeout: error recuperable con reintento manual.
- Respuesta inválida: no se inventan campos ni destinos; se informa que no fue posible cargar.
- Tipos desconocidos: se omiten para no romper la bandeja ante extensiones futuras.

## Verificación

### Estática

- `npm run typecheck` → `0`.
- `npm run verify:config` → configuración Expo válida (`3225` bytes).
- `npx expo export --platform android` → `0`, bundle Android de `1048` módulos.
- `git diff --check` → `0`.

### Manual en emulador Android

- Las campanas de Inicio y Oportunidades abren la misma pantalla **Notificaciones** con la misma lista.
- Cliente: `PROPUESTA_RECIBIDA` sin `solicitudId` abrió la pestaña Solicitudes.
- Prestador: `NUEVA_OPORTUNIDAD` abrió el detalle; `ACEPTACION_PROPUESTA` y `CAMBIO_ESTADO_SERVICIO` abrieron el servicio.
- Se verificaron orden descendente, actualización manual, estado vacío, error de red y reintento exitoso.
- La navegación desde una oportunidad ya contratada puede mostrar el detalle no disponible porque F06 revalida el estado en el servidor.

### No verificado

- No se validó `AVISO_SEGURIDAD_CUENTA` ni un aviso sin destino porque el backend no produce ese evento real.
- No se validó la apertura directa de propuestas recibidas porque el DTO real no entrega `solicitudId`; sí se verificó el fallback.
- No se validaron permisos push, tokens ni entrega externa porque D-08 sigue abierta.
- No se probó un `403` real.

## Fuera de alcance

Push, tokens de dispositivo, preferencias de notificación de F14, marcación leída/no leída, paginación, centro de seguridad y cambios de backend/OpenAPI.

## Enlaces

- [F06 — Oportunidades](opportunities.md)
- [F08 — Contratación y servicios](services.md)
- [Arquitectura móvil](../architecture/MOBILE_ARCHITECTURE.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
- [Solicitudes y decisiones backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
