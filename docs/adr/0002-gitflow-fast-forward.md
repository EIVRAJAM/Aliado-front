# ADR 0002 — Gitflow con promoción fast-forward

- **Estado:** aceptada
- **Fecha:** 2026-11-06
- **Alcance:** flujo de ramas del repositorio de la app móvil
- **No ejecuta:** este ADR no crea ramas, no hace commits, merges, pushes ni tags

## Contexto

El repositorio aloja únicamente la app móvil Cliente/Prestador y se integrará con el backend y el panel administrativo de `aliado-prb` mediante contratos API. Se necesita un flujo predecible que mantenga `main` siempre liberable, use `develop` como integración y evite commits de merge que dificulten la lectura del historial y la trazabilidad por feature.

El repositorio no tenía historial cuando se documentó esta decisión. Para iniciar F01 sin escribir en `main`, se creó `develop` como rama huérfana con el commit inicial de la base y desde allí se creó `feature/f01-acceso-identidad`. `main` permanece sin commits. La primera promoción a `main` requerirá autorización y conservar fast-forward.

## Decisión

Usar Gitflow con dos ramas permanentes y promoción exclusivamente fast-forward:

| Rama | Tipo | Propósito |
|---|---|---|
| `main` | permanente | Código liberable y etiquetado. Solo recibe promociones validadas. |
| `develop` | permanente | Integración continua de trabajo terminado. Base de las features. |
| `feature/<id>-<slug>` | temporal | Nueva capacidad o parte de una feature. Sale de `develop`. |
| `fix/<id>-<slug>` | temporal | Corrección no urgente. Sale de `develop`. |
| `chore/<slug>` | temporal | Tooling, dependencias o configuración sin cambio funcional. Sale de `develop`. |
| `docs/<slug>` | temporal | Documentación sin cambio de producto. Sale de `develop`. |
| `release/<version>` | temporal | Estabilización y versión. Sale de `develop`. |
| `hotfix/<version>` | temporal | Corrección urgente de producción. Sale de `main`. |

### Dirección de promoción

```text
feature/fix/chore/docs -> develop -> release/<version> -> main
                                                  |
                                             tag v<version>
main -> hotfix/<version> -> main (tag) -> develop
```

- `feature/*`, `fix/*`, `chore/*` y `docs/*` se integran solo en `develop`.
- `develop` se promueve a `main` mediante una rama `release/<version>`.
- Una `release/*` solo admite estabilización, versión y correcciones; no nuevas features.
- Un `hotfix/*` nace de `main`, vuelve a `main` y después se integra en `develop`.
- No se hacen commits directos a `main` ni a `develop`.

### Condiciones de merge

1. Rama actualizada sobre su base mediante `rebase` (nunca merge de la base hacia la rama).
2. PR revisado y aprobado.
3. CI en verde: `npm ci`, `npm run typecheck` y `npm run doctor`.
4. Sin conflictos, secretos, artefactos generados ni `android/`/`ios/`.
5. Documentación o ADR actualizados si cambió una decisión.
6. Merge local con `git merge --ff-only`; si falla, se rebasa de nuevo y se repite. No usar `--no-ff`.

### Cómo evitar commits de merge

- Rebasear la rama de trabajo sobre el destino antes de integrar.
- Promover con `git merge --ff-only`, de modo que el destino avance sin crear commit de merge.
- No usar `git merge <base>` dentro de la rama de trabajo; usar `git rebase <base>`.
- No usar squash ni merges con `--no-ff`. El historial debe conservar los commits revisados y una relación de ancestro directa.
- En la configuración de GitHub de ramas protegidas, exigir PR y checks; realizar la integración fast-forward desde una cuenta autorizada. Si se habilita el botón de merge, debe ser solo el modo que preserve fast-forward y no crear commits de merge.

### Releases y hotfixes

- `release/<version>`: se corta de `develop`, se valida, se integra con `--ff-only` en `main`, se etiqueta `v<version>` y se integra con `--ff-only` en `develop`; después se elimina.
- `hotfix/<version>`: se corta de `main`, se valida, se integra con `--ff-only` en `main` y se etiqueta.
- Si `main` y `develop` divergen, se detiene la promoción y se resuelve explícitamente; no se fuerza un merge commit para ocultar la divergencia.
- Para devolver un hotfix a `develop` sin merge commit, se crea una rama de sincronización desde `develop`, se reaplican allí los commits del hotfix (`rebase`/`cherry-pick`), se valida y se integra con `--ff-only` en `develop`. Es esperable que esos commits tengan hashes distintos a los de `main`.
- Antes de cortar una release, `main` debe ser ancestro de `develop`. Si no lo es por un hotfix pendiente de sincronizar, se sincroniza primero; de lo contrario el merge fast-forward fallará.

## Consecuencias

- El historial de `main` y `develop` es lineal y cada commit pertenece a una rama revisada.
- Cualquier commit local en `main` o `develop` rompe el modelo; si ocurre, debe regularizarse antes de continuar.
- `develop` quedó creada como rama huérfana con el commit inicial de la base; `main` no fue modificada.
- El detalle operativo y los comandos de referencia están en [`docs/development/GITFLOW.md`](../development/GITFLOW.md).

## Referencias

- Plan general ALIADO: [`aliado-prb/docs/plans/plan-general-ALIADO.md`](../../../aliado-prb/docs/plans/plan-general-ALIADO.md)
- Arquitectura móvil: [`MOBILE_ARCHITECTURE.md`](../architecture/MOBILE_ARCHITECTURE.md)
- Stack y versiones: [`ADR 0001`](0001-stack-y-versiones-movil.md)
