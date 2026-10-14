// Petits composants d'interface réutilisés partout.
import { Link } from 'react-router'
import type { ReactNode } from 'react'
import Icone from './Icone'

export function Retour({ to = '/reviser', label = 'Réviser' }: { to?: string; label?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 min-h-11 text-blue-700 font-semibold mb-2 -ml-1">
      <Icone nom="retour" taille={20} />
      {label}
    </Link>
  )
}

/** Barre de progression accessible. */
export function Barre({
  valeur,
  max = 100,
  label,
  couleur = 'bleu',
  hauteur = 'h-2.5',
}: {
  valeur: number
  max?: number
  label: string
  couleur?: 'bleu' | 'orange' | 'succes' | 'erreur' | 'attention'
  hauteur?: string
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valeur / max) * 100)) : 0
  const fond = {
    bleu: 'bg-blue-500',
    orange: 'bg-orange-500',
    succes: 'bg-success',
    erreur: 'bg-error',
    attention: 'bg-orange-400',
  }[couleur]
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(valeur)}
      className={`w-full ${hauteur} rounded-full bg-blue-100 overflow-hidden`}
    >
      <div className={`h-full rounded-full ${fond} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Pastille « +5 XP ». */
export function PuceXp({ xp }: { xp: number }) {
  if (!xp) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 font-bold text-sm px-2.5 py-0.5">
      <Icone nom="eclair" taille={14} plein />+{xp} XP
    </span>
  )
}

/** Message de correction : toujours une icône + un texte (jamais la couleur seule). */
export function Correction({ juste, titre, children }: { juste: boolean; titre?: string; children?: ReactNode }) {
  return (
    <div
      role="status"
      className={`apparition rounded-2xl border p-4 ${juste ? 'bg-success-bg border-success' : 'bg-error-bg border-error'}`}
    >
      <p className={`flex items-center gap-2 font-titre font-semibold ${juste ? 'text-success-ink' : 'text-error-ink'}`}>
        <Icone nom={juste ? 'ok' : 'non'} />
        {titre ?? (juste ? 'Bonne réponse !' : 'Pas tout à fait…')}
      </p>
      {children && <div className="mt-2 text-ink">{children}</div>}
    </div>
  )
}

export function Etiquette({ children, ton = 'bleu' }: { children: ReactNode; ton?: 'bleu' | 'orange' | 'neutre' }) {
  const cls = {
    bleu: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    neutre: 'bg-surface-2 text-muted',
  }[ton]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold ${cls}`}>{children}</span>
}

/** Onglets simples (boutons radio visuels). */
export function Onglets<T extends string>({
  valeur,
  options,
  onChange,
  label,
}: {
  valeur: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 p-1 rounded-2xl bg-surface-2 border border-line overflow-x-auto">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          type="button"
          aria-selected={valeur === o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 whitespace-nowrap min-h-11 px-3 rounded-xl font-semibold text-sm md:text-base transition-colors ${
            valeur === o.id ? 'bg-surface text-blue-700 shadow-carte' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Écran de fin d'activité. */
export function EcranFin({
  titre,
  message,
  xp,
  children,
}: {
  titre: string
  message: string
  xp?: number
  children?: ReactNode
}) {
  return (
    <div className="carte p-6 md:p-8 text-center apparition">
      <div aria-hidden className="text-5xl mb-3">🎉</div>
      <h2 className="text-2xl font-bold">{titre}</h2>
      <p className="text-muted mt-2">{message}</p>
      {xp ? (
        <p className="mt-4">
          <PuceXp xp={xp} />
        </p>
      ) : null}
      {children && <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">{children}</div>}
    </div>
  )
}
