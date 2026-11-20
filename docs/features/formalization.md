# F13 — Ruta y progreso orientativo de formalización (app móvil)

**Estado:** pantalla móvil para Prestador implementada contra el contrato real de lectura. Incluye ruta, pasos, enlaces externos y progreso orientativo. La actualización del avance no se expone porque D-13 sigue abierta. No se modificaron backend, contratos, migraciones ni datos.

## Alcance móvil

- Acceso desde **Mi perfil** solo para `PRESTADOR`, con una pantalla de pila fuera de la barra inferior.
- Ruta con nombre, descripción, pasos ordenados y enlaces configurados.
- Aviso permanente de que el contenido y el progreso son orientativos y no certifican ni declaran un estatus legal.
- Enlaces externos identificados y abiertos en el navegador del dispositivo solo si el backend los reporta disponibles.
- Consulta del progreso persistido por ruta; `404 SIN_PROGRESO` se presenta como ausencia de avance, no como error genérico ni como 0% inventado.
- Carga, error, vacío, reintento y sesión expirada.
- Sin vinculación institucional UC080, sin CRUD administrativo y sin actualización de progreso.

## Contrato real utilizado

| Operación | Endpoint | Uso móvil |
|---|---|---|
| Ruta | `GET /api/v1/formalizacion/ruta` | Requiere `PRESTADOR`. Devuelve un **array** de rutas con pasos, enlaces y `avisoLegal`; un catálogo sin rutas activas devuelve `[]`. |
| Progreso | `GET /api/v1/formalizacion/progreso` | Requiere `PRESTADOR`. Devuelve un **array** de progresos con `rutaId`, `valorOrientativo` (0–100) y `avisoLegal`. Sin registros responde `404 SIN_PROGRESO`. |
| Enlace | `GET /api/v1/formalizacion/enlaces/{id}` | Requiere sesión, sin `exigirRol("PRESTADOR")` en el controlador. Devuelve metadata y `estado` (`DISPONIBLE`/`NO_DISPONIBLE`), incluido el enlace no disponible. |
| Actualización | `PUT /api/v1/formalizacion/progreso` | Existe y acepta `{ rutaId, valor }`, pero **no se usa**: D-13 no confirma fórmula/fuente del avance. |
| Vinculación | `GET /api/v1/formalizacion/vinculacion` | UC080 Future, apagada por flag. No se llama. |

Los DTO se consumen desde el controlador real: `RutaResponse[]`, `ProgresoResponse[]`, `EnlaceResponse` y `avisoLegal` en ruta y progreso.

## Contenido confirmado en la base local

Consulta de solo lectura a PostgreSQL local:

- 1 ruta activa: “Ruta de formalización”.
- 4 pasos ordenados: Definir tu actividad, Registro tributario, Seguridad social y Facturación.
- 3 enlaces `DISPONIBLE`: DIAN, Cámara de Comercio de Santa Marta y Portal de seguridad social.
- El paso “Facturación” no tiene enlace configurado; la UI lo representa sin inventar uno.
- 0 registros de `progreso_formalizacion` en la base consultada.

El contenido mostrado proviene de la API; no se incluyen fixtures ni texto de formalización inventado.

## Comportamiento implementado

### Aviso orientativo

- Se muestra un aviso fijo al inicio de la pantalla, antes de carga, error o contenido.
- Usa `avisoLegal` de la ruta cuando está disponible y un texto equivalente local como respaldo si aún no hay rutas cargadas.
- Cada progreso persistido muestra además su propio `avisoLegal`; el aviso sigue visible al 100%.
- La UI no usa lenguaje de certificación, verificación legal ni cumplimiento.

### Progreso

- El progreso se consulta junto con la ruta, se asocia por `rutaId` y se mantiene un estado explícito: `loaded`, `missing` o `error`.
- Si el backend responde `404 SIN_PROGRESO`, se muestra **un único aviso general** de que aún no existe avance. Las tarjetas no repiten ese aviso ni dibujan un bloque de progreso.
- Si la consulta de progreso falla por red, `5xx` u otro error, se conserva el mensaje general del error y la ruta visible. Las tarjetas no muestran bloque de progreso ni afirman que no hay avance: el estado es desconocido.
- Si la consulta termina correctamente y solo algunas rutas tienen progreso, las rutas presentes muestran su porcentaje. Una ruta sin registro muestra un texto neutral propio, sin mensaje general de ausencia ni error.
- No se dibuja una barra en 0% cuando no hay un registro confirmado ni se crea estado local.
- No se ofrece edición del porcentaje ni se envía `PUT`.

### Enlaces externos

- Cada enlace muestra su nombre, URL, marca **Externo** y estado **Disponible**/**No disponible**.
- Un enlace `NO_DISPONIBLE` no es pulsable.
- Antes de abrir, la app consulta `GET /formalizacion/enlaces/{id}` para refrescar el estado.
- Solo abre URLs `http`/`https`; si el enlace ya no existe (`ENLACE_NO_ENCONTRADO`), cambió a `NO_DISPONIBLE` o la URL no es válida, lo informa y no altera el progreso.
- `Linking.openURL` abre el destino fuera de la app. La app no puede verificar la disponibilidad HTTP final del sitio externo; solo el estado del backend y el resultado de abrir el handler del sistema.
- Abrir un enlace no marca pasos, no actualiza el avance y no se interpreta como trámite completado.

### Estados

- **Carga:** indicador y texto mientras se consultan ruta y progreso.
- **Error de ruta:** mensaje y reintento.
- **Catálogo vacío:** “Sin ruta publicada”, con reintento.
- **Progreso sin registro:** un único aviso informativo, sin repetirlo en cada tarjeta.
- **Error de progreso:** mensaje general del error y ruta visible; las tarjetas no muestran bloque de progreso.
- **Sesión expirada:** alerta y limpieza de sesión mediante el patrón de autenticación existente.

## Discrepancias registradas

- SPEC y tarea describen una ruta y un progreso en singular; el backend devuelve arrays en ambos endpoints.
- La tarea y el manual nombran `enlaces_institucionales`; la migración y la entidad reales usan `enlaces_formalizacion`.
- OpenAPI declara seguridad global y no documenta por operación el rol `PRESTADOR`, el `404 SIN_PROGRESO` ni los demás errores. El código real aplica rol en ruta/progreso y solo autenticación en enlaces.
- `ActualizarProgresoRequest` solo marca `rutaId` como obligatorio en OpenAPI; `valor` es un entero primitivo que puede omitirse y tomar 0. La app no consume esta operación.
- La tarea pide consultar/actualizar el avance según fórmula y fuente acordadas, pero D-13 permanece abierta. Se implementó únicamente la lectura.
- El flag de vinculación institucional está apagado; `GET /vinculacion` responde error y no se consume desde la app.

## Decisiones y límites

- **D-13 abierta:** no se implementa actualización de progreso, checklist por paso ni cálculo local. El avance mostrado es exclusivamente el registrado por el backend.
- **Revisión visual real:** el 2026-11-20 se recorrió Mi perfil → Ruta de formalización en el emulador con una sesión Prestador ya iniciada. Se verificaron la ruta, los cuatro pasos, los tres enlaces disponibles, el único aviso de ausencia de progreso y el retorno desde Chrome. No se crearon ni modificaron datos.
- **Sin juicio sobre el sitio externo:** la app no comprueba el contenido legal del destino ni el resultado del trámite; solo abre el enlace disponible.
- **Sin UC080:** no hay rutas, botones ni llamadas de vinculación institucional.
- **Límite del enlace externo:** Android abrió Chrome, pero el sitio DIAN no llegó a cargarse porque Chrome pidió configuración/autenticación inicial. No se ingresó cuenta, no se concedieron permisos y no se añadió ninguna cuenta. La captura documenta la limitación, no una falla de la ruta.

## Verificación

### Estática

- Node `24.14.1`.
- `npm run typecheck` → `0`.
- `npm run verify:config` → `0`.
- `npm run doctor` → `20/20`.
- `git diff --check` → `0`.
- `npx expo export --platform android` → bundle Android correcto (1086 módulos).

### Gateway y estado

Siete pruebas de contrato del gateway:

- Ruta en array, orden de pasos y estados de enlace.
- Ruta vacía como `[]`.
- Progreso 100 con `avisoLegal`.
- `404 SIN_PROGRESO` identificado sin error genérico.
- Enlace `NO_DISPONIBLE` parseado.
- `401` como sesión expirada.
- Respuesta de ruta inválida como `INVALID_RESPONSE`.

Ocho pruebas de estado y presentación:

- `404 SIN_PROGRESO` → `missing`.
- `500` → `error`, no ausencia.
- Error de red → `error`, no ausencia.
- Progreso parcial indexado solo para rutas presentes.
- Progreso vacío cargado no crea entradas.
- La tarjeta oculta el bloque de progreso en `missing` y `error`.
- La tarjeta permite representar una ruta sin avance cuando el estado global es `loaded`.

Resultado: `7/7` gateway y `8/8` estado. Evidencia en `/tmp/aliado-f13-validation/`.

### Revisión visual manual

- Sesión Prestador ya iniciada en `emulator-5554`; no se creó una sesión ni una cuenta.
- Mi perfil mostró la tarjeta “Ruta de formalización” y la pantalla abrió con el aviso orientativo.
- La ruta mostró cuatro pasos y tres enlaces `DISPONIBLE`; “Facturación” apareció sin enlace.
- La consulta sin progreso mostró un único aviso global y ninguna repetición en las tarjetas.
- Al volver de Chrome, el estado sin progreso y los pasos se mantuvieron.
- Chrome abrió desde el enlace DIAN, pero no cargó el sitio por la configuración inicial de Chrome/autenticación. No se configuró una cuenta ni se modificaron datos.
- Capturas `visual-review-01..08.png` e informe en `/tmp/aliado-f13-validation/`; no forman parte del repositorio.

### API local sin sesión

- `GET /api/v1/formalizacion/ruta` → `401`.
- `GET /api/v1/formalizacion/progreso` → `401`.
- `GET /api/v1/formalizacion/enlaces/{id}` → `401`.
- `GET /api/v1/formalizacion/vinculacion` → `401`.

No se ejecutaron mutaciones. La lectura autenticada se verificó en la revisión visual.

## Fuera de alcance

Vinculación institucional UC080, actualización del progreso, checklist persistente por paso, certificación legal, administración de contenido, edición de enlaces y cualquier cambio de backend/OpenAPI.

## Enlaces

- [F01 — Acceso e identidad](auth.md)
- [F05 — Perfil profesional](professional-profile.md)
- [Solicitudes backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
- [SPEC-13](../../../ALIADO-backend/docs/specs/spec-13-ruta-formalizacion.md)
- [Tarea F13](../../../ALIADO-backend/docs/tasks/features/13-formalizacion.md)
