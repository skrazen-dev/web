// Sound utilities for alerts and notifications
export const playSound = (type: 'success' | 'warning' | 'error' | 'notification') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = audioContext.currentTime;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Different frequencies for different alert types
  const frequencies = {
    success: { freq: 800, duration: 0.2 },
    warning: { freq: 600, duration: 0.3 },
    error: { freq: 400, duration: 0.4 },
    notification: { freq: 700, duration: 0.15 },
  };

  const { freq, duration } = frequencies[type];

  oscillator.frequency.value = freq;
  gainNode.gain.setValueAtTime(0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
};

// Notification sound with multiple beeps
export const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = audioContext.currentTime;

  for (let i = 0; i < 3; i++) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.2, now + i * 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);

    oscillator.start(now + i * 0.15);
    oscillator.stop(now + i * 0.15 + 0.1);
  }
};
