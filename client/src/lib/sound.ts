// ── Premium Sound Utilities ───────────────────────────────────────────────────
// Web Audio API synthesized sounds — no external files needed

function getAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

/** เสียงพื้นฐาน: success, warning, error, notification */
export const playSound = (type: 'success' | 'warning' | 'error' | 'notification') => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const map = {
    success:      { freq: 880, duration: 0.18, type: 'sine'     as OscillatorType },
    warning:      { freq: 560, duration: 0.28, type: 'triangle' as OscillatorType },
    error:        { freq: 320, duration: 0.38, type: 'sawtooth' as OscillatorType },
    notification: { freq: 740, duration: 0.14, type: 'sine'     as OscillatorType },
  };

  const { freq, duration, type: waveType } = map[type];
  osc.type = waveType;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
};

/** เสียงแจ้งเตือน 3 beep */
export const playNotificationSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.18, now + i * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.1);
    osc.start(now + i * 0.14);
    osc.stop(now + i * 0.14 + 0.1);
  }
};

/** เสียงปักหมุด — rising tone */
export const playPinSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.linearRampToValueAtTime(880, now + 0.12);
  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.start(now);
  osc.stop(now + 0.2);
};

/** เสียงถอนหมุด — falling tone */
export const playUnpinSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.linearRampToValueAtTime(330, now + 0.14);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.start(now);
  osc.stop(now + 0.2);
};

/** เสียงคลิกปุ่ม — soft tick */
export const playClickSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = 1200;
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.start(now);
  osc.stop(now + 0.07);
};

/** เสียงเตือนความเสี่ยงสูง — urgent double beep */
export const playRiskAlertSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 480;
    gain.gain.setValueAtTime(0.15, now + i * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.15);
    osc.start(now + i * 0.2);
    osc.stop(now + i * 0.2 + 0.16);
  }
};

/** เสียง copy/save สำเร็จ — soft chime */
export const playCopySound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.12);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.14);
  });
};

/** Helper: เล่นเสียงเฉพาะเมื่อ soundEnabled = true */
export const playSoundIf = (
  enabled: boolean,
  fn: () => void
) => {
  if (enabled) {
    try { fn(); } catch { /* ignore AudioContext errors */ }
  }
};
