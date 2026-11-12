# Validación local y diagnóstico de Expo Doctor

## Comandos de cierre

```bash
nvm use
node --version   # debe ser v24.14.1 (o >=24.3.0 <25)
npm ci
npm run typecheck
npm run verify:config
npm run doctor
```

`verify:config` valida únicamente `expo config --json --full` con archivos temporales. `doctor` ejecuta la validación completa de Expo Doctor y propaga su código de salida real.

## Causa raíz demostrada

Expo Doctor obtiene la configuración con `getProjectConfigAsync`, que llama a `spawnExpoCLI` con `stdio: "pipe"` y luego ejecuta `JSON.parse` sobre `stdout`. En Linux, `child_process` implementa esos pipes con un socketpair; en el entorno afectado el subproceso terminaba con exit 0 pero el socket no entregaba datos. Resultado exacto:

```text
Failed to parse JSON output from 'npx expo config --json --full'.
Output:
```

La configuración de la app no era el problema: `expo config --json --full` lanzado directamente y con `stdout` redirigido a un archivo devuelve JSON válido. La diferencia estaba en el transporte `pipe`/socket que usa Expo Doctor para su subproceso.

Se reprodujo el fallo de forma controlada con un CLI de Expo simulado que devuelve vacío cuando `stdout` es socket o FIFO. Sin el parche, Expo Doctor terminaba con exit 1 con el error anterior; con el parche, completó 20/20.

## Corrección aplicada

- [`scripts/expo-doctor-spawn-patch.cjs`](../../scripts/expo-doctor-spawn-patch.cjs) intercepta los subprocesos JSON de Expo Doctor (`expo config --json --full`, `expo install --check --json`, `npm explain --json`) y redirige su `stdout`/`stderr` a archivos temporales. Después entrega esos datos a Expo Doctor mediante streams en memoria.
- [`scripts/run-expo-doctor.mjs`](../../scripts/run-expo-doctor.mjs) carga el parche antes de ejecutar Expo Doctor.
- [`scripts/doctor.mjs`](../../scripts/doctor.mjs) valida primero Expo Config con archivos temporales y ejecuta Expo Doctor a través del runner.
- `npm run doctor` conserva el código de salida real de Expo Doctor. Si el parche no cubre un subproceso o Expo Doctor falla por otra causa, el comando falla.

El parche no desactiva chequeos: solo cambia el transporte de salida de los subprocesos JSON. En la ejecución normal y en la simulación del fallo, Expo Doctor ejecutó sus 20 chequeos.

## Evidencia

- `expo config --json --full` directo: exit 0, JSON válido (2326 bytes en el estado actual).
- Config lanzado como subproceso con `stdout` a archivo: exit 0, JSON válido.
- Fallo simulado: CLI que devuelve vacío en socket/FIFO; `npm run doctor` exit 1 con el error de parseo, antes del parche.
- Con parche, misma simulación: `npm run doctor` exit 0, 20/20.
- Ejecución normal con parche: el resultado depende del estado de dependencias y red. En la última ejecución del 2026-11-12, `npm run doctor` terminó con exit 1 y 19/20 por versiones patch de Expo desactualizadas; no fue un fallo de red.
- Los subprocesos interceptados se registran con `stdout` y `stderr` en archivos regulares, no en sockets.

## Reproducción con el entorno correcto

```bash
nvm use
hash -r
which node npm npx
node --version
npm --version
```

Los tres binarios deben pertenecer a la misma instalación de Node 24. En esta máquina existe además `/usr/bin/node` (Node 20); no debe quedar antes que el Node de NVM en `PATH`.

Validar la configuración de forma aislada:

```bash
npm run verify:config
```

Validación manual equivalente:

```bash
node ./node_modules/expo/bin/cli config --json --full | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{JSON.parse(s); console.log('Expo config JSON: OK')})"
```

Validación completa:

```bash
npm run doctor
```

## Fallo actual: versiones patch de Expo

La ejecución del 2026-11-12 reportó:

```text
✖ Check that packages match versions required by installed Expo SDK
package          expected  found
expo             ~58.0.25  58.0.23
expo-dev-client  ~58.0.20  58.0.18
expo-status-bar  ~58.0.5   58.0.4
```

Es un fallo real, reproducible y distinto de los errores de red. No se cambió el stack en esta tarea. Para resolverlo hay que decidir si se actualizan las versiones patch con `npx expo install --check`/`npx expo install` y se actualiza el ADR 0001, o si se acepta explícitamente el fallo. CI no lo oculta: `npm run doctor` es obligatorio y sin `continue-on-error`.

## Limitaciones

- Algunos chequeos de Expo Doctor consultan `api.expo.dev`, `exp.host` y React Native Directory. Sin red o con red inestable, el comando puede terminar con 18/20 y exit 1 aunque la configuración local sea válida. Ese fallo se conserva y se reporta; no se silencia ni se convierte en éxito.
- El CI ejecuta `npm run doctor` como paso obligatorio, sin `continue-on-error`; un fallo de red hace fallar el job, que es el comportamiento esperado para no ocultar el estado real.
- El parche cubre los subprocesos que producen JSON. Herramientas nativas que no usan `--json` podrían seguir dependiendo del `stdio` del entorno; si fallan, Expo Doctor reportará el error real.
- Si Expo Doctor cambia la forma de lanzar sus subprocesos, el parche debe revisarse o retirarse.
- `verify:config` sigue siendo una validación parcial útil para aislar problemas de configuración de los de Expo Doctor.
