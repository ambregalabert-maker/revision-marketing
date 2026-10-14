import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import Page from '../components/Page'
import SessionFlashcards from '../components/revision/SessionFlashcards'
import SerieQcm from '../components/revision/SerieQcm'
import Calculs from '../components/revision/Calculs'
import Classement from '../components/revision/Classement'
import VraiFauxEx from '../components/revision/VraiFauxEx'
import CasEx from '../components/revision/CasEx'
import { Etiquette, PuceXp } from '../components/ui'
import Icone from '../components/Icone'
import { casPratiques, classements, flashcards, melanger, notions, qcm, titreNotion, vraiFaux } from '../lib/contenu'
import { ordonner } from '../lib/leitner'
import { XP, encouragement, maitrise, notionLaPlusFaible } from '../lib/gamification'
import { formatDans, jour } from '../lib/dates'
import { useProgression } from '../state/progression'
import { formatMinuteur, usePomodoro } from '../state/pomodoro'
import { useTempsEtude } from '../state/useTempsEtude'
import type { NotionId, Progression } from '../lib/types'

type Etape = 'intro' | 'flashcards' | 'qcm' | 'exercice' | 'fin'

const MAX_CARTES = 15
const NB_QCM = 5

/** Choisit l'exercice d'application le plus adapté à la notion travaillée. */
function exercicePour(notion: NotionId) {
  if (notion === 'taux-evolution') return { genre: 'calcul' as const, calcul: 'taux' as const }
  if (notion === 'part-de-marche') return { genre: 'calcul' as const, calcul: 'pdm' as const }
  const environnement = notion === 'micro-environnement' || notion === 'macro-environnement'
  const classement = melanger(classements.filter((c) => (environnement ? c.id.startsWith('cl-env') : c.notion === notion)))[0]
  if (classement) return { genre: 'classement' as const, classement }
  const vf = vraiFaux.filter((v) => v.notion === notion)
  if (vf.length) return { genre: 'vraifaux' as const, items: melanger(vf).slice(0, 3) }
  return { genre: 'cas' as const, cas: casPratiques.find((c) => c.id === 'cas-cqlp')! }
}

/** Prépare le programme : cartes du jour, notion la plus faible, 5 questions, 1 exercice. */
function preparer(cartesRevues: Progression['cartes'], tentatives: Progression['tentatives']) {
  const { dues, nouvelles } = ordonner(flashcards, cartesRevues)
  const cartes = [...dues, ...nouvelles].slice(0, MAX_CARTES)
  const notion = notionLaPlusFaible(tentatives)
  const seance = notions.find((n) => n.id === notion)!.seance
  let questions = melanger(qcm.filter((q) => q.notion === notion)).slice(0, NB_QCM)
  if (questions.length < NB_QCM) {
    const complement = melanger(qcm.filter((q) => q.notion !== notion && q.seance === seance)).slice(0, NB_QCM - questions.length)
    questions = [...questions, ...complement]
  }
  return { cartes, notion, questions, exercice: exercicePour(notion) }
}

export default function Seance() {
  useTempsEtude()
  const { p, terminerSession } = useProgression()
  const pomodoro = usePomodoro()
  const [etape, setEtape] = useState<Etape>('intro')
  const depart = useRef<{ xp: number; heure: number; maitrise: Record<string, number> } | null>(null)
  const [exerciceFait, setExerciceFait] = useState(false)

  // Le programme est calculé en direct sur l'écran d'accueil, puis figé au démarrage.
  const apercu = useMemo(() => preparer(p.cartes, p.tentatives), [p.cartes, p.tentatives])
  const [fige, setFige] = useState<ReturnType<typeof preparer> | null>(null)
  const plan = fige ?? apercu

  const commencer = () => {
    depart.current = {
      xp: p.stats.xpTotal,
      heure: Date.now(),
      maitrise: Object.fromEntries(notions.map((n) => [n.id, maitrise(p.tentatives, n.id).taux])),
    }
    pomodoro.lancerTravail()
    setExerciceFait(false)
    setFige(apercu)
    setEtape(apercu.cartes.length ? 'flashcards' : 'qcm')
    window.scrollTo(0, 0)
  }

  const finir = () => {
    const minutes = Math.max(1, Math.round((Date.now() - (depart.current?.heure ?? Date.now())) / 60_000))
    terminerSession('guidee', minutes, XP.bonusSeanceGuidee)
    setEtape('fin')
    window.scrollTo(0, 0)
  }

  const allerA = (e: Etape) => {
    if (e === 'intro') setFige(null)
    setEtape(e)
    window.scrollTo(0, 0)
  }

  const etapes: { id: Etape; label: string }[] = [
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'qcm', label: 'QCM' },
    { id: 'exercice', label: 'Exercice' },
  ]
  const indexEtape = etapes.findIndex((e) => e.id === etape)

  if (etape === 'intro') {
    return (
      <Page titre="Séance guidée" sousTitre="25 minutes de concentration, puis 5 minutes de pause. On s'occupe du programme, tu t'occupes de réfléchir.">
        <ol className="flex flex-col gap-3 mb-6">
          <EtapeIntro n={1} titre="Tes flashcards du jour" texte={plan.cartes.length ? `${plan.cartes.length} carte${plan.cartes.length > 1 ? 's' : ''} à réviser (répétition espacée).` : 'Aucune carte due aujourd\'hui : on passe directement au QCM.'} />
          <EtapeIntro n={2} titre={`5 questions sur ta notion la plus faible`} texte={`Aujourd'hui : « ${titreNotion(plan.notion)} ».`} />
          <EtapeIntro n={3} titre="1 exercice d'application" texte="Pour passer de « je reconnais » à « je sais appliquer »." />
        </ol>
        <div className="carte p-4 mb-6 text-sm">
          <p className="font-semibold flex items-center gap-2">
            <Icone nom="astuces" taille={18} className="text-orange-700" /> Avant de commencer
          </p>
          <p className="text-muted mt-1">Mets ton téléphone en mode avion (ou dans une autre pièce si tu révises sur ordinateur). Tu gagnes un bonus de {XP.bonusSeanceGuidee} XP en allant au bout.</p>
        </div>
        <button type="button" className="btn btn-orange w-full !min-h-14 text-lg" onClick={commencer}>
          <Icone nom="lecture" /> Commencer ma séance (25 min)
        </button>
      </Page>
    )
  }

  if (etape === 'fin') {
    const gain = p.stats.xpTotal - (depart.current?.xp ?? p.stats.xpTotal)
    const progres = notions
      .map((n) => ({ n, avant: depart.current?.maitrise[n.id] ?? 0, apres: maitrise(p.tentatives, n.id).taux }))
      .filter((x) => x.apres > x.avant)
    const aujourdhui = jour()
    const prochaines = Object.values(p.cartes)
      .map((c) => c.prochaine)
      .filter((d) => d > aujourdhui)
      .sort()
    return (
      <Page titre="Séance terminée !">
        <div className="carte p-6 text-center apparition">
          <div aria-hidden className="text-5xl mb-2">🎉</div>
          <p className="text-lg">{encouragement()}</p>
          <p className="mt-3">
            <PuceXp xp={gain} />
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="carte p-5">
            <h2 className="font-bold mb-2">Notions qui ont progressé</h2>
            {progres.length ? (
              <ul className="flex flex-col gap-1">
                {progres.map((x) => (
                  <li key={x.n.id} className="flex justify-between gap-2">
                    <span>{x.n.titre}</span>
                    <span className="font-bold text-success-ink">
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
            {pomodoro.phase !== 'travail' && <p className="mt-2 text-sm rounded-xl bg-success-bg p-2">C'est la pause : {pomodoro.suggestion}</p>}
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link to="/" className="btn btn-orange flex-1">
            Retour à l'accueil
          </Link>
          <button type="button" className="btn btn-contour flex-1" onClick={() => allerA('intro')}>
            Nouvelle séance
          </button>
        </div>
      </Page>
    )
  }

  return (
    <Page titre="Séance guidée">
      {/* Avancement de la séance + minuteur */}
      <div className="flex items-center gap-2 mb-4">
        <ol className="flex-1 flex gap-1" aria-label="Étapes de la séance">
          {etapes.map((e, i) => (
            <li key={e.id} className="flex-1" aria-current={i === indexEtape ? 'step' : undefined}>
              <div className={`h-2 rounded-full ${i < indexEtape ? 'bg-success' : i === indexEtape ? 'bg-orange-500' : 'bg-blue-100'}`} />
              <span className={`block text-xs mt-1 ${i === indexEtape ? 'font-bold text-ink' : 'text-muted'}`}>
                {i < indexEtape && <span className="sr-only">Terminé : </span>}
                {e.label}
              </span>
            </li>
          ))}
        </ol>
        <span className="flex items-center gap-1 text-sm font-titre font-bold tabular-nums text-blue-700" aria-label="Temps restant du Pomodoro">
          <Icone nom="minuteur" taille={16} /> {formatMinuteur(pomodoro.resteSec)}
        </span>
      </div>

      {etape === 'flashcards' && (
        <>
          <p className="mb-3 text-muted">Étape 1 · Tes flashcards du jour.</p>
          <SessionFlashcards cartes={plan.cartes} onTermine={() => allerA('qcm')} />
        </>
      )}

      {etape === 'qcm' && (
        <>
          <p className="mb-3 text-muted">
            Étape 2 · Ta notion la plus faible : <Etiquette>{titreNotion(plan.notion)}</Etiquette>
          </p>
          <SerieQcm questions={plan.questions} mode="entrainement" onTermine={() => allerA('exercice')} />
        </>
      )}

      {etape === 'exercice' && (
        <>
          <p className="mb-3 text-muted">Étape 3 · Applique : c'est ce qui fait la différence le jour de l'examen.</p>
          {plan.exercice.genre === 'calcul' && <Calculs genreInitial={plan.exercice.calcul} onVerifie={() => setExerciceFait(true)} />}
          {plan.exercice.genre === 'classement' && <Classement exo={plan.exercice.classement} onTermine={() => setExerciceFait(true)} />}
          {plan.exercice.genre === 'vraifaux' && <VraiFauxEx items={plan.exercice.items} onTermine={() => setExerciceFait(true)} />}
          {plan.exercice.genre === 'cas' && <CasEx cas={plan.exercice.cas} onTermine={() => setExerciceFait(true)} />}
          {exerciceFait && (
            <button type="button" className="btn btn-orange w-full mt-4 !min-h-14" onClick={finir}>
              Terminer ma séance (+{XP.bonusSeanceGuidee} XP bonus) <Icone nom="suivant" />
            </button>
          )}
        </>
      )}

      <Link to="/reviser" className="btn btn-discret w-full mt-4">
        Quitter la séance
      </Link>
    </Page>
  )
}

function EtapeIntro({ n, titre, texte }: { n: number; titre: string; texte: string }) {
  return (
    <li className="carte p-4 flex gap-3">
      <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-blue-100 text-blue-700 font-titre font-bold">{n}</span>
      <span>
        <span className="block font-titre font-semibold">{titre}</span>
        <span className="block text-muted">{texte}</span>
      </span>
    </li>
  )
}
