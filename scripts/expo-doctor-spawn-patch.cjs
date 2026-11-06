'use strict';

const childProcess = require('node:child_process');
const { EventEmitter } = require('node:events');
const {
  closeSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
} = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');

if (process.env.ALIADO_DOCTOR_NO_SPAWN_PATCH === '1') {
  return;
}

const originalSpawn = childProcess.spawn;
const originalSpawnSync = childProcess.spawnSync;

function basename(command) {
  return path.basename(String(command)).toLowerCase().replace(/\.(exe|cmd)$/, '');
}

function needsCapturedStdio(command, args, options) {
  const base = basename(command);
  const hasJson = args.includes('--json');
  if (!hasJson) return false;

  if (options && options.stdio && options.stdio !== 'pipe') {
    return false;
  }

  const text = args.join(' ');
  if (base === 'node' || base === 'npx') {
    return /expo[\\/]bin[\\/]cli|(^|\s)expo(\s|$)/.test(text);
  }
  if (base === 'npm') {
    return true;
  }
  return false;
}

function createCapture(command, args, options) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'aliado-doctor-spawn-'));
  const stdoutPath = path.join(tempDir, 'stdout.log');
  const stderrPath = path.join(tempDir, 'stderr.log');
  const stdoutFd = openSync(stdoutPath, 'w');
  const stderrFd = openSync(stderrPath, 'w');

  let realChild;
  try {
    realChild = originalSpawn(command, args, {
      ...options,
      stdio: ['ignore', stdoutFd, stderrFd],
    });
  } catch (error) {
    closeSync(stdoutFd);
    closeSync(stderrFd);
    rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }

  closeSync(stdoutFd);
  closeSync(stderrFd);

  const fake = new EventEmitter();
  fake.stdout = new Readable({ read() {} });
  fake.stderr = new Readable({ read() {} });
  fake.stdin = null;
  fake.pid = realChild.pid;
  fake.killed = false;
  fake.kill = (...killArgs) => realChild.kill(...killArgs);

  let settled = false;

  realChild.on('error', (error) => {
    settled = true;
    rmSync(tempDir, { recursive: true, force: true });
    fake.emit('error', error);
  });

  realChild.on('close', (code, signal) => {
    if (settled) return;
    settled = true;

    let stdout = '';
    let stderr = '';
    try {
      stdout = readFileSync(stdoutPath, 'utf8');
      stderr = readFileSync(stderrPath, 'utf8');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }

    if (stdout) fake.stdout.push(stdout);
    fake.stdout.push(null);
    if (stderr) fake.stderr.push(stderr);
    fake.stderr.push(null);

    setImmediate(() => fake.emit('close', code, signal));
  });

  return fake;
}

childProcess.spawn = function patchedSpawn(command, args = [], options = {}) {
  if (needsCapturedStdio(command, args, options)) {
    return createCapture(command, args, options);
  }
  return originalSpawn(command, args, options);
};

childProcess.spawnSync = function patchedSpawnSync(command, args = [], options = {}) {
  if (!needsCapturedStdio(command, args, options)) {
    return originalSpawnSync(command, args, options);
  }

  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'aliado-doctor-spawnsync-'));
  const stdoutPath = path.join(tempDir, 'stdout.log');
  const stderrPath = path.join(tempDir, 'stderr.log');
  const stdoutFd = openSync(stdoutPath, 'w');
  const stderrFd = openSync(stderrPath, 'w');

  let result;
  try {
    result = originalSpawnSync(command, args, {
      ...options,
      stdio: ['ignore', stdoutFd, stderrFd],
    });
  } catch (error) {
    closeSync(stdoutFd);
    closeSync(stderrFd);
    rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }

  closeSync(stdoutFd);
  closeSync(stderrFd);

  try {
    return {
      ...result,
      stdout: readFileSync(stdoutPath, 'utf8'),
      stderr: readFileSync(stderrPath, 'utf8'),
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
};
