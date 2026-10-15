// Le chemin du mode « daily » : une étape par notion, dans l'ordre du cours,
// avec un bilan à la fin de chaque séance. Toutes les étapes sont ouvertes.
//
// Les étoiles suivent la répétition espacée :
//   ⭐      : la mini-séance est terminée une première fois ;
//   ⭐⭐    : réussie (≥ 70 %) au moins 1 jour après la 1re étoile ;
//   ⭐⭐⭐  : réussie encore au moins 7 jours après la 2e.
import { ecartJours, jour } from './dates'
import { notions } from './contenu'
import type { EtoilesEtape, NotionId, Progression } from './types'

export const SEUIL_REUSSITE = 0.7

export type GenreEtape = 'notion' | 'bilan' | 'final'

export interface Etape {
  id: string
  titre: string
  genre: GenreEtape
  seance: 1 | 2
  /** Notions travaillées dans cette étape. */
  notions: NotionId[]
}

const etapesNotion = (s: 1 | 2): Etape[] =>
  notions
    .filter((n) => n.seance === s)
    .map((n) => ({ id: n.id, titre: n.titre, genre: 'notion', seance: s, notions: [n.id] }))

export const ETAPES: Etape[] = [
  ...etapesNotion(1),
  { id: 'bilan-1', titre: 'Bilan séance 1', genre: 'bilan', seance: 1, notions: notions.filter((n) => n.seance === 1).map((n) => n.id) },
  ...etapesNotion(2),
  { id: 'final', titre: 'Prêt·e pour le QCM', genre: 'final', seance: 2, notions: notions.map((n) => n.id) },
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
