import { useEffect, useRef, useState } from 'react'
import { formatMinuteur, usePomodoro } from '../state/pomodoro'
import Icone from './Icone'
import { Barre } from './ui'

const NOM_PHASE = { travail: 'Concentration', pause: 'Pause', pauseLongue: 'Pause longue' } as const

/** Les commandes du minuteur (partagées par la version latérale et la version mobile). */
function Panneau() {
  const { phase, enCours, resteSec, dureeSec, cycles, suggestion, demarrer, mettreEnPause, reinitialiser, passer } = usePomodoro()
  const enPause = phase !== 'travail'
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold ${enPause ? 'text-success-ink' : 'text-blue-700'}`}>{NOM_PHASE[phase]}</span>
        <span className="text-xs text-muted" aria-label={`${cycles} Pomodoro${cycles > 1 ? 's' : ''} sur 4 avant la pause longue`}>
          {'🍅'.repeat(cycles)}
          {'·'.repeat(Math.max(0, 4 - cycles))}
        </span>
      </div>
      <p className="font-titre font-bold text-4xl tabular-nums text-center" role="timer" aria-live="off">
        {formatMinuteur(resteSec)}
      </p>
      <Barre valeur={dureeSec - resteSec} max={dureeSec} label="Temps écoulé" couleur={enPause ? 'succes' : 'orange'} />
      {enPause && <p className="text-sm rounded-xl bg-success-bg p-2">{suggestion}</p>}
      <div className="flex gap-2">
        {enCours ? (
          <button type="button" className="btn btn-contour flex-1" onClick={mettreEnPause}>
            <Icone nom="pause" taille={18} /> Pause
          </button>
        ) : (
          <button type="button" className="btn btn-orange flex-1" onClick={demarrer}>
            <Icone nom="lecture" taille={18} /> {phase === 'travail' ? (resteSec < dureeSec ? 'Reprendre' : 'Démarrer') : 'Reprendre'}
          </button>
        )}
        <button type="button" className="btn btn-contour !px-3" onClick={enPause ? passer : reinitialiser} aria-label={enPause ? 'Passer la pause' : 'Remettre à zéro'} title={enPause ? 'Passer la pause' : 'Remettre à zéro'}>
          <Icone nom={enPause ? 'suivant' : 'recommencer'} taille={18} />
        </button>
      </div>
    </div>
  )
}

export default function PomodoroWidget({ variante }: { variante: 'lateral' | 'compact' }) {
  const { phase, enCours, resteSec } = usePomodoro()
  const [ouvert, setOuvert] = useState(false)
  const zone = useRef<HTMLDivElement>(null)

  // Ferme le panneau mobile en cliquant ailleurs ou avec Échap.
  useEffect(() => {
    if (!ouvert) return
    const clic = (e: MouseEvent) => {
      if (!zone.current?.contains(e.target as Node)) setOuvert(false)
    }
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false)
    document.addEventListener('mousedown', clic)
    document.addEventListener('keydown', echap)
    return () => {
      document.removeEventListener('mousedown', clic)
      document.removeEventListener('keydown', echap)
    }
  }, [ouvert])

  if (variante === 'lateral') {
    return (
      <section aria-label="Minuteur Pomodoro" className="rounded-2xl border border-line bg-surface-2 p-3">
        <Panneau />
      </section>
    )
  }

  return (
    <div ref={zone} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label={`Minuteur Pomodoro : ${NOM_PHASE[phase]}, ${formatMinuteur(resteSec)}${enCours ? ', en cours' : ''}`}
        className={`btn !min-h-10 !px-3 !rounded-full !text-sm tabular-nums ${
          enCours ? (phase === 'travail' ? 'btn-orange' : 'bg-success-bg text-success-ink') : 'btn-contour'
        }`}
      >
        <Icone nom="minuteur" taille={18} />
        {formatMinuteur(resteSec)}
      </button>
      {ouvert && (
        <div className="absolute right-0 top-12 w-72 carte p-4 z-40 apparition">
          <Panneau />
        </div>
      )}
    </div>
  )
}
