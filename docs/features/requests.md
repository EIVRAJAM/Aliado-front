# F04 — Solicitudes de servicio (app móvil)

**Estado:** UI, validación, gateway y recorrido manual en emulador verificados contra backend local el 2026-11-13. La feature es funcional para crear, retomar, publicar, editar y cancelar solicitudes, con fotos opcionales, pero **no se declara cerrada ni aceptada**: la idempotencia server-side y la gestión de fotos existentes siguen bloqueadas por el contrato real del backend.

## Alcance móvil

Cubre SPEC-04 para el rol **Cliente**:

- Crear una solicitud completa y publicarla.
- Guardar un borrador parcial, retomarlo y publicarlo después.
- Listar las solicitudes propias con estado, categoría, zona, urgencia y fecha en **Inicio** para Cliente, con la misma lista, estados y acción de creación.
- Consultar el detalle propio.
- Editar una solicitud abierta (`BORRADOR` o `PUBLICADA`).
- Cancelar una solicitud abierta con confirmación explícita.
- Adjuntar fotos opcionales con progreso, límites y errores.
- Mostrar estados de carga, vacío, error, sesión expirada y acción en curso.

Quedan fuera: oportunidades para Prestador, matching horario, propuestas, contratación, historial de estados no expuesto por el contrato y superficies de Administrador.

## Fuente técnica del contrato

- OpenAPI local: `/home/abrahamc/Descargas/api-docs-ALIADO.json`.
- Contrato real: `SolicitudController`, `SolicitudDtos`, `SolicitudService`, `CatalogoController` y `CatalogoDtos` en `aliado-prb`.
- Requisitos: `aliado-prb/docs/specs/spec-04-gestion-solicitudes-servicio.md`.
- Tareas: `aliado-prb/docs/tasks/features/04-solicitudes-catalogo-storage.md`.

### Discrepancias OpenAPI / backend / plan

| Tema | OpenAPI o tarea | Backend real | Tratamiento en la app |
|---|---|---|---|
| Crear solicitud | `200` con `{ id, estado }` | `201` con `SolicitudResponse` completo | El cliente acepta cualquier 2xx y consume el body real. |
| Fotos al crear | La tarea muestra `fotos[]` en el body del `POST` | No acepta `fotos[]` en el JSON; usa `POST /{id}/fotos` multipart | La app crea primero la solicitud y luego sube las fotos al endpoint multipart. |
| Respuesta de ítem de catálogo | OpenAPI puede incluir `estado` | Categorías: `{ id, nombre }`; zonas: `{ id, nombre, coberturaGeografica }` | El cliente modela solo los campos reales. |
| Fotos en la solicitud | `fotos` como lista | Lista de `archivoKey` (strings), no de IDs de foto | La app cuenta las fotos, pero no puede previsualizar, reemplazar ni eliminar fotos existentes. |
| Subida de foto | `POST` multipart | `201 { id, archivoKey, orden }` | La app usa la respuesta para confirmar la carga y muestra una miniatura local. |
| Historial de estados | La tarea pide mostrarlo si el contrato lo prevé | `SolicitudResponse` no incluye historial | No se muestra historial; no se inventa. |
| Idempotencia | `Idempotency-Key` opcional, reintentos | Una clave UUID válida devuelve `500` porque `idempotency_keys.respuesta` es `jsonb` y se inserta como `varchar` | La app genera y conserva una clave por formulario, pero no la envía mientras el backend no corrija el fallo. |
| Errores | No documentados | `400`, `401`, `403`, `404`, `409`, `413`, `415` con `code` y `message` | El cliente mapea los códigos observados y muestra mensajes accionables. |

## Operaciones integradas

| Operación | Método y ruta | Uso en la app |
|---|---|---|
| Categorías activas | `GET /api/v1/catalogo/categorias` | Selector de categoría y nombres en lista/detalle. |
| Zonas activas | `GET /api/v1/catalogo/zonas` | Selector de zona y nombres en lista/detalle. |
| Crear | `POST /api/v1/solicitudes` | Crear borrador o solicitud publicada. |
| Listar propias | `GET /api/v1/solicitudes/mias` | Pantalla “Mis solicitudes”. |
| Detalle propio | `GET /api/v1/solicitudes/mias/{id}` | Detalle y edición. |
| Editar | `PUT /api/v1/solicitudes/{id}` | Edición de solicitudes abiertas. |
| Publicar | `POST /api/v1/solicitudes/{id}/publicar` | Retomar un borrador y publicarlo. |
| Cancelar | `POST /api/v1/solicitudes/{id}/cancelar` | Cancelación con confirmación. |
| Subir foto | `POST /api/v1/solicitudes/{id}/fotos` | Carga multipart con progreso. |

Los endpoints de reemplazo, eliminación y descarga de fotos existen en el backend, pero no se integran porque la solicitud no expone los IDs de foto necesarios.

## Límites de fotos

El backend aplica estas reglas, replicadas en el cliente:

- Máximo 10 fotos por solicitud.
- Máximo 5 MB por archivo.
- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`.
- Validación de firma MIME en el servidor.

La decisión **D-07** sigue abierta: estos límites son los observados en el backend, no una política de producto aprobada. **D-06** también sigue abierta: el backend local usa almacenamiento local; no hay proveedor S3-compatible productivo.

## Estructura

```text
src/features/requests/
├── components/        # estado, badge, tarjeta de solicitud y fotos
├── hooks/             # catálogos, lista, detalle y errores
├── screens/           # lista, formulario y detalle
├── services/          # RequestGateway y adaptador HTTP/multipart
├── types/             # solicitud, catálogo, fotos y errores
├── utils/             # formato, mensajes, visuales e idempotencia
├── validation/        # reglas de borrador y publicación
└── index.ts
```

La barra inferior no incluye `Solicitudes` como pestaña: la lista vive en **Inicio** para `CLIENTE`. `RequestForm` y `RequestDetail` se abren fuera de la barra para conservar jerarquía e historial. `RequestsBoard` compone Inicio con la lista completa y la acción **Nueva**. En el estado vacío se muestra únicamente **Publicar una solicitud** y se oculta **Nueva** de la barra para no duplicar la acción; durante carga o error la barra mantiene el acceso a crear. La lista vuelve a comprobar el rol y el backend exige `CLIENTE` en todas las rutas; la app no sustituye esa autorización.

## Flujos y estados

- **Crear y publicar sin fotos:** valida categoría, descripción, zona y urgencia, crea en estado `PUBLICADA` y navega al detalle.
- **Crear y publicar con fotos:** crea primero un `BORRADOR`, sube las fotos con progreso y luego publica. Si una carga falla, conserva el borrador y evita declarar éxito.
- **Guardar borrador:** permite datos parciales; el borrador no es visible para prestadores. Puede publicarse desde el detalle.
- **Editar:** precarga los datos reales; una solicitud publicada exige seguir completa y una solicitud en borrador admite cambios parciales.
- **Cancelar:** pide confirmación y deja la solicitud fuera de la visibilidad de prestadores.
- **Sesión expirada:** un `401` limpia la sesión y vuelve al acceso, igual que en F01/F02.
- **Datos transitorios:** el formulario conserva sus valores en memoria mientras la pantalla está abierta; no se persisten tokens ni formularios. No se declara éxito antes de la respuesta del servidor.
- **Resultado incierto:** si una creación, edición o carga de fotos termina por timeout, desconexión o error incierto, la app no reenvía el formulario automáticamente. Bloquea los campos, conserva los datos y muestra “No se pudo confirmar…”. Desde ahí se puede actualizar “Mis solicitudes” (la lista se refresca al abrirla) o, en edición, abrir el detalle. No se ofrece un botón para volver a crear de inmediato.
- **Conciliación de creación incierta:** antes de crear, la app intenta leer la lista propia; si la creación termina con un resultado incierto, vuelve a leerla una sola vez y busca una única solicitud nueva que coincida con categoría, zona, urgencia, descripción y estado deseados. Si existe exactamente una coincidencia, muestra “Revisar solicitud coincidente” y advierte que la coincidencia no garantiza que sea la misma operación. La conciliación solo usa `GET /solicitudes/mias`; no crea IDs de operación ni endpoints nuevos.
- **Límites de la conciliación:** la lista puede no reflejar el resultado todavía, puede no estar disponible, o pueden existir varias solicitudes nuevas parecidas. En esos casos no se concilia nada, no se declara ausencia de duplicados y el formulario permanece bloqueado. La única acción ofrecida es revisar/actualizar “Mis solicitudes”.
- **Sin garantía de idempotencia:** mientras el backend no procese `Idempotency-Key`, la app no presenta el reintento como seguro ni promete un único registro. La clave se conserva por formulario, pero no se envía. Si backend corrige el fallo y se activa `SERVER_IDEMPOTENCY_SUPPORTED`, un reintento de la misma pantalla reutilizaría la clave y una pantalla nueva generaría otra; ese caso exitoso no pudo verificarse contra el backend actual.

## Iteración visual

Referencia revisada: prototipo funcional web de ALIADO (vistas `ClienteSolicitudes`, `ClienteDetalleSolicitud` y `ClienteNuevaSolicitud`) y SPEC-04. Se tomó como referencia de jerarquía, composición y lenguaje visual, no su implementación ni sus datos simulados.

### Comparación breve antes/después

| Superficie | Antes | Después | Referencia del prototipo |
|---|---|---|---|
| Mis solicitudes | Tarjetas de texto casi idénticas, estado arriba a la izquierda y fecha arriba a la derecha; sin iconos ni acento por estado. | Barra de resumen con contador, actualizar y “Nueva”; tarjetas con acento de estado, categoría como eyebrow, descripción como título, metadatos con iconos y pie con fecha/fotos. | Tarjeta suave con categoría, título, estado arriba a la derecha, metadatos y acción “Nueva”. |
| Detalle | Estado y fecha, descripción y una tarjeta genérica de etiqueta/valor; nota interna sobre la vista previa. | Hero con acento de estado, categoría, descripción, chips de zona/urgencia y fecha; resumen 2×2 con iconos; acciones contextuales; estado cerrado sin acciones. | Tarjeta de detalle con estado, datos principales y acciones contextuales. |
| Formulario | Una sola tarjeta con campos apilados y selectores modales. | Secciones “¿Qué necesitas?”, “Zona y urgencia” y “Fotos”; categoría como chips, urgencia segmentada, acciones agrupadas. | Chips de categoría, urgencia segmentada, agrupación visual y acciones separadas. |

### Decisiones visuales confirmadas

- **Lista:** el estado se comunica con un badge suave y un acento lateral; la categoría funciona como eyebrow; la descripción ocupa el rol de título porque el contrato no expone un campo `titulo`; fecha y fotos quedan en el pie.
- **Detalle:** el hero concentra estado, categoría, descripción y metadatos; el resumen usa cuatro tiles; las acciones se separan por estado. Una solicitud cancelada o contratada no muestra acciones.
- **Formulario:** se usan chips de categoría, selector segmentado de urgencia y tarjetas de sección. La validación, el progreso de fotos, los errores y el estado de resultado incierto se conservan.
- **Iconografía:** se usa `@expo/vector-icons` (Ionicons) en lugar de caracteres Unicode para iconos de ubicación, fecha, urgencia, fotos, acciones y estados.
- **Mensajes:** se retiraron textos internos como “esta versión” o “queda pendiente”. La UI no promete previsualización, reemplazo o eliminación de fotos existentes; el bloqueo se mantiene en esta documentación.
- **Alcance:** no se añadieron campos, endpoints, propuestas ni historial. El título visual es la descripción existente; no se inventó un `titulo` de solicitud.

Las capturas de la revisión se guardaron fuera de Git en `/tmp/f04-visual-after-*.png`; incluyen lista, formulario, detalle publicado, borrador, cancelado y resultado incierto. Las capturas “antes” de referencia son `/tmp/f04-list.png`, `/tmp/f04-form.png` y `/tmp/f04-detail.png`.

## Verificación local

El 2026-11-13 se levantó el backend local, PostgreSQL aislado, Metro y el emulador Android. Se verificó:

- Inicio de sesión Cliente y entrada a “Mis solicitudes”.
- Carga de catálogos reales y lista de solicitudes propias.
- Validación de publicación sin categoría, descripción, zona ni urgencia.
- Publicación con foto: creación de borrador, subida multipart, publicación y detalle con `PUBLICADA` y 1 foto.
- Edición de descripción y urgencia, con actualización visible en el detalle.
- Cancelación con confirmación y detalle posterior en `CANCELADA`, sin acciones de edición.
- Guardado de borrador y publicación posterior desde el detalle.
- API: creación, lista, detalle, edición, subida/descarga de foto, publicación, cancelación y rechazo `400` de una publicación incompleta.
- Reintento con `Idempotency-Key` UUID válida: dos `POST` con la misma clave devolvieron `500` y el conteo de solicitudes subió de 8 a 10, confirmando que el backend crea el recurso pero falla al guardar la idempotencia (`respuesta` es `jsonb` y la entidad la envía como `varchar`). Los registros de prueba se cancelaron.
- UI con backend detenido: al intentar guardar, la app mostró “No se pudo confirmar si la solicitud se guardó”, bloqueó los campos y no mostró los botones de envío. El formulario conservó sus datos y ofreció actualizar “Mis solicitudes”; al restablecer el backend, la lista cargó correctamente.
- UI después del bloqueo: se verificó de nuevo la creación normal de un borrador y su cancelación; el flujo de éxito sigue funcionando cuando el servidor responde.
- Conciliación con el fallo real: se activó temporalmente el envío de `Idempotency-Key` para reproducir el `500` posterior a la creación. La app bloqueó el formulario, releyó la lista y mostró “Revisar solicitud coincidente”; el detalle abrió el borrador creado. La solicitud de prueba se canceló y la constante se restauró a `false`.
- UI con edición incierta: se abrió un borrador, se detuvo el backend y se intentó guardar. El formulario bloqueó los campos, conservó el cambio local y mostró “No se pudo confirmar si los cambios se guardaron”; ofreció “Ver solicitud” y actualizar “Mis solicitudes”, sin reenvío. Al restablecer el backend, el detalle mostró el estado real (el cambio no se había aplicado).
- Carga de fotos posterior a una creación o edición confirmada: si falla, la app usa el estado de solicitud guardada con resultado pendiente, no reintenta la carga automáticamente y dirige al detalle. No se indujo una caída exactamente durante la transferencia; ese caso se revisó en código y queda cubierto por el mismo bloqueo de reenvío.
- Flujo completo final: tras recargar el development build con `SERVER_IDEMPOTENCY_SUPPORTED=false`, se creó una solicitud con foto, se publicó, el detalle mostró `PUBLICADA` y 1 foto, y se canceló correctamente. Con ello se comprobó que la lectura base de conciliación no altera el camino exitoso.

No se registraron tokens ni contraseñas en esta documentación. Las solicitudes creadas durante la verificación se cancelaron; la cuenta local de prueba permanece activa.

## Decisiones y bloqueos

- **Idempotencia server-side bloqueada:** el backend falla al insertar una clave UUID en `idempotency_keys` (`jsonb` vs `varchar`) y aun así crea la solicitud. La app genera una clave por formulario y la conserva, pero no la envía; ante un resultado incierto bloquea el formulario y evita el reenvío silencioso. La constante `SERVER_IDEMPOTENCY_SUPPORTED` de `http-request-gateway.ts` queda en `false` hasta que backend corrija el fallo. No se cumple todavía F04-FE-04 ni el escenario de reintento sin duplicados.
- **Fotos existentes bloqueadas:** el detalle devuelve solo `archivoKey`; no hay IDs para llamar a reemplazar, eliminar o descargar. La app solo permite agregar fotos nuevas, muestra el conteo de existentes y miniaturas locales de la sesión actual; no simula acciones de reemplazo o eliminación ni presenta una galería persistente.
- **Historial no disponible:** no está en el contrato de respuesta; no se muestra.
- **D-03 sigue abierta:** no se implementa ventana temporal ni compatibilidad horaria.
- **D-06 y D-07 siguen abiertas:** almacenamiento local y límites de archivo observados, no política productiva aprobada.
- **API desplegada pendiente:** la verificación fue contra backend local.
- **E2E automatizados pendientes:** la evidencia es manual/API; no sustituye una suite E2E.
- **D-04 sin cambios:** la sesión sigue en memoria, sin persistencia de tokens.
