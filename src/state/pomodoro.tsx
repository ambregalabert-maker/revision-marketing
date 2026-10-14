// Minuteur Pomodoro global : il continue de tourner quand tu changes de page
// (et même si tu recharges la page, car il est basé sur l'heure de fin).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ecrire, lire } from '../lib/stockage'
import { XP } from '../lib/gamification'
import { useProgression } from './progression'

export type PhasePomodoro = 'travail' | 'pause' | 'pauseLongue'

interface EtatPomodoro {
  phase: PhasePomodoro
  /** Heure de fin (timestamp) si le minuteur tourne, sinon null. */
  finA: number | null
  /** Temps restant (ms) quand le minuteur est en pause ou arrêté. */
  resteMs: number
  /** Nombre de Pomodoros de travail terminés depuis la dernière pause longue. */
  cycles: number
}

const CLE = 'rm-pomodoro'

export const SUGGESTIONS_PAUSE = [
  'Lève-toi et étire-toi : bras au ciel, puis penche-toi doucement en avant.',
  "Bois un grand verre d'eau.",
  "Éloigne-toi de l'écran : regarde au loin par la fenêtre pendant 20 secondes.",
  'Marche un peu, même dans ta chambre.',
  "Respire profondément : 4 secondes pour inspirer, 4 secondes pour expirer, 5 fois.",
  "Range ton bureau : un espace clair, c'est un esprit clair.",
  'Pas de réseaux sociaux pendant la pause : ton cerveau a besoin de vrai repos.',
]

interface ValeurPomodoro {
  phase: PhasePomodoro
  enCours: boolean
  resteSec: number
  dureeSec: number
  cycles: number
  suggestion: string
  demarrer: () => void
  mettreEnPause: () => void
  reinitialiser: () => void
  passer: () => void
  /** Démarre un Pomodoro de travail s'il ne tourne pas déjà (séance guidée). */
  lancerTravail: () => void
}

const Contexte = createContext<ValeurPomodoro | null>(null)

/** Petit carillon doux, généré par le navigateur (pas de fichier audio à charger). */
function carillon() {
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

function notifier(titre: string, corps: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') new Notification(titre, { body: corps, icon: '/favicon.svg' })
  } catch {
    // Notifications indisponibles.
  }
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { p, terminerSession } = useProgression()
  const prefs = p.profil.preferences
  const duree = useCallback(
    (phase: PhasePomodoro) => (phase === 'travail' ? prefs.travail : phase === 'pause' ? prefs.pause : prefs.pauseLongue) * 60_000,
    [prefs.travail, prefs.pause, prefs.pauseLongue],
  )

  const [etat, setEtat] = useState<EtatPomodoro>(() =>
    lire<EtatPomodoro>(CLE, { phase: 'travail', finA: null, resteMs: prefs.travail * 60_000, cycles: 0 }),
  )
  const [maintenant, setMaintenant] = useState(Date.now())
  const [suggestion, setSuggestion] = useState(SUGGESTIONS_PAUSE[0])
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs

  // Référence toujours à jour de l'état (pour agir hors des fonctions de mise à jour de React).
  const etatRef = useRef(etat)
  const changer = useCallback((nouveau: EtatPomodoro) => {
    etatRef.current = nouveau
    setEtat(nouveau)
    ecrire(CLE, nouveau)
  }, [])

  // Si tu changes la durée de travail dans ton profil pendant que le minuteur est arrêté, on l'applique.
  const travailInitial = useRef(prefs.travail)
  useEffect(() => {
    if (travailInitial.current === prefs.travail) return
    travailInitial.current = prefs.travail
    const e = etatRef.current
    if (e.finA === null && e.phase === 'travail') changer({ ...e, resteMs: prefs.travail * 60_000 })
  }, [prefs.travail, changer])

  // Passage à la phase suivante quand le temps est écoulé.
  const terminerPhase = useCallback(() => {
    const e = etatRef.current
    const pr = prefsRef.current
    if (pr.son) carillon()
    if (e.phase === 'travail') {
      const cycles = e.cycles + 1
      terminerSession('pomodoro', pr.travail, XP.pomodoro)
      const longue = cycles % 4 === 0
      const phase: PhasePomodoro = longue ? 'pauseLongue' : 'pause'
      setSuggestion(SUGGESTIONS_PAUSE[Math.floor(Math.random() * SUGGESTIONS_PAUSE.length)])
      if (pr.notifications) notifier('Pomodoro terminé ! +15 XP', longue ? 'Bravo, 4 Pomodoros : prends 15 minutes de vraie pause.' : 'Prends 5 minutes de pause.')
      // La pause démarre automatiquement.
      changer({ phase, cycles: longue ? 0 : cycles, finA: Date.now() + duree(phase), resteMs: duree(phase) })
      return
    }
    if (pr.notifications) notifier('Fin de la pause', "On s'y remet ? Lance ton prochain Pomodoro.")
    // Après la pause, le travail ne redémarre pas tout seul : c'est toi qui décides.
    changer({ ...e, phase: 'travail', finA: null, resteMs: duree('travail') })
  }, [duree, terminerSession, changer])

  // Tic-tac (une fois par seconde) tant que le minuteur tourne.
  useEffect(() => {
    if (etat.finA === null) return
    const verifier = () => {
      const n = Date.now()
      setMaintenant(n)
      const e = etatRef.current
      if (e.finA !== null && n >= e.finA) terminerPhase()
    }
    verifier() // aussi au chargement, si le temps s'est écoulé pendant que la page était fermée
    const t = window.setInterval(verifier, 1000)
    return () => window.clearInterval(t)
  }, [etat.finA, terminerPhase])

  const resteMs = etat.finA !== null ? Math.max(0, etat.finA - maintenant) : etat.resteMs

  const demarrer = useCallback(() => {
    const e = etatRef.current
    setMaintenant(Date.now())
    if (e.finA === null) changer({ ...e, finA: Date.now() + e.resteMs })
  }, [changer])
  const mettreEnPause = useCallback(() => {
    const e = etatRef.current
    if (e.finA !== null) changer({ ...e, finA: null, resteMs: Math.max(0, e.finA - Date.now()) })
  }, [changer])
  const reinitialiser = useCallback(() => changer({ phase: 'travail', finA: null, resteMs: duree('travail'), cycles: 0 }), [duree, changer])
  // Passer une pause : on revient au travail. Passer un travail : on revient au début (sans XP).
  const passer = useCallback(() => changer({ ...etatRef.current, phase: 'travail', finA: null, resteMs: duree('travail') }), [duree, changer])
  const lancerTravail = useCallback(() => {
    const e = etatRef.current
    setMaintenant(Date.now())
    if (!(e.finA !== null && e.phase === 'travail')) changer({ ...e, phase: 'travail', finA: Date.now() + duree('travail'), resteMs: duree('travail') })
  }, [duree, changer])

  const valeur = useMemo<ValeurPomodoro>(
    () => ({
      phase: etat.phase,
      enCours: etat.finA !== null,
      resteSec: Math.ceil(resteMs / 1000),
      dureeSec: duree(etat.phase) / 1000,
      cycles: etat.cycles,
      suggestion,
      demarrer,
      mettreEnPause,
      reinitialiser,
      passer,
      lancerTravail,
    }),
    [etat, resteMs, duree, suggestion, demarrer, mettreEnPause, reinitialiser, passer, lancerTravail],
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export function usePomodoro() {
  const v = useContext(Contexte)
  if (!v) throw new Error('usePomodoro doit être utilisé dans <PomodoroProvider>')
  return v
}

export const formatMinuteur = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
