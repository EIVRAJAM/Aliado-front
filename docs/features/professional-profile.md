# F05 — Perfil profesional (app móvil)

**Estado:** implementación frontend parcial. El formulario de alta y la lectura de vista previa/agenda están implementados, pero el alta real está bloqueada por un error backend confirmado: PostgreSQL rechaza el bind de `datos_generales` JSONB como `varchar` (SQLState 42804). La lectura pública devuelve datos públicos confirmados y reseñas; la edición completa, experiencia, portafolio y disponibilidad quedan bloqueadas por contrato. No se usan mocks ni datos simulados. Seguimiento: [solicitudes de corrección y contrato backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-01--persistencia-jsonb-del-perfil-profesional).

## Alcance y corrección del diagnóstico inicial

SPEC-05 cubre la creación y gestión del perfil profesional del Prestador: categorías y zonas obligatorias, experiencia opcional, portafolio, disponibilidad, agenda y vista previa pública.

Correcciones al diagnóstico anterior:

- **`GET /api/v1/perfiles/mio/agenda` sí existe** y permite consultar los compromisos del Prestador autenticado. La agenda no está bloqueada por la falta de lectura del perfil completo; se puede cargar de forma independiente.
- **No existe `GET /api/v1/perfiles/mio`.** Esto impide hidratar el perfil profesional completo, incluidas categorías/zonas por ID, experiencia, portafolio y disponibilidad. No bloquea la lectura de la agenda ni la vista previa pública.
- **`GET /api/v1/perfiles/mio/vista-previa` sí existe** y devuelve la proyección pública que consume descubrimiento, incluida disponibilidad, reputación, verificación y reseñas visibles.
- El backend ya dispone del módulo `perfiles`, migración V3, controlador, servicio, dominio y persistencia. F05 frontend puede integrarse parcialmente contra ese contrato.

## Operaciones reales disponibles

Todas exigen rol `PRESTADOR` y sesión bearer.

| Operación | Endpoint | Respuesta real | Uso actual en la app |
|---|---|---|---|
| Crear perfil | `POST /api/v1/perfiles` | `201 PerfilResponse` | **Implementado** solo con `categoriaIds` y `zonaIds`; `datosGenerales` y experiencia se omiten. |
| Editar datos generales | `PUT /api/v1/perfiles/mio` | `200 PerfilResponse` | Bloqueado: sin `GET /mio` y sin esquema de campos. |
| Actualizar categorías | `PUT /api/v1/perfiles/mio/categorias` | `200 PerfilResponse` | Bloqueado: no se pueden recuperar los IDs actuales. |
| Actualizar zonas | `PUT /api/v1/perfiles/mio/zonas` | `200 PerfilResponse` | Bloqueado: no se pueden recuperar los IDs actuales. |
| Agregar experiencia | `POST /api/v1/perfiles/mio/experiencia` | `201 ExperienciaResponse` | Bloqueado: no hay lectura de experiencias existentes. |
| Agregar portafolio | `POST /api/v1/perfiles/mio/portafolio` multipart | `201 PortafolioResponse` | Bloqueado: no hay lectura/previsualización de portafolio existente. |
| Eliminar portafolio | `DELETE /api/v1/perfiles/mio/portafolio/{id}` | `204` | Bloqueado por la misma falta de lectura. |
| Consultar disponibilidad | Incluida en `PerfilResponse` | — | No se puede hidratar por falta de `GET /mio`; la vista previa sí muestra los bloques públicos. |
| Actualizar disponibilidad | `PUT /api/v1/perfiles/mio/disponibilidad` | `200 PerfilResponse` | Bloqueado: sin lectura propia y con D-03 pendiente. |
| Consultar agenda | `GET /api/v1/perfiles/mio/agenda` | `200 CompromisoResponse[]` | **Implementado en modo consulta.** |
| Crear compromiso | `POST /api/v1/perfiles/mio/agenda` | `201 CompromisoResponse` | Bloqueado: D-03 y regla de zona horaria pendientes. |
| Editar compromiso | `PUT /api/v1/perfiles/mio/agenda` | `200 CompromisoResponse` | Bloqueado: mismas reglas temporales. |
| Vista previa pública | `GET /api/v1/perfiles/mio/vista-previa` | `200 VistaPreviaResponse` | **Implementado en modo consulta, incluidos datos públicos confirmados y reseñas.** |
| Exposición pública | `PUT /api/v1/perfiles/mio/exposicion` | `200 PerfilResponse` | No implementado en esta fase. |

## Diferencias OpenAPI / backend / tarea

| Tema | OpenAPI o tarea | Backend real | Tratamiento |
|---|---|---|---|
| Alta de perfil | `200` y `CrearRequest { motivo }` por colisión de esquema | `201 PerfilResponse`; request real `{ datosGenerales, categoriaIds, zonaIds, experiencia? }` | No usar el esquema genérico de OpenAPI; seguir el controlador real. |
| Respuesta de alta | Tarea: `{ id }` | `PerfilResponse` completo | El cliente debería consumir el perfil real si se habilita la creación. |
| Portafolio | `200`; tarea con `evidencia[]` | `201 PortafolioResponse`; multipart `descripcion` + `archivo` opcional | No se implementa hasta resolver lectura de portafolio y D-07. |
| Agenda POST | OpenAPI `200` | `201 CompromisoResponse` | Sin implementación de mutación. |
| Lectura del perfil propio | No declarada | No existe | Bloqueo para hidratar el perfil completo. |
| `GET /mio/agenda` | Presente | Presente | Implementado. |
| `GET /mio/vista-previa` | Presente | Presente | Implementado. |
| Exposición | Presente y no listada en la tarea | `PUBLICO`/`OCULTO` | Se documenta; no se implementa ahora. |
| Evidencia de portafolio | `evidenciaKey` | Solo clave, sin endpoint de descarga | No se puede previsualizar. |
| Datos generales | `Map<String,Object>` | Sin esquema de claves ni validación de campos | No se inventan campos ni claves. |
| Vista previa | `VistaPreviaResponse` | Incluye categorías/zonas/disponibilidad/confianza/reseñas; excluye el listado de experiencia, portafolio y compromisos | Se muestra exactamente lo disponible y se advierte la omisión. |

## Implementación frontend actual

- Entrada **“Perfil profesional”** desde la pantalla de sesión para el rol `PRESTADOR`.
- Pantalla `ProfessionalProfileCreateScreen`:
  - Carga real de catálogos, selección múltiple, validación local y POST de creación.
  - Manejo de carga, error, `400`, `401`, `403`, `409`, resultado incierto y reconciliación por vista previa.
- Pantalla `ProfessionalProfileScreen`:
  - Vista previa pública real con datos públicos confirmados, categorías, zonas, disponibilidad, reputación, nivel de verificación y reseñas visibles (texto, estrellas y fecha).
  - Agenda real desde `GET /api/v1/perfiles/mio/agenda`, con estado vacío, error, carga y ausencia de perfil.
  - Estado “Sin perfil profesional” cuando el backend responde `404`.
  - Bloque de alcance actual con las capacidades no disponibles.

### Flujo de creación inicial

- En el estado “Sin perfil profesional” aparece el botón primario “Crear mi perfil profesional” dentro del mismo recuadro.
- La pantalla de creación carga categorías y zonas desde `GET /api/v1/catalogo/categorias` y `GET /api/v1/catalogo/zonas` con la sesión actual.
- Permite seleccionar una o varias categorías y zonas, muestra el nombre y la cobertura recibidos, y exige al menos una de cada una.
- Envía únicamente `{ categoriaIds, zonaIds }` a `POST /api/v1/perfiles`; no añade `datosGenerales` ni experiencia.
- Tras `201`, vuelve a la pantalla de consulta, que recarga vista previa y agenda con sus endpoints reales.
- Un `409` no repite el POST: informa que el perfil existe y vuelve a la consulta para cargar el perfil.
- Un resultado incierto por timeout, desconexión o error de servidor no permite reenviar el formulario automáticamente. La app consulta una vez `GET /mio/vista-previa` para reconciliar y distingue tres estados:
  - **Perfil encontrado:** la consulta devuelve el perfil; se permite volver a la vista previa y agenda.
  - **Perfil no encontrado (`404`):** la consulta confirma que no existe perfil. Si el POST había respondido `5xx`, la app muestra que el servidor tuvo un error al crearlo, sin detalles SQL. Las categorías y zonas se conservan y el reintento es manual y explícito.
  - **Verificación no disponible:** si la consulta falla por red o servidor, se muestra “Resultado pendiente” sin ofrecer un nuevo envío de creación.
- En la prueba local del 2026-11-13, el alta respondió `500 ERROR_INTERNO` por SQLState `42804`; la consulta posterior devolvió `404` y la base confirmó que no se creó el perfil. La UI corregida muestra “Perfil no creado” y el fallo del servidor, conserva la selección y no repite el POST automáticamente. El alta real sigue bloqueada por [BE-01](../backend-requests/BACKEND_CORRECTION_REQUESTS.md#be-01--persistencia-jsonb-del-perfil-profesional).
- Los datos generales y la experiencia no se solicitan porque el contrato no define sus campos de forma segura.

### Presentación de datos públicos

- Solo se renderizan las claves de `datosGenerales` incluidas en la lista blanca real del backend: `descripcion`, `resumen`, `experiencia`, `anosExperiencia`, `aniosExperiencia`, `especialidades`, `servicios`, `habilidades`, `formacion`, `educacion`, `certificaciones`, `idiomas` y `sitioWeb`.
- Las etiquetas visibles son las claves exactas de la lista blanca; no se traducen ni se inventan etiquetas nuevas.
- Se muestran valores string, números finitos y arrays de strings unidos por comas. Cualquier otro formato se omite y se advierte que parte de los datos públicos no se muestra por formato no definido.
- Las reseñas se muestran con su texto, calificación en estrellas y fecha. Si no hay reseñas visibles, aparece un estado vacío.
- La vista previa no incluye el listado de experiencia, portafolio ni compromisos; no se presenta como una vista pública completa más allá de lo que devuelve el contrato.
- No se agregan mocks, datos demo, persistencia local ni formularios que simulen operaciones bloqueadas.
- No se muestran el listado de experiencia, el portafolio ni los compromisos. Los datos generales solo se presentan en la vista previa pública y únicamente para las claves confirmadas.

## Estructura

```text
src/features/professional-profile/
├── components/        # vista previa pública y agenda
├── hooks/             # carga independiente de vista previa y agenda
├── screens/           # perfil profesional
├── services/          # gateway y adaptador HTTP
├── types/             # respuestas reales y errores
└── utils/             # formato de agenda, verificación y errores
```

La ruta `ProfessionalProfile` se registra en la navegación autenticada y la pantalla vuelve a comprobar el rol. El backend sigue siendo la autoridad de autorización.

## Validación y límites

- La app no se probó en emulador con un Prestador real en esta iteración: no existía una cuenta de Prestador con perfil en el entorno local y la instrucción prohíbe modificar datos del backend. No se declara una prueba de UI que no ocurrió, incluido el flujo de creación.
- La agenda se presenta en la hora local del dispositivo; la regla de zona horaria y los solapes formales siguen pendientes de D-03.
- La comprobación disponible es estática (`typecheck`, configuración, Doctor y export) y de contrato. No sustituye una prueba de UI con datos reales.
- La creación/edición completa del perfil, experiencia, portafolio, disponibilidad y agenda queda bloqueada por los contratos/decisiones indicados.

## Dependencias y decisiones abiertas

- F01 identidad/roles y F04 catálogo/storage: disponibles.
- D-02: granularidad de catálogo, oferta y portafolio.
- D-03: regla temporal y zona horaria para disponibilidad/agenda.
- D-06/D-07: storage productivo y límites/MIME de evidencias.
- Falta `GET /api/v1/perfiles/mio` para hidratar el perfil completo.
- Falta descarga de evidencia del portafolio.
- Falta definición de campos y validaciones de `datosGenerales`.
