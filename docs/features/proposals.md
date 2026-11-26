# F07 — Creación, edición y retiro de propuestas (app móvil)

**Estado:** flujo Prestador implementado en UI y gateway contra el controlador/DTO reales; la propuesta incluye la tarifa acordada en COP (decisión D-09). La disponibilidad se selecciona con controles nativos de fecha y hora y se serializa como texto para el backend. La vista de propuesta usa el contexto real de la oportunidad recibido desde el detalle y permite copiar ambos IDs. La creación no envía `Idempotency-Key` mientras BE-02 siga abierto. La validación estática y la revisión visual Android se completaron con un backend/DB temporales aislados y datos sintéticos. También se probó el rechazo de un contrato antiguo que omitía `tarifaCop` en la respuesta: la app conserva el resultado como no confirmado. No se usan mocks ni datos personales.

## Alcance móvil

Cubre SPEC-07 para el rol **Prestador**:

- acción **Enviar propuesta** desde el detalle de una oportunidad compatible;
- formulario con fecha/hora obligatorias, tarifa obligatoria en COP y mensaje opcional;
- creación, edición y retiro mientras la propuesta siga `ACTIVA`;
- confirmación explícita antes de retirar;
- estados de envío, éxito, validación, error recuperable, sesión expirada y permisos;
- conservación del `id` devuelto por el servidor dentro del flujo actual;
- contexto de oportunidad recibido por navegación y referencias copiables.

No incluye recepción, comparación, aceptación o rechazo de propuestas por parte del Cliente; eso se implementa en [F08](services.md). No se añaden pagos, anticipos, comisiones, identidad ni contacto del Cliente.

## Contratos reales integrados

Todas las mutaciones requieren rol `PRESTADOR` y sesión bearer.

| Operación | Endpoint | Request | Respuesta usada |
|---|---|---|---|
| Crear | `POST /api/v1/propuestas` | `{ solicitudId, disponibilidad, tarifaCop, mensaje? }` | `201 { id, solicitudId, prestadorId, disponibilidad, tarifaCop, mensaje, estado }` |
| Editar | `PUT /api/v1/propuestas/{id}` | `{ disponibilidad, tarifaCop?, mensaje? }` | `200` con el mismo DTO. |
| Retirar | `POST /api/v1/propuestas/{id}/retirar` | — | `200 { id, estado: "RETIRADA" }` |
| Listar propias | **No existe** | — | No se inventa endpoint ni almacenamiento. |
| Propuestas de una solicitud | `GET /api/v1/solicitudes/{solicitudId}/propuestas` | — | Exclusivo de `CLIENTE`; no se usa en el flujo Prestador. |

El DTO real es `PropuestaResponse(id, solicitudId, prestadorId, disponibilidad, mensaje, tarifaCop, estado)`. `tarifaCop` es obligatorio en propuestas nuevas y puede venir `null` en propuestas históricas. Los estados observados en el dominio son `ACTIVA`, `RETIRADA`, `ACEPTADA` y `CERRADA`.

### Relación con OpenAPI

OpenAPI no es autoridad para F07 en esta copia:

- declara `200` para la creación, pero el controlador responde `201` mediante `BaseController`;
- el esquema `CrearRequest` de OpenAPI muestra `motivo`, aunque el DTO real exige `solicitudId` y `disponibilidad`;
- el esquema `EditarRequest` de OpenAPI muestra campos de solicitud, aunque el DTO real usa `disponibilidad` y `mensaje`.

El cliente sigue el controlador/DTO entregados. La sincronización de OpenAPI sigue registrada en BE-06.

## Reglas y validaciones

- **Disponibilidad:** la UI exige seleccionar fecha y hora. No permite fechas pasadas ni una fecha/hora combinada en el pasado. La selección se convierte a texto local con formato `dd mmm yyyy, HH:mm` y se envía en el campo `disponibilidad`; el request no incluye campos adicionales. El texto generado es corto y respeta el límite de 255 de edición del backend. La pantalla aclara que es disponibilidad declarada, no una reserva ni una coincidencia calculada por el servidor.
- **Compatibilidad de edición:** si la propuesta cargada trae un texto que no se puede interpretar como fecha y hora, la UI muestra el valor anterior, advierte que no es interpretable y exige seleccionar una nueva fecha y hora; no reemplaza el valor silenciosamente.
- **Tarifa:** obligatoria en propuestas nuevas. Entero positivo en pesos colombianos (COP), máximo técnico `2.147.483.647`; la UI rechaza vacío, cero, negativos, decimales, texto y valores fuera de rango. En propuestas históricas sin tarifa se muestra `Sin tarifa registrada`; no se inventa un valor. La respuesta de creación/edición debe incluir exactamente la misma `tarifaCop` enviada; si la omite, llega `null` o difiere, el gateway la trata como `INVALID_RESPONSE` y el flujo conserva el estado no confirmado.
- **Mensaje:** opcional, máximo 1000 caracteres. Al editar, un mensaje vacío se envía para limpiar el valor.
- **Creación:** solo sobre solicitud publicada y compatible; el backend puede responder `409` por solicitud cerrada, no compatible o propuesta activa duplicada.
- **Edición/retiro:** solo propuesta propia y `ACTIVA`. Un `409 PROPUESTA_NO_ACTIVA` o un `404` deja el estado local como no confirmado, oculta las acciones y no se presenta como activa.
- **Idempotencia desactivada:** la creación **no envía** `Idempotency-Key` mientras el backend no corrija y valide el defecto compartido de `idempotency_keys.respuesta` (`JSONB`/`varchar`) documentado en BE-02 y observado en F04. La corrección corresponde al backend; el cliente no promete reintentos seguros ni idempotencia. Si la creación termina con un resultado incierto, el formulario se conserva bloqueado y no se reenvía.
- **Edición de tarifa:** el formulario de edición carga la tarifa actual; una propuesta histórica sin tarifa exige ingresarla para guardar cambios. La tarifa aceptada no cambia al aceptar la propuesta.

## Implementación

```text
src/features/proposals/
├── components/       # campos compartidos y badge de estado
├── hooks/            # sesión expirada y errores de propuesta
├── screens/          # ProposalFlowScreen
├── services/         # gateway y adaptador HTTP
├── types/            # DTO, comandos y errores
├── utils/            # formato y mensajes
└── validation/       # disponibilidad y mensaje
```

- `OpportunityDetailScreen` muestra **Enviar propuesta** y abre `ProposalFlow` con el `solicitudId` y el contexto disponible de la oportunidad (`categoria`, `zonaAproximada`, `urgencia`, `descripcion`).
- `ProposalFields` usa el selector nativo de fecha/hora, mínimo hoy y validación de instante futuro; el mensaje sigue siendo un campo de texto opcional.
- `ProposalFlowScreen` conserva en la barra superior el título de la acción o de la vista (`Nueva propuesta`, `Editar propuesta`, `Mi propuesta`). La categoría del servicio aparece como encabezado grande del contenido, seguida de zona/urgencia y una descripción breve. La propuesta activa se identifica con su badge de estado; disponibilidad y mensaje quedan en el cuerpo. Las referencias abreviadas están al final, con copia del UUID completo mediante `expo-clipboard` y confirmación breve.
- `ProposalFlowScreen` mantiene un flujo único y valida que las respuestas de las mutaciones correspondan al recurso solicitado:
  - formulario de creación;
  - estado de la propuesta con disponibilidad, tarifa formateada, mensaje y referencia;
  - edición inline con los mismos campos;
  - retiro con confirmación.
- El `id` real se conserva en el estado local del flujo. No se persiste en almacenamiento, no se simula una lista y no se consulta un endpoint inexistente.
- El estado no confirmado por `409/404` o por una respuesta contractual inválida se muestra como “Estado no disponible”; se ocultan editar/retirar y se ofrece volver a la oportunidad para que F06 vuelva a consultar el estado de la solicitud.

### Dependencia nativa

Se añadieron `@react-native-community/datetimepicker` `9.2.1` y `expo-clipboard` `58.0.4` con `npx expo install`, compatibles con Expo SDK 58. Expo añadió el plugin de fecha/hora a `app.json`. Ambos son módulos nativos: el development build debe reconstruirse antes de revisar el flujo en el emulador; Metro/HMR no es suficiente. También se alinearon los patchs de Expo (`58.0.26`) y `expo-dev-client` (`58.0.21`) requeridos por la matriz del SDK.

## Límite de recuperación y D-09

No existe un endpoint para listar propuestas propias ni para recuperar una propuesta por `solicitudId`. Por tanto:

- al salir de `ProposalFlow`, la app pierde el `id` y no puede volver a editar o retirar esa propuesta;
- si la creación devuelve `409 PROPUESTA_DUPLICADA`, la app no puede recuperar la propuesta existente;
- no se usa AsyncStorage, caché persistente ni un endpoint inventado para ocultar esta limitación.

La limitación se documenta aquí; la vista no muestra una advertencia persistente. La recuperación y la política de propuestas duplicadas siguen pendientes. La decisión de producto sobre la tarifa quedó resuelta: `tarifaCop` es obligatoria en propuestas nuevas y nullable en históricas.

## Errores y estados

- Resultado incierto en creación: el formulario permanece visible, los campos y el envío se bloquean, y se informa que no se pudo confirmar si la propuesta se registró. No se reintenta automáticamente ni se afirma que no se creó.
- `401`: se limpia la sesión y se vuelve al acceso.
- `403`: mensaje de permiso; la sesión se conserva.
- `400`: se muestran los mensajes de validación del servidor cuando existen.
- `404`: solicitud/propuesta no disponible; en edición/retiro el estado queda no confirmado.
- `409`: conflicto de estado o duplicado. En edición/retiro se ocultan las acciones y no se asume que la propuesta siga activa.
- Respuesta inválida de mutación: en creación se exige que `solicitudId` coincida y que la respuesta repita la `tarifaCop` enviada; en edición, el ID esperado, la misma solicitud/prestador y la misma tarifa; en retiro, el ID esperado y `estado: RETIRADA`. Cualquier contradicción deja el estado no confirmado. La lectura de propuestas históricas sigue aceptando `tarifaCop: null`.
- Red/timeout: error recuperable; se conserva el formulario o la acción para reintento manual.
- Éxito de creación/edición: mensaje de confirmación y estado actualizado con la respuesta real.
- Éxito de retiro: estado `RETIRADA` y acciones ocultas.

## Verificación

### Estática

- `npm run typecheck` → `0`.
- `npm run verify:config` → configuración Expo válida (`3439` bytes).
- `npx expo export --platform android` → `0`, bundle Android de `1126` módulos (`2.7 MB`).
- `git diff --check` → `0`.
- Validación del gateway compilado: la respuesta de creación/edición debe repetir la tarifa; respuesta omitida, `null` o distinta produce `INVALID_RESPONSE`; la lectura histórica acepta `null`.

### API/UI Android

Validado en emulador `emulator-5554` contra backend temporal `:18092`, PostgreSQL temporal `:5438` y datos sintéticos:

- creación de propuesta con `250000` COP y `201`;
- edición de tarifa de `250000` a `350000`, con confirmación en la pantalla del Prestador;
- propuestas recibidas del Cliente muestran el valor actualizado `$350.000` y el texto “Compara disponibilidad, tarifa y mensaje antes de aceptar.”;
- lectura de propuesta histórica con `tarifaCop: null` sin inventar valor;
- respuesta antigua sin `tarifaCop`: la creación queda como “Envío no confirmado”, bloquea el formulario y no muestra éxito.

La matriz HTTP y la persistencia se documentan en el informe de validación de la tarea.

### No verificado

- retiro real desde UI;
- `409` reales de solicitud cerrada/no compatible/duplicada;
- idempotencia/replay: no aplica mientras BE-02 siga abierto;
- presentación del selector nativo en iOS.

## Fuera de alcance

F08 cubre la recepción, comparación y aceptación de propuestas en la app móvil. F07 no añade notificaciones locales, pagos, contacto del Cliente ni recuperación persistente de propuestas.

## Enlaces

- [Oportunidades/F06](opportunities.md)
- [Arquitectura móvil](../architecture/MOBILE_ARCHITECTURE.md)
- [Plan de entrega](../core/DELIVERY_PLAN.md)
- [Solicitudes de corrección backend](../backend-requests/BACKEND_CORRECTION_REQUESTS.md)
