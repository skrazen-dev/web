/**
 * Soft, premium "wealth" chime synthesized with the Web Audio API — a gentle
 * ascending major arpeggio (Bb major triad → octave) with a slow bell-like
 * decay. No audio asset required, and it stays well clear of casino / crypto
 * jingles: think a private-bank lobby, not a slot machine.
 *
 * Respects the user's sound preference and only ever plays once per page load.
 */
let hasPlayed = false;

export function playWealthChime(): void {
  if (hasPlayed) return;
  if (typeof window === "undefined") return;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;

  hasPlayed = true;

  const ctx = new AudioCtx();
  // Bb major arpeggio, voiced high and soft.
  const notes = [466.16, 587.33, 698.46, 932.33];
  const now = ctx.currentTime;

  // Shared gentle low-pass to keep it warm rather than glassy.
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 5200;
  filter.Q.value = 0.4;
  master.connect(filter).connect(ctx.destination);

  // Slow swell + long release on the master bus.
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.18);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

  notes.forEach((freq, i) => {
    const start = now + i * 0.16;
    const osc = ctx.createOscillator();
    const sine = ctx.createOscillator();
    const voice = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.value = freq;
    // A faint sine an octave up adds a soft "shimmer" without harshness.
    sine.type = "sine";
    sine.frequency.value = freq * 2;

    voice.gain.setValueAtTime(0.0001, start);
    voice.gain.exponentialRampToValueAtTime(0.9, start + 0.05);
    voice.gain.exponentialRampToValueAtTime(0.0001, start + 2.6);

    osc.connect(voice);
    sine.connect(voice);
    voice.connect(master);

    osc.start(start);
    sine.start(start);
    osc.stop(start + 2.8);
    sine.stop(start + 2.8);
  });

  window.setTimeout(() => ctx.close().catch(() => {}), 4200);
}
