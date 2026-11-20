# F14 — Preferencias, historial, indicadores y actividad (app móvil)

**Estado:** frontend implementado contra los contratos reales de lectura y configuración. La lectura autenticada se revisó en el emulador con una sesión Prestador existente. La actualización de preferencias y la exportación implican mutaciones reales y no se ejecutaron. La exportación requiere reconstruir el development client por la incorporación de `expo-file-system`/`expo-sharing`.

## Alcance móvil

- Acceso desde **Mi perfil → Actividad y avisos** para `CLIENTE` y `PRESTADOR`.
- Preferencias de notificación por tipo y canal, mostrando los avisos obligatorios como no editables.
- Historial de trabajos paginado, con acceso al detalle de cada servicio.
- Exportación del historial completo a CSV y apertura del menú del sistema para guardarlo o compartirlo.
- Indicadores del Prestador mostrados desde el cálculo del backend, sin recalcularlos en la app.
- Actividad reciente ordenada por el backend.

No se agregaron datos de prueba ni se modificaron backend, migraciones o base de datos.

## Contratos reales utilizados

| Operación | Endpoint | Uso móvil |
|---|---|---|
| Preferencias | `GET /api/v1/preferencias/notificaciones` | Devuelve 5 tipos × `PUSH`/`EMAIL`; genera valores por defecto y marca `configurable`. |
| Actualizar preferencia | `PUT /api/v1/preferencias/notificaciones` | Body `{ tipoAviso, canal, habilitada }`; `AVISO_SEGURIDAD_CUENTA` no puede desactivarse (`409 AVISO_NO_CONFIGURABLE`). |
| Historial | `GET /api/v1/historial?pagina=&tamano=` | Devuelve un array de `{ id, estado, fechaContratacion }`, orden descendente; `tamano` máximo 100. |
| Crear exportación | `POST /api/v1/historial/exportaciones` | Devuelve `{ id, archivoKey, estado }`; el backend actual genera el CSV y responde `LISTA`. |
| Descargar exportación | `GET /api/v1/historial/exportaciones/{id}` | Devuelve el CSV autenticado; no hay URL pública. |
| Indicadores | `GET /api/v1/prestadores/mis-indicadores` | Solo Prestador; devuelve totales, reputación y cantidad de calificaciones calculados por backend. |
| Actividad | `GET /api/v1/actividad-reciente` | Devuelve hasta 20 eventos `{ tipo, resumen, fecha }` ordenados por el backend. |

## Comportamiento implementado

### Preferencias

- Agrupa por tipo de aviso y muestra `PUSH`/`EMAIL`.
- Los tipos marcados con `configurable=false` se muestran con la etiqueta **Obligatorio** y sus controles quedan bloqueados.
- Los cambios son optimistas y se revierten si el servidor los rechaza.
- `AVISO_NO_CONFIGURABLE`, validaciones, red y sesión expirada se muestran sin inventar un estado local exitoso.
- No se implementa push ni cambio de proveedor de correo; solo se persiste la preferencia contractual.

### Historial y exportación

- Paginación de 20 elementos con “Cargar más”; el contrato no expone total ni cursores.
- Solo aparecen servicios en los que participa la cuenta, según el backend.
- Cada elemento abre `ServiceDetail` con el `id` devuelto.
- La exportación usa el endpoint autenticado, escribe un CSV temporal en caché y abre `expo-sharing` para que el usuario elija guardar o compartir.
- La app no presenta el archivo como guardado hasta que el sistema abre el menú; no hay confirmación de que el usuario lo haya guardado.
- No se ofrece filtrado porque el contrato no lo soporta. La exportación incluye todo el historial actual, no solo la página visible.
- No hay idempotencia ni polling de exportación; cada reintento solicita una exportación nueva.

### Indicadores

- Solo Prestador; la app muestra los valores del backend.
- No calcula fórmulas, rangos ni subtotales localmente.
- Se advierte que la fórmula y el rango temporal definitivos están pendientes (D-15).
- La inclusión de servicios cancelados/moderados se acepta tal como la devuelve el backend.

### Actividad reciente

- Muestra los eventos `SERVICIO` y `NOTIFICACION` con su resumen y fecha.
- El contrato actual no incluye IDs de referencia, por lo que no se ofrecen enlaces navegables.
- No hay paginación en el contrato; el backend limita la respuesta a 20 eventos.

## Discrepancias registradas

- El historial devuelve un array sin total, página ni cursor; la app solo puede inferir “hay más” si la página tiene 20 elementos.
- El historial no acepta filtros, aunque la tarea frontend menciona filtros.
- `POST /historial/exportaciones` responde `201` en el controlador, mientras OpenAPI declara `200`; no hay endpoint para consultar el estado de una exportación.
- La exportación no recibe `Idempotency-Key` ni una clave de correlación.
- La actividad no expone IDs de servicio/notificación ni paginación, y no hay desempate documentado para eventos con la misma fecha.
- Los indicadores no exponen `formulaVersion`, periodo ni criterio de inclusión; D-15 sigue abierta.
- OpenAPI no describe los roles/errores específicos de estos endpoints.

Las brechas que requieren contrato backend se registran en [BE-17, BE-18 y BE-19](../backend-requests/BACKEND_CORRECTION_REQUESTS.md).

## Permisos y privacidad

- La app no envía IDs de usuario ni de propietario; las consultas usan la sesión autenticada.
- El historial, la exportación y la actividad dependen del aislamiento del backend.
- No se almacenan tokens ni archivos de historial en almacenamiento persistente; el CSV se escribe en caché temporal para compartirlo.
- La UI de indicadores solo se registra para `PRESTADOR`; el endpoint también valida el rol.
- No se muestran datos de terceros ni archivos públicos.

## Límites y decisiones abiertas

- **D-15 abierta:** fórmulas, periodo de indicadores, formato/límites de exportación y snapshot.
- **Sin filtros de historial:** no se implementan filtros locales que parezcan equivalentes a filtros de servidor.
- **Sin enlaces de actividad:** faltan referencias en el DTO.
- **Sin prueba de mutaciones:** no se cambió ninguna preferencia ni se creó una exportación real.
- **Lectura visual validada, escritura pendiente:** las pantallas de lectura se revisaron en el emulador con una sesión Prestador. No se activaron switches ni se generó una exportación. `expo-file-system` y `expo-sharing` se añadieron como dependencias directas y requieren reconstruir el development client para probar la exportación real.
- **Vista Cliente no revisada:** el mismo hub está registrado para Cliente, pero la sesión disponible era Prestador; no se creó una cuenta para probarlo.

## Validación

### Estática

- Node `24.14.1`.
- `npm run typecheck` → `0`.
- `npm run verify:config` → `0`; Expo Config válido (`3403` bytes).
- `npm run doctor` → `20/20`.
- `git diff --check` → `0`.
- `npx expo export --platform android` → bundle correcto (1124 módulos).
- Dependencias añadidas: `expo-file-system` y `expo-sharing`; el config plugin de sharing actualizó `app.json`.

### Gateway

Nueve pruebas con `node:test`:

- Preferencias y aviso obligatorio.
- Actualización por tipo/canal y `409 AVISO_NO_CONFIGURABLE`.
- Historial con página/tamaño, orden y array vacío.
- Exportación `LISTA` y descarga CSV autenticada.
- `409 DESCARGA_NO_LISTA`.
- Indicadores y actividad.
- `401` como sesión expirada.

Resultado: `9/9`. Evidencia en `/tmp/aliado-f14-validation/gateway-tests.log`.

### API local sin sesión

- `GET /preferencias/notificaciones` → `401`.
- `GET /historial` → `401`.
- `GET /historial/exportaciones/{id}` → `401`.
- `GET /prestadores/mis-indicadores` → `401`.
- `GET /actividad-reciente` → `401`.

### Lectura autenticada en emulador

Se utilizó una sesión Prestador ya iniciada; no se creó ninguna cuenta. Se verificó:

- Acceso desde Mi perfil a **Actividad y avisos**.
- Historial con un servicio y acceso a su detalle.
- Preferencias con los cinco tipos, dos canales y el tipo de seguridad marcado como obligatorio.
- Indicadores reales del backend: total 1, en curso 1, finalizados 0, reputación 0.0, calificaciones 0.
- Actividad reciente con dos eventos ordenados.
- Capturas `f14-00..06.png` en `/tmp/aliado-f14-validation/`.

No se cambió ninguna preferencia ni se generó una exportación. La base conservó `preferencias_notificacion=0`, `descargas_historial=0`, `servicios_contratados=3` y no se alteraron datos.

## Fuera de alcance

Push real, proveedor de correo, exportación a formatos distintos de CSV, filtros no contratados, navegación desde actividad sin referencias, fórmulas locales, backend y base de datos.

## Enlaces

- [F01 — Acceso e identidad](auth.md)
- [F09 — Notificaciones](notifications.md)
- [F13 — Formalización](formalization.md)
- [Solicitudes backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
- [SPEC-14](../../../ALIADO-backend/docs/specs/spec-14-preferencias-historial-indicadores.md)
- [Tarea F14](../../../ALIADO-backend/docs/tasks/features/14-preferencias-historial.md)
