/** Petit carillon doux, généré par le navigateur (pas de fichier audio à charger). */
export function carillon() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.25
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.15, t + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 1.3)
    })
    window.setTimeout(() => ctx.close(), 2000)
  } catch {
    // Son indisponible : tant pis.
  }
}
