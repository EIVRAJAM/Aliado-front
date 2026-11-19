# F08 — Contratación, ciclo del servicio y comunicación (app móvil)

**Estado:** flujo Cliente de consulta/aceptación de propuestas, detalle compartido del servicio, transiciones, historial y mensajes implementado contra el controlador/DTO reales. La pantalla de avisos de servicio permite abrir un servicio desde notificaciones existentes. No se validaron mutaciones autenticadas ni revisión visual porque el development build requiere reconstrucción y no se autorizó crear servicios. No se usan mocks ni datos ficticios.

## Alcance móvil

- Cliente: consulta y compara propuestas activas de una solicitud propia, acepta una y abre el servicio contratado.
- Cliente y Prestador: consultan el detalle, estado, propuesta aceptada e historial.
- Prestador: inicia el servicio y lo marca como terminado.
- Cliente: confirma la finalización o cancela mientras el servidor lo permita.
- Ambos: cancelan si el estado lo permite.
- Mensajes REST mediados después de la contratación; no chat en tiempo real.
- Avisos de servicio desde `GET /api/v1/notificaciones`, sin push ni polling.

No se implementa F09 push, F15 chat realtime, precios, datos de contacto ni un listado de servicios.

## Contratos reales

| Operación | Endpoint | Respuesta usada |
|---|---|---|
| Propuestas recibidas | `GET /api/v1/solicitudes/{solicitudId}/propuestas` | `PropuestaResponse[]`; exclusivo de Cliente dueño. |
| Aceptar propuesta | `POST /api/v1/propuestas/{id}/aceptar` | `200 { servicioId, estado }`. |
| Detalle del servicio | `GET /api/v1/servicios/{id}` | Servicio + resumen de solicitud + propuesta aceptada. |
| Iniciar | `POST /api/v1/servicios/{id}/en-ejecucion` | `{ id, estado }`. |
| Terminar | `POST /api/v1/servicios/{id}/terminado` | `{ id, estado }`. |
| Confirmar finalización | `POST /api/v1/servicios/{id}/confirmar-finalizacion` | `{ id, estado }`. |
| Cancelar | `POST /api/v1/servicios/{id}/cancelar` | `{ id, estado }`. |
| Historial | `GET /api/v1/servicios/{id}/historial` | Transiciones ordenadas. |
| Mensajes | `GET/POST /api/v1/servicios/{id}/mensajes` | Lista o mensaje creado. |
| Avisos de servicio | `GET /api/v1/notificaciones` | Se filtran `ACEPTACION_PROPUESTA` y `CAMBIO_ESTADO_SERVICIO`. |

El detalle de servicio expone IDs de la solicitud y propuesta, pero no nombres de las partes ni contacto. Para mostrar categoría y zona se consultan los catálogos existentes. El canal de mensajes no expone datos de contacto y el backend limita el contenido a 2000 caracteres.

## Reglas y límites

- **Estados:** `CONTRATADO → EN_EJECUCION → TERMINADO → FINALIZADO`; cancelación antes de finalizar. El servidor sigue siendo la autoridad. Cada acción exige releer el servicio y solo muestra éxito si el estado releído es el esperado por la acción: `EN_EJECUCION`, `TERMINADO`, `FINALIZADO` o `CANCELADO`. Si la respuesta es inválida, diferente o la recarga no confirma el estado, el resultado queda como incierto.
- **Aceptación:** cierra las demás propuestas, crea el servicio y habilita comunicación en una sola operación.
- **Idempotencia desactivada:** no se envía `Idempotency-Key` en aceptación ni transiciones mientras BE-02 siga abierto. Ante un resultado incierto de aceptación no se reintenta automáticamente.
- **Sin lista de servicios:** no existe endpoint para listar o recuperar servicios de una cuenta. El Cliente abre el servicio con el `servicioId` devuelto por la aceptación; el Prestador puede abrirlo desde un aviso de servicio. Al salir de esos contextos, el `servicioId` se pierde y la app no inventa recuperación persistente. La operación faltante está registrada en [BE-07](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-07--listado-de-servicios-propios).
- **Notificaciones:** solo se consultan al abrir; no hay push, polling ni WebSocket. Para el Cliente no existe una notificación inicial de aceptación; si pierde la respuesta y sale, no puede recuperar el servicio desde la app.
- **Mensajería y D-10:** la UI permite enviar mientras `comunicacionHabilitada` sea verdadero. No se agregan restricciones propias por estado porque la política después de cancelar/finalizar sigue pendiente de [D-10](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#d-10--mensajería-después-de-cancelar-o-finalizar); si el servidor rechaza, se muestra el error. No es un defecto confirmado.
- **Mensaje con resultado incierto:** no se envía `Idempotency-Key`. Ante timeout, red, `5xx` o respuesta inválida se conserva el texto y se vuelven a consultar los mensajes. Si aparece un mensaje nuevo del usuario actual con el mismo contenido desde el inicio del intento, se confirma y se limpia el campo. Si no se puede confirmar, se bloquea el reenvío en esa pantalla y se advierte que podría duplicarse; no se deduce que falló por perder la respuesta HTTP.
- **Historial:** se muestra el orden entregado por el backend; los actores se identifican como Cliente o Prestador, sin nombre ni contacto.
- **409:** las acciones y mensajes recargan servicio, historial y mensajes antes de ofrecer nuevas acciones.
- **Sin datos inventados:** no se muestran precio, nombre/contacto, dirección exacta ni campos que el DTO no entregue.

## Implementación

```text
src/features/services/
├── components/       # estado, historial, mensajes y avisos
├── hooks/            # detalle compartido, avisos y sesión expirada
├── screens/          # detalle del servicio y avisos
├── services/         # gateway HTTP
├── types/            # DTOs, estados y errores
└── utils/            # formato y mensajes

src/features/proposals/screens/ReceivedProposalsScreen.tsx
```

- `RequestDetailScreen` muestra **Ver propuestas recibidas** para solicitudes publicadas del Cliente.
- `ReceivedProposalsScreen` compara disponibilidad y mensaje y permite aceptar con confirmación.
- `ServiceDetailScreen` comparte el detalle para ambos roles y muestra acciones según rol/estado, historial y mensajes.
- `ServiceNotificationsScreen` se abre desde la campana **Avisos de servicio** del encabezado de Inicio; muestra aceptaciones y cambios de estado. El botón no muestra contador ni estado de lectura.
- El `servicioId` se conserva únicamente en el contexto de navegación. No se persiste ni se simula una lista.
- Se reutilizó la selección de fecha/hora y `expo-clipboard` de F07; el development build debe reconstruirse por los módulos nativos.

## Errores

- `401`: se limpia la sesión y se vuelve al acceso.
- `403`: permisos insuficientes; `404`: servicio/propuesta no disponible sin revelar detalle a terceros.
- `400`: validación del mensaje u operación.
- `409`: transición inválida, conflicto de concurrencia, comunicación no habilitada o servicio ya contratado. Se recarga el estado y se evita asumir que la acción se aplicó.
- Respuesta de transición inválida o con estado distinto: se relee el servicio; solo se confirma si el estado actual coincide con el esperado. Si no, se muestra resultado incierto.
- Envío de mensaje incierto: se releen mensajes y se compara contra el contenido y los IDs previos al intento; si no hay coincidencia, el campo y el envío quedan bloqueados para evitar duplicados.
- Aceptación incierta: se bloquean nuevas aceptaciones y se informa que no se pudo confirmar el resultado. No se reintenta ni se promete recuperación.
- Red/timeout: error recuperable con reintento manual; no hay reintento automático de mutaciones.

## Verificación

### Estática

- `npm run typecheck` → `0`.
- `npm run verify:config` → configuración Expo válida (`3225` bytes).
- `npm run doctor` → `20/20`.
- `npx expo export --platform android` → `0`, bundle Android de `1044` módulos.
- `git diff --check` → `0`.

### API local sin sesión

- Propuestas recibidas, aceptación, detalle, historial, mensajes, transiciones y notificaciones respondieron `401`.
- El OpenAPI no expone `GET /api/v1/servicios` para listar servicios de una cuenta.

### No verificado

- No se ejecutaron API autenticada ni mutaciones de aceptación, transiciones o mensajes.
- No se provocaron respuestas inválidas, estados distintos, timeouts ni duplicados de mensajes; la lógica se validó por tipos y revisión de contrato, no con backend autenticado.
- No se creó ni modificó ningún servicio o propuesta.
- No se completó revisión visual: el development build actual no incorpora los módulos nativos de F07 y debe reconstruirse; no había credenciales Prestador/Cliente para reautenticar.
- Quedan pendientes: aceptación real, cierre de propuestas, primera transición, historial, mensajes, conflictos `409`, resultado incierto y acceso desde avisos de servicio con datos autorizados.

## Fuera de alcance

F09 push, F15 chat realtime, F10 confianza, precios y recuperación persistente de servicios. D-10 debe definir la política de mensajes después de cancelar/finalizar.

## Enlaces

- [F07 — Propuestas](proposals.md)
- [Arquitectura móvil](../architecture/MOBILE_ARCHITECTURE.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
- [Solicitudes y decisiones backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
