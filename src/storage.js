import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_PREFIX = 'learnplay.progress.';
const SETTINGS_KEY = 'learnplay.settings';

// gameId scopes progress per mini-game (e.g. 'abc', 'numbers'), so playing
// one doesn't clobber or get confused with progress in another.
export async function saveProgress(gameId, index, stars) {
  try {
    await AsyncStorage.setItem(PROGRESS_PREFIX + gameId, JSON.stringify({ index, stars }));
  } catch {
    // Non-fatal: progress just won't be remembered this session.
  }
}

export async function loadProgress(gameId) {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_PREFIX + gameId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearProgress(gameId) {
  try {
    await AsyncStorage.removeItem(PROGRESS_PREFIX + gameId);
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
