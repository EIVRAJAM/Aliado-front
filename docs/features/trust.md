# F10 — Calificaciones, reseñas y verificación (app móvil)

**Estado:** flujos de calificación, reseña, verificación documental y reporte de reseña implementados contra el contrato confirmado. La reputación, cantidad de calificaciones, nivel de verificación y reseñas públicas ya se mostraban en F03/F05 desde el DTO público. Validados en emulador Android contra el backend local: calificación/reseña con servicio desechable, conflicto de servicio ya calificado, verificación con documento sintético y reporte de reseña. El historial privado del Cliente está implementado como pantalla y gateway, pero su consulta depende de BE-11 y no se presenta como verificada. Quedan sin ejecutar la interrupción segura entre calificación y reseña y el 409 de reseña en UI.

No se modifica el backend ni se inventan endpoints, campos, MIME, tamaños o cantidades.

## Alcance móvil

- Cliente califica un servicio propio únicamente cuando está `FINALIZADO`.
- La app exige una calificación de 1 a 5 y una reseña no vacía antes de iniciar el envío conjunto del flujo móvil.
- Prestador consulta su última solicitud de verificación y envía documentos mediante multipart.
- Usuarios autenticados pueden reportar una reseña pública indicando únicamente un motivo.
- La reputación, cantidad, nivel y reseñas se muestran en búsqueda/perfil público y en la vista previa del Prestador con los datos ya disponibles.
- Cliente accede desde Mi perfil a **Mis calificaciones y reseñas**, un historial privado de solo lectura. La operación backend está solicitada en BE-11 y todavía no existe.

No se implementan: atomicidad de calificación y reseña en backend, lectura de la calificación propia desde el detalle del servicio, descarga de documentos privados de verificación, edición de calificación/reseña ni presentar el nivel como certificación legal. La evidencia de un reporte de reseña se adjunta mediante el flujo F11 después de confirmar el `reporteId`.

## Contrato real utilizado

| Operación | Endpoint | Uso en la app |
|---|---|---|
| Calificar | `POST /api/v1/servicios/{servicioId}/calificacion` | Body `{ valor: 1..5 }`; respuesta `201 { id, reputacionActualizada }`. |
| Agregar reseña | `POST /api/v1/calificaciones/{id}/resena` | Body `{ texto }`; respuesta `201 { id }`. |
| Confianza pública | `GET /api/v1/prestadores/{prestadorId}/confianza` | Contrato disponible; las vistas actuales consumen los mismos datos embebidos en el DTO público de F03/F05. |
| Reseñas públicas | `GET /api/v1/prestadores/{prestadorId}/resenas` | Contrato disponible; las vistas actuales consumen las reseñas embebidas en el DTO público. |
| Solicitar verificación | `POST /api/v1/verificaciones` | Multipart con partes `documentos`; respuesta `202 { id, estado }`. Solo Prestador. |
| Mi verificación | `GET /api/v1/verificaciones/mia` | `200 { id, estado }`; `404 SIN_VERIFICACION` si no existe. Solo Prestador. |
| Reportar reseña | `POST /api/v1/resenas/{id}/reportes` | Body `{ motivo }`; respuesta `201 { reporteId }`. |

No se duplican llamadas a confianza/reseñas en las vistas que ya reciben esos datos en el DTO público. El gateway F10 solo expone las mutaciones y la lectura de verificación propia que no existían en el cliente.

## Flujos implementados

### Calificar y reseñar

- El bloque aparece en el detalle del servicio solo para `CLIENTE` y estado `FINALIZADO`.
- Ofrece cinco estrellas y un campo de reseña obligatorio. El CTA **Enviar calificación y reseña** permanece deshabilitado hasta que ambos estén completos.
- Al iniciar, llama primero a `POST /servicios/{id}/calificacion`; con el `id` devuelto llama a `POST /calificaciones/{id}/resena`.
- Evita doble envío concurrente con un único estado de fase y no reintenta automáticamente.
- Si la calificación se guarda y la reseña falla, conserva en memoria el `calificacionId` y el texto, muestra que la calificación quedó guardada con la reseña pendiente y cambia el CTA a **Reintentar reseña**. El reintento solo ejecuta el segundo POST.
- Si la reseña ya existía (`409 RESENA_YA_EXISTE`), se informa que no se creó un duplicado.
- La app no fija un máximo local de texto porque el contrato móvil confirmado no lo define. La reseña vacía se bloquea antes de enviar.
- El detalle del servicio no informa si ya existe una calificación. La app no afirma poder detectarlo al entrar.
- Ante `409` de calificación se distingue el código del servidor:
  - `YA_CALIFICADO`: no recarga el detalle, oculta el formulario y muestra un aviso persistente de que el servicio ya fue calificado. No inventa ni muestra el valor o `calificacionId` previos.
  - `SERVICIO_NO_FINALIZADO`: informa que el servicio dejó de cumplir las condiciones y recarga el detalle.
- Ante una respuesta ambigua de calificación no se afirma que no se guardó; se informa que no se pudo confirmar y se evita el reenvío automático. Ante una respuesta ambigua de reseña se conserva el `calificacionId` y se permite reintentar solo la reseña.
- Al salir o cerrar la app se pierde el `id` de la calificación y el texto pendiente. No hay forma de recuperar la reseña porque el detalle del servicio no expone la calificación y no existe un GET propio.
- La obligatoriedad de ambos campos es una regla del cliente móvil. El backend sigue aceptando calificación y reseña por separado, por lo que no puede garantizar atomicidad ni impedir que un cliente API externo cree solo la calificación.

### Verificación del Prestador

- La tarjeta de verificación se muestra en la pantalla **Profesional** para `PRESTADOR`.
- Consulta `GET /verificaciones/mia` al enfocar y representa:
  - sin solicitud (`404 SIN_VERIFICACION`);
  - `PENDIENTE`, sin permitir otra solicitud mientras siga en revisión;
  - `APROBADA`, con nivel máximo disponible y sin nueva solicitud;
  - `RECHAZADA`, habilitando un nuevo envío.
- La selección usa `expo-document-picker` con `multiple` y tipo abierto; no impone MIME, tamaño ni cantidad en el cliente.
- El upload usa `XMLHttpRequest` + `FormData`, el patrón ya validado por F04 para archivos. El intento inicial con `fetch` + `FormData` no completaba el multipart y se corrigió.
- Los documentos se envían como partes `documentos` y no se muestran ni descargan después.
- `409` por solicitud pendiente o nivel máximo se muestra y se reconcilia consultando de nuevo el estado.
- `400`, `413` y `415` se presentan como errores del servidor; no se codifican reglas locales no aprobadas.

### Reportar reseña

- Las reseñas públicas y la vista previa del Prestador muestran una acción **Reportar**.
- El modal exige un motivo y usa el endpoint real.
- El éxito conserva el `reporteId` devuelto y habilita la sección de evidencia de F11. No se puede adjuntar antes de confirmar el reporte.
- La reseña sigue visible hasta la moderación.

## Historial privado del Cliente (BE-11)

- Entrada **Mis calificaciones y reseñas** en Mi perfil, visible solo para `CLIENTE`; ruta `MyRatings` registrada solo para ese rol.
- La pantalla consulta exclusivamente `HttpTrustGateway.getMyRatings`, propuesto contra `GET /api/v1/calificaciones/mias?pagina=0&tamano=20`.
- No usa mocks, fixtures, almacenamiento local ni la lista pública de reseñas de un Prestador.
- Estados: carga, lista, vacío (solo tras `200` con `items: []`), error de red, sesión expirada y operación no disponible.
- Si el endpoint responde `404`, o el `500 ERROR_INTERNO` acotado de ruta inexistente del backend actual, muestra **Historial aún no disponible** y no “sin reseñas”.
- Cada tarjeta usa solo datos del DTO: descripción/categoría/zona del servicio, valor, fecha de calificación, reseña opcional y `nombrePublico` del Prestador si el backend lo entrega. No deriva nombres.
- La lista se ordena por `fechaCalificacion` descendente y ofrece actualización manual y “Cargar más” cuando el backend indique páginas adicionales.
- No permite editar, eliminar, reenviar ni reportar desde el historial.
- El DTO propuesto y sus requisitos están en [BE-11](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-11--historial-de-calificaciones-y-reseñas-del-cliente). Si cambia, la adaptación queda en el parser del gateway.

## Reputación y nivel de verificación

- F03 muestra reputación, cantidad y nivel en la tarjeta de búsqueda y en el perfil público.
- F05 muestra los mismos datos en la vista previa y las reseñas visibles.
- Se añadió una explicación explícita: la verificación básica indica revisión de documentos por ALIADO y no es una certificación legal ni una garantía.
- Los niveles conocidos son `SIN_VERIFICAR` y `BASICO`; valores nuevos se muestran con formato neutral, sin prometer un nivel superior.

## Límites y dependencias

- **Calificación propia no legible:** `GET /api/v1/servicios/{id}` no devuelve la calificación ni un `calificacionId`. Después de salir de la pantalla no se puede abrir una reseña pendiente ni saber si el servicio ya fue calificado. Se solicita en [BE-08](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-08--lectura-de-la-calificación-propia-por-servicio).
- **Historial privado pendiente:** no existe `GET /api/v1/calificaciones/mias`. La pantalla muestra el estado no disponible y no puede confirmar si hay reseñas. Se solicita en [BE-11](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-11--historial-de-calificaciones-y-reseñas-del-cliente).
- **Sin atomicidad de calificación + reseña:** el backend usa dos operaciones separadas. La app exige ambos campos antes de empezar, pero no puede garantizar que ambos queden persistidos si la segunda falla. Se solicita una operación atómica o recuperación explícita en [BE-10](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-10--atomicidad-de-calificación-y-reseña).
- **Evidencia de reporte:** F11 usa `POST /reportes/{id}/evidencias` después de confirmar el `reporteId`; no se ofrece adjunto antes. La política de archivos sigue en [D-07](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#d-07--política-de-archivos-de-verificación-y-evidencias) y la definición de consolidación en D-12.
- **Política de archivos pendiente:** la app no fija MIME, tamaño ni cantidad para documentos de verificación. El backend valida y puede responder `400`, `413` o `415`. D-07 sigue abierta.
- **Documentos privados:** no hay operación móvil para listarlos o descargarlos; la UI no los expone.
- **Build nativo:** se añadió `expo-document-picker` (`~58.0.5`). El development build existente debe reconstruirse para usar el selector de documentos.
- **Sin edición:** no se puede corregir una calificación o reseña ya enviada.
- **Sin detección de estado:** la UI no simula una consulta de calificación previa ni un estado leído.

## Implementación

```text
src/features/trust/
├── components/   # calificación/reseña, verificación, reporte e historial
├── hooks/        # verificación, historial propio y sesión expirada
├── screens/      # historial privado del Cliente
├── services/     # gateway JSON y multipart
├── types/        # DTOs, estados y errores
└── utils/        # formato de estado, fechas y archivos
```

Integraciones:

- `ServiceDetailScreen`: bloque de calificación/reseña obligatorias para Cliente con servicio finalizado; conserva el `calificacionId` en memoria y permite reintentar solo la reseña.
- `ProfileOverviewScreen`: entrada **Mis calificaciones y reseñas** solo para Cliente.
- `MyRatingsScreen`: historial privado de solo lectura conectado a la ruta propuesta BE-11.
- `ProfessionalProfileScreen`: tarjeta de verificación y reporte de reseñas de la vista previa.
- `ProviderProfileScreen` + `ProviderPublicProfileView`: reporte de reseñas públicas.
- `PublicPreviewCard`: reporte de reseñas visibles por el Prestador.

## Errores

- `401`: sesión expirada; se limpia y se vuelve al acceso.
- `403`: permiso insuficiente; no se altera la sesión.
- `404`: recurso o verificación no disponible. `SIN_VERIFICACION` se trata como ausencia esperada, no como error.
- `409`: conflicto de estado. Se muestra el mensaje específico cuando el backend entrega `code`; no se reintenta automáticamente.
- `400`: validación del valor, texto o motivo.
- `413`/`415`: archivo rechazado por el servidor; no se fijan reglas locales.
- Red/timeout: error recuperable con reintento manual; las mutaciones no se reenvían solas.
- Respuesta inválida: no se inventan IDs ni estados.

## Verificación

### Estática

- `npm run typecheck` → `0`.
- `npm run verify:config` → configuración Expo válida (`3258` bytes).
- `npm run doctor` → `20/20` comprobaciones con Node `24.14.1`.
- `npx expo export --platform android` → `0`, bundle Android de `1067` módulos.
- `git diff --check` → `0`.

### API local

- Sin sesión, `POST /servicios/{id}/calificacion`, `GET /verificaciones/mia` y `POST /resenas/{id}/reportes` respondieron `401`.
- `GET /prestadores/{id}/confianza` con un ID inexistente respondió `404`; no se usó una sesión de prueba para mutaciones.

### Manual en emulador Android

- CTA deshabilitado sin estrellas/reseña; habilitado al completar ambos.
- Envío exitoso de calificación y reseña; la DB confirmó 1 calificación y 1 reseña asociada.
- Servicio `TERMINADO`: no mostró formulario.
- Servicio ya calificado: 409 persistente, sin formulario; la DB mantuvo 1 calificación y 1 reseña.
- Verificación: estado sin solicitud, selección de PNG sintético, upload exitoso y estado `PENDIENTE`; DB con 1 solicitud y 1 documento.
- Reporte de reseña desde la vista previa del Prestador; UI de éxito y reporte `PENDIENTE` en DB. La evidencia se integró después con F11, pero no se probó una carga autenticada en esta iteración.
- API de conflictos: `YA_CALIFICADO` y `RESENA_YA_EXISTE` respondieron 409; un reporte equivalente devolvió 201 sin fila adicional.
- Historial privado: con sesión Cliente, la ruta propuesta devolvió el `500 ERROR_INTERNO` de ruta inexistente del backend actual. La UI mostró **Historial aún no disponible**, no una lista vacía. No se validó una respuesta exitosa.

### No verificado

- No se interrumpió de forma segura la reseña después de una calificación exitosa.
- El 409 de reseña no se reprodujo en UI; se comprobó por HTTP.
- No se probaron carreras reales ni múltiples clientes API.
- No se cargaron documentos reales; solo un PNG sintético.
- No se validó una respuesta exitosa del historial porque BE-11 no existe. Solo se validará el estado “no disponible” mientras falte la operación.

## Fuera de alcance

Administración/moderación de reportes, descarga de evidencias, edición de reseñas, preferencias de notificación, formalización y cualquier cambio de backend/OpenAPI.

## Enlaces

- [F03 — Descubrimiento](discovery.md)
- [F05 — Perfil profesional](professional-profile.md)
- [F08 — Contratación y servicios](services.md)
- [F11 — Reportes y evidencias](reports.md)
- [Solicitudes y decisiones backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
