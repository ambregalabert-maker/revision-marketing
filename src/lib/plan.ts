// Préparation des séances : mini-séance du chemin (daily) et séance Tryhard.
import { casPratiques, classements, flashcards, melanger, notions, qcm, vraiFaux } from './contenu'
import { ordonner } from './leitner'
import { erreursARevoir, notionLaPlusFaible } from './gamification'
import type { Etape } from './chemin'
import type { CasPratique, ExerciceClassement, Flashcard, NotionId, Progression, QuestionQcm, VraiFaux } from './types'
import type { GenreCalcul } from './calculs'

export type Exercice =
  | { genre: 'calcul'; calcul: GenreCalcul }
  | { genre: 'classement'; classement: ExerciceClassement }
  | { genre: 'vraifaux'; items: VraiFaux[] }
  | { genre: 'cas'; cas: CasPratique }

/** Version courte d'un classement (n éléments, une seule étape) pour les séances rapides. */
export function classementCourt(c: ExerciceClassement, n = 4): ExerciceClassement {
  // On prend au moins un élément de chaque catégorie, puis on complète au hasard.
  const parCategorie = c.categories.map((cat) => melanger(c.elements.filter((e) => e.categorie === cat.id))[0]).filter(Boolean)
  const reste = melanger(c.elements.filter((e) => !parCategorie.includes(e)))
  const elements = [...parCategorie, ...reste].slice(0, Math.max(n, parCategorie.length))
  return { ...c, elements, sousCategories: undefined }
}

const estEnvironnement = (n: NotionId) => n === 'micro-environnement' || n === 'macro-environnement'

/** L'exercice d'application le plus adapté à une notion. `court` = version rapide (daily). */
export function exercicePour(notion: NotionId, court = false): Exercice | null {
  if (notion === 'taux-evolution') return { genre: 'calcul', calcul: 'taux' }
  if (notion === 'part-de-marche') return { genre: 'calcul', calcul: 'pdm' }
  const classement = melanger(classements.filter((c) => (estEnvironnement(notion) ? c.id.startsWith('cl-env') : c.notion === notion)))[0]
  if (classement) return { genre: 'classement', classement: court ? classementCourt(classement) : classement }
  const vf = vraiFaux.filter((v) => v.notion === notion)
  if (vf.length) return { genre: 'vraifaux', items: melanger(vf).slice(0, court ? 1 : 3) }
  if (court) return null
  const cas = casPratiques.find((c) => c.notions.includes(notion))
  return cas ? { genre: 'cas', cas } : null
}

/** Cartes à revoir en priorité (dues, puis nouvelles, puis le reste au hasard). */
function choisirCartes(liste: Flashcard[], p: Progression, n: number) {
  const { dues, nouvelles, plusTard } = ordonner(liste, p.cartes)
  return [...dues, ...nouvelles, ...melanger(plusTard)].slice(0, n)
}

function choisirQuestions(notionsCibles: NotionId[], n: number, exclure: string[] = []) {
  const cibles = melanger(qcm.filter((q) => notionsCibles.includes(q.notion) && !exclure.includes(q.id)))
  if (cibles.length >= n) return cibles.slice(0, n)
  // Pas assez de questions sur ces notions : on complète avec la même séance.
  const seances = new Set(notionsCibles.map((id) => notions.find((x) => x.id === id)!.seance))
  const complement = melanger(qcm.filter((q) => !cibles.includes(q) && seances.has(q.seance) && !exclure.includes(q.id)))
  return [...cibles, ...complement].slice(0, n)
}

export interface Plan {
  cartes: Flashcard[]
  questions: QuestionQcm[]
  /** Questions de QCM ratées récemment (séance Tryhard). */
  revanche: QuestionQcm[]
  exercices: Exercice[]
  notionsVisees: NotionId[]
}

/** Mini-séance du chemin (~3 min) : 3 flashcards, 3 questions, 1 petit exercice. */
export function planDaily(etape: Etape, p: Progression): Plan {
  if (etape.genre === 'final') {
    return {
      cartes: [],
      questions: melanger(qcm).slice(0, 7),
      revanche: [],
      exercices: [{ genre: 'calcul', calcul: 'tous' }],
      notionsVisees: etape.notions,
    }
  }
  const bilan = etape.genre === 'bilan'
  const cartes = choisirCartes(flashcards.filter((c) => etape.notions.includes(c.notion)), p, bilan ? 4 : 3)
  const questions = choisirQuestions(etape.notions, bilan ? 5 : 3)
  const exo = bilan ? ({ genre: 'calcul', calcul: 'tous' } as Exercice) : exercicePour(etape.notions[0], true)
  return { cartes, questions, revanche: [], exercices: exo ? [exo] : [], notionsVisees: etape.notions }
}

/**
 * Séance Tryhard : le contenu s'adapte à la durée choisie et commence par tes points faibles.
 *  5 min → flashcards + 2 questions · 10 min → flashcards + 5 questions
 * 25 min → + tes questions ratées + 1 exercice · plus long → 2 notions faibles, plus de questions, 2 exercices.
 */
export function planTryhard(duree: number, p: Progression): Plan {
  const faible = notionLaPlusFaible(p.tentatives)
  const deuxieme = notionLaPlusFaible(p.tentatives, notions.map((n) => n.id).filter((n) => n !== faible))
  const long = duree > 25
  const notionsVisees = long ? [faible, deuxieme] : [faible]
  const nbCartes = duree <= 5 ? 8 : duree <= 10 ? 10 : long ? 20 : 15
  const nbQuestions = duree <= 5 ? 2 : duree <= 25 ? 5 : 10

  const { dues, nouvelles } = ordonner(flashcards, p.cartes)
  const cartes = [...dues, ...nouvelles].slice(0, nbCartes)
  const questions = choisirQuestions(notionsVisees, nbQuestions)

  const ratees = erreursARevoir(p.tentatives)
    .filter((e) => e.type === 'qcm')
    .map((e) => qcm.find((q) => q.id === e.itemId))
    .filter((q): q is QuestionQcm => !!q && !questions.includes(q))
  const revanche = duree >= 25 ? ratees.slice(0, long ? 5 : 3) : []

  const exercices: Exercice[] = []
  if (duree >= 25) {
    const e1 = exercicePour(faible)
    if (e1) exercices.push(e1)
    if (long) {
      const e2 = exercicePour(deuxieme)
      if (e2) exercices.push(e2)
    }
  }
  return { cartes, questions, revanche, exercices, notionsVisees }
}
