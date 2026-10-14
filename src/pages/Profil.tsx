import { useState } from 'react'
import Page from '../components/Page'
import Icone from '../components/Icone'
import GraphiqueSeances from '../components/GraphiqueSeances'
import MaitriseNotions from '../components/MaitriseNotions'
import Compte from '../components/Compte'
import { Barre } from '../components/ui'
import { BADGES, NIVEAUX, niveauPour } from '../lib/gamification'
import { formatDuree } from '../lib/dates'
import { useProgression } from '../state/progression'
import { useTheme, type ChoixTheme } from '../state/theme'

export default function Profil() {
  const { p, majProfil, reinitialiser } = useProgression()
  const { choix, setChoix } = useTheme()
  const [confirmer, setConfirmer] = useState(false)
  const prefs = p.profil.preferences
  const niveau = niveauPour(p.stats.xpTotal)
  const minutesTotal = p.sessions.reduce((s, x) => s + x.dureeMinutes, 0)
  const tentatives = p.tentatives.filter((t) => t.type !== 'flashcard')
  const taux = tentatives.length ? Math.round((tentatives.filter((t) => t.correct).length / tentatives.length) * 100) : null

  const activerNotifications = async (oui: boolean) => {
    if (oui && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        // ignoré
      }
    }
    majProfil({ preferences: { ...prefs, notifications: oui } })
  }

  const champ = 'min-h-11 rounded-xl border-2 border-line bg-surface px-3 focus:border-blue-500 outline-none'

  return (
    <Page titre="Profil & progression">
      <Compte />

      {/* Niveau */}
      <section className="carte p-5 mb-4" aria-labelledby="t-niveau">
        <h2 id="t-niveau" className="text-lg font-bold">
          Niveau {niveau.numero} · {niveau.nom}
        </h2>
        <div className="mt-3">
          <Barre valeur={niveau.progression * 100} label="Progression vers le niveau suivant" couleur="orange" hauteur="h-3" />
        </div>
        <p className="text-sm text-muted mt-1">
          {p.stats.xpTotal} XP{niveau.suivant ? ` · ${niveau.resteXp} XP avant « ${niveau.suivant.nom} »` : ' · tu as atteint le niveau maximum !'}
        </p>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-blue-700">Les 10 niveaux et comment gagner des XP</summary>
          <ol className="mt-2 grid sm:grid-cols-2 gap-1">
            {NIVEAUX.map((n, i) => (
              <li key={n.nom} className={i + 1 === niveau.numero ? 'font-bold' : ''}>
                {i + 1}. {n.nom} <span className="text-muted">({n.seuil} XP)</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-muted">
            Flashcard révisée 2 XP · bonne réponse au QCM 5 XP · exercice réussi 10 XP · cas pratique terminé 25 XP · Pomodoro terminé 15 XP · séance guidée complète +20 XP. Une erreur ne fait jamais perdre d'XP.
          </p>
        </details>
      </section>

      {/* Statistiques */}
      <section className="carte p-5 mb-4" aria-labelledby="t-stats">
        <h2 id="t-stats" className="text-lg font-bold mb-3">Mes statistiques</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <Stat valeur={formatDuree(minutesTotal)} label="de révision" />
          <Stat valeur={String(p.stats.meilleureSerie)} label="meilleure série (jours)" />
          <Stat valeur={String(p.tentatives.filter((t) => t.type === 'flashcard').length)} label="flashcards révisées" />
          <Stat valeur={taux === null ? '—' : `${taux} %`} label="de réussite (QCM, exercices)" />
        </div>
        <h3 className="font-semibold mb-2">Séances par semaine</h3>
        <GraphiqueSeances p={p} />
        <h3 className="font-semibold mt-6 mb-3">Réussite par notion</h3>
        <MaitriseNotions />
      </section>

      {/* Badges */}
      <section className="carte p-5 mb-4" aria-labelledby="t-badges">
        <h2 id="t-badges" className="text-lg font-bold">
          Mes badges <span className="text-muted font-normal text-base">({Object.keys(p.badges).length} / {BADGES.length})</span>
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {BADGES.map((b) => {
            const obtenu = !!p.badges[b.id]
            return (
              <li key={b.id} className={`rounded-2xl p-3 border ${obtenu ? 'border-orange-400 bg-orange-100' : 'border-line bg-surface-2'}`}>
                <span aria-hidden className={`text-2xl ${obtenu ? '' : 'grayscale opacity-50'}`}>{b.icone}</span>
                <p className="font-semibold text-sm mt-1">
                  {b.nom}
                  <span className="sr-only">{obtenu ? ' (obtenu)' : ' (pas encore obtenu)'}</span>
                </p>
                <p className="text-xs text-muted">{b.description}</p>
                {obtenu && (
                  <p className="text-xs font-bold text-orange-700 mt-1 flex items-center gap-1">
                    <Icone nom="ok" taille={12} /> Obtenu
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Réglages */}
      <section className="carte p-5 mb-4" aria-labelledby="t-reglages">
        <h2 id="t-reglages" className="text-lg font-bold mb-4">Mes réglages</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 font-semibold text-sm">
            Prénom
            <input className={`${champ} font-normal text-base`} value={p.profil.prenom} maxLength={30} autoComplete="given-name" onChange={(e) => majProfil({ prenom: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 font-semibold text-sm">
            Date de ton QCM (facultatif)
            <input type="date" className={`${champ} font-normal text-base`} value={p.profil.dateQcm ?? ''} onChange={(e) => majProfil({ dateQcm: e.target.value || null })} />
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="font-semibold text-sm mb-1">Objectif de la semaine</legend>
          <div className="grid grid-cols-3 gap-2">
            {([3, 5, 7] as const).map((n) => (
              <label key={n} className={`flex items-center justify-center gap-2 min-h-11 rounded-xl border-2 cursor-pointer ${p.profil.objectifHebdo === n ? 'border-orange-500 bg-orange-100 font-bold' : 'border-line'}`}>
                <input type="radio" name="objectif" className="sr-only" checked={p.profil.objectifHebdo === n} onChange={() => majProfil({ objectifHebdo: n })} />
                {n} séances
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="font-semibold text-sm mb-1">Minuteur Pomodoro (minutes)</legend>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['travail', 'Travail', 10, 60],
                ['pause', 'Pause', 1, 15],
                ['pauseLongue', 'Pause longue', 5, 30],
              ] as const
            ).map(([cle, label, min, max]) => (
              <ChampMinutes key={cle} label={label} min={min} max={max} valeur={prefs[cle]} classe={`${champ} text-base`} onChange={(v) => majProfil({ preferences: { ...prefs, [cle]: v } })} />
            ))}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-col gap-2">
          <Interrupteur label="Son doux à la fin du minuteur" coche={prefs.son} onChange={(v) => majProfil({ preferences: { ...prefs, son: v } })} />
          <Interrupteur
            label="Notification du navigateur à la fin du minuteur"
            aide={'Notification' in window && Notification.permission === 'denied' ? 'Les notifications sont bloquées dans les réglages de ton navigateur.' : undefined}
            coche={prefs.notifications}
            onChange={activerNotifications}
          />
        </div>

        <fieldset className="mt-4">
          <legend className="font-semibold text-sm mb-1">Thème</legend>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['systeme', 'Auto'],
                ['clair', 'Clair'],
                ['sombre', 'Sombre'],
              ] as [ChoixTheme, string][]
            ).map(([v, l]) => (
              <label key={v} className={`flex items-center justify-center min-h-11 rounded-xl border-2 cursor-pointer ${choix === v ? 'border-blue-500 bg-blue-100 font-bold' : 'border-line'}`}>
                <input type="radio" name="theme" className="sr-only" checked={choix === v} onChange={() => setChoix(v)} />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* Zone sensible */}
      <section className="carte p-5" aria-labelledby="t-reset">
        <h2 id="t-reset" className="text-lg font-bold">Recommencer à zéro</h2>
        <p className="text-sm text-muted mt-1">Efface tes XP, ta série, tes badges et ta répétition espacée. Ton prénom et tes réglages sont gardés.</p>
        {!confirmer ? (
          <button type="button" className="btn btn-contour mt-3 !border-error text-error-ink" onClick={() => setConfirmer(true)}>
            Réinitialiser ma progression
          </button>
        ) : (
          <div role="alertdialog" aria-labelledby="t-confirm" className="mt-3 rounded-2xl bg-error-bg border border-error p-4">
            <p id="t-confirm" className="font-semibold">Sûr·e ? Cette action est définitive.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                className="btn btn-contour !border-error text-error-ink"
                onClick={() => {
                  reinitialiser()
                  setConfirmer(false)
                }}
              >
                Oui, tout effacer
              </button>
              <button type="button" className="btn btn-bleu" onClick={() => setConfirmer(false)} autoFocus>
                Non, garder ma progression
              </button>
            </div>
          </div>
        )}
      </section>
    </Page>
  )
}

/** Champ de minutes : on peut taper librement, la valeur est corrigée quand on quitte le champ. */
function ChampMinutes({ label, min, max, valeur, classe, onChange }: { label: string; min: number; max: number; valeur: number; classe: string; onChange: (v: number) => void }) {
  const [texte, setTexte] = useState(String(valeur))
  const valider = () => {
    const v = Math.min(max, Math.max(min, Math.round(Number(texte)) || valeur))
    setTexte(String(v))
    if (v !== valeur) onChange(v)
  }
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input type="number" inputMode="numeric" min={min} max={max} className={classe} value={texte} onChange={(e) => setTexte(e.target.value)} onBlur={valider} onKeyDown={(e) => e.key === 'Enter' && valider()} />
    </label>
  )
}

function Stat({ valeur, label }: { valeur: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <p className="font-titre font-bold text-xl text-blue-700">{valeur}</p>
      <p className="text-xs text-muted leading-tight">{label}</p>
    </div>
  )
}

function Interrupteur({ label, aide, coche, onChange }: { label: string; aide?: string; coche: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 min-h-11 cursor-pointer">
      <span>
        {label}
        {aide && <span className="block text-xs text-muted">{aide}</span>}
      </span>
      <input type="checkbox" role="switch" className="w-6 h-6 accent-[var(--blue-700)]" checked={coche} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}
