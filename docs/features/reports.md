# F11 — Reportes de cuentas/servicios y evidencias (app móvil)

**Estado:** frontend implementado contra las rutas reales de reportes y evidencias. Incluye reporte de cuenta desde el perfil público, reporte de servicio y de la contraparte desde el detalle del servicio, evidencia posterior a un `reporteId` confirmado y consulta del estado propio. El reporte de reseña de F10 reutiliza la misma sección de evidencia. No se crearon ni modificaron datos durante la implementación; la validación autenticada de mutaciones queda pendiente de autorización.

## Alcance móvil

- Reportar otra cuenta desde el perfil público del Prestador.
- Reportar la contraparte desde el detalle de un servicio, para Cliente o Prestador.
- Reportar un servicio desde su detalle solo en estados `CONTRATADO` o `EN_EJECUCION`.
- Reutilizar el formulario de reporte de reseña de F10 sin duplicarlo.
- Adjuntar evidencia opcional solo después de recibir un `reporteId`.
- Consultar el estado propio del reporte recién creado mediante la lectura real existente.

No existe listado de reportes propios; el detalle se consulta por ID. Se solicita en BE-12.

## Contrato real utilizado

| Operación | Endpoint | Respuesta/uso |
|---|---|---|
| Reportar cuenta | `POST /api/v1/usuarios/{id}/reportes` | `201 { reporteId }`; motivo obligatorio; el servidor rechaza auto-reporte y objetivo inexistente. |
| Reportar servicio | `POST /api/v1/servicios/{id}/reportes` | `201 { reporteId }`; solo participante; motivo obligatorio. |
| Adjuntar evidencia | `POST /api/v1/reportes/{id}/evidencias` | Multipart `archivo`; `201 { id, archivoKey, tipoContenido }`. Solo reportante y reporte abierto. |
| Estado propio | `GET /api/v1/reportes/mios/{id}` | `ReporteResponse` con motivo, estado, fecha y evidencias. Solo reportante. |
| Descargar evidencia | `GET /api/v1/reportes/{id}/evidencias/{evidenciaId}` | Existe; no se usa en la UI para no exponer claves ni ampliar el alcance. |

El servidor consolida un reporte equivalente abierto del mismo reportante, tipo, objetivo y motivo; devuelve su `reporteId`. La app muestra la referencia devuelta y no decide por sí misma si el reporte era nuevo.

## Flujos implementados

### Crear reporte

- Los formularios exigen un motivo no vacío antes de habilitar el envío.
- No permiten elegir al reportante ni aceptar IDs escritos por el usuario: el objetivo procede del perfil o servicio real ya cargado.
- La app llama al endpoint de cuenta o servicio según el contexto.
- Al recibir éxito, conserva y muestra el `reporteId` y consulta `GET /reportes/mios/{id}` para mostrar estado y evidencias.
- Si el backend devuelve una referencia consolidada, se muestra tal cual; no se infiere que se creó una fila nueva.
- Un error ambiguo no se presenta como “no creado” y no se reintenta automáticamente. El motivo se conserva y un reintento manual con el mismo motivo puede devolver el reporte consolidado.
- `403`, `404`, `400`, sesión expirada y red se muestran según la respuesta real.

### Evidencia

- La sección de evidencia solo se monta cuando existe un `reporteId` confirmado.
- Usa `expo-document-picker` con tipo abierto y sin límites locales de MIME, tamaño o cantidad.
- La carga usa `XMLHttpRequest` + `FormData` con la parte `archivo`; el backend valida el archivo.
- Los errores inequívocos (`400`, `413`, `415`, `409`, `403`, `404`) se muestran sin reconciliación especial.
- Ante timeout, red, respuesta inválida o `5xx`, el resultado es incierto: la app consulta `GET /reportes/mios/{id}` solo para actualizar el estado visible, no para atribuir una evidencia concreta a la carga fallida.
- Aunque aparezcan evidencias nuevas o aumente el conteo, la carga sigue siendo incierta: el backend no entrega un identificador de correlación. La app indica que hay evidencia nueva pero no puede confirmar si corresponde a este archivo.
- Mientras siga incierto, el archivo se conserva, no se reenvía automáticamente y reemplazarlo, quitarlo o cerrar el modal exige una confirmación explícita sobre el posible duplicado y sobre que solo se descarta la copia local.
- Si la consulta de estado falla, se muestran ambas fallas y se conserva el archivo.
- Solo un `POST` con respuesta exitosa confirmada borra el archivo y muestra éxito. Una consulta posterior fallida no convierte ese éxito confirmado en fallo.
- Nunca se vuelve a crear el reporte para reintentar la evidencia.
- El contrato no ofrece idempotencia ni identificador de carga; la app no promete una carga “exactamente una vez” y no puede reconciliar la autoría de una evidencia nueva comparando IDs o conteos.
- El estado y la lista de evidencias se refrescan con `GET /reportes/mios/{id}`.
- No se muestran claves internas de almacenamiento ni se ofrece descarga en la UI.

### Reporte de reseña F10

- `ReportReviewModal` conserva su formulario único y, tras confirmar el `reporteId`, reutiliza la sección de evidencia de F11.
- No existe una segunda pantalla/formulario para reportar reseñas.
- La reseña sigue visible mientras moderación la revisa.

## Integraciones

- `ProviderProfileScreen`: acción **Reportar esta cuenta** con el ID público real del Prestador.
- `ServiceDetailScreen`: **Reportar servicio** se muestra solo para `CONTRATADO` y `EN_EJECUCION`, según UC066. **Reportar al Prestador/Cliente** (UC065) permanece disponible para participantes en otros estados.
- `ReportReviewModal`: evidencia posterior al reporte de reseña.
- `ReportTargetModal` y `ReportEvidenceSection`: componentes compartidos de F11.

No se agregan rutas de navegación; los reportes se abren como modales contextuales.

## Seguridad y privacidad

- La app no acepta un `clienteId` ni un `reportanteId`; el backend usa la sesión autenticada.
- El objetivo se toma del recurso cargado y autorizado por la pantalla.
- La consulta de estado usa la ruta autenticada de reportes propios.
- No se muestran reportes de terceros ni evidencias privadas.
- La autorización real sigue siendo responsabilidad del backend.

## Límites y decisiones abiertas

- **Sin listado propio:** no existe una operación para enumerar reportes del usuario. Después de cerrar el modal no se puede recuperar un reporte desde la app. Se solicita en [BE-12](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-12--listado-de-reportes-propios).
- **D-07 pendiente:** la app no fija MIME, tamaño ni cantidad de archivos. El servidor puede responder `400`, `413` o `415`; esos errores se muestran.
- **D-12 pendiente:** la política de equivalencia/consolidación no está aprobada como producto. La UI se limita a mostrar el `reporteId` que devuelve el servidor y no promete crear o reutilizar reportes por su cuenta.
- **Sin idempotencia de evidencia:** la carga no tiene clave de correlación; un timeout puede dejar el archivo guardado y un reintento podría duplicarlo. La app actualiza el estado visible, mantiene el resultado como incierto y advierte antes de reintentar; no puede atribuir una evidencia nueva al archivo fallido. Se solicita en [BE-13](../backend-requests/BACKEND_CORRECTION_REQUESTS.md).
- **Sin descarga de evidencia:** el endpoint existe, pero no se expone en esta fase para mantener las evidencias privadas y evitar ampliar el alcance de archivos.
- **Detalle solo por ID:** el estado propio se muestra tras crear el reporte; no se inventa historial ni persistencia local.
- **Sin prueba autenticada de mutaciones:** no se crearon reportes ni evidencias reales durante la implementación.

## Implementación

```text
src/features/reports/
├── components/   # formulario contextual y carga de evidencia
├── hooks/        # errores y sesión expirada
├── services/     # gateway JSON y multipart
├── types/        # DTOs, estados y errores
└── utils/        # formato de estado, fecha y archivo
```

No se usan mocks, fixtures, datos demo ni éxito local.

## Verificación

### Estática

- Node `24.14.1`.
- `npm run typecheck` → `0`.
- `npm run verify:config` → `0`; configuración Expo válida (`3258` bytes).
- `npm run doctor` → `0`; `20/20` comprobaciones.
- `git diff --check` → `0`.

### API local de solo lectura

- Sin sesión: reportes de usuario, reportes de servicio, carga de evidencia y consulta propia respondieron `401`.
- Con una sesión de prueba autorizada, `GET /api/v1/reportes/mios/{id}` respondió `200` para un reporte preexistente y devolvió `tipo`, `estado`, `evidencias` y los campos documentados.
- `GET /api/v1/reportes/mios` sin ID respondió `500 ERROR_INTERNO` por ruta inexistente; se registra como BE-12 y no se interpreta como lista vacía.

### No verificado

- No se crearon reportes de cuenta/servicio ni evidencias autenticadas.
- No se probó la consolidación real ni el estado propio con datos nuevos.
- No se probó visualmente el modal con backend y archivos reales.
- La política de archivos D-07 y la consolidación D-12 siguen pendientes.

## Enlaces

- [F10 — Calificaciones, reseñas y verificación](trust.md)
- [F08 — Contratación y servicios](services.md)
- [F03 — Descubrimiento](discovery.md)
- [Solicitudes y decisiones backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
