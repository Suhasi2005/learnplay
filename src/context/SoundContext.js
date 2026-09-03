import * as Speech from 'expo-speech';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { playCompleteSound, playSuccessSound, playWrongSound } from '../soundEffects';
import { loadSettings, saveSettings } from '../storage';

const SoundContext = createContext(null);

export function SoundProvider({ children }) {
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    loadSettings().then((settings) => setSoundOn(settings.soundOn));
    return () => Speech.stop();
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      saveSettings({ soundOn: next });
      if (!next) Speech.stop();
      return next;
    });
  }, []);

  const speak = useCallback((text, options) => {
    Speech.stop();
    if (soundOn) Speech.speak(text, options);
  }, [soundOn]);

  // These respect the same single mute toggle as speech — one "sound"
  // switch for the whole app, not a separate control per feedback type.
  const playSuccess = useCallback(() => {
    if (soundOn) playSuccessSound();
  }, [soundOn]);

  const playWrong = useCallback(() => {
    if (soundOn) playWrongSound();
  }, [soundOn]);

  const playComplete = useCallback(() => {
    if (soundOn) playCompleteSound();
  }, [soundOn]);

  return (
    <SoundContext.Provider value={{ soundOn, toggleSound, speak, playSuccess, playWrong, playComplete }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within a SoundProvider');
  return ctx;
}
