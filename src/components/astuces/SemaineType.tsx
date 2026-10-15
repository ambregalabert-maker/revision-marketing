import { useState } from 'react'
import { Link } from 'react-router'
import Icone from '../Icone'
import astuces from '../../data/astuces.json'
import { lundi } from '../../lib/dates'
import { ecrire, lire } from '../../lib/stockage'
import { useProgression } from '../../state/progression'

const lignes = astuces.semaine as { id: string; quand: string; duree: string; quoi: string; lien: { label: string; to: string } }[]

/** La semaine type (1 h 30) en liste à cocher. Remise à zéro chaque lundi. */
export default function SemaineType() {
  const { debloquerBadge } = useProgression()
  const cle = `rm-semaine-${lundi()}`
  const [faits, setFaits] = useState<string[]>(() => lire(cle, []))
  const pct = Math.round((faits.length / lignes.length) * 100)

  const basculer = (id: string) => {
    const nouveaux = faits.includes(id) ? faits.filter((x) => x !== id) : [...faits, id]
    setFaits(nouveaux)
    ecrire(cle, nouveaux)
    if (nouveaux.length === lignes.length) debloquerBadge('semaine-type')
  }

  return (
    <div className="carte p-5">
      <div className="flex items-center gap-4">
        {/* Anneau de progression */}
        <div className="relative w-16 h-16 shrink-0" role="img" aria-label={`${faits.length} sur ${lignes.length} cochées cette semaine`}>
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90" aria-hidden="true">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--blue-100)" strokeWidth="4" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="var(--accent-500)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
              style={{ transition: 'stroke-dasharray .5s' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-titre font-bold">{faits.length}/{lignes.length}</span>
        </div>
        <p className="text-muted">
          1 h 30 par semaine, en petites séances, au lieu d'une nuit entière la veille. Coche au fur et à mesure : la liste repart de zéro chaque lundi.
        </p>
      </div>
      <ul className="flex flex-col gap-2 mt-4">
        {lignes.map((l) => {
          const fait = faits.includes(l.id)
          return (
            <li key={l.id} className={`rounded-2xl border-2 p-3 flex items-center gap-3 transition-colors ${fait ? 'border-accent-500 bg-accent-100' : 'border-line'}`}>
              <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                <input type="checkbox" className="w-6 h-6 shrink-0 accent-[var(--accent-600)]" checked={fait} onChange={() => basculer(l.id)} />
                <span className="min-w-0">
                  <span className={`block font-semibold ${fait ? 'line-through decoration-2 opacity-70' : ''}`}>
                    {l.quand} · <span className="text-accent-700">{l.duree}</span>
                  </span>
                  <span className="block text-sm text-muted">{l.quoi}</span>
                </span>
              </label>
              <Link to={l.lien.to} className="btn btn-bleu !min-h-10 !px-3 text-sm shrink-0" aria-label={`${l.lien.label} (${l.quand})`}>
                <Icone nom="suivant" taille={18} />
              </Link>
            </li>
          )
        })}
      </ul>
      {faits.length === lignes.length && <p className="mt-3 text-center font-bold text-success-ink">✅ Semaine parfaite ! Badge débloqué.</p>}
    </div>
  )
}
