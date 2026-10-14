// Générateur d'exercices de calcul (taux d'évolution, part de marché).
// Les données sont tirées au hasard à chaque fois ; les marques citées sont fictives.
import type { NotionId } from './types'

export interface ExerciceCalcul {
  id: string
  notion: NotionId
  enonce: string
  reponse: number
  unite: string
  calcul: string[]
  source?: string
}

const hasard = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const choisir = <T,>(liste: T[]) => liste[Math.floor(Math.random() * liste.length)]

/** Format français : 12 345,6 */
export function nombre(n: number, decimales = 0): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).replace(/ /g, ' ')
}

/** Arrondi au dixième. */
export const arrondi1 = (n: number) => Math.round(n * 10) / 10

/** Lit une réponse tapée par l'étudiant : « 20 », « +20 % », « 20,5 », « -3.2 ». */
export function lireNombre(texte: string): number | null {
  const propre = texte.replace(/\s/g, '').replace('%', '').replace('points', '').replace('pts', '').replace(',', '.').replace('−', '-')
  if (!/^[+-]?\d+(\.\d+)?$/.test(propre)) return null
  return Number(propre)
}

/** Tolérance d'arrondi : ±0,1 point. */
export const estProche = (reponse: number, attendu: number) => Math.abs(reponse - attendu) <= 0.1 + 1e-9

const MARCHES = [
  { nom: 'des vélos électriques', unite: 'vélos', min: 200, max: 900, mult: 1000 },
  { nom: 'des trottinettes électriques', unite: 'trottinettes', min: 100, max: 600, mult: 1000 },
  { nom: 'des capsules de café', unite: 'millions de capsules', min: 300, max: 900, mult: 1 },
  { nom: 'des baskets', unite: 'paires', min: 150, max: 800, mult: 1000 },
  { nom: 'des smartphones reconditionnés', unite: 'smartphones', min: 100, max: 500, mult: 1000 },
  { nom: 'des eaux aromatisées', unite: 'millions de litres', min: 80, max: 400, mult: 1 },
  { nom: 'des boissons végétales', unite: 'millions de litres', min: 50, max: 300, mult: 1 },
  { nom: 'des abonnements de streaming musical', unite: 'abonnements', min: 200, max: 900, mult: 1000 },
]

const MARQUES = ['Lumen', 'Roulib', 'Kafé & Co', 'Basko', 'Vélia', 'Ondine', 'Néo-Tel', 'Pulpa']

/** Taux d'évolution : (N − N-1) / N-1 × 100. */
function tauxEvolution(): ExerciceCalcul {
  const m = choisir(MARCHES)
  const avant = hasard(m.min, m.max) * m.mult
  // Taux tiré entre −25 % et +40 %, jamais nul.
  let taux = hasard(-50, 80) / 2
  if (taux === 0) taux = 5
  const apres = Math.round(avant * (1 + taux / 100))
  const exact = ((apres - avant) / avant) * 100
  const r = arrondi1(exact)
  return {
    id: 'calc-gen-taux',
    notion: 'taux-evolution',
    enonce: `Le marché ${m.nom} passe de ${nombre(avant)} à ${nombre(apres)} ${m.unite} en un an. Calcule le taux d'évolution (arrondi au dixième).`,
    reponse: r,
    unite: '%',
    calcul: [
      'Taux d\'évolution = (Taille N − Taille N-1) / Taille N-1 × 100',
      `= (${nombre(apres)} − ${nombre(avant)}) / ${nombre(avant)} × 100`,
      `= ${nombre(apres - avant)} / ${nombre(avant)} × 100`,
      `= ${r > 0 ? '+' : ''}${nombre(r, 1)} %${r < 0 ? ' : le marché recule.' : ' : le marché progresse.'}`,
    ],
  }
}

/** Part de marché en volume : ventes de l'entreprise / ventes du marché × 100. */
function partVolume(): ExerciceCalcul {
  const m = choisir(MARCHES)
  const marque = choisir(MARQUES)
  const marche = hasard(m.min, m.max) * m.mult
  const ventes = Math.round((marche * hasard(30, 450)) / 1000)
  const r = arrondi1((ventes / marche) * 100)
  return {
    id: 'calc-gen-pdm-volume',
    notion: 'part-de-marche',
    enonce: `La marque fictive ${marque} vend ${nombre(ventes)} ${m.unite}. Le marché ${m.nom} représente ${nombre(marche)} ${m.unite}. Calcule sa part de marché en volume (arrondie au dixième).`,
    reponse: r,
    unite: '%',
    calcul: [
      'Part de marché = Ventes de l\'entreprise / Ventes du marché × 100',
      `= ${nombre(ventes)} / ${nombre(marche)} × 100`,
      `= ${nombre(r, 1)} % (en volume, car on compare des quantités).`,
    ],
  }
}

/** Part de marché en valeur (chiffre d'affaires). */
function partValeur(): ExerciceCalcul {
  const m = choisir(MARCHES)
  const marque = choisir(MARQUES)
  const marche = hasard(40, 900) // millions d'euros
  const ca = arrondi1((marche * hasard(30, 450)) / 1000)
  const r = arrondi1((ca / marche) * 100)
  return {
    id: 'calc-gen-pdm-valeur',
    notion: 'part-de-marche',
    enonce: `Le marché ${m.nom} pèse ${nombre(marche)} millions d'euros. La marque fictive ${marque} y réalise un chiffre d'affaires de ${nombre(ca, 1)} millions d'euros. Calcule sa part de marché en valeur (arrondie au dixième).`,
    reponse: r,
    unite: '%',
    calcul: [
      'Part de marché = Ventes de l\'entreprise / Ventes du marché × 100',
      `= ${nombre(ca, 1)} / ${nombre(marche)} × 100`,
      `= ${nombre(r, 1)} % (en valeur, car on compare des chiffres d'affaires).`,
    ],
  }
}

export type GenreCalcul = 'taux' | 'pdm' | 'tous'

export function genererCalcul(genre: GenreCalcul = 'tous'): ExerciceCalcul {
  if (genre === 'taux') return tauxEvolution()
  if (genre === 'pdm') return Math.random() < 0.5 ? partVolume() : partValeur()
  return choisir([tauxEvolution, partVolume, partValeur])()
}
