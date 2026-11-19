# Solicitudes de corrección y contrato para backend

Este documento consolida los defectos del backend y las brechas de contrato que afectan la app móvil. Está dirigido a preparar una revisión con el equipo backend; **las solicitudes aún no se han enviado ni aprobado**. El frontend se adapta al backend entregado y no modifica su código, base de datos ni contratos.

## Resumen

| ID | Feature | Tipo | Solicitud | Estado |
|---|---|---|---|---|
| BE-01 | F05 | Defecto de persistencia | Corregir el mapeo de `datos_generales` a PostgreSQL `jsonb` al crear el perfil profesional. | Bloqueante, pendiente de comunicar |
| BE-02 | F04 | Defecto de persistencia e idempotencia | Corregir el guardado y la reproducción de respuestas en `idempotency_keys.respuesta`. | Bloqueante para reintentos seguros, pendiente de comunicar |
| BE-03 | F04 | Respuesta incompleta | Exponer identificador estable de cada foto en consultas de solicitud. | Pendiente de contrato, pendiente de comunicar |
| BE-04 | F05 | Endpoint de lectura faltante | Añadir lectura autenticada del perfil profesional propio. | Bloqueante para hidratar y editar, pendiente de comunicar |
| BE-05 | F05 | Definición de contrato | Acordar y documentar campos, tipos y validaciones de `datosGenerales`. | Pendiente de definición conjunta con producto |
| BE-06 | F04/F05 | Documentación API | Alinear OpenAPI con requests, respuestas y códigos HTTP observados en el backend. | Pendiente de comunicar |
| BE-07 | F08 | Endpoint de lectura faltante | Añadir un listado autenticado y paginable de los servicios propios del Cliente o Prestador. | Pendiente de comunicar |

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

### BE-05 — Esquema de `datosGenerales`

**Evidencia observada:** requests y respuestas exponen `datosGenerales` como `Map<String,Object>` sin catálogo de claves, tipos, restricciones ni política de cambios. El backend filtra una lista de claves para la vista pública, pero esa lista no define por sí sola qué campos debe solicitar el formulario ni sus validaciones.

**Solicitar a producto y backend:** acordar y documentar los campos editables, tipo, obligatoriedad, validaciones, compatibilidad de versiones y cuáles son públicos. Mantener explícitamente excluidos teléfono, dirección, correo y documento de la vista pública, conforme al filtro existente.

**Motivo:** el móvil no debe inventar campos ni validar con reglas no aprobadas. En el flujo inicial actual se omite este mapa; la edición de datos generales seguirá pendiente hasta contar con definición.

**Criterios de aceptación propuestos:** definición aprobada y reflejada en SPEC/OpenAPI con ejemplos de request/response y una política de evolución compatible.

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

## Decisiones pendientes

| ID | Feature | Decisión | Estado |
|---|---|---|---|
| D-10 | F08 | Definir si se permite leer y enviar mensajes después de cancelar o finalizar un servicio, y cómo se refleja en API y UI. | Abierta; no es un defecto confirmado |

### D-10 — Mensajería después de cancelar o finalizar

**Evidencia observada:** `ServicioService.enviarMensaje` y `listarMensajes` validan que el actor sea participante y que `comunicacionHabilitada` sea verdadero. La aceptación crea el servicio con esa bandera en `true`; el código actual no la cierra en las transiciones a `CANCELADO` o `FINALIZADO`. Por tanto, el comportamiento después del cierre no está definido explícitamente por una regla de estado, solo por el valor de la bandera.

**Decisión requerida:** acordar si Cliente y Prestador pueden leer y/o enviar mensajes después de `CANCELADO` o `FINALIZADO`, y si el canal debe cerrarse automáticamente o conservarse en solo lectura. La decisión debe cubrir API, UI y auditoría.

**Comportamiento actual del frontend:** muestra el canal cuando `comunicacionHabilitada` es verdadero y no agrega restricciones por estado; si el servidor rechaza, muestra el error. No se presenta una política de mensajería posterior al cierre como si estuviera aprobada.

**Criterios para cerrar:** política aprobada por producto y backend, contrato/OpenAPI con errores y permisos por estado, pruebas de lectura/escritura en ambos estados, y copy de UI coherente con la decisión. Esto no debe implementarse como un defecto ni como un cambio unilateral del cliente.

## Dependencias que no son defectos de backend

- D-03 (zona horaria y reglas de solapamiento) requiere decisión funcional; no se propone resolverla por una corrección técnica unilateral.
- D-02, D-06 y D-07 requieren decisiones de producto/operación sobre catálogo, almacenamiento y evidencias.
- Las definiciones de campos de `datosGenerales` requieren acuerdo de producto, además de su documentación técnica.

## Seguimiento

Actualizar estado y fecha solo cuando exista respuesta del equipo backend. No marcar una solicitud como resuelta por cambios únicamente del cliente móvil; confirmar con contrato actualizado y prueba de integración. Este documento no autoriza modificaciones en `aliado-prb` ni el envío de mensajes al equipo.
