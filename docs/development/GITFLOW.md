# Flujo Gitflow con fast-forward

Este documento operativiza la decisión [ADR 0002](../adr/0002-gitflow-fast-forward.md). No autoriza por sí mismo a crear ramas, hacer merges, pushes ni tags; cada operación requiere la tarea y la autorización correspondientes.

## Estado actual

- `develop` existe como rama huérfana con el commit inicial de la base (`chore(project): establish Expo mobile foundation`), creado porque el repositorio no tenía historial. Integra F01–F14 (F05 parcial); BE-15 y BE-20 quedan pendientes de backend.
- `main` permanece sin commits y no fue modificada.
- F14 se integró localmente mediante fast-forward; no hubo push, tags ni despliegue. La primera promoción a `main` requiere autorización y conservar fast-forward.

## Ramas

| Rama | Origen | Destino | Uso |
|---|---|---|---|
| `main` | — | — | Código liberable; solo promociones validadas. |
| `develop` | `main` | — | Integración de trabajo terminado. |
| `feature/<id>-<slug>` | `develop` | `develop` | Funcionalidad nueva. |
| `fix/<id>-<slug>` | `develop` | `develop` | Corrección no urgente. |
| `chore/<slug>` | `develop` | `develop` | Tooling, dependencias y configuración. |
| `docs/<slug>` | `develop` | `develop` | Documentación. |
| `release/<version>` | `develop` | `main` y `develop` | Estabilización y versión. |
| `hotfix/<version>` | `main` | `main` y `develop` | Corrección urgente de producción. |

Usar identificadores de feature o tarea y un slug corto en minúsculas, por ejemplo `feature/f01-acceso-identidad` o `docs/f01-gitflow`.

## Ciclo de trabajo

1. Actualizar `develop` sin merge: `git switch develop` y `git pull --ff-only`.
2. Crear la rama de trabajo desde `develop` (o desde `main` si es hotfix).
3. Implementar cambios pequeños y verificables.
4. Antes de abrir el PR, rebasear sobre el destino:
   ```bash
   git fetch origin
   git rebase origin/develop
   ```
   Para `release/*` y `hotfix/*`, usar la base correspondiente (`origin/develop` u `origin/main`).
5. Ejecutar las validaciones locales:
   ```bash
   npm ci
   npm run typecheck
   npm run verify:config
   npm run doctor
   ```
6. Abrir PR con alcance, evidencia de validación y decisiones afectadas.
7. Integrar solo cuando el PR cumpla las condiciones siguientes.

No hacer commits directos a `main` ni a `develop`. No mezclar cambios de features distintas en una rama.

## Condiciones de merge

- CI verde (`npm ci`, `typecheck`, `verify:config`, `doctor`).
- PR revisado y aprobado.
- Rama rebasada sobre el destino y sin conflictos.
- Sin secretos, `.env` reales, credenciales, `node_modules/`, `android/` ni `ios/`.
- Sin dependencias de estado, formularios, navegación o UI ajenas al alcance de la feature.
- Documentación o ADR actualizados si se cambió una decisión.
- Lockfile actualizado si cambiaron dependencias.

## Merge fast-forward

El merge se realiza con la rama de trabajo ya rebasada:

```bash
git switch develop
git pull --ff-only
git merge --ff-only feature/<id>-<slug>
```

Si `git merge --ff-only` falla, la rama no está basada en el destino actual. No forzar el merge: rebasear de nuevo y repetir las validaciones.

Prohibido para evitar commits de merge:

- `git merge` de `develop` dentro de una feature (usar `rebase`).
- `git merge --no-ff`.
- `git merge --squash` o squash merge del PR.
- Resolver una divergencia creando un merge commit.

## Releases

1. Verificar que `main` es ancestro de `develop`; si hay un hotfix pendiente de sincronizar, resolverlo antes.
2. Cortar `release/<version>` desde `develop`.
3. Congelar features; solo corregir, actualizar versión y documentación.
4. Validar el PR de release.
5. Integrar en `main` con `--ff-only`; crear el tag `v<version>`.
6. Integrar `main` en `develop` con `--ff-only` para que ambos queden alineados.
7. Eliminar la rama de release.

## Hotfixes

1. Cortar `hotfix/<version>` desde `main`.
2. Corregir y validar.
3. Integrar en `main` con `--ff-only` y etiquetar.
4. Sincronizar con `develop` sin merge commit:
   - crear una rama desde `develop` (por ejemplo `chore/sync-hotfix-<version>`);
   - reaplicar los commits del hotfix con `git cherry-pick` o `git rebase`;
   - validar y integrar en `develop` con `--ff-only`.
5. Eliminar las ramas temporales.

En una sincronización de hotfix es normal que `main` y `develop` tengan commits equivalentes con hashes distintos. Lo prohibido es crear un merge commit para unirlos. Si el fast-forward falla, no forzarlo: rebasear o reaplicar sobre la rama de sincronización y repetir.

## Relación con CI

El workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) valida instalación limpia, TypeScript, Expo Config y Expo Doctor en `push` a `main`/`develop` y en PR hacia ambas ramas. No compila binarios nativos ni publica artefactos en esta fase.

## Regla de gobierno

Ante una duda de ramas, promoción o merge, detener la operación y registrar la decisión. No modificar `aliado-prb` desde este flujo.
