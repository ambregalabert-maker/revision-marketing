import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import Page from '../components/Page'
import DeroulementSeance, { type Score } from '../components/revision/DeroulementSeance'
import { DUREES } from '../components/Personnaliser'
import { Interrupteur } from '../components/Personnaliser'
import Icone from '../components/Icone'
import { PuceXp } from '../components/ui'
import { notions } from '../lib/contenu'
import { planTryhard, type Plan } from '../lib/plan'
import { XP, encouragement, maitrise } from '../lib/gamification'
import { formatDans, jour } from '../lib/dates'
import { carillon } from '../lib/son'
import { useProgression } from '../state/progression'
import { useTempsEtude } from '../state/useTempsEtude'

const DESCRIPTION: Record<string, { nom: string; contenu: string }> = {
  '5': { nom: 'Petit pas', contenu: 'Tes flashcards du jour + 2 questions' },
  '10': { nom: 'Séance express', contenu: 'Flashcards + 5 questions sur ta notion faible' },
  '25': { nom: 'Séance complète', contenu: 'Flashcards + 5 questions + tes erreurs + 1 exercice' },
  plus: { nom: 'Grosse session', contenu: 'Tes 2 notions faibles, 10 questions, tes erreurs, 2 exercices' },
}

const formatMinuteur = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

/** Bonus de fin de séance : proportionnel à la durée (20 XP pour 25 min). */
const bonusPour = (duree: number) => Math.max(5, Math.round((XP.bonusSeanceGuidee * Math.min(duree, 40)) / 25))

/**
 * Le mode Tryhard : tu choisis ta durée, la séance s'adapte à tes points faibles.
 * C'est le seul endroit où le minuteur apparaît (discret, et masquable).
 */
export default function Seance() {
  useTempsEtude()
  const { p, terminerSession } = useProgression()
  const prefs = p.profil.preferences
  const [duree, setDuree] = useState(prefs.dureeSeance)
  const [minuteur, setMinuteur] = useState(prefs.minuteur)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [fin, setFin] = useState<{ score: Score; xp: number; minutes: number } | null>(null)
  const depart = useRef<{ xp: number; heure: number; maitrise: Record<string, number> } | null>(null)
  const dureeLibre = !DUREES.includes(duree as (typeof DUREES)[number])

  const commencer = () => {
    depart.current = {
      xp: p.stats.xpTotal,
      heure: Date.now(),
      maitrise: Object.fromEntries(notions.map((n) => [n.id, maitrise(p.tentatives, n.id).taux])),
    }
    setFin(null)
    setPlan(planTryhard(duree, p))
    window.scrollTo(0, 0)
  }

  const terminer = (score: Score) => {
    const minutes = Math.max(1, Math.round((Date.now() - (depart.current?.heure ?? Date.now())) / 60_000))
    const bonus = bonusPour(duree)
    terminerSession('guidee', minutes, bonus)
    setFin({ score, xp: bonus, minutes })
    setPlan(null)
    window.scrollTo(0, 0)
  }

  // ---------- Écran de fin ----------
  if (fin) {
    const gain = p.stats.xpTotal - (depart.current?.xp ?? p.stats.xpTotal)
    const progres = notions
      .map((n) => ({ n, avant: depart.current?.maitrise[n.id] ?? 0, apres: maitrise(p.tentatives, n.id).taux }))
      .filter((x) => x.apres > x.avant)
    const prochaines = Object.values(p.cartes)
      .map((c) => c.prochaine)
      .filter((d) => d > jour())
      .sort()
    const pct = fin.score.total ? Math.round((fin.score.justes / fin.score.total) * 100) : 100
    return (
      <Page titre="Séance terminée !">
        <div className="carte p-6 text-center apparition">
          <div aria-hidden className="text-5xl mb-2">
            🎉
          </div>
          <p className="text-xl font-titre font-bold">Bravo ! Fais une pause 🙂</p>
          <p className="text-muted mt-1">{encouragement()}</p>
          <div className="flex justify-center gap-2 mt-4">
            <PuceXp xp={gain} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-2xl bg-surface-2 p-3">
              <p className="font-titre font-bold text-2xl">{pct} %</p>
              <p className="text-xs text-muted">de bonnes réponses</p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-3">
              <p className="font-titre font-bold text-2xl">{fin.minutes} min</p>
              <p className="text-xs text-muted">de révision</p>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="carte p-5">
            <h2 className="font-bold mb-2">Notions qui ont progressé</h2>
            {progres.length ? (
              <ul className="flex flex-col gap-1">
                {progres.map((x) => (
                  <li key={x.n.id} className="flex justify-between gap-2">
                    <span>{x.n.titre}</span>
                    <span className="font-bold text-success-ink whitespace-nowrap">
                      {x.avant} % → {x.apres} %
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">Pas de hausse visible cette fois, mais chaque réponse compte pour la suite.</p>
            )}
          </div>
          <div className="carte p-5">
            <h2 className="font-bold mb-2">Prochaine révision</h2>
            <p>{prochaines[0] ? `Tes prochaines flashcards reviennent ${formatDans(prochaines[0])}.` : 'Reviens demain pour une nouvelle séance.'}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link to="/" className="btn btn-accent flex-1">
            Retour au chemin
          </Link>
          <button type="button" className="btn btn-contour flex-1" onClick={() => setFin(null)}>
            Nouvelle séance
          </button>
        </div>
      </Page>
    )
  }

  // ---------- Séance en cours ----------
  if (plan) {
    return (
      <div className="apparition">
        <DeroulementSeance
          plan={plan}
          onFin={terminer}
          entete={
            <>
              <button
                type="button"
                onClick={() => setPlan(null)}
                className="flex items-center justify-center w-11 h-11 -ml-2 text-muted rounded-full hover:bg-surface-2"
                aria-label="Quitter la séance"
              >
                <Icone nom="non" />
              </button>
              {minuteur && <Minuteur duree={duree} debut={depart.current?.heure ?? Date.now()} son={prefs.son} onMasquer={() => setMinuteur(false)} />}
            </>
          }
        />
      </div>
    )
  }

  // ---------- Choix de la durée ----------
  const cle = dureeLibre ? 'plus' : String(duree)
  return (
    <Page titre="Mode Tryhard" sousTitre="Tu as combien de temps ? La séance s'adapte et commence par tes points faibles.">
      <Link to="/reviser" className="inline-flex items-center gap-1 min-h-11 text-blue-700 font-semibold mb-2 -ml-1">
        <Icone nom="retour" taille={20} /> Tryhard
      </Link>
      <div role="radiogroup" aria-label="Durée de la séance" className="flex flex-col gap-3">
        {(['5', '10', '25', 'plus'] as const).map((k) => {
          const actif = cle === k
          const minutes = k === 'plus' ? (dureeLibre ? duree : 40) : Number(k)
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => setDuree(minutes)}
              className={`text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors ${
                actif ? 'border-accent-600 bg-accent-100' : 'border-line bg-surface hover:border-blue-500'
              }`}
              style={{ boxShadow: `0 4px 0 ${actif ? 'var(--accent-600)' : 'var(--line)'}` }}
            >
              <span
                className={`w-14 h-14 shrink-0 rounded-2xl flex flex-col items-center justify-center font-titre font-bold text-xl leading-none ${
                  actif ? 'bg-accent-500 text-[#1e2a3a]' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {k === 'plus' ? '30+' : k}
                <span className="text-[11px] font-semibold">min</span>
              </span>
              <span>
                <span className="block font-titre font-semibold text-lg">{DESCRIPTION[k].nom}</span>
                <span className="block text-sm text-muted">{DESCRIPTION[k].contenu}</span>
              </span>
            </button>
          )
        })}
      </div>
      {dureeLibre && (
        <label className="flex items-center gap-3 mt-4 text-sm font-semibold">
          <span className="whitespace-nowrap w-16">{duree} min</span>
          <input
            type="range"
            min={30}
            max={60}
            step={5}
            value={duree}
            onChange={(e) => setDuree(Number(e.target.value))}
            className="flex-1 accent-[var(--accent-600)]"
            aria-label="Durée de la séance en minutes"
          />
        </label>
      )}
      <div className="mt-4">
        <Interrupteur label="Afficher le minuteur pendant la séance" coche={minuteur} onChange={setMinuteur} />
      </div>
      <p className="text-sm text-muted mt-1">Pas de pression : quand le temps est écoulé, tu finis tranquillement ta question.</p>
      <button type="button" className="btn btn-accent w-full !min-h-14 text-lg mt-5" onClick={commencer}>
        C'est parti ({duree} min)
      </button>
    </Page>
  )
}

/** Petit minuteur discret, en haut de la séance. Quand le temps est écoulé : un message doux, pas de couperet. */
function Minuteur({ duree, debut, son, onMasquer }: { duree: number; debut: number; son: boolean; onMasquer: () => void }) {
  const [maintenant, setMaintenant] = useState(Date.now())
  const sonne = useRef(false)
  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const reste = Math.max(0, Math.round(duree * 60 - (maintenant - debut) / 1000))
  useEffect(() => {
    if (reste === 0 && !sonne.current) {
      sonne.current = true
      if (son) carillon()
    }
  }, [reste, son])

  return (
    <button
      type="button"
      onClick={onMasquer}
      title="Masquer le minuteur"
      aria-label={reste ? `Temps restant ${formatMinuteur(reste)}. Masquer le minuteur` : 'Temps écoulé, termine ta question puis fais une pause. Masquer le minuteur'}
      className={`order-last shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 min-h-9 text-sm font-bold tabular-nums ${
        reste ? 'bg-surface border-line text-muted' : 'bg-success-bg border-success text-success-ink'
      }`}
    >
      <Icone nom="minuteur" taille={14} />
      {reste ? formatMinuteur(reste) : 'Pause bientôt 🙂'}
    </button>
  )
}
