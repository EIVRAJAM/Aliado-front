# Solicitudes de corrección y contrato para backend

Este documento consolida los defectos del backend y las brechas de contrato que afectan la app móvil. Está dirigido a preparar una revisión con el equipo backend; **las solicitudes aún no se han enviado ni aprobado**. El frontend se adapta al backend entregado y no modifica su código, base de datos ni contratos.

## Resumen

| ID | Feature | Tipo | Solicitud | Estado |
|---|---|---|---|---|
| BE-01 | F05 | Defecto de persistencia | Corregir el mapeo de `datos_generales` a PostgreSQL `jsonb` al crear el perfil profesional. | Corregido en rama backend; pendiente integración/despliegue |
| BE-02 | F04 | Defecto de persistencia e idempotencia | Corregir el guardado y la reproducción de respuestas en `idempotency_keys.respuesta`. | Bloqueante para reintentos seguros, pendiente de comunicar |
| BE-03 | F04 | Respuesta incompleta | Exponer identificador estable de cada foto en consultas de solicitud. | Pendiente de contrato, pendiente de comunicar |
| BE-04 | F05 | Endpoint de lectura faltante | Añadir lectura autenticada del perfil profesional propio. | Implementado en rama backend; pendiente integración/despliegue |
| BE-05 | F05 | Definición de contrato | Acordar y documentar campos, tipos y validaciones de `datosGenerales`. | Contrato mínimo implementado en rama backend; pendiente integración/despliegue |
| BE-06 | F04/F05 | Documentación API | Alinear OpenAPI con requests, respuestas y códigos HTTP observados en el backend. | Pendiente de comunicar |
| BE-07 | F08 | Endpoint de lectura faltante | Añadir un listado autenticado y paginable de los servicios propios del Cliente o Prestador. | Pendiente de comunicar |
| BE-08 | F10 | Endpoint de lectura faltante | Exponer la calificación propia de un servicio o incluirla en el detalle para poder detectar duplicados y recuperar el `calificacionId` de una reseña pendiente. | Pendiente de comunicar |
| BE-09 | F10/F11 | Contrato verificado | Confirmar el uso de `POST /reportes/{id}/evidencias` para reportes de reseña y documentar la política de archivos. | Contrato existente; pendiente prueba autenticada y D-07 |
| BE-10 | F10 | Atomicidad de escritura | Permitir registrar calificación y reseña en una sola operación transaccional, o exponer recuperación suficiente para completar una reseña pendiente. | Pendiente de comunicar |
| BE-11 | F10 | Endpoint de lectura faltante | Exponer el historial autenticado de calificaciones y reseñas propias del Cliente, con paginación y orden descendente. | Pendiente de comunicar |
| BE-12 | F11 | Endpoint de lectura faltante | Añadir un listado autenticado de reportes propios para recuperar referencias y estados después de cerrar el modal. | Pendiente de comunicar |
| BE-13 | F11 | Idempotencia de evidencia | Añadir `Idempotency-Key` o un identificador de carga correlacionable para evitar evidencias duplicadas cuando se pierde la respuesta. | Pendiente de comunicar |
| BE-14 | F12 | Error de sesión bloqueada | Distinguir una sesión válida de una cuenta bloqueada (`403 CUENTA_BLOQUEADA`) en lugar de devolver `401 NO_AUTENTICADO`. | Pendiente de comunicar |
| BE-15 | F12/F01 | Rechazo de Administrador en login móvil | Rechazar el rol `ADMINISTRADOR` antes de cerrar sesiones previas cuando el login indique cliente móvil. | Pendiente de comunicar |
| BE-16 | F13 | Documentación API | Alinear OpenAPI de formalización con roles, arrays, `404 SIN_PROGRESO`, estado de enlaces y obligatoriedad real de `valor`. | Pendiente de comunicar |
| BE-17 | F14 | Historial paginado/filtros | Añadir metadatos de paginación y filtros de historial, o documentar que el cliente solo puede usar “cargar más” sin total. | Pendiente de comunicar |
| BE-18 | F14 | Actividad reciente | Exponer referencias navegables, paginación y un desempate estable para eventos de actividad. | Pendiente de comunicar |
| BE-19 | F14 | Exportación y contrato de indicadores | Documentar el ciclo de exportación, el `201` real, la entrega CSV y la ausencia de estado/ventana/fórmula de indicadores. | Pendiente de comunicar |
| BE-20 | F14 | Defecto de almacenamiento | Normalizar la raíz de `ALIADO_STORAGE_DIR` antes de compararla con la ruta del archivo; la raíz relativa `./storage` provoca un falso `ARCHIVO_NO_ENCONTRADO`. | Defecto confirmado; pendiente de comunicar |

## Solicitudes detalladas

### BE-01 — Persistencia JSONB del perfil profesional

**Evidencia observada:** al enviar `POST /api/v1/perfiles`, el backend respondió `500 ERROR_INTERNO` con SQLState `42804`: `datos_generales` es `jsonb`, pero Hibernate intentó insertar un valor `character varying`. La consulta posterior de vista previa devolvió `404` y la base quedó sin perfil profesional para la cuenta probada.

El código revisado declara `PerfilProfesionalEntity.datosGenerales` como `String`; el mapper serializa el mapa a JSON string. La columna `datos_generales` de PostgreSQL es `JSONB`. El error también afecta potencialmente las mutaciones que persistan este campo, por lo que se debe validar el ciclo completo, no solo el alta.

**Solicitar al backend:** corregir la correspondencia ORM/JDBC entre el campo Java y `jsonb`, preservando el contrato JSON del endpoint. No cambiar el campo a texto ni exigir al móvil que envíe JSON como string para ocultar el problema de tipos.

**Motivo:** el Prestador no puede completar la creación inicial de F05; el endpoint existente falla antes de persistir el perfil. El flujo de reintento no puede recuperar una creación que el backend rechazó.

**Criterios de aceptación propuestos:**

- `POST /api/v1/perfiles` con categorías y zonas activas responde `201` y persiste el perfil.
- `datosGenerales` omitido o vacío se almacena como JSON válido según el contrato.
- Lectura posterior devuelve el mismo objeto JSON sin doble serialización ni pérdida de tipos admitidos.
- Pruebas de integración cubren creación y actualización del campo contra PostgreSQL, incluyendo la migración vigente.

**Comportamiento frontend corregido:** tras el `500` y la consulta de vista previa `404`, la app muestra “Perfil no creado” y explica que el servidor falló al crear el perfil, sin mostrar detalles SQL. Conserva las categorías y zonas, no repite el POST automáticamente y solo ofrece un reintento manual explícito. Si la consulta de reconciliación no puede completarse, muestra “Resultado pendiente” sin sugerir un nuevo envío.

**Fuentes:** `aliado-prb/src/main/java/.../perfiles/infrastructure/persistence/entity/PerfilProfesionalEntity.java`, mapper de persistencia, `V3` y registro del intento local del 2026-11-13. El reporte de diagnóstico encontró cero filas de perfil después del fallo.

**Actualización 2026-11-24:** la rama `feature/mvp-backend-corrections` incluye la persistencia JSONB corregida y pruebas de integración; la app podrá crear el perfil al integrar/desplegar esa rama.

### BE-02 — Persistencia y replay de claves de idempotencia

**Evidencia observada:** `idempotency_keys.respuesta` es `JSONB` en la migración V1 y la entidad `IdempotencyKeyEntity.respuesta` es `String`. La integración de F04 observó un `500` al enviar una clave UUID válida porque se intenta guardar `varchar` en esa columna. El defecto puede ocurrir después de que la operación de negocio haya creado la solicitud.

**Solicitar al backend:** corregir el mapeo de la respuesta JSON y garantizar que la clave y el resultado de negocio se registren de forma transaccional y puedan reproducirse en una repetición de la misma operación.

**Motivo:** el móvil mantiene deshabilitado el envío de `Idempotency-Key` para no activar el fallo. Ante una desconexión con resultado incierto, no puede reintentar de forma segura y existe riesgo de duplicar solicitudes.

**Criterios de aceptación propuestos:**

- Primera petición con clave válida ejecuta la operación y persiste su respuesta.
- Repetición de la misma clave y operación devuelve el resultado original sin crear un segundo recurso.
- La prueba cubre fallo antes y después de persistir el recurso y verifica que no quede un resultado parcial incoherente.
- Se documentan alcance, expiración, aislamiento por usuario y códigos de conflicto para reutilización incorrecta de claves.

**Fuentes:** `aliado-prb/src/main/resources/db/migration/V1__identidad_perfil_idempotencia.sql`, `IdempotencyKeyEntity` y `docs/features/requests.md` de este repositorio.

### BE-03 — Identificadores de fotos de solicitudes

**Evidencia observada:** `SolicitudResponse.fotos` devuelve una lista de `archivoKey` (`List<String>`), mientras que la respuesta de carga `FotoResponse` tiene `id`, `archivoKey` y `orden`. El backend dispone de operaciones para reemplazar, eliminar o descargar una foto, pero la app no recibe en las consultas el ID que esas operaciones requieren.

**Solicitar al backend:** devolver para cada foto un objeto con identificador estable, clave de archivo y orden en las respuestas de detalle/listado, o proporcionar una operación de lectura equivalente que permita obtener esos datos.

**Motivo:** sin IDs la app no puede mostrar o gestionar fotos que ya existían antes de la sesión actual; solo puede contar esas fotos y operar sobre las miniaturas locales recién cargadas.

**Criterios de aceptación propuestos:**

- Las respuestas propias de solicitud exponen `id`, `archivoKey` y `orden` para cada foto.
- Las operaciones de reemplazo/eliminación validan propiedad de la solicitud y de la foto.
- OpenAPI documenta la forma nueva y el comportamiento para solicitudes sin fotos.

**Fuentes:** `SolicitudDtos.SolicitudResponse`, `SolicitudDtos.FotoResponse`, endpoints del controlador de solicitudes y `docs/features/requests.md`.

### BE-04 — Lectura del perfil profesional propio

**Evidencia observada:** existen `PUT /api/v1/perfiles/mio` y mutaciones que devuelven `PerfilResponse`, pero no existe `GET /api/v1/perfiles/mio`. La vista previa pública no contiene IDs de categorías/zonas, experiencia, portafolio ni compromisos.

**Solicitar al backend:** añadir `GET /api/v1/perfiles/mio`, restringido a `PRESTADOR`, que devuelva el perfil propio completo con una representación estable y documentada.

**Motivo:** después de cerrar/reabrir la app o cambiar de pantalla, el móvil no puede hidratar el estado editable ni mostrar experiencia, portafolio o disponibilidad configurada. La vista previa pública no sustituye la lectura de propietario.

**Criterios de aceptación propuestos:**

- Devuelve `PerfilResponse` para el Prestador dueño del perfil y `404` cuando aún no existe.
- Incluye IDs de categorías y zonas, datos generales, experiencias, portafolio, disponibilidades y compromisos según las reglas de privacidad.
- No permite leer perfiles ajenos y devuelve `401`/`403` con semántica documentada.
- OpenAPI y pruebas de contrato reflejan la respuesta.

Esto es una ampliación necesaria para completar el cliente, no el defecto que causó el `500` del alta.

**Actualización 2026-11-24:** `GET /api/v1/perfiles/mio` está implementado en la rama `feature/mvp-backend-corrections`; el frontend lo usa para hidratar la descripción y el estado del perfil. Falta integrar y desplegar la rama.

### BE-05 — Esquema de `datosGenerales`

**Estado:** contrato mínimo definido e implementado en `ALIADO-backend` rama `feature/mvp-backend-corrections` (commit `d6e27c4`). No está integrado en `develop` ni desplegado.

**Campo del MVP:**

| Clave | Tipo | Obligatorio | Validación | Público |
|---|---|---|---|---|
| `descripcion` | string | No | Recortado; vacío/null elimina; máximo 1000 caracteres | Sí |

**Justificación:** es una presentación libre del Prestador y no duplica categorías, zonas, experiencia, portafolio, disponibilidad ni agenda. No se incluye `anosExperiencia`; la experiencia conserva su operación propia.

**Comportamiento:** en escrituras nuevas se ignoran claves desconocidas. En edición, las claves heredadas se conservan pero no forman parte del contrato ni se publican. La vista pública solo expone `descripcion`; teléfono, correo, dirección exacta y documentos quedan excluidos.

**Frontend:** la creación y edición de la descripción están implementadas en la rama `feature/f05-be05-datos-generales`, pendientes de integrar junto con la rama backend. No se añaden otros campos ni se modifica SPEC-05.

**Contrato real:** `DatosGeneralesRequest/Response` en OpenAPI, con `descripcion` opcional y `maxLength: 1000`. El request/response es tipado; el antiguo `Map<String,Object>` ya no forma parte del contrato móvil.

### BE-06 — Sincronización OpenAPI con el backend real

**Evidencia observada:** se han documentado diferencias entre OpenAPI/tareas y las respuestas reales, entre ellas `201` frente a `200`, el cuerpo de `POST /api/v1/perfiles`, el multipart de portafolio, la respuesta de creación de agenda y la forma de las fotos de solicitudes.

**Solicitar al backend:** actualizar OpenAPI para que cada operación refleje el request, response, multipart, status codes, autenticación, roles y errores que realmente soporta. Publicar la especificación corregida desde el mismo código desplegable.

**Motivo:** el cliente móvil necesita un contrato único y reproducible para implementar y validar integración sin inferir DTOs desde controladores.

**Criterios de aceptación propuestos:** OpenAPI pasa validación, sus ejemplos coinciden con pruebas de contrato y se versiona junto al backend.

### BE-07 — Listado de servicios propios

**Evidencia observada:** el backend expone `GET /api/v1/servicios/{id}`, transiciones, historial y mensajes, pero no una operación para que Cliente o Prestador consulten los servicios en los que participan. `ServicioJpaRepository` ya contiene `findByUsuario(UUID, Pageable)`, pero no existe un controlador ni una ruta HTTP que lo publique. OpenAPI tampoco incluye un listado de servicios.

**Solicitar al backend:** exponer una consulta autenticada y paginable (por ejemplo, `GET /api/v1/servicios/mios`, nombre a acordar) que devuelva solo los servicios donde el usuario autenticado sea `clienteId` o `prestadorId`, con datos suficientes para abrir el detalle existente.

**Motivo:** actualmente la app móvil solo conserva el `servicioId` al aceptar una propuesta o al abrir un aviso de servicio. Al salir de ese contexto no hay forma contractual de recuperar el servicio; el usuario no puede volver a consultar su estado, historial o mensajes desde la app.

**Criterios de aceptación propuestos:**

- La operación exige sesión y devuelve únicamente servicios del usuario autenticado; un actor ajeno no puede listar ni inferir servicios de terceros.
- Funciona para ambos roles (`CLIENTE` y `PRESTADOR`) sin exponer contacto ni datos privados.
- Incluye al menos `id`, `solicitudId`, `propuestaId`, `estado`, `fechaContratacion` y la información mínima para abrir `GET /servicios/{id}`.
- Define el tratamiento de estados y un orden estable; si se permite filtrar por estado, el parámetro y sus valores deben quedar documentados.
- Si se pagina, define parámetros, metadatos de página, orden estable y tamaño máximo; si no, justifica el límite y el comportamiento con volúmenes del piloto.
- Los errores `401`/`403`, el aislamiento por participante y la semántica de la respuesta quedan reflejados en OpenAPI y en pruebas de contrato.

**Comportamiento frontend actual:** no inventa un listado; mantiene el `servicioId` en el contexto de aceptación o lo obtiene de avisos existentes. La ausencia de esta operación está documentada en F08.

### BE-08 — Lectura de la calificación propia por servicio

**Evidencia observada:** `GET /api/v1/servicios/{id}` devuelve estado, solicitud y propuesta aceptada, pero no informa si el servicio ya tiene calificación ni expone el `calificacionId`. Tampoco existe una operación móvil para consultar la calificación propia del servicio. El único aviso disponible es el `409 YA_CALIFICADO` al intentar calificar de nuevo.

**Solicitar al backend:** incluir en el detalle del servicio, para el Cliente propietario, un resumen opcional de su calificación (`id`, `valor`, si tiene reseña) o exponer una lectura equivalente, por ejemplo `GET /api/v1/servicios/{id}/calificacion`.

**Motivo:** después de salir de la pantalla, el Cliente no puede saber si ya calificó ni recuperar el `calificacionId` para publicar una reseña pendiente. La UI actual no puede ofrecer un camino seguro para continuar una reseña después de un cierre de pantalla.

**Criterios de aceptación propuestos:**

- El propietario del servicio puede consultar si existe calificación y su identificador sin acceder a calificaciones ajenas.
- La respuesta no expone datos de otros Clientes ni servicios.
- El detalle mantiene compatibilidad con el contrato existente o la nueva operación queda documentada en OpenAPI.
- Pruebas cubren servicio sin calificación, calificado, ajeno y no finalizado.

**Comportamiento frontend actual:** la app muestra el formulario al entrar a un servicio `FINALIZADO` y maneja el `409` con un mensaje claro; no afirma detectar duplicados ni permite recuperar una reseña después de salir.

### BE-09 — Evidencia en reporte de reseña

**Evidencia observada:** el backend real expone `POST /api/v1/reportes/{id}/evidencias` para cualquier reporte propio abierto, incluido un reporte de reseña creado en F10. Devuelve `201 { id, archivoKey, tipoContenido }`. F11 ya usa esa ruta y la UI no ofrece adjuntos antes de confirmar el `reporteId`.

**Solicitar al backend:** confirmar que el endpoint genérico es el contrato definitivo para evidencia de reseñas, documentar la autorización y mantenerlo estable. La selección de MIME, tamaño y cantidad sigue pendiente en D-07.

**Motivo:** F10 no debe duplicar un endpoint de evidencia específico de reseña; el contrato genérico de reportes es suficiente si se confirma su estabilidad.

**Criterios de aceptación propuestos:** OpenAPI refleja el DTO real; la política D-07 queda aprobada; pruebas cubren reporte propio, reporte cerrado, archivo inválido y acceso ajeno.

**Comportamiento frontend actual:** después de crear el reporte, `ReportEvidenceSection` permite seleccionar un archivo y reintentar la carga sin volver a crear el reporte. No se ha validado una carga autenticada durante esta implementación.

### BE-10 — Atomicidad de calificación y reseña

**Evidencia observada:** el backend registra la calificación con `POST /api/v1/servicios/{id}/calificacion` y la reseña con `POST /api/v1/calificaciones/{id}/resena` en operaciones separadas. El flujo móvil exige ambos campos antes de comenzar, pero si la primera operación responde correctamente y la segunda falla o la app se cierra, la calificación queda guardada sin reseña y el cliente no puede reconstruir el `calificacionId`.

**Solicitar al backend:** definir una operación atómica que reciba `valor` y `texto`, o garantizar un mecanismo de recuperación que permita obtener la calificación propia y completar la reseña pendiente. La solicitud BE-08 cubre la lectura mínima; BE-10 cubre la consistencia de la escritura.

**Motivo:** el requisito de reseña obligatoria es aplicable solo al cliente móvil. No puede presentarse como garantía de que calificación y reseña quedaron persistidas juntas, ni impedir que clientes API externos creen únicamente la calificación.

**Criterios de aceptación propuestos:**

- Una operación atómica confirma calificación y reseña juntas o no persiste ninguna.
- Alternativamente, la lectura de la calificación propia permite recuperar el `calificacionId` y el estado de la reseña.
- La semántica de duplicados y conflictos queda documentada y probada bajo concurrencia.
- La UI móvil puede reintentar solo la parte pendiente sin duplicar la calificación.

**Comportamiento frontend actual:** exige ambos campos, conserva el `calificacionId` y el texto en memoria si falla la reseña, y permite reintentar únicamente la reseña. Al salir de la pantalla se pierde ese estado, por lo que no se promete recuperación.

### BE-11 — Historial de calificaciones y reseñas del Cliente

**Evidencia observada:** F10 puede crear calificaciones y reseñas, pero no existe una operación autenticada para que el Cliente consulte las suyas. `GET /api/v1/calificaciones/mias` no está implementado. En el backend actual una ruta inexistente se resuelve como `500 ERROR_INTERNO`/`NoResourceFoundException`; no se acepta como contrato ni se corrige desde el móvil.

**Solicitar al backend:** definir y exponer una operación autenticada, propuesta como `GET /api/v1/calificaciones/mias?pagina=0&tamano=20`, que devuelva solo las calificaciones del Cliente autenticado. No debe aceptar un `clienteId` arbitrario ni permitir consultar datos de otros Clientes.

**DTO de respuesta propuesto — pendiente de confirmación:**

```json
{
  "items": [
    {
      "calificacionId": "uuid",
      "servicioId": "uuid",
      "valor": 5,
      "fechaCalificacion": "OffsetDateTime",
      "resena": {
        "id": "uuid",
        "texto": "texto",
        "fechaCreacion": "OffsetDateTime"
      },
      "servicio": {
        "descripcion": "texto o null",
        "categoria": "nombre o null",
        "zonaAproximada": "nombre o null"
      },
      "prestador": {
        "id": "uuid o null",
        "nombrePublico": "texto o null"
      }
    }
  ],
  "pagina": 0,
  "tamano": 20,
  "totalElementos": 1,
  "totalPaginas": 1
}
```

`resena`, `servicio` y `prestador` pueden ser `null` si el backend no dispone del dato. El frontend no deriva nombres de Prestador ni rellena campos ausentes. Si `prestador` incluye identidad pública, se mostrará tal como llegue.

**Requisitos solicitados:**

- Autenticación de Cliente y aislamiento estricto por identidad; sin parámetro de propietario.
- `calificacionId`, `servicioId`, `valor`, `fechaCalificacion`, reseña opcional (`id`, `texto`, `fechaCreacion`) y datos mínimos del servicio.
- `pagina` y `tamano` con validación; orden descendente por `fechaCalificacion`.
- Lista vacía como `200` con `items: []`, no `404`.
- `401` para sesión ausente/expirada, `403` para rol no autorizado y errores documentados.
- Pruebas de aislamiento entre dos Clientes y de orden/paginación.

**Contrato del frontend:** el parser de `HttpTrustGateway.getMyRatings` queda aislado para absorber cambios de nombre o forma del DTO. El 404, o el 500 de ruta inexistente del backend actual, se presenta como “historial no disponible”; no se interpreta como lista vacía. Cuando BE-11 exista, retirar la compatibilidad con el 500 de `NoResourceFoundException`.

**Estado actual:** la pantalla está implementada y conectada a la ruta propuesta, pero no puede mostrar historial real mientras falte BE-11. No se usan mocks, almacenamiento local ni reseñas públicas como sustituto.

### BE-12 — Listado de reportes propios

**Evidencia observada:** existe `GET /api/v1/reportes/mios/{id}` para consultar un reporte propio por ID, pero no una operación que liste los reportes del usuario. La app puede conservar el `reporteId` mientras el modal está abierto; al cerrarlo pierde la referencia y no puede recuperar el estado después.

**Solicitar al backend:** exponer una lectura autenticada y paginada de reportes propios, propuesta como `GET /api/v1/reportes/mios?pagina=0&tamano=20`, sin aceptar un `reportanteId` arbitrario.

**Impacto frontend:** sin este listado no se puede ofrecer un historial de reportes, recuperar evidencias/estado tras cerrar el modal ni reintentar una evidencia de un reporte anterior.

**DTO propuesto — pendiente de confirmación:**

```json
{
  "items": [
    {
      "id": "uuid",
      "tipo": "USUARIO | SERVICIO | RESENA",
      "objetivoId": "uuid",
      "motivo": "texto",
      "estado": "PENDIENTE | EN_REVISION | RESUELTO | DESCARTADO",
      "fechaCreacion": "OffsetDateTime",
      "evidencias": [
        { "id": "uuid", "archivoKey": "clave", "tipoContenido": "MIME" }
      ]
    }
  ],
  "pagina": 0,
  "tamano": 20,
  "totalElementos": 1,
  "totalPaginas": 1
}
```

**Criterios de aceptación propuestos:** autenticación y aislamiento por reportante; paginación y orden descendente por `fechaCreacion`; lista vacía como `200 items: []`; `401/403` documentados; pruebas entre dos usuarios. El frontend no implementa este listado hasta que exista.

### BE-13 — Idempotencia/correlación de cargas de evidencia

**Evidencia observada:** `POST /api/v1/reportes/{id}/evidencias` acepta únicamente el multipart `archivo`. No recibe `Idempotency-Key` ni un identificador de carga, y `GET /reportes/mios/{id}` devuelve evidencias por `id`, pero no una clave que relacione una carga concreta con el archivo. Si el servidor guarda la evidencia y la respuesta se pierde por timeout/red/5xx, el cliente no puede demostrar si ese archivo quedó guardado.

**Impacto frontend:** F11 consulta el detalle solo para actualizar el estado visible. No puede atribuir una evidencia nueva ni confirmar que corresponda al archivo fallido: el DTO no incluye una clave de correlación. Por eso conserva el archivo, mantiene el resultado como incierto y exige confirmación antes de un reintento; este podría duplicar la evidencia. La app no puede garantizar una carga exactamente una vez.

**Propuesta de contrato:**

- Aceptar `Idempotency-Key` (UUID generado por el cliente y conservado durante reintentos) o un campo multipart `clientUploadId`.
- Aplicar unicidad por reportante/reporte/clave durante una ventana documentada.
- Repetir la misma clave con el mismo reporte devuelve la misma evidencia (`200/201`) sin crear otra fila ni otro archivo.
- Reutilizar la misma clave con contenido distinto devuelve `409`.
- Incluir `clientUploadId` en la evidencia devuelta por la consulta propia para reconciliar sin ambigüedad.

**Criterios de aceptación propuestos:** pruebas concurrentes con la misma clave; prueba de timeout tras commit; una sola fila/objeto por carga lógica; el cliente puede reintentar sin duplicar; comportamiento documentado en OpenAPI y política de retención/limpieza de claves.

**Comportamiento frontend actual:** no hay idempotencia disponible; ante un resultado incierto se consulta el detalle, se conserva el archivo y se advierte antes de reintentar. No se afirma éxito ni se reenvía automáticamente.

### BE-14 — Distinguir cuenta bloqueada en sesión existente

**Evidencia observada:** `POST /api/v1/auth/login` devuelve `403 CUENTA_BLOQUEADA`, pero `SesionService.validar` filtra las cuentas bloqueadas y `SessionAuthFilter` termina respondiendo `401 NO_AUTENTICADO`. Para la app móvil ambos casos son distintos: el `403` permite explicar el bloqueo preventivo; el `401` solo puede presentarse como sesión expirada o inválida.

**Solicitar al backend:** cuando el bearer corresponda a una sesión vigente de una cuenta bloqueada, responder `403` con código `CUENTA_BLOQUEADA`, o un código de error equivalente que el cliente pueda distinguir de `NO_AUTENTICADO`. No debe revelarse información de cuentas ajenas ni aceptarse el token para operaciones ordinarias.

**Motivo:** una cuenta bloqueada mientras la app está abierta pierde el acceso, pero la UI no puede informar el motivo real ni evitar un mensaje engañoso de expiración. El móvil no puede inferir el bloqueo ni consultar rutas administrativas.

**Criterios de aceptación propuestos:**

- Un token de una sesión vigente cuya cuenta está bloqueada no autoriza operaciones ordinarias.
- La respuesta usa `403 CUENTA_BLOQUEADA` o un código documentado e inequívoco.
- Una sesión vencida, cerrada o inexistente sigue respondiendo `401 NO_AUTENTICADO`.
- OpenAPI documenta ambos casos y pruebas cubren cuenta bloqueada, sesión vencida y token inexistente.
- El cliente limpia la sesión local en ambos casos, pero muestra el mensaje específico solo cuando el contrato lo permite.

**Comportamiento frontend actual:** el login de una cuenta bloqueada se maneja con el `403`; una sesión ya abierta recibe `401` y se trata como sesión expirada. No se simula un bloqueo ni se inventan rutas administrativas.

### BE-15 — Rechazar Administrador móvil antes de invalidar sesiones

**Evidencia observada:** `POST /api/v1/auth/login` valida las credenciales y el estado de bloqueo; luego cierra todas las sesiones activas del usuario y crea una nueva sesión, y solo entonces devuelve el rol. Si la app móvil recibe `rol: ADMINISTRADOR`, el daño a una sesión previa del panel web ya ocurrió antes de que el frontend pueda detectar el rol o cerrar el token nuevo.

**Solicitud mínima:** conservar `POST /api/v1/auth/login` y aceptar el encabezado opcional `X-ALIADO-Client: MOBILE`. Cuando esté presente y el usuario autenticado tenga rol `ADMINISTRADOR`, responder `403` con código `ADMINISTRADOR_NO_DISPONIBLE_EN_MOVIL` antes de cerrar sesiones activas o crear una nueva. Para `CLIENTE` y `PRESTADOR`, mantener el comportamiento actual. La ausencia del encabezado debe conservar compatibilidad con clientes existentes.

El encabezado solo selecciona el comportamiento de cliente y no se considera una frontera de autorización. El rol se determina desde la cuenta autenticada en el servidor; nunca desde un dato enviado por el cliente.

**Motivo:** la app es para Cliente y Prestador; un intento accidental de login móvil como Administrador no debe cerrar la sesión del panel web. El frontend por sí solo no puede evitarlo porque el backend invalida las sesiones antes de responder.

**Criterios de aceptación propuestos:**

- Con `X-ALIADO-Client: MOBILE` y credenciales válidas de `ADMINISTRADOR`, el servidor responde `403 ADMINISTRADOR_NO_DISPONIBLE_EN_MOVIL`, sin token y sin modificar/cerrar sesiones preexistentes.
- Una prueba crea o conserva una sesión administrativa activa, ejecuta el intento móvil y comprueba que esa sesión sigue válida.
- El mismo intento con rol `CLIENTE` o `PRESTADOR` mantiene el flujo actual y crea la sesión esperada.
- Un login de panel sin el encabezado móvil mantiene compatibilidad con clientes existentes.
- OpenAPI documenta el encabezado opcional y el error `403`; pruebas de servicio/controlador cubren el orden de las operaciones.

**Comportamiento frontend preparado:** todos los logins móviles envían `X-ALIADO-Client: MOBILE`; el gateway traduce el `403 ADMINISTRADOR_NO_DISPONIBLE_EN_MOVIL` al mensaje de uso del panel web. Se conserva un fallback para una respuesta exitosa antigua que devuelva `rol: ADMINISTRADOR`, con limpieza best-effort del token nuevo. Ese fallback no puede conservar sesiones previas; hasta que BE-15 esté desplegado, no se debe probar una cuenta Administrador real desde el móvil.

### BE-16 — Alinear OpenAPI de formalización

**Evidencia observada:** el controlador real exige `PRESTADOR` en `GET /formalizacion/ruta` y `GET /formalizacion/progreso`, pero OpenAPI declara solo seguridad global sin roles por operación. Ambos endpoints devuelven arrays, aunque la tarea los describe en singular. `GET /formalizacion/progreso` puede responder `404 SIN_PROGRESO`, caso no documentado. `GET /formalizacion/enlaces/{id}` exige sesión pero no rol y devuelve también enlaces `NO_DISPONIBLE`. En OpenAPI, `ActualizarProgresoRequest` solo marca `rutaId` como obligatorio; `valor` es un entero primitivo que puede omitirse y tomar 0.

**Solicitar al backend:** documentar en OpenAPI los roles por operación, los DTO de lista, `404 SIN_PROGRESO`, la semántica de `DISPONIBLE`/`NO_DISPONIBLE`, el rol aplicable a enlaces y si `valor` es realmente obligatorio en la actualización. Mantener el comportamiento del código o corregirlo de forma explícita; no cambiar el contrato solo desde el cliente.

**Motivo:** el cliente móvil implementó el contrato a partir del controlador y de la base local. La falta de detalle en OpenAPI impide validar automáticamente roles, errores y obligatoriedad, y puede producir clientes que interpreten `404 SIN_PROGRESO` como fallo genérico o que envíen actualizaciones incompletas.

**Criterios de aceptación propuestos:**

- OpenAPI refleja arrays de ruta y progreso, esquemas completos y `avisoLegal`.
- Cada operación declara autenticación y rol; enlaces indica su alcance real.
- `404 SIN_PROGRESO` y los códigos de error esperados están documentados.
- `ActualizarProgresoRequest` marca `valor` como obligatorio o documenta el valor por defecto y su validación.
- Pruebas de contrato comparan OpenAPI con las respuestas reales.

**Comportamiento frontend actual:** consume los arrays, trata `SIN_PROGRESO` como ausencia de avance y no usa `PUT /progreso`. No se modifica OpenAPI desde este repositorio.

### BE-17 — Metadatos y filtros de historial

**Evidencia observada:** `GET /api/v1/historial?pagina=&tamano=` devuelve un array de `{ id, estado, fechaContratacion }` sin total, página actual, páginas totales, cursor ni filtros. El backend limita `tamano` a 100 y ordena por `fechaContratacion` descendente. La app solo puede ofrecer “cargar más” e inferir si hay otra página cuando recibe 20 elementos.

**Solicitar al backend:** definir una envoltura paginada con metadatos (página, tamaño, total o cursor) y filtros acordados por estado/fecha, o documentar formalmente que el contrato no admite filtros y que el cliente no debe simularlos localmente. Mantener la respuesta limitada a servicios donde el usuario autenticado sea participante.

**Motivo:** F14-FE-02 pide historial con paginación/filtros; el contrato actual solo ofrece paginación por página y no permite construir filtros equivalentes de forma segura. El frontend evita filtrar solo la página cargada para no presentar resultados incompletos.

**Criterios de aceptación propuestos:**

- Respuesta con `items` y metadatos de paginación, o contrato explícito de “cargar más” sin total.
- Filtros opcionales documentados con aislamiento por usuario.
- Orden estable y página vacía como `200`.
- Pruebas con Cliente, Prestador y usuario sin servicios.

### BE-18 — Actividad reciente navegable y paginada

**Evidencia observada:** `GET /api/v1/actividad-reciente` devuelve hasta 20 elementos `{ tipo, resumen, fecha }`. No incluye IDs de servicio, notificación, propuesta o solicitud, ni paginación. La app no puede abrir un detalle desde la actividad y no hay un desempate documentado para eventos con la misma fecha.

**Solicitar al backend:** añadir referencias autorizadas por evento y paginación o cursor; documentar el orden por `(fecha, id estable)`. No incluir IDs de recursos ajenos ni datos que el usuario no pueda consultar.

**Motivo:** F14-FE-04 pide enlaces autorizados y el contrato actual solo permite mostrar texto y fecha. No se inventan rutas ni identificadores.

**Criterios de aceptación propuestos:**

- Cada evento incluye un tipo y una referencia navegable cuando corresponda.
- Orden determinista con desempate estable.
- Paginación o límite explícito y repetible.
- Pruebas de visibilidad entre dos usuarios.

### BE-19 — Ciclo y contrato de exportación/indicadores

**Evidencia observada:** `POST /api/v1/historial/exportaciones` responde `201` en el controlador, mientras OpenAPI declara `200`; devuelve `{ id, archivoKey, estado }`. El CSV se obtiene con `GET /historial/exportaciones/{id}` y no hay URL pública, polling ni endpoint de estado, aunque el DTO admite `GENERANDO`, `LISTA` y `FALLIDA`. El endpoint no recibe `Idempotency-Key`. Los indicadores devuelven valores calculados por el backend sin `formulaVersion` ni periodo.

**Solicitar al backend:** alinear OpenAPI con el `201`, documentar el CSV, la autorización y el ciclo de estados; añadir estado/polling si la generación puede ser asíncrona y una clave de correlación para reintentos. Para indicadores, documentar o exponer `formulaVersion` y periodo, sujeto a D-15. No se solicita cambiar fórmulas desde el cliente.

**Motivo:** la app implementa el CSV síncrono actual y muestra los indicadores tal como llegan, pero no puede prometer equivalencia de snapshot, reintento sin duplicados ni interpretar una fórmula no aprobada.

**Criterios de aceptación propuestos:**

- OpenAPI refleja `201`, `text/csv`, autorización, errores y estados reales.
- Reintento de exportación con la misma clave no duplica archivos o se documenta el comportamiento.
- Si la generación es asíncrona, existe forma de consultar el estado.
- D-15 aprueba fórmula, periodo, formato, límites y snapshot antes de declarar aceptación completa.

### BE-20 — Raíz relativa de almacenamiento invalida la descarga

**Evidencia observada:** con la configuración por defecto `aliado.storage.dir=./storage`, `LocalArchivoStorageAdapter` normaliza la ruta del archivo pero no la raíz. La comparación queda, de forma equivalente, entre `storage/<archivo>` y `./storage`; `Path.startsWith` devuelve `false`, por lo que la lectura se rechaza con `404 ARCHIVO_NO_ENCONTRADO` aunque el CSV exista en disco.

**Solución temporal comprobada:** iniciar el backend desde `/data/PROYECTOS/ALIADO-backend` con:
`ALIADO_STORAGE_DIR=/data/PROYECTOS/ALIADO-backend/storage`
Con esa ruta absoluta, la descarga de la exportación existente respondió `200`, `Content-Type: text/csv`, y el flujo móvil abrió el menú nativo y mostró éxito. No se modificó el código backend.

**Solicitar al backend:** normalizar la raíz y la ruta del archivo antes de comparar (`raiz = Path.of(directorio).toAbsolutePath().normalize()` y `objetivo = raiz.resolve(clave).normalize()`), o usar una comprobación equivalente que no dependa de una raíz relativa. Mantener la protección contra traversal.

**Criterios de aceptación propuestos:**

- Con una raíz relativa (`./storage`) y una raíz absoluta, una clave válida existente se lee correctamente.
- Una clave que intente salir de la raíz sigue rechazándose.
- La descarga de una exportación existente responde `200 text/csv` con ambas configuraciones.
- Pruebas cubren raíz relativa, raíz absoluta, archivo ausente y traversal.

## Decisiones pendientes

| ID | Feature | Decisión | Estado |
|---|---|---|---|
| D-07 | F04/F05/F10/F11 | Definir política de MIME, tamaño máximo y cantidad para evidencias/fotos/documentos de verificación. | Abierta |
| D-12 | F11/F12 | Aprobar la política de consolidación de reportes equivalentes, revisión y criterios de alto riesgo. | Abierta |
| D-10 | F08 | Definir si se permite leer y enviar mensajes después de cancelar o finalizar un servicio, y cómo se refleja en API y UI. | Abierta; no es un defecto confirmado |
| D-15 | F14 | Aprobar fórmula, periodo y formato/snapshot de indicadores y exportación. | Abierta |

### D-07 — Política de archivos de verificación y evidencias

**Evidencia observada:** el backend aplica validaciones técnicas de archivo, pero la política de producto sobre MIME, tamaño y cantidad no está cerrada. F10 y F11 no fijan esas reglas en el cliente para no contradecir una decisión pendiente.

**Decisión requerida:** aprobar tipos, tamaño, cantidad y mensajes de error para fotos, documentos de verificación y evidencias. El cliente seguirá mostrando el error del servidor y no impondrá límites locales hasta que la política sea confirmada.

### D-12 — Consolidación y moderación de reportes

**Evidencia observada:** el backend consolida un reporte equivalente abierto por reportante, tipo, objetivo y motivo, y devuelve su ID. La política de producto sobre equivalencia, prioridad, evidencia acumulada y revisión por el mismo administrador no está aprobada formalmente.

**Decisión requerida:** aprobar los criterios de equivalencia/consolidación, si una evidencia nueva reabre o no un reporte, y la relación con los criterios de alto riesgo de F12. La UI no decide la consolidación: muestra el `reporteId` que devuelve el servidor.

### D-10 — Mensajería después de cancelar o finalizar

**Evidencia observada:** `ServicioService.enviarMensaje` y `listarMensajes` validan que el actor sea participante y que `comunicacionHabilitada` sea verdadero. La aceptación crea el servicio con esa bandera en `true`; el código actual no la cierra en las transiciones a `CANCELADO` o `FINALIZADO`. Por tanto, el comportamiento después del cierre no está definido explícitamente por una regla de estado, solo por el valor de la bandera.

**Decisión requerida:** acordar si Cliente y Prestador pueden leer y/o enviar mensajes después de `CANCELADO` o `FINALIZADO`, y si el canal debe cerrarse automáticamente o conservarse en solo lectura. La decisión debe cubrir API, UI y auditoría.

**Comportamiento actual del frontend:** muestra el canal cuando `comunicacionHabilitada` es verdadero y no agrega restricciones por estado; si el servidor rechaza, muestra el error. No se presenta una política de mensajería posterior al cierre como si estuviera aprobada.

**Criterios para cerrar:** política aprobada por producto y backend, contrato/OpenAPI con errores y permisos por estado, pruebas de lectura/escritura en ambos estados, y copy de UI coherente con la decisión. Esto no debe implementarse como un defecto ni como un cambio unilateral del cliente.

### D-15 — Fórmulas de indicadores y formato de exportación

**Evidencia observada:** el backend calcula los indicadores a partir de los servicios y la reputación, pero no expone versión de fórmula ni periodo. La exportación actual es CSV síncrono y no garantiza un snapshot equivalente a una consulta paginada. El SPEC deja la fórmula y el formato como decisión pendiente.

**Decisión requerida:** aprobar fórmula, ventana temporal, inclusión de servicios cancelados/moderados, formato y límites de exportación, snapshot y responsable de mantenerlos. La UI seguirá mostrando lo que devuelve el backend y no recalculará ni inventará un periodo.

## Dependencias que no son defectos de backend

- D-03 (zona horaria y reglas de solapamiento): la zona operativa `America/Bogota` quedó decidida para el conflicto disponibilidad/agenda y el backend la aplica. Siguen abiertas las ventanas temporales de solicitud y el matching.
- D-02, D-06 y D-07 requieren decisiones de producto/operación sobre catálogo, almacenamiento y evidencias.
- BE-05 quedó concretado como `descripcion` opcional de hasta 1000 caracteres; no hay otros campos de datos generales en el MVP.

## Seguimiento

Actualizar estado y fecha solo cuando exista respuesta del equipo backend. No marcar una solicitud como resuelta por cambios únicamente del cliente móvil; confirmar con contrato actualizado y prueba de integración. Este documento no autoriza modificaciones en `aliado-prb` ni el envío de mensajes al equipo.
