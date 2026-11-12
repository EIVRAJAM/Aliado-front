# ADR 0001 — Stack, versiones y gestor de paquetes de la app móvil

- **Estado:** aceptada
- **Fecha:** 2026-11-06
- **Alcance:** app móvil Cliente/Prestador de este repositorio
- **Resuelve:** la parte móvil de D-01 en `aliado-prb`

## Contexto

D-01 exigía fijar versiones compatibles y un gestor de paquetes antes de inicializar el cliente. La documentación previa de este repositorio mantenía la decisión pendiente y no fijaba versiones. Expo publica nuevas versiones de SDK varias veces al año y cada SDK fija una versión objetivo de React Native, React y Node, por lo que la elección debía verificarse contra la matriz oficial vigente y no copiarse del prototipo ni de otro cliente.

La app usará Continuous Native Generation (CNG) y development builds. En esta fase no se implementan funcionalidades de producto ni se añaden librerías de estado, formularios, navegación o UI.

## Decisión

| Componente | Versión fijada | Motivo |
|---|---|---|
| Node.js | `24.14.1` (`.nvmrc`); `engines: >=24.3.0 <25` | Node 24 es LTS y cumple el mínimo de Expo SDK 58 (`22.13.x`). Se fija una línea LTS para evitar deriva entre desarrollo y CI. |
| npm | `11.11.0` (`packageManager`) | Gestor integrado con Node y con el flujo oficial de Expo; `package-lock.json` reproducible y menos configuración adicional que pnpm/yarn. |
| Expo SDK | `~58.0.25` | SDK 58 estable; patch actualizado el 2026-11-12 por recomendación de `expo install --check`. |
| React Native | `0.88.1` | Versión objetivo de Expo SDK 58. |
| React | `19.3.0` | Versión objetivo de Expo SDK 58. |
| TypeScript | `~6.0.3` | Versión validada por la plantilla oficial `blank-typescript` de SDK 58. No se adopta TypeScript 7 para evitar una combinación no validada por Expo. |
| `@types/react` | `~19.3.0` | Tipos compatibles con React 19.3. |
| `expo-status-bar` | `~58.0.5` | Módulo base de la plantilla; incluye config plugin nativo desde este patch. |
| `expo-dev-client` | `~58.0.20` | Requerido por la estrategia de development builds. |
| `expo-doctor` | `^1.21.6` | Validación de configuración y dependencias en local y CI. |

### Actualización de patch 2026-11-12

Motivo: Expo Doctor reportó 19/20 por desalineación de versiones patch recomendadas para SDK 58. `npx expo install --check` indicó actualizar `expo` a `~58.0.25`, `expo-dev-client` a `~58.0.20` y `expo-status-bar` a `~58.0.5`. Se aplicó `npx expo install --fix`; el lockfile se actualizó y Expo CLI añadió el config plugin `expo-status-bar` en `app.json`.

Compatibilidad: se mantiene Expo SDK 58, React Native 0.88.1, React 19.3.0 y Node 24.14.1; no cambian las peer dependencies principales. Verificación posterior: `expo install --check` sin pendientes, `npm run doctor` 20/20, `npm run typecheck` y export Android correctos.

Decisiones complementarias:

- **CNG:** `android/` e `ios/` no se versionan. Se generan con `npx expo prebuild` o de forma implícita con `expo run:android` / `expo run:ios`. Si una necesidad concreta exige versionar código nativo, se registrará un ADR antes de hacerlo.
- **Development builds:** se usa `expo-dev-client` y `expo start --dev-client`; Expo Go no es el objetivo de desarrollo de ALIADO.
- **Dependencias nativas:** se instalarán con `npx expo install` para respetar las versiones compatibles del SDK.
- **Lockfile:** `package-lock.json` se versiona. `node_modules/` no.
- **Identificadores nativos:** `com.aliado.movil` es un valor inicial para permitir prebuild/build; debe confirmarse con la organización antes de publicar en tiendas.
- **Navegación:** se decidió al iniciar F01 en [ADR 0003](0003-navegacion-react-navigation.md), con React Navigation 7 y stack nativo.

## Alternativas consideradas

- **Node 22.13+:** válido para Expo SDK 58, pero se prefiere Node 24 LTS como línea única del proyecto.
- **pnpm o yarn:** pueden aportar velocidad o workspaces, pero no hay monorepo en este repositorio y npm reduce configuración y riesgo de resolución no hoisted con Expo.
- **Expo SDK 57:** soportado, pero SDK 58 es el estable vigente y evita iniciar con una línea anterior.
- **TypeScript 7:** disponible en el registro, pero no es la versión usada por la plantilla oficial del SDK; adoptarlo ahora introduciría una variable no validada.
- **Expo Router u otra navegación:** no se instala en fase 1; F01 adoptó React Navigation según ADR 0003.

## Consecuencias

- Cualquier actualización de SDK, React Native, React, Node o TypeScript requiere revisar la matriz oficial y actualizar este ADR junto con el lockfile.
- El CI instala con `npm ci`, usa la versión de `.nvmrc` y ejecuta `typecheck` y `expo-doctor`.
- Los comandos que generan proyectos nativos requieren Android SDK/Xcode en la máquina; el CI mínimo no compila binarios nativos.
- No se deben añadir dependencias exóticas con `npm install` sin pasar por `npx expo install` cuando sean módulos Expo o nativos.
- Al 2026-11-12, `npm audit` reporta 3 vulnerabilidades moderadas en dependencias transitivas del tooling de Expo. No se aplica `npm audit fix --force` porque degradaría Expo a SDK 53; se revisará al actualizar el SDK.
- D-04 (sesión, expiración, revocación y almacenamiento seguro) sigue pendiente y no se resuelve con este ADR.

## Fuentes verificadas

- Matriz oficial de versiones de Expo: <https://docs.expo.dev/versions/latest/>
- Notas de Expo SDK 58: <https://expo.dev/changelog/sdk-58>
- Plantilla oficial `expo-template-blank-typescript` (SDK 58), consultada en el registro npm el 2026-11-06.
- Decisiones de origen: [`aliado-prb/docs/tasks/03-decisiones-y-dependencias.md`](../../../aliado-prb/docs/tasks/03-decisiones-y-dependencias.md)
- Arquitectura y stack de origen: [`aliado-prb/docs/tasks/01-arquitectura-y-stack.md`](../../../aliado-prb/docs/tasks/01-arquitectura-y-stack.md)
