import { useSyncExternalStore } from 'react'
import { ecrire, lire } from '../lib/stockage'
import type { FiltreSeance, NotionId } from '../lib/types'

// Filtres « Séance 1 / Séance 2 / Tout le chapitre » et « par notion »,
// partagés par toutes les pages de révision et mémorisés dans le navigateur.
export interface Filtres {
  seance: FiltreSeance
  notion: NotionId | 'toutes'
}

const CLE = 'rm-filtres'
let actuels: Filtres = lire<Filtres>(CLE, { seance: 'toutes', notion: 'toutes' })
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
