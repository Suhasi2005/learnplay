import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = 'learnplay.abcProgress';
const SETTINGS_KEY = 'learnplay.settings';

export async function saveProgress(index, stars) {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify({ index, stars }));
  } catch {
    // Non-fatal: progress just won't be remembered this session.
  }
}

export async function loadProgress() {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearProgress() {
  try {
    await AsyncStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
}

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { soundOn: true };
  } catch {
    return { soundOn: true };
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
