import Compagnon, { type Humeur } from './Compagnon'
import { useProgression } from '../state/progression'
import { ecartJours, jour } from '../lib/dates'

/** Le compagnon de l'étudiant, habillé de ses accessoires. Il fait la sieste après 2 jours sans révision. */
export default function MonCompagnon({ humeur, taille = 96, anime = false }: { humeur?: Humeur; taille?: number; anime?: boolean }) {
  const { p } = useProgression()
  const b = p.boutique
  if (!b.compagnon) return null
  const derniere = p.stats.derniereActivite
  const endormi = !derniere || ecartJours(derniere, jour()) >= 2
  return (
    <Compagnon
      espece={b.compagnon}
      accessoires={b.porte}
      humeur={humeur ?? (endormi && p.tentatives.length > 0 ? 'sieste' : 'normal')}
      taille={taille}
      anime={anime}
      label={b.nom ? `${b.nom}, ton compagnon` : 'Ton compagnon'}
    />
  )
}

/** Le compagnon dort-il ? (pour adapter ses petites phrases) */
export function useCompagnonEndormi() {
  const { p } = useProgression()
  const derniere = p.stats.derniereActivite
  return p.tentatives.length > 0 && (!derniere || ecartJours(derniere, jour()) >= 2)
}
