declare const confetti: any;

export function triggerConfetti() {
  const end = Date.now() + 3 * 1000; // 3 seconds
  const colors = ["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd"]; // Using our app's blue color scheme

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });

    requestAnimationFrame(frame);
  };

  frame();
}
