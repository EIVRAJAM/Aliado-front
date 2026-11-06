import { spawn } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expoCli = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
const expoDoctorCli = path.join(projectRoot, 'node_modules', 'expo-doctor', 'bin', 'expo-doctor.js');
const expoDoctorRunner = path.join(projectRoot, 'scripts', 'run-expo-doctor.mjs');
const configOnly = process.argv.includes('--config-only');

const nodeVersion = process.versions.node;
const [major, minor] = nodeVersion.split('.').map(Number);

if (major < 24 || (major === 24 && minor < 3) || major >= 25) {
  console.error(
    `[doctor] Node ${nodeVersion} no es compatible con este repositorio. ` +
      'Usa Node 24 LTS (>=24.3.0 <25), por ejemplo con `nvm use`.'
  );
  process.exit(1);
}

if (!existsSync(expoCli)) {
  console.error('[doctor] No se encontró Expo local. Ejecuta `npm ci` antes de validar.');
  process.exit(1);
}

if (!configOnly && !existsSync(expoDoctorCli)) {
  console.error('[doctor] No se encontró expo-doctor local. Ejecuta `npm ci` antes de validar.');
  process.exit(1);
}

function getEnvWithNodeFirst() {
  const env = { ...process.env };
  const pathKey = Object.keys(env).find((key) => key.toUpperCase() === 'PATH') ?? 'PATH';
  const nodeDir = path.dirname(process.execPath);
  env[pathKey] = [nodeDir, env[pathKey]].filter(Boolean).join(path.delimiter);
  return env;
}

function writeAll(fd, text) {
  if (!text) return;
  const buffer = Buffer.from(text);
  let offset = 0;
  while (offset < buffer.length) {
    offset += writeSync(fd, buffer, offset);
  }
}

function writeStdout(text) {
  writeAll(1, text);
}

function writeStderr(text) {
  writeAll(2, text);
}

function runCaptured(command, args, options) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'aliado-doctor-'));
  const stdoutPath = path.join(tempDir, 'stdout.log');
  const stderrPath = path.join(tempDir, 'stderr.log');
  const stdoutFd = openSync(stdoutPath, 'w');
  const stderrFd = openSync(stderrPath, 'w');

  let child;
  try {
    child = spawn(command, args, {
      ...options,
      stdio: ['ignore', stdoutFd, stderrFd],
    });
  } catch (error) {
    closeSync(stdoutFd);
    closeSync(stderrFd);
    rmSync(tempDir, { recursive: true, force: true });
    return Promise.reject(error);
  }

  closeSync(stdoutFd);
  closeSync(stderrFd);

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      rmSync(tempDir, { recursive: true, force: true });
      reject(error);
    });
    child.on('close', (code, signal) => {
      let stdout = '';
      let stderr = '';
      try {
        stdout = readFileSync(stdoutPath, 'utf8');
        stderr = readFileSync(stderrPath, 'utf8');
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
      resolve({
        code: code ?? (signal ? 1 : 0),
        signal,
        stdout,
        stderr,
      });
    });
  });
}

function printEnvironmentDiagnostics() {
  const relevantEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(PATH|NODE|NPM|NPX|EXPO|CI|FORCE_COLOR|NO_COLOR|npm_)/.test(key)
    )
  );
  writeStderr(`[doctor] process.execPath: ${process.execPath}\n`);
  writeStderr(`[doctor] process.versions.node: ${process.versions.node}\n`);
  writeStderr(`[doctor] Entorno relevante: ${JSON.stringify(relevantEnv, null, 2)}\n`);
}

function printConfigFailure(result, context) {
  writeStderr(`[doctor] ${context}\n`);
  writeStderr(`[doctor] Node: ${nodeVersion} (${process.execPath})\n`);
  writeStderr(`[doctor] Comando: ${process.execPath} ${expoCli} config --json --full\n`);
  if (result) {
    writeStderr(`[doctor] Exit: ${result.code}${result.signal ? ` (${result.signal})` : ''}\n`);
    if (result.stdout) {
      writeStderr(`[doctor] stdout (primeros 500 caracteres):\n${result.stdout.slice(0, 500)}\n`);
    } else {
      writeStderr('[doctor] stdout: <vacío>\n');
    }
    if (result.stderr) {
      writeStderr(`[doctor] stderr:\n${result.stderr}\n`);
    } else {
      writeStderr('[doctor] stderr: <vacío>\n');
    }
  }
  printEnvironmentDiagnostics();
}

const env = getEnvWithNodeFirst();

let preflight;
try {
  preflight = await runCaptured(process.execPath, [expoCli, 'config', '--json', '--full'], {
    cwd: projectRoot,
    env,
  });
} catch (error) {
  printConfigFailure(null, 'No se pudo ejecutar la validación de Expo Config.');
  writeStderr(`${error instanceof Error ? error.stack : error}\n`);
  process.exit(1);
}

if (preflight.code !== 0) {
  printConfigFailure(preflight, 'Expo Config falló con código distinto de cero.');
  process.exit(preflight.code);
}

try {
  JSON.parse(preflight.stdout);
} catch {
  printConfigFailure(preflight, 'Expo Config no devolvió JSON válido.');
  process.exit(1);
}

if (preflight.stderr) {
  writeStderr(preflight.stderr);
}

writeStdout(`[verify:config] Expo Config JSON válido (${Buffer.byteLength(preflight.stdout)} bytes).\n`);

if (configOnly) {
  process.exit(0);
}

let doctor;
try {
  doctor = await runCaptured(process.execPath, [expoDoctorRunner, ...process.argv.slice(2)], {
    cwd: projectRoot,
    env,
  });
} catch (error) {
  writeStderr('[doctor] No se pudo ejecutar Expo Doctor.\n');
  writeStderr(`${error instanceof Error ? error.stack : error}\n`);
  process.exit(1);
}

writeStdout(doctor.stdout);
writeStderr(doctor.stderr);

if (doctor.code === 0) {
  process.exit(0);
}

const combined = `${doctor.stdout}\n${doctor.stderr}`;
if (combined.includes("Failed to parse JSON output from 'npx expo config --json --full'")) {
  writeStderr('\n[doctor] LIMITACIÓN EXTERNA DE EXPO DOCTOR\n');
  writeStderr(
    '[doctor] Expo Doctor no pudo leer la salida de su subproceso `expo config` en este entorno.\n'
  );
  writeStderr(
    '[doctor] La validación de Expo Config con archivos temporales sí pasó; no se declara ' +
      'Expo Doctor como exitoso ni se ejecutaron sus chequeos.\n'
  );
  writeStderr(
    '[doctor] Control disponible en este entorno: `npm run verify:config` (valida la configuración).\n'
  );
  printEnvironmentDiagnostics();
}

process.exit(doctor.code);
