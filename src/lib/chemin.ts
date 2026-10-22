// Le chemin du mode « daily » : une étape par notion, dans l'ordre du cours,
// avec un bilan à la fin de chaque séance. Toutes les étapes sont ouvertes.
//
// Les étoiles suivent la répétition espacée :
//   ⭐      : la mini-séance est terminée une première fois ;
//   ⭐⭐    : réussie (≥ 70 %) au moins 1 jour après la 1re étoile ;
//   ⭐⭐⭐  : réussie encore au moins 7 jours après la 2e.
import { ecartJours, jour } from './dates'
import { notions } from './contenu'
import type { Chapitre, EtoilesEtape, NotionId, Progression, Seance } from './types'

export const SEUIL_REUSSITE = 0.7

export type GenreEtape = 'notion' | 'bilan' | 'final'

export interface Etape {
  id: string
  titre: string
  genre: GenreEtape
  chapitre: Chapitre
  seance: Seance
  /** Notions travaillées dans cette étape. */
  notions: NotionId[]
}

const etapesNotion = (filtre: (n: (typeof notions)[number]) => boolean): Etape[] =>
  notions.filter(filtre).map((n) => ({ id: n.id, titre: n.titre, genre: 'notion', chapitre: n.chapitre, seance: n.seance, notions: [n.id] }))

const notionsDuChapitre = (c: Chapitre) => notions.filter((n) => n.chapitre === c).map((n) => n.id)

// Les identifiants « bilan-1 » et « final » sont gardés tels quels pour ne pas perdre les étoiles déjà gagnées.
export const ETAPES: Etape[] = [
  ...etapesNotion((n) => n.chapitre === 1 && n.seance === 1),
  { id: 'bilan-1', titre: 'Bilan séance 1', genre: 'bilan', chapitre: 1, seance: 1, notions: notions.filter((n) => n.seance === 1).map((n) => n.id) },
  ...etapesNotion((n) => n.chapitre === 1 && n.seance === 2),
  { id: 'final', titre: 'Bilan chapitre 1', genre: 'bilan', chapitre: 1, seance: 2, notions: notionsDuChapitre(1) },
  ...etapesNotion((n) => n.chapitre === 2),
  { id: 'bilan-ch2', titre: 'Bilan chapitre 2', genre: 'bilan', chapitre: 2, seance: 4, notions: notionsDuChapitre(2) },
  ...etapesNotion((n) => n.chapitre === 3),
  { id: 'bilan-ch3', titre: 'Bilan chapitre 3', genre: 'bilan', chapitre: 3, seance: 6, notions: notionsDuChapitre(3) },
  ...etapesNotion((n) => n.chapitre === 4),
  { id: 'bilan-ch4', titre: 'Bilan chapitre 4', genre: 'bilan', chapitre: 4, seance: 8, notions: notionsDuChapitre(4) },
  { id: 'examen', titre: 'Prêt·e pour l’examen', genre: 'final', chapitre: 4, seance: 8, notions: notions.map((n) => n.id) },
]

/** Délai (en jours) avant de pouvoir gagner l'étoile suivante. */
const DELAI: Record<number, number> = { 1: 1, 2: 7 }

/** Calcule l'état d'une étape après une mini-séance. */
export function gagnerEtoile(etat: EtoilesEtape | undefined, reussi: boolean, aujourdhui = jour()): EtoilesEtape {
  const e = etat ?? { etoiles: 0, le: null }
  if (e.etoiles === 0) return { etoiles: 1, le: aujourdhui }
  if (e.etoiles >= 3 || !reussi || !e.le) return e
  if (ecartJours(e.le, aujourdhui) >= DELAI[e.etoiles]) return { etoiles: e.etoiles + 1, le: aujourdhui }
  return e
}

/** Quand la prochaine étoile pourra être gagnée ("AAAA-MM-JJ"), ou null si 3 étoiles. */
export function prochaineEtoile(etat: EtoilesEtape | undefined): string | null {
  if (!etat || etat.etoiles === 0) return jour()
  if (etat.etoiles >= 3 || !etat.le) return null
  const d = new Date(etat.le + 'T12:00:00')
  d.setDate(d.getDate() + DELAI[etat.etoiles])
  return jour(d)
}

/** Une étoile peut-elle être gagnée aujourd'hui sur cette étape ? */
export function etoileDisponible(etat: EtoilesEtape | undefined, aujourdhui = jour()): boolean {
  const date = prochaineEtoile(etat)
  return date !== null && date <= aujourdhui
}

/**
 * L'étape conseillée aujourd'hui (« C'est ici ! ») : la première jamais faite,
 * sinon celle dont une étoile est disponible avec le moins d'étoiles, sinon la première non dorée.
 */
export function etapeDuJour(p: Progression): Etape {
  const aujourdhui = jour()
  const jamais = ETAPES.find((e) => !p.chemin[e.id]?.etoiles)
  if (jamais) return jamais
  const dispo = ETAPES.filter((e) => etoileDisponible(p.chemin[e.id], aujourdhui)).sort(
    (a, b) => (p.chemin[a.id]?.etoiles ?? 0) - (p.chemin[b.id]?.etoiles ?? 0),
  )
  return dispo[0] ?? ETAPES.find((e) => (p.chemin[e.id]?.etoiles ?? 0) < 3) ?? ETAPES[0]
}

export const totalEtoiles = (p: Progression) => ETAPES.reduce((s, e) => s + (p.chemin[e.id]?.etoiles ?? 0), 0)
