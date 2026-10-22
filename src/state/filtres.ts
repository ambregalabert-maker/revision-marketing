import { useSyncExternalStore } from 'react'
import { ecrire, lire } from '../lib/stockage'
import type { FiltreChapitre, NotionId } from '../lib/types'

// Filtres « Chapitre 1 à 4 / Tous » et « par notion »,
// partagés par toutes les pages de révision et mémorisés dans le navigateur.
export interface Filtres {
  chapitre: FiltreChapitre
  notion: NotionId | 'toutes'
}

const CLE = 'rm-filtres-chapitres'
let actuels: Filtres = lire<Filtres>(CLE, { chapitre: 'tous', notion: 'toutes' })
const abonnes = new Set<() => void>()

export function changerFiltres(f: Partial<Filtres>) {
  actuels = { ...actuels, ...f }
  ecrire(CLE, actuels)
  abonnes.forEach((x) => x())
}

export function useFiltres() {
  const filtres = useSyncExternalStore(
    (f) => {
      abonnes.add(f)
      return () => abonnes.delete(f)
    },
    () => actuels,
  )
  return { filtres, changerFiltres }
}
