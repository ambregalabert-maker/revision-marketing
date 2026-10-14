import { useState } from 'react'
import { ajouterJours, lundi, versDate } from '../lib/dates'
import { MINUTES_JOUR_ACTIF } from '../lib/gamification'
import type { Progression } from '../lib/types'

const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

/**
 * Séances par semaine sur les 8 dernières semaines (une seule série → pas de légende).
 * Barres fines, coins arrondis, ligne de l'objectif, info-bulle au survol / au toucher,
 * et un tableau équivalent pour les lecteurs d'écran.
 */
export default function GraphiqueSeances({ p }: { p: Progression }) {
  const [survol, setSurvol] = useState<number | null>(null)
  const debut = ajouterJours(lundi(), -7 * 7)
  const semaines = Array.from({ length: 8 }, (_, i) => {
    const l = ajouterJours(debut, i * 7)
    const fin = ajouterJours(l, 7)
    const n = p.sessions.filter((s) => {
      const j = s.debut.slice(0, 10)
      return j >= l && j < fin && (s.type !== 'libre' || s.dureeMinutes >= MINUTES_JOUR_ACTIF)
    }).length
    return { l, n, label: fmt.format(versDate(l)) }
  })
  const objectif = p.profil.objectifHebdo
  const max = Math.max(objectif, ...semaines.map((s) => s.n), 1)
  const H = 140

  return (
    <figure>
      <figcaption className="sr-only">Nombre de séances par semaine, sur les 8 dernières semaines (objectif : {objectif})</figcaption>
      <div className="relative" style={{ height: H + 28 }} aria-hidden>
        {/* Ligne de l'objectif */}
        <div className="absolute inset-x-0 border-t-2 border-dashed border-orange-500" style={{ bottom: 28 + (objectif / max) * H }}>
          <span className="absolute right-0 -top-6 text-xs font-bold text-orange-700 bg-surface px-1">objectif {objectif}</span>
        </div>
        <div className="absolute inset-x-0 bottom-7 border-t border-line" />
        <div className="absolute inset-0 grid grid-cols-8 gap-[2px] items-end">
          {semaines.map((s, i) => (
            <div
              key={s.l}
              className="relative flex flex-col items-center justify-end h-full pb-7"
              onMouseEnter={() => setSurvol(i)}
              onMouseLeave={() => setSurvol(null)}
              onClick={() => setSurvol(survol === i ? null : i)}
            >
              {survol === i && (
                <span className="absolute z-10 whitespace-nowrap rounded-lg bg-ink text-bg text-xs px-2 py-1" style={{ bottom: 34 + (s.n / max) * H }}>
                  Semaine du {s.label} : {s.n} séance{s.n > 1 ? 's' : ''}
                </span>
              )}
              <div
                className={`w-3/5 max-w-7 rounded-t ${i === 7 ? 'bg-blue-700' : 'bg-blue-500'}`}
                style={{ height: s.n ? Math.max(4, (s.n / max) * H) : 0 }}
              />
              <span className="absolute bottom-1 text-[11px] text-muted">{i === 7 ? 'cette sem.' : s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">Semaine du</th>
            <th scope="col">Séances</th>
          </tr>
        </thead>
        <tbody>
          {semaines.map((s) => (
            <tr key={s.l}>
              <td>{s.label}</td>
              <td>{s.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
