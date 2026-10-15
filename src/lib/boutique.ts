// La boutique : les Marks 🪙, les compagnons et leurs accessoires.
// Les Marks se gagnent tout seuls avec les XP (1 Mark pour 10 XP) : ton niveau ne baisse jamais quand tu achètes.
import type { Boutique, Espece, Progression } from './types'

export const XP_PAR_MARK = 10
/** Le coffre d'un bilan, ouvert la première fois qu'on le termine. */
export const MARKS_COFFRE = 20

export const marksGagnes = (p: Progression) => Math.floor(p.stats.xpTotal / XP_PAR_MARK)
export const marksDisponibles = (p: Progression) => Math.max(0, marksGagnes(p) + p.boutique.bonus - p.boutique.depenses)

export interface InfoCompagnon {
  id: Espece
  nom: string
  description: string
  prix: number
}

export const COMPAGNONS: InfoCompagnon[] = [
  { id: 'renard', nom: 'Renard', description: 'Malin et curieux, il adore les études de marché.', prix: 60 },
  { id: 'panda', nom: 'Panda', description: 'Calme et patient, le roi de la répétition espacée.', prix: 60 },
  { id: 'licorne', nom: 'Licorne', description: 'Rose, arc-en-ciel et pleine de paillettes.', prix: 60 },
]

export type Emplacement = 'tete' | 'yeux' | 'cou'

export interface Accessoire {
  id: string
  nom: string
  emplacement: Emplacement
  prix: number
  /** Objet spécial : il ne s'achète pas, il se gagne avec ce badge. */
  badge?: string
  condition?: string
}

export const ACCESSOIRES: Accessoire[] = [
  { id: 'lunettes-rondes', nom: 'Lunettes rondes', emplacement: 'yeux', prix: 15 },
  { id: 'noeud', nom: 'Nœud papillon', emplacement: 'cou', prix: 15 },
  { id: 'bonnet', nom: 'Bonnet', emplacement: 'tete', prix: 20 },
  { id: 'fleurs', nom: 'Couronne de fleurs', emplacement: 'tete', prix: 25 },
  { id: 'lunettes-soleil', nom: 'Lunettes de soleil', emplacement: 'yeux', prix: 25 },
  { id: 'echarpe', nom: 'Écharpe', emplacement: 'cou', prix: 25 },
  { id: 'casquette', nom: 'Casquette', emplacement: 'tete', prix: 30 },
  { id: 'magicien', nom: 'Chapeau de magicien', emplacement: 'tete', prix: 40 },
  { id: 'couronne', nom: 'Couronne', emplacement: 'tete', prix: 0, badge: 'chapitre1-maitrise', condition: 'Maîtrise tout le chapitre 1' },
  { id: 'bonnet-nuit', nom: 'Bonnet de nuit', emplacement: 'tete', prix: 0, badge: 'oiseau-de-nuit', condition: 'Révise après 22 h' },
]

export const accessoire = (id: string) => ACCESSOIRES.find((a) => a.id === id)

/** L'étudiant possède-t-il cet objet ? (les objets spéciaux sont possédés dès que le badge est gagné) */
export function possede(p: Progression, id: string) {
  const a = accessoire(id)
  if (a?.badge) return !!p.badges[a.badge]
  return p.boutique.possedes.includes(id)
}

/** Adopter le premier compagnon (gratuit) et le baptiser. */
export function adopter(b: Boutique, espece: Espece, nom: string): Boutique {
  return { ...b, compagnon: espece, nom: nom.trim() || nomParDefaut(espece), possedes: b.possedes.includes(espece) ? b.possedes : [...b.possedes, espece] }
}

export const nomParDefaut = (e: Espece) => ({ renard: 'Roux', panda: 'Bambou', licorne: 'Paillette' })[e]

/** Acheter un compagnon ou un accessoire, si les Marks suffisent. Renvoie null sinon. */
export function acheter(p: Progression, id: string): Boutique | null {
  const prix = COMPAGNONS.find((c) => c.id === id)?.prix ?? accessoire(id)?.prix
  if (prix === undefined || accessoire(id)?.badge || p.boutique.possedes.includes(id)) return null
  if (marksDisponibles(p) < prix) return null
  return { ...p.boutique, possedes: [...p.boutique.possedes, id], depenses: p.boutique.depenses + prix }
}

/** Mettre un accessoire (il remplace celui du même emplacement) ou l'enlever s'il est déjà porté. */
export function basculerAccessoire(b: Boutique, id: string): Boutique {
  const a = accessoire(id)
  if (!a) return b
  if (b.porte.includes(id)) return { ...b, porte: b.porte.filter((x) => x !== id) }
  return { ...b, porte: [...b.porte.filter((x) => accessoire(x)?.emplacement !== a.emplacement), id] }
}
