# Arquitectura de la app móvil ALIADO

**Estado:** base inicializada y primera feature móvil (`auth`, SPEC-01) implementada en UI y contrato de integración. El stack está confirmado en [ADR 0001](../adr/0001-stack-y-versiones-movil.md) y la navegación en [ADR 0003](../adr/0003-navegacion-react-navigation.md). La integración real con API, D-04 (sesión segura) y las decisiones funcionales de `aliado-prb` siguen pendientes.

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
│   │   ├── screens/
│   │   ├── services/
│   │   ├── session/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validation/
│   └── shared/
│       ├── api/http-client.ts         # transporte JSON y errores comunes
│       ├── config/env.ts              # variables públicas validadas
│       └── ui/theme.ts                # tokens visuales compartidos
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

La app presenta los flujos Cliente y Prestador según la identidad y permisos devueltos por el backend. En F01 el stack muestra el flujo de acceso sin sesión y una pantalla de sesión autenticada mínima. Las rutas deben responder a sesión ausente, expirada o revocada y a cambios de cuenta. Si el producto confirma que una cuenta puede operar con ambos roles, la selección/cambio de contexto se ajustará al contrato; no se debe inferir del prototipo.

Las rutas protegidas mejoran navegación y presentación, pero nunca sustituyen la verificación de rol y propiedad de recursos en el servidor.

## Integración con API

- Usar una capa de transporte central que gestione URL por entorno, serialización, cancelación y errores comunes.
- Mantener servicios y tipos específicos dentro de su feature; generar o compartir contratos desde OpenAPI cuando el contrato esté aprobado.
- Modelar explícitamente respuestas exitosas, errores recuperables, validaciones, `401`, `403`, `404`, `409` y conectividad intermitente.
- No asumir campos, endpoints o estados que no estén en los SPEC/contratos.
- Las fixtures pueden habilitar trabajo visual temprano, pero deben estar aisladas del adaptador real y no presentarse como integración aceptada.
- Los comandos que admitan reintento conservan su `Idempotency-Key`; una nueva intención de usuario genera una clave distinta.
- La configuración de entorno parte de `.env.example`; las variables reales no se versionan. `EXPO_PUBLIC_API_BASE_URL` debe incluir `/api/v1`; si falta, el adaptador HTTP no simula éxito y la UI informa que la integración está pendiente. `EXPO_PUBLIC_TERMS_VERSION` habilita el registro.

## Estado, formularios y datos locales

Clasificar el estado antes de elegir librerías: estado efímero de pantalla local, estado de servidor asociado a consultas/mutaciones, y sesión/identidad transversal. Mantener local el estado que no requiera compartirse.

Validar entradas en el límite, con reglas alineadas al contrato. Formularios deben representar carga, errores por campo, error del servidor, éxito confirmado y reintento cuando aplique.

En F01 la sesión vive solo en memoria durante la ejecución actual; no se implementa persistencia de tokens mientras D-04 siga abierta. No se usa AsyncStorage, localStorage ni logs para tokens. Cuando D-04 se resuelva, la persistencia se hará en almacenamiento seguro de plataforma y se limpiarán los datos de la identidad anterior al cerrar sesión o cambiar de cuenta.

## UX, accesibilidad y estados

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

Navegación confirmada por [ADR 0003](../adr/0003-navegacion-react-navigation.md): React Navigation 7 con stack nativo.

Siguen pendientes de decisión: herramientas de estado servidor/formularios/pruebas, generación de contratos y las decisiones D-04/D-06/D-07/D-08/D-18 que afectan sesión, archivos, notificaciones e idempotencia.
