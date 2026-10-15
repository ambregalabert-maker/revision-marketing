import { useMemo, useState, type ReactNode } from 'react'
import SessionFlashcards from './SessionFlashcards'
import SerieQcm from './SerieQcm'
import ExerciceAuto from './ExerciceAuto'
import Icone from '../Icone'
import type { Plan } from '../../lib/plan'

export interface Score {
  justes: number
  total: number
}

type Etape = { id: string; label: string; contenu: (fin: (justes: number, total: number) => void) => ReactNode }

/**
 * Enchaîne les étapes d'une séance (flashcards → questions → revanche → exercices),
 * avec une barre d'avancement en segments façon jeu, puis renvoie le score global.
 */
export default function DeroulementSeance({ plan, onFin, entete }: { plan: Plan; onFin: (s: Score) => void; entete?: ReactNode }) {
  const etapes = useMemo<Etape[]>(() => {
    const liste: Etape[] = []
    if (plan.cartes.length)
      liste.push({ id: 'cartes', label: 'Flashcards', contenu: (fin) => <SessionFlashcards cartes={plan.cartes} onTermine={(b) => fin(b.sues, b.vues)} /> })
    if (plan.questions.length)
      liste.push({ id: 'qcm', label: 'Questions', contenu: (fin) => <SerieQcm questions={plan.questions} mode="entrainement" onTermine={(r) => fin(r.bonnes, r.total)} /> })
    if (plan.revanche.length)
      liste.push({ id: 'revanche', label: 'Revanche', contenu: (fin) => <SerieQcm questions={plan.revanche} mode="entrainement" onTermine={(r) => fin(r.bonnes, r.total)} /> })
    plan.exercices.forEach((exo, i) =>
      liste.push({ id: `exo-${i}`, label: plan.exercices.length > 1 ? `Exercice ${i + 1}` : 'Exercice', contenu: (fin) => <ExerciceAuto exo={exo} onFin={fin} /> }),
    )
    return liste
  }, [plan])

  const [index, setIndex] = useState(0)
  const [score, setScore] = useState<Score>({ justes: 0, total: 0 })
  // Pour les exercices, on attend que l'étudiant ait lu la correction avant de passer à la suite.
  const [enAttente, setEnAttente] = useState<Score | null>(null)

  const etape = etapes[index]
  const avancer = (s: Score) => {
    const cumul = { justes: score.justes + s.justes, total: score.total + s.total }
    setScore(cumul)
    setEnAttente(null)
    window.scrollTo(0, 0)
    if (index + 1 >= etapes.length) onFin(cumul)
    else setIndex(index + 1)
  }

  if (!etape) {
    return null
  }

  // Le vrai/faux a déjà son bouton « Terminer » : pas besoin d'un second bouton.
  const exo = etape.id.startsWith('exo') ? plan.exercices[Number(etape.id.slice(4))] : null
  const estExercice = !!exo && exo.genre !== 'vraifaux'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {entete}
        <ol className="flex-1 flex gap-1.5" aria-label={`Étape ${index + 1} sur ${etapes.length} : ${etape.label}`}>
          {etapes.map((e, i) => (
            <li key={e.id} className="flex-1">
              <div className={`h-3 rounded-full transition-colors ${i < index ? 'bg-accent-500' : i === index ? 'bg-accent-400' : 'bg-blue-100'}`} />
            </li>
          ))}
        </ol>
      </div>
      <p className="text-sm font-bold text-muted -mb-1">{etape.label}</p>

      <div key={etape.id}>
        {etape.contenu((justes, total) => (estExercice ? setEnAttente({ justes, total }) : avancer({ justes, total })))}
      </div>

      {enAttente && (
        <button type="button" className="btn btn-accent w-full !min-h-14 text-lg" onClick={() => avancer(enAttente)}>
          {index + 1 >= etapes.length ? 'Terminer' : 'Continuer'} <Icone nom="suivant" />
        </button>
      )}
    </div>
  )
}
