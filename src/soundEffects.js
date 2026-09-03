import { createAudioPlayer } from 'expo-audio';

// Synthesized by tools/generate-sounds.mjs — every sample is generated math,
// not a downloaded or licensed clip, so there's no rights question to resolve.
// Re-run that script to regenerate these; it reproduces them byte-for-byte.
const successPlayer = createAudioPlayer(require('../assets/sounds/success.wav'));
const wrongPlayer = createAudioPlayer(require('../assets/sounds/wrong.wav'));
const completePlayer = createAudioPlayer(require('../assets/sounds/complete.wav'));

async function playClip(player) {
  try {
    // Rewind before every play so rapid repeat taps always restart the
    // clip from the beginning instead of silently no-op'ing mid-sound.
    await player.seekTo(0);
    player.play();
  } catch {
    // A missed chime is a minor cosmetic miss, never worth crashing or
    // blocking gameplay over (e.g. if the audio session isn't ready yet).
  }
}

export function playSuccessSound() {
  playClip(successPlayer);
}

export function playWrongSound() {
  playClip(wrongPlayer);
}

export function playCompleteSound() {
  playClip(completePlayer);
}
