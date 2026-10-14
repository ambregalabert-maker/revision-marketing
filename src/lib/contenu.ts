// Point d'entrée unique vers le contenu pédagogique (fichiers JSON de src/data).
// Pour corriger ou ajouter une question, modifie les JSON : pas besoin de toucher à ce fichier.
import notionsJson from '../data/notions.json'
import flashcardsJson from '../data/flashcards.json'
import qcmJson from '../data/qcm.json'
import classementsJson from '../data/classements.json'
import vraiFauxJson from '../data/vraifaux.json'
import casJson from '../data/cas.json'
import donneesCoursJson from '../data/donnees-cours.json'
import type {
  CasPratique,
  ExerciceClassement,
  FiltreSeance,
  Flashcard,
  Notion,
  NotionId,
  QuestionDonneesCours,
  QuestionQcm,
  VraiFaux,
} from './types'

export const notions = notionsJson as Notion[]
export const flashcards = flashcardsJson as Flashcard[]
export const qcm = qcmJson as QuestionQcm[]
export const classements = classementsJson as ExerciceClassement[]
export const vraiFaux = vraiFauxJson as VraiFaux[]
export const casPratiques = casJson as CasPratique[]
export const donneesCours = donneesCoursJson as QuestionDonneesCours[]

const titres = new Map(notions.map((n) => [n.id, n.titre]))
export const titreNotion = (id: NotionId) => titres.get(id) ?? id
export const seanceNotion = (id: NotionId) => notions.find((n) => n.id === id)?.seance ?? 1

/** Filtre une liste de contenu selon la séance et la notion choisies. */
export function filtrer<T extends { seance: 1 | 2; notion?: NotionId; notions?: NotionId[] }>(
  liste: T[],
  seance: FiltreSeance,
  notion: NotionId | 'toutes' = 'toutes',
): T[] {
  return liste.filter((x) => {
    if (seance !== 'toutes' && String(x.seance) !== seance) return false
    if (notion === 'toutes') return true
    return x.notion === notion || (x.notions?.includes(notion) ?? false)
  })
}

/** Mélange une copie d'un tableau (algorithme de Fisher-Yates). */
export function melanger<T>(liste: T[]): T[] {
  const copie = [...liste]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

/** Retrouve un élément de contenu par son identifiant (pour la liste « Mes erreurs à revoir »). */
export function trouverItem(id: string):
  | { genre: 'flashcard'; item: Flashcard }
  | { genre: 'qcm'; item: QuestionQcm }
  | { genre: 'classement'; item: ExerciceClassement }
  | { genre: 'vraifaux'; item: VraiFaux }
  | { genre: 'cas'; item: CasPratique }
  | { genre: 'donnees'; item: QuestionDonneesCours }
  | null {
  const f = flashcards.find((x) => x.id === id)
  if (f) return { genre: 'flashcard', item: f }
  const q = qcm.find((x) => x.id === id)
  if (q) return { genre: 'qcm', item: q }
  const c = classements.find((x) => x.id === id)
  if (c) return { genre: 'classement', item: c }
  const v = vraiFaux.find((x) => x.id === id)
  if (v) return { genre: 'vraifaux', item: v }
  const k = casPratiques.find((x) => x.id === id)
  if (k) return { genre: 'cas', item: k }
  const d = donneesCours.find((x) => x.id === id)
  if (d) return { genre: 'donnees', item: d }
  return null
}
