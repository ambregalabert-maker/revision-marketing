// Les 4 mondes du chemin : un fond sobre et un décor discret, purement visuel. Tous gratuits.
import type { Monde } from './types'

export interface InfoMonde {
  id: Monde
  nom: string
  emoji: string
  /** Couleurs de la vignette dans « Personnaliser ». */
  fond: string
  ombre: string
}

// Les identifiants restent les mêmes (préférences déjà enregistrées), seuls les décors ont changé.
export const MONDES: InfoMonde[] = [
  { id: 'arc', nom: 'Nuage', emoji: '☁️', fond: '#eef0fb', ombre: '#cfd5ee' },
  { id: 'jardin', nom: 'Papier', emoji: '✏️', fond: '#f6f1e6', ombre: '#ddd3bf' },
  { id: 'galaxie', nom: 'Nuit', emoji: '🌙', fond: '#1f2647', ombre: '#12172e' },
  { id: 'hiver', nom: 'Givre', emoji: '❄️', fond: '#e8f1fa', ombre: '#c6d8ea' },
]

export type TypeDecor =
  | 'halo'
  | 'point'
  | 'nuage'
  | 'etoile'
  | 'fleur'
  | 'petale'
  | 'papillon'
  | 'planete'
  | 'lune'
  | 'filante'
  | 'flocon'
  | 'sapin'
  | 'arc'
  | 'herbe'
  | 'butte'

export interface ElementDecor {
  type: TypeDecor
  /** Position horizontale en % de la largeur. */
  x: number
  /** Position verticale en px. */
  y: number
  /** Largeur et hauteur en px (avant agrandissement sur ordinateur). */
  t: number
  h: number
  couleur: string
  anim?: 'flotte' | 'scintille' | 'tombe' | 'papillon' | 'filante'
  delai?: number
  duree?: number
}

/** Hauteur d'un motif de décor : il se répète tout le long du chemin. */
export const HAUTEUR_MOTIF = 970

// Les motifs ont été dessinés pour un écran de 390 px de large : on convertit x en %.
const el = (type: TypeDecor, x: number, y: number, t: number, extra: Partial<ElementDecor> = {}): ElementDecor => ({
  type,
  x: (x / 390) * 100,
  y,
  t,
  h: t,
  couleur: '#ffffff',
  ...extra,
})

// Très peu d'éléments, petits ou flous : le décor doit rester en arrière-plan.
const MOTIFS: Record<Monde, ElementDecor[]> = {
  // Nuage : trois grands halos de couleur, flous, qui dérivent lentement.
  arc: [
    el('halo', -40, 80, 260, { couleur: '#ffc7b2', anim: 'flotte', duree: 18 }),
    el('halo', 230, 420, 280, { couleur: '#d6cefb', anim: 'flotte', delai: -6, duree: 22 }),
    el('halo', -20, 760, 240, { couleur: '#bfe0fa', anim: 'flotte', delai: -11, duree: 20 }),
  ],
  // Papier : le motif à points suffit.
  jardin: [],
  // Nuit : quelques petites étoiles qui scintillent.
  galaxie: [
    [40, 90], [330, 180], [90, 360], [350, 520], [30, 640], [300, 780], [150, 900], [210, 260],
  ].map(([x, y], i) => el('point', x, y, i % 3 === 0 ? 5 : 3, { couleur: '#ffffff', anim: 'scintille', delai: -i * 0.7, duree: 3.4 })),
  // Givre : quelques petits flocons qui tombent doucement.
  hiver: [
    [50, 20], [200, 160], [340, 60], [110, 420], [300, 520], [60, 700],
  ].map(([x, y], i) => el('point', x, y, 6, { couleur: '#b9d3ee', anim: 'tombe', delai: -i * 2, duree: 14 })),
}

/** Le décor d'un monde, répété sur toute la hauteur du chemin. */
export function decorDuMonde(monde: Monde, hauteur: number): ElementDecor[] {
  const motif = MOTIFS[monde] ?? MOTIFS.arc
  const tout: ElementDecor[] = []
  for (let debut = 0; debut < hauteur; debut += HAUTEUR_MOTIF) {
    for (const e of motif) if (debut + e.y < hauteur - 20) tout.push({ ...e, y: debut + e.y })
  }
  return tout
}
