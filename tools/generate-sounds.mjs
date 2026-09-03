// Synthesizes the three short WAV files in assets/sounds/ from scratch — no
// external audio assets and no licensing question at all, since every sample
// is generated math rather than someone else's recording.
//
// Run from the repo root:  node tools/generate-sounds.mjs
import fs from 'fs';

const SAMPLE_RATE = 22050;
const OUT_DIR = './assets/sounds';

function note(freqHz, durationMs, { fadeMs = 12, wave = 'sine', volume = 0.5 } = {}) {
  const n = Math.round((durationMs / 1000) * SAMPLE_RATE);
  const fadeSamples = Math.round((fadeMs / 1000) * SAMPLE_RATE);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let v;
    if (wave === 'triangle') {
      const phase = (freqHz * t) % 1;
      v = 4 * Math.abs(phase - 0.5) - 1;
    } else {
      v = Math.sin(2 * Math.PI * freqHz * t);
    }
    // Fade in/out to avoid clicks at note boundaries.
    let env = 1;
    if (i < fadeSamples) env = i / fadeSamples;
    else if (i > n - fadeSamples) env = (n - i) / fadeSamples;
    samples[i] = v * env * volume;
  }
  return samples;
}

function concat(...arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

function writeWav(filename, floatSamples) {
  const numSamples = floatSamples.length;
  const byteRate = SAMPLE_RATE * 2; // 16-bit mono
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, floatSamples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
  console.log(`Wrote ${filename} (${(buffer.length / 1024).toFixed(1)} KB, ${(numSamples / SAMPLE_RATE).toFixed(2)}s)`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// Success: a bright two-note ascending chime (C5 -> E5), cheerful not jarring.
writeWav(`${OUT_DIR}/success.wav`, concat(
  note(523.25, 130, { volume: 0.5 }),
  note(659.25, 190, { volume: 0.55 }),
));

// Wrong: a soft two-note descending tone — a gentle "oops", not a harsh buzzer.
// Kept quieter than the success chime on purpose: getting it wrong shouldn't
// be the loudest thing that happens to a five-year-old.
writeWav(`${OUT_DIR}/wrong.wav`, concat(
  note(350, 90, { wave: 'triangle', volume: 0.35 }),
  note(260, 130, { wave: 'triangle', volume: 0.3 }),
));

// Topic complete: a slightly longer 3-note fanfare (C5 -> E5 -> G5).
writeWav(`${OUT_DIR}/complete.wav`, concat(
  note(523.25, 100, { volume: 0.45 }),
  note(659.25, 100, { volume: 0.5 }),
  note(783.99, 220, { volume: 0.55 }),
));
