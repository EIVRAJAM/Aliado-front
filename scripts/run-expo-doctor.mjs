import './expo-doctor-spawn-patch.cjs';

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expoDoctorCli = path.join(projectRoot, 'node_modules', 'expo-doctor', 'bin', 'expo-doctor.js');

if (!existsSync(expoDoctorCli)) {
  console.error('[doctor] No se encontró expo-doctor local. Ejecuta `npm ci` antes de validar.');
  process.exit(1);
}

const require = createRequire(import.meta.url);
require(expoDoctorCli);
