import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import { appEnv } from '../../../shared/config/env';
import type { AuthSession } from '../../auth/types/auth';
import { revokePushDevice, syncPushDevice } from './push-gateway';

const channelId = 'aliado_oportunidades';
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

interface Binding {
  account: string;
  token: string;
  revocation: string;
}
interface Installation {
  id: string;
  proof: string;
  permissionRequested?: boolean;
  binding?: Binding;
  pending?: Binding;
  revocations: string[];
}

let serial = Promise.resolve();
function exclusive<T>(operation: () => Promise<T>): Promise<T> {
  const result = serial.then(operation);
  serial = result.then(() => undefined, () => undefined);
  return result;
}

async function secret(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const value = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    result += alphabet.charAt((value >> 18) & 63) + alphabet.charAt((value >> 12) & 63);
    if (i + 1 < bytes.length) result += alphabet.charAt((value >> 6) & 63);
    if (i + 2 < bytes.length) result += alphabet.charAt(value & 63);
  }
  return result;
}

async function readInstallation() {
  const scope = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256, appEnv.apiBaseUrl?.replace(/\/+$/, '') ?? '',
  );
  const key = `aliado.push.${scope}`;
  const saved = await SecureStore.getItemAsync(key);
  const state: Installation = saved
    ? JSON.parse(saved) as Installation
    : { id: Crypto.randomUUID(), proof: await secret(), revocations: [] };
  const save = () => SecureStore.setItemAsync(key, JSON.stringify(state));
  return { state, save };
}

async function flushRevocations(state: Installation, save: () => Promise<void>) {
  for (const revocation of state.revocations.slice()) {
    try {
      await revokePushDevice(state.id, revocation);
    } catch {
      continue;
    }
    state.revocations = state.revocations.filter((value) => value !== revocation);
    await save();
  }
}

export function refreshAndroidPush(session: AuthSession | null, isCurrent: () => boolean) {
  return exclusive(async () => {
    if (!isCurrent()) return;
    const { state, save } = await readInstallation();
    await flushRevocations(state, save);
    if (session?.role !== 'PRESTADOR' || !isCurrent()) return;

    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Oportunidades de ALIADO',
      importance: Notifications.AndroidImportance.HIGH,
    });
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain && !state.permissionRequested && isCurrent()) {
      state.permissionRequested = true;
      await save();
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!isCurrent()) return;
    if (!permission.granted) {
      const known = [state.binding, state.pending].filter((value): value is Binding => !!value);
      if (known.length) {
        state.revocations = [...new Set([...state.revocations, ...known.map((value) => value.revocation)])];
        delete state.binding;
        delete state.pending;
        await save();
        await flushRevocations(state, save);
      }
      return;
    }

    const native = await Notifications.getDevicePushTokenAsync();
    if (!isCurrent() || native.type !== 'android' || typeof native.data !== 'string') return;
    const account = session.email.trim().toLowerCase();
    const matches = (binding?: Binding) => binding?.account === account && binding.token === native.data;
    const binding = [state.pending, state.binding].find(matches)
      ?? { account, token: native.data, revocation: await secret() };
    if (!isCurrent()) return;
    const stale = [state.pending, state.binding].filter(
      (value): value is Binding => !!value && value.revocation !== binding.revocation,
    );
    for (const value of stale) {
      if (!state.revocations.includes(value.revocation)) state.revocations.push(value.revocation);
    }
    state.pending = binding;
    await save();
    if (!isCurrent()) return;
    await syncPushDevice(state.id, state.proof, session.token, binding);
    state.binding = binding;
    delete state.pending;
    state.revocations = state.revocations.filter(
      (value) => !stale.some((previous) => previous.revocation === value),
    );
    await save();
  });
}

export function retireAndroidPush(session: AuthSession) {
  return exclusive(async () => {
    const { state, save } = await readInstallation();
    const account = session.email.trim().toLowerCase();
    const removals = [...new Set([state.binding, state.pending]
      .filter((value): value is Binding => value?.account === account)
      .map((value) => value.revocation))];
    if (state.binding?.account === account) delete state.binding;
    if (state.pending?.account === account) delete state.pending;
    state.revocations = [...new Set([...state.revocations, ...removals])];
    if (removals.length) await save();
    try {
      const displayed = await Notifications.getPresentedNotificationsAsync();
      await Promise.all(displayed
        .filter((notice) => notice.request.content.data?.tipo === 'NUEVA_OPORTUNIDAD')
        .map((notice) => Notifications.dismissNotificationAsync(notice.request.identifier)));
    } catch {
      // Native cleanup must not prevent a persisted revocation from being sent.
    }
    for (const revocation of removals) {
      try {
        await revokePushDevice(state.id, revocation, { token: session.token, proof: state.proof });
      } catch {
        continue; // Retain the scoped revocation for the next connection.
      }
      state.revocations = state.revocations.filter((value) => value !== revocation);
      await save();
    }
  });
}
