/**
 * Web Audio API synthesizer for an authentic commercial Class 8 Truck Pneumatic Air Horn.
 * Plays a rich, resonant dual-pitch harmonic blast (Grover / Nathan K5LA style)
 * with pneumatic flutter and brass overtones.
 */

let audioCtx: AudioContext | null = null;

export function playTruckAirHorn(): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === "suspended") {
      audioCtx = new AudioContextClass();
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
    }

    const ctx = audioCtx;
    const now = ctx.currentTime;
    const duration = 0.9;

    // Classic dual-tone truck horn chords: C#4 (277 Hz), F4 (349 Hz), A4 (440 Hz)
    const frequencies = [277.18, 349.23, 440.0, 554.37];

    // Master gain envelope for the pneumatic blast
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.28, now + 0.05); // fast attack
    masterGain.gain.setValueAtTime(0.26, now + 0.65);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // pneumatic decay

    // Lowpass filter to give the warm, brassy resonance of an air horn trumpet
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(2.5, now);

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // Create dual acoustic horns with subtle detuning for authentic air resonance
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      // Subtle pneumatic pressure vibrato (tremolo)
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(18 + idx * 3, now); // 18-24 Hz air flutter
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(4.0, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + duration);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.25 / frequencies.length, now);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration);
    });
  } catch (err) {
    console.warn("AudioContext air horn playback not allowed by browser policy yet:", err);
  }
}

