// Les 4 mondes du chemin : un décor animé, purement visuel. Tous gratuits.
import type { Monde } from './types'

export interface InfoMonde {
  id: Monde
  nom: string
  emoji: string
  /** Couleurs de la vignette dans « Personnaliser ». */
  fond: string
  ombre: string
}

export const MONDES: InfoMonde[] = [
  { id: 'arc', nom: 'Arc-en-ciel', emoji: '🌈', fond: '#dcecfb', ombre: '#b9d3ee' },
  { id: 'jardin', nom: 'Jardin', emoji: '🌸', fond: '#d9f0df', ombre: '#b2dcbd' },
  { id: 'galaxie', nom: 'Galaxie', emoji: '🌌', fond: '#262f66', ombre: '#141a3b' },
  { id: 'hiver', nom: 'Hiver', emoji: '❄️', fond: '#eef4fb', ombre: '#c9d9ea' },
]

export type TypeDecor =
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

const MOTIFS: Record<Monde, ElementDecor[]> = {
  arc: [
    el('arc', 270, 90, 110, { h: 55 }),
    el('nuage', 10, 120, 80, { h: 40, anim: 'flotte', duree: 8 }),
    el('nuage', 290, 260, 90, { h: 45, anim: 'flotte', delai: -3, duree: 9 }),
    el('nuage', 250, 560, 70, { h: 35, anim: 'flotte', delai: -5, duree: 7 }),
    el('nuage', 12, 760, 86, { h: 43, anim: 'flotte', delai: -2, duree: 10 }),
    el('arc', 10, 420, 120, { h: 60 }),
    el('arc', 250, 840, 140, { h: 70 }),
    el('etoile', 40, 230, 18, { couleur: '#ffd966', anim: 'scintille' }),
    el('etoile', 345, 410, 14, { couleur: '#ffb3c7', anim: 'scintille', delai: -1 }),
    el('etoile', 30, 520, 16, { couleur: '#c4b8f8', anim: 'scintille', delai: -1.8 }),
    el('etoile', 345, 700, 18, { couleur: '#ffd966', anim: 'scintille', delai: -0.6 }),
    el('etoile', 40, 900, 14, { couleur: '#9fe3c9', anim: 'scintille', delai: -2.2 }),
  ],
  jardin: [
    el('fleur', 16, 120, 34, { couleur: '#ffb3c7' }),
    el('fleur', 340, 200, 30, { couleur: '#c4b8f8' }),
    el('fleur', 20, 420, 28, { couleur: '#ffe08a' }),
    el('fleur', 340, 520, 34, { couleur: '#ffb3c7' }),
    el('fleur', 336, 780, 28, { couleur: '#9ccbf5' }),
    el('fleur', 22, 880, 32, { couleur: '#c4b8f8' }),
    el('herbe', 40, 150, 40, { h: 20 }),
    el('herbe', 330, 560, 40, { h: 20 }),
    el('herbe', 50, 910, 40, { h: 20 }),
    el('petale', 80, 60, 14, { couleur: '#ffb3c7', anim: 'tombe', duree: 9 }),
    el('petale', 300, 160, 12, { couleur: '#ffc9d6', anim: 'tombe', delai: -3, duree: 10 }),
    el('petale', 30, 420, 14, { couleur: '#ffb3c7', anim: 'tombe', delai: -6, duree: 9 }),
    el('petale', 350, 620, 12, { couleur: '#ffc9d6', anim: 'tombe', delai: -2, duree: 11 }),
    el('papillon', 300, 360, 34, { couleur: '#c4b8f8', anim: 'papillon' }),
    el('papillon', 30, 650, 30, { couleur: '#ffb3c7', anim: 'papillon', delai: -4 }),
  ],
  galaxie: [
    el('planete', 300, 110, 80),
    el('lune', 14, 600, 56),
    el('filante', 320, 300, 90, { h: 40, anim: 'filante', duree: 6 }),
    el('filante', 340, 720, 90, { h: 40, anim: 'filante', delai: -3, duree: 7 }),
    ...[
      [30, 100], [120, 80], [350, 250], [60, 330], [300, 450], [20, 470], [340, 590],
      [150, 700], [40, 800], [330, 860], [200, 930], [90, 220], [260, 820], [360, 380],
    ].map(([x, y], i) =>
      el('etoile', x, y, 8 + (i % 3) * 5, { couleur: i % 3 === 0 ? '#ffd966' : '#ffffff', anim: 'scintille', delai: -i * 0.4 }),
    ),
  ],
  hiver: [
    el('sapin', 10, 150, 44, { h: 62 }),
    el('sapin', 336, 330, 40, { h: 56 }),
    el('sapin', 14, 600, 48, { h: 68 }),
    el('sapin', 334, 820, 44, { h: 62 }),
    el('butte', 0, 930, 140, { h: 46 }),
    el('butte', 260, 920, 140, { h: 50 }),
    ...[
      [40, 20], [120, 60], [220, 10], [310, 80], [360, 30], [80, 200],
      [280, 240], [180, 300], [30, 420], [340, 480], [150, 560], [260, 640],
    ].map(([x, y], i) => el('flocon', x, y, 10 + (i % 3) * 4, { couleur: '#9ccbf5', anim: 'tombe', delai: -i * 0.7, duree: 7 + (i % 3) })),
  ],
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
