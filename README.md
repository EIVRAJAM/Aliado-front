# ALIADO — App móvil Cliente/Prestador

Repositorio de la aplicación móvil de ALIADO, construida con **Expo SDK 58**, **React Native 0.88.1**, **TypeScript 6.0.x** y **Continuous Native Generation (CNG)**. El backend, la base de datos y el panel administrativo viven en `../aliado-prb` y no forman parte de este repositorio.

La base técnica está lista. F01 (acceso e identidad), F02 (perfil) y F04 (solicitudes de servicio) tienen UI, validación e integración HTTP verificada contra backend local. La autenticación real sigue pendiente de API desplegada, D-04 y configuración de términos; no hay cuentas demo ni sesión simulada.

## Requisitos

- Node.js `24.14.1` (ver `.nvmrc`; SDK 58 exige como mínimo 22.13).
- npm `11.11.0`.
- Android SDK y un emulador/dispositivo para desarrollo Android.
- Xcode y un simulador/dispositivo para desarrollo iOS (solo macOS).

## Inicio rápido

```bash
nvm use
npm ci
cp .env.example .env
npm run typecheck
npm run verify:config
npm run doctor
```

El archivo `.env` es local y no se versiona. `EXPO_PUBLIC_API_BASE_URL` debe apuntar al servidor sin `/api/v1` (el cliente añade el prefijo del OpenAPI); `EXPO_PUBLIC_TERMS_VERSION` debe contener la versión aprobada de términos. Sin esos valores, F01 muestra el bloqueo correspondiente y no simula autenticación.

## Comandos

| Comando | Uso |
|---|---|
| `npm start` | Inicia Metro para un development build (`expo start --dev-client`). |
| `npm run android` | Genera/actualiza el proyecto nativo si hace falta, compila e instala en Android. |
| `npm run ios` | Genera/actualiza el proyecto nativo si hace falta, compila e instala en iOS (macOS). |
| `npm run prebuild` | Genera `android/` e `ios/` con CNG sin compilar. |
| `npm run prebuild:clean` | Regenera los proyectos nativos desde cero. |
| `npm run build:android` | Build local de release Android (requiere toolchain y firma). |
| `npm run build:ios` | Build local de release iOS (requiere macOS y firma). |
| `npm run typecheck` | Verifica TypeScript en modo estricto sin emitir. |
| `npm run verify:config` | Valida `expo config --json --full` con captura por archivos temporales. |
| `npm run doctor` | Valida Expo Config y ejecuta `expo-doctor` completo con corrección de captura de subprocesos JSON. |

Los comandos nativos requieren SDKs locales y no se ejecutan en el CI mínimo. Las dependencias de Expo se instalan con `npx expo install <paquete>` para conservar la matriz de compatibilidad.

## CNG y directorios nativos

`android/` e `ios/` son artefactos generados y están en `.gitignore`; no se versionan. Los cambios de configuración nativa se hacen en `app.json` o mediante config plugins. Si alguna necesidad concreta exige versionar código nativo, primero se registra un ADR.

## Estructura actual

```text
.
├── index.ts
├── src/
│   ├── bootstrap/App.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── features/auth/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── session/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validation/
│   ├── features/profile/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validation/
│   ├── features/requests/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validation/
│   └── shared/
│       ├── api/http-client.ts
│       ├── config/env.ts
│       └── ui/
├── assets/
├── app.json
├── package.json
├── scripts/
│   ├── doctor.mjs
│   ├── expo-doctor-spawn-patch.cjs
│   └── run-expo-doctor.mjs
├── tsconfig.json
├── .env.example
├── .github/workflows/ci.yml
└── docs/
```

La estructura se amplía solo cuando una feature real lo necesita. La arquitectura y sus reglas están en [docs/architecture/MOBILE_ARCHITECTURE.md](docs/architecture/MOBILE_ARCHITECTURE.md); el alcance de F01 y sus bloqueos en [docs/features/auth.md](docs/features/auth.md).

## Documentación

- Índice local: [docs/README.md](docs/README.md)
- Arquitectura móvil: [docs/architecture/MOBILE_ARCHITECTURE.md](docs/architecture/MOBILE_ARCHITECTURE.md)
- F01 Acceso e identidad: [docs/features/auth.md](docs/features/auth.md)
- F02 Perfil, privacidad y eliminación: [docs/features/profile.md](docs/features/profile.md)
- F04 Solicitudes de servicio: [docs/features/requests.md](docs/features/requests.md)
- Entrega y alcance: [docs/core/DELIVERY_PLAN.md](docs/core/DELIVERY_PLAN.md)
- Gitflow: [docs/development/GITFLOW.md](docs/development/GITFLOW.md)
- ADRs: [docs/adr/README.md](docs/adr/README.md)
- Fuente funcional de ALIADO: `../aliado-prb/docs`

## Calidad

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) ejecuta en cada push a `main`/`develop` y en PR hacia ambas ramas:

1. `npm ci`
2. `npm run typecheck`
3. `npm run verify:config`
4. `npm run doctor`

`npm run doctor` usa [`scripts/doctor.mjs`](scripts/doctor.mjs): valida antes `expo config --json --full` capturando `stdout`/`stderr` en archivos temporales, ejecuta Expo Doctor y propaga su código de salida. El runner [`scripts/run-expo-doctor.mjs`](scripts/run-expo-doctor.mjs) aplica un parche que captura en archivos los subprocesos JSON de Expo Doctor, evitando la pérdida de salida por pipes/sockets. Si algo falla, el comando termina distinto de cero. El diagnóstico completo está en [docs/development/VALIDATION.md](docs/development/VALIDATION.md).

No publica, despliega ni compila binarios nativos.

## Estado de validación

Verificado con Node 24.14.1 y npm 11.11.0:

| Control | Resultado |
|---|---|
| `npm ci` | OK |
| `npm run typecheck` | OK |
| `npm run verify:config` | OK, JSON válido de 2894 bytes |
| `npm run doctor` | OK, 20/20 en la última ejecución tras actualizar los patches de Expo. Puede fallar por red. |
| `npx expo config --json --full` | OK, JSON interpretado |

La corrección de captura se verificó simulando el fallo original y el parche sigue activo. La desalineación de patches de Expo se resolvió con `npx expo install --fix` y quedó documentada en el ADR 0001; `npm run doctor` pasó 20/20 en la ejecución posterior. El CI ejecuta `npm run doctor` como paso obligatorio, sin `continue-on-error`, y un fallo de red seguirá haciendo fallar el job. Ver [docs/development/VALIDATION.md](docs/development/VALIDATION.md).

## Estado y pendientes

- Stack y versiones: [ADR 0001](docs/adr/0001-stack-y-versiones-movil.md).
- Flujo de ramas: [ADR 0002](docs/adr/0002-gitflow-fast-forward.md). `develop` integra F01/F02 y F04 se desarrolla en `feature/f04-solicitudes-servicio`.
- Navegación: [ADR 0003](docs/adr/0003-navegacion-react-navigation.md).
- F01: UI, validación y contrato de integración implementados; la autenticación real sigue bloqueada por API desplegada, D-04 y versión de términos. Ver [docs/features/auth.md](docs/features/auth.md).
- F02: perfil propio, edición, ubicación, visibilidad, vista pública y eliminación implementados; D-05 sigue pendiente. Ver [docs/features/profile.md](docs/features/profile.md).
- F04: solicitudes propias, borrador, publicación, edición, cancelación y fotos opcionales implementados; no se declara cerrada mientras la idempotencia server-side y la gestión de fotos existentes sigan bloqueadas. Ver [docs/features/requests.md](docs/features/requests.md).
- Pendientes que bloquean la siguiente fase: D-03 (regla temporal), D-04 (sesión segura), D-05 (eliminación/retención), D-06/D-07 (storage/archivos), contrato API desplegado, versión de términos, canal/deep link de recuperación y cierre de las decisiones indicadas en [docs/adr/README.md](docs/adr/README.md).
- Los iconos actuales son provisionales y los identificadores `com.aliado.movil` deben confirmarse antes de publicar.
