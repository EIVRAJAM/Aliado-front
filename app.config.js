module.exports = ({ config }) => {
  const googleServicesFile = process.env.ALIADO_ANDROID_GOOGLE_SERVICES_FILE?.trim();
  const pushEnabled = process.env.EXPO_PUBLIC_ANDROID_PUSH_ENABLED === 'true';

  if (pushEnabled && !googleServicesFile) {
    throw new Error('ALIADO_ANDROID_GOOGLE_SERVICES_FILE is required for Android push.');
  }

  return {
    ...config,
    android: googleServicesFile ? { ...config.android, googleServicesFile } : config.android,
    plugins: [...(config.plugins ?? []), 'expo-notifications', 'expo-secure-store'],
  };
};
