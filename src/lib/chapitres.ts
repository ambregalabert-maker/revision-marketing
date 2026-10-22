// Les 4 chapitres du module, avec leur couleur sur le chemin (classes .chap-1 à .chap-4 dans index.css).
import type { Chapitre } from './types'

export interface InfoChapitre {
  numero: Chapitre
  titre: string
  seances: string
  /** Nom de la couleur du chapitre (pour l'affichage). */
  couleur: string
}

export const CHAPITRES: InfoChapitre[] = [
  { numero: 1, titre: 'Le concept de marché', seances: 'Séances 1 et 2', couleur: 'Pêche' },
  { numero: 2, titre: 'Le parcours d’achat', seances: 'Séances 3 et 4', couleur: 'Lavande' },
  { numero: 3, titre: 'Stratégie marketing', seances: 'Séances 5 et 6', couleur: 'Menthe' },
  { numero: 4, titre: 'Le marketing mix', seances: 'Séance 8', couleur: 'Ciel' },
]

export const infoChapitre = (n: Chapitre) => CHAPITRES[n - 1]
