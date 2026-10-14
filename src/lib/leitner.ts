// Répétition espacée avec 5 boîtes de Leitner.
// Boîte 1 : à revoir le jour même (J+0) · 2 : J+1 · 3 : J+3 · 4 : J+7 · 5 : J+30.
// « Je ne savais pas » → boîte 1 ; « Hésitant » → reste dans sa boîte ; « Je savais » → boîte suivante.
import { ajouterJours, jour } from './dates'
import type { Flashcard, RevisionCarte } from './types'

export type NoteCarte = 'non' | 'hesite' | 'oui'

export const INTERVALLES: Record<RevisionCarte['boite'], number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 30 }

export function noter(actuelle: RevisionCarte | undefined, note: NoteCarte, aujourdhui = jour()): RevisionCarte {
  const avant = actuelle ?? { boite: 1, prochaine: aujourdhui, derniere: null, nbRevisions: 0, nbEchecs: 0 }
  let boite = avant.boite
  if (note === 'non') boite = 1
  else if (note === 'oui') boite = Math.min(5, boite + 1) as RevisionCarte['boite']
  // Une carte « hésitante » de la boîte 1 revient demain (et non en boucle le jour même).
  const intervalle = note === 'hesite' ? Math.max(1, INTERVALLES[boite]) : INTERVALLES[boite]
  return {
    boite,
    prochaine: ajouterJours(aujourdhui, intervalle),
    derniere: aujourdhui,
    nbRevisions: avant.nbRevisions + 1,
    nbEchecs: avant.nbEchecs + (note === 'non' ? 1 : 0),
  }
}

export function estDue(r: RevisionCarte | undefined, aujourdhui = jour()): boolean {
  return !r || r.prochaine <= aujourdhui
}

/**
 * Ordre de passage : d'abord les cartes déjà vues et dues (les plus en retard et
 * les boîtes les plus basses en premier, donc les cartes ratées avant les cartes réussies),
 * puis les cartes jamais vues.
 */
export function ordonner(cartes: Flashcard[], revisions: Record<string, RevisionCarte>, aujourdhui = jour()) {
  const dues = cartes
    .filter((c) => revisions[c.id] && estDue(revisions[c.id], aujourdhui))
    .sort((a, b) => {
      const ra = revisions[a.id]
      const rb = revisions[b.id]
      return ra.boite - rb.boite || ra.prochaine.localeCompare(rb.prochaine)
    })
  const nouvelles = cartes.filter((c) => !revisions[c.id])
  const plusTard = cartes
    .filter((c) => revisions[c.id] && !estDue(revisions[c.id], aujourdhui))
    .sort((a, b) => revisions[a.id].prochaine.localeCompare(revisions[b.id].prochaine))
  return { dues, nouvelles, plusTard }
}

/** Nombre de cartes à réviser aujourd'hui (dues + quelques nouvelles pour avancer). */
export const NOUVELLES_PAR_JOUR = 10

export function nombreDuJour(cartes: Flashcard[], revisions: Record<string, RevisionCarte>) {
  const { dues, nouvelles } = ordonner(cartes, revisions)
  return dues.length + Math.min(NOUVELLES_PAR_JOUR, nouvelles.length)
}
