# Arquitectura de la app móvil ALIADO

**Estado:** base inicializada, shell autenticado MVP con barra inferior y features `auth` (SPEC-01), `profile` (SPEC-02), `requests` (SPEC-04), `professional-profile` (SPEC-05, parcial), `discovery` (SPEC-03), `opportunities` (SPEC-06), `proposals` (SPEC-07), `services` (SPEC-08), `notifications` (SPEC-09), `trust` (SPEC-10), `reports` (SPEC-11), `formalization` (SPEC-13) y `account-activity` (SPEC-14) implementadas en UI e integración contra backend local. F12 no añade una feature administrativa a la app: el panel React y `/api/v1/admin/**` permanecen fuera de alcance; el login móvil solo distingue cuenta bloqueada y rechaza el rol Administrador. F13 añade una pantalla de formalización de solo lectura para Prestador; no actualiza progreso mientras D-13 siga abierta y no consume UC080. F14 agrega preferencias, historial, exportación CSV, indicadores y actividad desde Mi perfil; no calcula indicadores ni inventa filtros o enlaces no contratados. La exportación se validó con menú nativo; BE-20 documenta el defecto de raíz relativa del almacenamiento backend. El stack está confirmado en [ADR 0001](../adr/0001-stack-y-versiones-movil.md) y la navegación en [ADR 0003](../adr/0003-navegacion-react-navigation.md). La API desplegada, D-04 (sesión segura), D-06/D-07 (storage/archivos), D-09 (recuperación de propuestas), D-10 (mensajería tras cierre) y otras decisiones funcionales de `aliado-prb` siguen pendientes.

## Propósito y límites

Este repositorio contiene la app móvil para los roles **Cliente** y **Prestador**, construida con **React Native y TypeScript** sobre **Expo SDK 58**, con **Continuous Native Generation (CNG)** y **development builds**. La app consume la API REST/JSON del backend ALIADO. No accede directamente a PostgreSQL, Supabase ni a proveedores de infraestructura.

El panel web de Administrador y el backend son clientes y componentes separados. Las capacidades compartidas se expresan mediante contratos API aprobados; no se acoplan los clientes a entidades internas del backend.

## Principios

- Organizar principalmente por dominio/feature, manteniendo UI, coordinación de presentación, validación e integración cercanas a su contexto.
- Mantener en `shared` solo capacidades realmente transversales y reutilizadas.
- Respetar la dirección `pantalla/componente → hook o coordinador → caso de uso/servicio de feature → cliente API → backend`.
- No introducir una capa sin responsabilidad concreta ni replicar por anticipado toda la estructura de la guía.
- Considerar no confiables los datos de API, formularios, deep links y almacenamiento local.
- La autorización efectiva pertenece al servidor; la navegación por rol solo adapta la experiencia.
- Las capacidades Could/Future deben permanecer apagadas por defecto y no ser necesarias para los flujos MVP.

## Estado actual de la estructura

La estructura actual contiene el bootstrap, la navegación y la feature de acceso. No hay features vacías ni capas sin consumidor.

```text
.
├── index.ts
├── src/
│   ├── bootstrap/App.tsx              # bootstrap, providers y navegación raíz
│   ├── navigation/                    # RootNavigator y tipos de rutas
│   ├── features/auth/                 # SPEC-01: acceso e identidad
│   │   ├── components/
│   │   ├── screens/                   # login, registro y recuperación
│   │   ├── services/
│   │   ├── session/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validation/
│   ├── features/home/                 # Inicio autenticado y resumen de cuenta
│   │   └── screens/
│   ├── features/profile/              # SPEC-02: perfil, privacidad y eliminación
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validation/
│   ├── features/requests/             # SPEC-04: solicitudes, catálogo y fotos
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validation/
│   ├── features/professional-profile/ # SPEC-05: creación inicial, vista previa y agenda (parcial)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── features/discovery/            # SPEC-03: búsqueda y perfil público
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── features/opportunities/        # SPEC-06: tablero, detalle y avisos del Prestador
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── features/proposals/            # SPEC-07: creación, edición y retiro de propuestas
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validation/
│   ├── features/services/             # SPEC-08: contratación, ciclo y mensajes
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── shared/
│       ├── api/http-client.ts         # transporte JSON y errores comunes
│       ├── config/env.ts              # variables públicas validadas
│       └── ui/                        # tema y componentes compartidos
├── assets/
├── app.json
├── package.json
├── tsconfig.json
└── .github/workflows/ci.yml
```

La estructura objetivo se ampliará con cada feature; no implica crear hoy todos estos directorios:

```text
src/
├── bootstrap/             # bootstrap y providers de aplicación
├── navigation/            # navegación raíz y flujos por rol (se creará al implementar navegación)
├── features/
│   ├── auth/              # se creará con la primera feature que lo requiera
│   ├── home/              # inicio autenticado
│   ├── profile/
│   ├── discovery/
│   ├── service-requests/
│   └── ...                # añadir con el desarrollo de cada feature
├── shared/
│   ├── api/               # transporte, errores y contratos transversales
│   ├── ui/                # primitivas realmente compartidas
│   ├── config/            # configuración validada por entorno
│   └── utils/             # utilidades puras transversales
└── assets/
```

Cada feature incorpora únicamente las partes que necesita. Una forma de referencia, no obligatoria en todos los módulos:

```text
features/<feature>/
├── screens/
├── components/
├── hooks/
├── use-cases/             # solo si coordina una operación con valor propio
├── services/              # integración específica de la feature
├── types/
├── validation/
└── utils/
```

Los nombres finales deben seguir las convenciones del stack ratificado. No crear carpetas vacías ni trasladar lógica específica de negocio a `shared`.

## Continuous Native Generation (CNG)

- `android/` e `ios/` no se versionan; están excluidos en `.gitignore`.
- Los proyectos nativos se generan con `npm run prebuild` o de forma implícita con `npm run android` / `npm run ios`.
- `app.json` es la fuente de configuración nativa. Los cambios de configuración se hacen ahí o mediante config plugins, no editando directorios generados.
- Si una necesidad concreta obliga a versionar código nativo, se documentará con un ADR antes de cambiar la política.
- Los development builds usan `expo-dev-client`; Expo Go no es el objetivo de desarrollo.

## Navegación y roles

La navegación usa React Navigation 7 con stack nativo, según [ADR 0003](../adr/0003-navegacion-react-navigation.md). `src/navigation/RootNavigator.tsx` contiene la raíz y `src/navigation/types.ts` los tipos de rutas. Expo Router no se adopta en esta fase. El bootstrap vive en `src/bootstrap/` para no usar el directorio reservado `src/app/` de Expo Router y evitar su detección accidental. Si se adopta Expo Router más adelante, `src/app/` pasará a ser su directorio de rutas y el bootstrap se reubicará con un ADR de migración.

La app presenta los flujos Cliente y Prestador según la identidad y permisos devueltos por el backend. Sin sesión, el stack muestra acceso, registro y recuperación. Con sesión, el stack raíz contiene `MainTabs` y las subpantallas; `MainTabs` separa las superficies principales por rol:

- **Cliente:** Inicio, Buscar y Mi perfil.
- **Prestador:** Inicio, Profesional y Mi perfil.

Los formularios, detalles, edición, privacidad, creación de perfil, perfil público, flujo de propuesta y pantallas de servicio se abren fuera de la barra inferior. `Inicio` es la superficie operativa por rol: para Cliente muestra todas sus solicitudes reales y la acción de crear una; para Prestador, todas las oportunidades compatibles con filtros, resultados y acceso al detalle. Ambos reutilizan los tableros y hooks de F04/F06. Las antiguas pestañas Solicitudes y Oportunidades se retiraron para no duplicar la misma superficie. No usa métricas, datos no disponibles ni tarjetas de cuenta duplicadas. Ver [Inicio por rol](../features/home.md). `Cerrar sesión` vive al final de `Mi perfil`, junto al aviso de sesión en memoria y separado visualmente de la acción destructiva “Eliminar cuenta”. Las rutas deben responder a sesión ausente, expirada o revocada y a cambios de cuenta. Si el producto confirma que una cuenta puede operar con ambos roles, la selección/cambio de contexto se ajustará al contrato; no se debe inferir del prototipo.

Deep links: F03 registra `aliado://prestadores/:providerId` con React Navigation y rutas anidadas de tabs (`buscar`, `perfil`, `perfil-profesional`). Si no hay sesión, el ID se conserva y se navega después del acceso; la pantalla de detalle solo monta la consulta para `CLIENTE` y muestra acceso no permitido para otros roles. La validación de UUID se hace antes de navegar. F07 añade `ProposalFlow` como subpantalla del stack para Prestador; recibe el contexto de la oportunidad desde el detalle y no crea una pestaña ni un endpoint de recuperación. F08 añade `ReceivedProposals` para Cliente y `ServiceDetail` compartido; no hay listado de servicios. El `servicioId` procede de la aceptación o de una notificación y se pierde al salir del contexto. F09 usa la campana de Inicio para `Notifications`, una bandeja unificada de oportunidades, propuestas y servicios; la antigua ruta `OpportunityNotifications` se retiró. F10 inserta calificación/reseña en `ServiceDetail`, verificación en `ProfessionalProfile` y el reporte de reseña como modal en las vistas públicas. Añade `MyRatings` al stack solo para Cliente, como historial privado pendiente de BE-11. F11 no agrega rutas: incorpora modales de reporte en el perfil público y en el detalle del servicio, y evidencia posterior al `reporteId` en el flujo de reseña de F10. F13 añade `Formalization` al stack solo para Prestador y lo enlaza desde Mi perfil; la pantalla consulta la ruta y el progreso persistido, abre enlaces externos disponibles y mantiene un aviso no certificante. F14 añade `AccountActivity` y sus subpantallas de historial, preferencias, indicadores y actividad; la exportación usa el CSV autenticado y `expo-sharing`.

Las rutas protegidas mejoran navegación y presentación, pero nunca sustituyen la verificación de rol y propiedad de recursos en el servidor.

## Integración con API

- Usar una capa de transporte central que gestione URL por entorno, serialización, cancelación y errores comunes.
- Mantener servicios y tipos específicos dentro de su feature; generar o compartir contratos desde OpenAPI cuando el contrato esté aprobado.
- En F01, el cliente HTTP sigue el OpenAPI entregado por backend; las diferencias con el plan funcional se registran en [F01 — Acceso e identidad](../features/auth.md). F02, F04, F06, F07, F08 y F10 registran sus propias diferencias en [F02](../features/profile.md), [F04](../features/requests.md), [F06](../features/opportunities.md), [F07](../features/proposals.md), [F08](../features/services.md) y [F10](../features/trust.md).
- F04 mantiene el contrato real del backend: la creación usa JSON, las fotos usan multipart y la respuesta del detalle solo expone claves de archivo. La cabecera `Idempotency-Key` está implementada en el cliente pero desactivada mientras el backend no corrija el fallo de `idempotency_keys`; ver [F04](../features/requests.md).
- F06 consume `GET /api/v1/oportunidades` y `GET /api/v1/oportunidades/{solicitudId}`. Los filtros de categoría y urgencia se delegan al servidor; la app no calcula compatibilidad ni filtra localmente. Las fotos llegan como claves internas sin contrato de descarga. Los avisos se consultan desde la bandeja unificada F09, sin push ni polling; ver [F06](../features/opportunities.md).
- F07 consume `POST /api/v1/propuestas`, `PUT /api/v1/propuestas/{id}` y `POST /api/v1/propuestas/{id}/retirar`. La creación no envía `Idempotency-Key` mientras BE-02 siga abierto; el cliente conserva el `id` solo en el flujo local. No existe endpoint de propuestas propias y `GET /solicitudes/{id}/propuestas` es exclusivo de Cliente. La UI sigue el controlador/DTO real, no los esquemas desalineados de OpenAPI; ver [F07](../features/proposals.md).
- F08 consume `GET /solicitudes/{id}/propuestas`, `POST /propuestas/{id}/aceptar`, detalle de servicio, transiciones, historial y mensajes. No hay endpoint de listado de servicios; el Cliente abre el `servicioId` devuelto por la aceptación y el Prestador desde avisos. No se envían cabeceras de idempotencia. El canal de mensajes depende de `comunicacionHabilitada`; D-10 sigue abierta; ver [F08](../features/services.md).
- F09 consume `GET /notificaciones` para una bandeja unificada accesible desde la campana de Inicio. Ordena por `fechaGeneracion` descendente y navega a oportunidad, propuestas o servicio solo con los IDs disponibles; si falta el contexto, vuelve a Inicio. No hay push, tokens, leído/no leído ni paginación; D-08 sigue abierta; ver [F09](../features/notifications.md).
- F11 consume reportes de usuario/servicio, evidencia multipart `archivo`, estado propio por ID y reutiliza la evidencia en reportes de reseña. No hay listado de reportes propios; BE-12 sigue abierto. No se inventan estados ni historial; ver [F11](../features/reports.md).
- F13 consume `GET /formalizacion/ruta` y `GET /formalizacion/progreso`, ambos para Prestador, y refresca `GET /formalizacion/enlaces/{id}` antes de abrir un enlace externo. Trata `404 SIN_PROGRESO` como ausencia de avance y los fallos de consulta como estado desconocido, sin repetir ausencia en las tarjetas. No usa `PUT /progreso` ni `/formalizacion/vinculacion`; D-13 sigue abierta. Ver [F13](../features/formalization.md).
- F14 consume preferencias, historial paginado, exportación CSV autenticada, indicadores y actividad. No implementa filtros ni enlaces no presentes en el contrato; la fórmula de indicadores y el formato/ventana de exportación dependen de D-15. Ver [F14](../features/account-activity.md).
- F10 consume calificación/reseña, verificación propia (multipart `documentos`) y reporte de reseña. El flujo móvil exige ambos campos, pero el backend persiste calificación y reseña en operaciones separadas; BE-10 documenta la atomicidad pendiente y BE-08 la recuperación. La reputación y las reseñas públicas se mantienen desde los DTO de F03/F05, sin duplicar llamadas. No se inventan MIME, tamaños ni comprobantes. El historial privado consulta una ruta propuesta en BE-11 y muestra no disponible si falta. BE-08/BE-09/BE-10/BE-11 y D-07 siguen abiertas; ver [F10](../features/trust.md).
- Modelar explícitamente respuestas exitosas, errores recuperables, validaciones, `401`, `403`, `404`, `409` y conectividad intermitente.
- No asumir campos, endpoints o estados que no estén en los SPEC/contratos.
- Las fixtures pueden habilitar trabajo visual temprano, pero deben estar aisladas del adaptador real y no presentarse como integración aceptada.
- Los comandos que admitan reintento conservan su `Idempotency-Key` cuando el backend lo soporta; una nueva intención de usuario genera una clave distinta. En F04 y F07 la cabecera está desactivada porque el backend falla al persistirla; ante un resultado incierto se bloquea el reenvío y no se presenta la operación como segura.
- La configuración de entorno parte de `.env.example`; las variables reales no se versionan. `EXPO_PUBLIC_API_BASE_URL` debe apuntar al servidor sin `/api/v1`; el cliente añade el prefijo `/api/v1` definido por OpenAPI. Si falta, el adaptador HTTP no simula éxito y la UI informa que la integración está pendiente. `EXPO_PUBLIC_TERMS_VERSION` habilita el registro.

## Estado, formularios y datos locales

Clasificar el estado antes de elegir librerías: estado efímero de pantalla local, estado de servidor asociado a consultas/mutaciones, y sesión/identidad transversal. Mantener local el estado que no requiera compartirse.

Validar entradas en el límite, con reglas alineadas al contrato. Formularios deben representar carga, errores por campo, error del servidor, éxito confirmado y reintento cuando aplique.

En F01 la sesión vive solo en memoria durante la ejecución actual; no se implementa persistencia de tokens mientras D-04 siga abierta. No se usa AsyncStorage, localStorage ni logs para tokens. F07 tampoco persiste el `id` de la propuesta. F08 no persiste el `servicioId`: al salir de la aceptación o del aviso se pierde porque no existe un endpoint de listado de servicios; D-09/D-10 siguen abiertas. Cuando D-04 se resuelva, la persistencia se hará en almacenamiento seguro de plataforma y se limpiarán los datos de la identidad anterior.

## UX, accesibilidad y estados

Patrón visual vigente:

- **Acceso:** fondo azul oscuro, marca ALIADO y formulario dentro de una tarjeta blanca con esquinas amplias.
- **App autenticada:** fondo claro, cabecera blanca compacta con marca, título y acción de volver cuando aplique.
- **Perfil:** avatar/resumen de identidad y filas de acción en tarjetas con icono, texto secundario y chevron; los botones primarios se reservan para guardar o confirmar.
- **Solicitudes:** tarjetas con acento de estado, categoría como contexto, descripción como título visual y metadatos con iconos; el formulario agrupa secciones y el detalle separa hero, resumen y acciones contextuales.
- **Shell autenticado:** barra inferior persistente con iconos Ionicons, estado activo/inactivo, safe area y feedback nativo; las subpantallas no muestran la barra. `Inicio` presenta el contenido operativo por rol y acceso a avisos de servicio; para Prestador usa tarjetas de oportunidad con acento de urgencia, filtros en modal y detalle compacto. `Propuestas` abre formulario, estado y edición/retiro. `Servicios` comparte detalle, acciones por rol/estado, historial y mensajes; las propuestas recibidas del Cliente se comparan y aceptan desde la solicitud. `Mi perfil` concentra cuenta y `Cerrar sesión`.
- **Estados:** los avisos de configuración de API y de versión de términos no se ocultan para mejorar la apariencia; se mantienen visibles cuando corresponden.

Cada pantalla debe considerar, según corresponda: carga, vacío, datos, error recuperable, validación, sesión expirada, permiso denegado, conflicto de versión y acción en curso. La experiencia móvil debe cuidar etiquetas accesibles, lector de pantalla, foco, tamaño táctil y navegación atrás.

No mostrar éxito antes de confirmación del backend ni reintentar automáticamente todos los comandos.

## Calidad y aceptación

La base actual valida instalación limpia, TypeScript estricto y configuración Expo:

- `npm ci` instala desde el lockfile.
- `npm run typecheck` ejecuta `tsc --noEmit`.
- `npm run verify:config` valida `expo config --json --full` con captura por archivos temporales.
- `npm run doctor` valida Expo Config y ejecuta `expo-doctor`; el runner captura en archivos los subprocesos JSON para evitar la pérdida de salida por pipes/sockets. Si algo falla, termina distinto de cero.
- `.github/workflows/ci.yml` aplica esas validaciones en `main`, `develop` y PR hacia ambas ramas.

La estrategia de pruebas de interacción, builds nativos y E2E sigue pendiente de las fases que implementen producto. Cada feature se acepta frente a sus escenarios SPEC y tareas; un mock o una captura no acredita integración con API real.

## Tecnologías

Confirmadas por [ADR 0001](../adr/0001-stack-y-versiones-movil.md): Expo SDK 58, React Native 0.88.1, React 19.3.0, TypeScript 6.0.x, Node 24 LTS y npm con lockfile. La API es REST/JSON.

Navegación confirmada por [ADR 0003](../adr/0003-navegacion-react-navigation.md): React Navigation 7 con stack nativo y bottom tabs para el shell autenticado.

Siguen pendientes de decisión: herramientas de estado servidor/formularios/pruebas, generación de contratos y las decisiones D-03/D-04/D-06/D-07/D-08/D-18 que afectan reglas temporales, sesión, archivos, notificaciones e idempotencia. F09 mantiene la bandeja funcional sin push ni estado de lectura hasta que D-08 se concrete. F04 usa `expo-image-picker` para la selección nativa de fotos. F10 añade `expo-document-picker` `~58.0.5` para documentos de verificación y mantiene la política de archivos en D-07. F07 añade `@react-native-community/datetimepicker` `9.2.1` para fecha/hora y `expo-clipboard` `58.0.4` para copiar IDs; son dependencias nativas y requieren development build. F07 también alinea los patchs de Expo y `expo-dev-client` con la matriz del SDK.
