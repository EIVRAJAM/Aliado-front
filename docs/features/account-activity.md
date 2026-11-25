# F14 — Preferencias, historial, indicadores y actividad (app móvil)

**Estado:** frontend implementado contra los contratos reales. La pestaña **Actividad** reúne historial, actividad reciente e indicadores del Prestador; **Preferencias de notificación** vive en Mi perfil. Lectura, exportación CSV, menú nativo y estado de éxito fueron validados en el emulador con una sesión Prestador. La descarga requiere iniciar el backend con `ALIADO_STORAGE_DIR` absoluto mientras BE-20 no esté corregido; no se modificó el código backend.

## Alcance móvil

- Pestaña inferior **Actividad** para `CLIENTE` y `PRESTADOR`; reúne historial y actividad reciente, e indicadores para Prestador.
- **Preferencias de notificación** accesibles desde **Mi perfil**, como ajuste de cuenta.
- Actividad muestra un resumen de historial con acceso al historial completo y al detalle de cada servicio.
- Exportación del historial completo a CSV desde el historial y apertura del menú del sistema para guardarlo o compartirlo.
- Indicadores del Prestador agrupados en un único resumen: total, estados, reputación y cantidad de calificaciones, desde el cálculo del backend y sin recalcularlos.
- Actividad reciente ordenada por el backend.

No se modificó el esquema del backend ni su configuración. La prueba autorizada agregó una exportación real de la cuenta Prestador; no se crearon cuentas, servicios, preferencias ni contenido de prueba.

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

### Pantalla Actividad

- Es una pantalla de contenido, no un menú de accesos.
- Cliente: actividad reciente y acceso al historial completo.
- Prestador: resumen agrupado de indicadores, actividad reciente y acceso al historial completo.
- Los indicadores se presentan juntos: total de servicios con estados y reputación con cantidad de calificaciones. No se muestran gráficos, tendencias, periodos ni métricas inventadas.
- El historial completo conserva paginación y exportación CSV; la actividad no duplica el historial completo.
- Cada sección mantiene carga, error, reintento, vacío y sesión expirada mediante los hooks F14 existentes.

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
- La prueba visual de 2026-11-20 creó una exportación y abrió el menú nativo de Android. Se cerró sin compartir ni guardar una copia permanente. La descarga funcionó con `ALIADO_STORAGE_DIR` absoluto; con la configuración relativa por defecto el backend devuelve `ARCHIVO_NO_ENCONTRADO` (BE-20).
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
- La raíz de almacenamiento relativa no se normaliza antes de `Path.startsWith`; con `./storage` la descarga de un archivo existente devuelve `404 ARCHIVO_NO_ENCONTRADO`. Confirmado como BE-20.

Las brechas que requieren contrato backend se registran en [BE-17 a BE-20](../backend-requests/BACKEND_CORRECTION_REQUESTS.md).

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
- **Exportación validada con entorno absoluto:** el 2026-11-20 se creó una exportación desde la app y el menú nativo se abrió; no se compartió ni se guardó una copia permanente. La fila quedó `LISTA`.
- **BE-20 abierto:** la configuración por defecto `./storage` no permite leer archivos existentes por la comparación de rutas. No se modificó el backend; la prueba usó una ruta absoluta.
- **Preferencias sin mutación:** no se activaron switches ni se modificó ninguna preferencia.
- **Vista Cliente:** la pestaña Actividad no mostró Indicadores; no se probaron mutaciones de Cliente.

## Validación

### Estática

- Node `24.14.1`.
- `npm run typecheck` → `0`.
- `npm run verify:config` → `0`; Expo Config válido (`3403` bytes).
- `npm run doctor` → `20/20`.
- `git diff --check` → `0`.
- `npx expo export --platform android` → bundle correcto (1125 módulos).
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

Se utilizó una sesión Prestador ya iniciada; no se creó una cuenta nueva. Se verificó:

- Acceso a la pestaña **Actividad**; **Preferencias de notificación** se abre desde Mi perfil.
- Historial con un servicio y acceso a su detalle.
- Preferencias con los cinco tipos, dos canales y el tipo de seguridad marcado como obligatorio.
- Indicadores reales del backend: total 1, en curso 1, finalizados 0, reputación 0.0, calificaciones 0.
- Actividad reciente con dos eventos ordenados en la pestaña Actividad.
- Capturas `f14-00..06.png` en `/tmp/aliado-f14-validation/`.

### Exportación CSV en emulador

- Se pulsó **Exportar todo mi historial** una sola vez.
- El backend creó una exportación `LISTA` y la descarga se completó.
- Android abrió el menú nativo de compartir con un archivo CSV; se cerró con Atrás sin compartir ni guardar una copia permanente.
- La app mostró el estado de éxito. No se repitió el POST ni se borraron exportaciones.
- Conteo de exportaciones: 1 antes, 2 después; ambas `LISTA`. No se expusieron IDs, claves ni contenido.
- La prueba se hizo con `ALIADO_STORAGE_DIR` absoluto. Con `./storage`, el backend devuelve `ARCHIVO_NO_ENCONTRADO` por BE-20.

### Reorganización de navegación 2026-11-25

- Se verificó la pestaña **Actividad** con sesión Prestador: resumen agrupado, actividad reciente, historial y acceso al historial completo.
- Se verificó **Preferencias de notificación** desde Mi perfil y la ausencia de la tarjeta **Actividad y avisos**.
- Se conservaron **Agenda** y **Perfil profesional**. La cuenta visual no tenía servicios ni actividad; por eso el estado mostrado fue vacío/cero.
- No se activaron switches, no se exportó CSV y no se mutaron datos.
- Capturas en `/tmp/aliado-f14-activity-visual/`.

No se modificó el backend; la única fila añadida fue la exportación solicitada. No se cambió ninguna preferencia.

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
