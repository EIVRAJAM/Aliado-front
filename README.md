# ALIADO — App móvil Cliente/Prestador

Repositorio de la aplicación móvil de ALIADO, construida con **Expo SDK 58**, **React Native 0.88.1**, **TypeScript 6.0.x** y **Continuous Native Generation (CNG)**. El backend, la base de datos y el panel administrativo viven en `../aliado-prb` y no forman parte de este repositorio.

La fase 1 deja únicamente la base técnica y documental: no hay funcionalidades de producto ni integración real con la API.

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

El archivo `.env` es local y no se versiona. En esta fase la variable de API todavía no se consume; completa su valor cuando exista el contrato de entorno.

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
│   └── app/
│       └── App.tsx
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

Las carpetas `src/features/`, `src/navigation/` y `src/shared/` se crearán cuando una feature real las necesite; no se versionan carpetas vacías. La estructura objetivo y sus reglas están en [docs/architecture/MOBILE_ARCHITECTURE.md](docs/architecture/MOBILE_ARCHITECTURE.md).

## Documentación

- Índice local: [docs/README.md](docs/README.md)
- Arquitectura móvil: [docs/architecture/MOBILE_ARCHITECTURE.md](docs/architecture/MOBILE_ARCHITECTURE.md)
- Entrega y alcance: [docs/core/DELIVERY_PLAN.md](docs/core/DELIVERY_PLAN.md)
- Gitflow: [docs/development/GITFLOW.md](docs/development/GITFLOW.md)
- ADR de stack: [docs/adr/0001-stack-y-versiones-movil.md](docs/adr/0001-stack-y-versiones-movil.md)
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
| `npm run verify:config` | OK, JSON válido de 2171 bytes |
| `npm run doctor` | OK, 20/20 con corrección de captura de subprocesos |
| `npx expo config --json --full` | OK, JSON interpretado |

La corrección se verificó también simulando el fallo original: un CLI de Expo que devuelve vacío cuando `stdout` es socket/FIFO. Sin el parche, Doctor falla con el error de parseo; con el parche, completa 20/20. Ver [docs/development/VALIDATION.md](docs/development/VALIDATION.md).

## Estado y pendientes

- Stack y versiones: [ADR 0001](docs/adr/0001-stack-y-versiones-movil.md).
- Flujo de ramas: [ADR 0002](docs/adr/0002-gitflow-fast-forward.md). `develop` todavía no existe y no se cambió de rama en fase 1.
- Pendientes que bloquean la siguiente fase: D-04 (sesión segura), contratos API mínimos, decisión de navegación y cierre de las decisiones funcionales indicadas en [docs/adr/README.md](docs/adr/README.md).
- Los iconos actuales son provisionales y los identificadores `com.aliado.movil` deben confirmarse antes de publicar.
