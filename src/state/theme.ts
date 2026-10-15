import { useSyncExternalStore } from 'react'
import { ecrire, lire } from '../lib/stockage'

// Thème : "systeme" suit le réglage du téléphone/ordinateur, sinon choix manuel.
// Petit magasin partagé : tous les boutons de thème restent synchronisés.
export type ChoixTheme = 'systeme' | 'clair' | 'sombre'

const CLE = 'rm-theme'
let choixActuel: ChoixTheme = lire<ChoixTheme>(CLE, 'systeme')
const abonnes = new Set<() => void>()

function appliquer(choix: ChoixTheme) {
  const racine = document.documentElement
  if (choix === 'systeme') delete racine.dataset.theme
  else racine.dataset.theme = choix === 'sombre' ? 'dark' : 'light'
}

export function choisirTheme(choix: ChoixTheme) {
  choixActuel = choix
  appliquer(choix)
  ecrire(CLE, choix)
  abonnes.forEach((f) => f())
}

export function useTheme() {
  const choix = useSyncExternalStore(
    (f) => {
      abonnes.add(f)
      return () => abonnes.delete(f)
    },
    () => choixActuel,
  )
  // Fait défiler les 3 choix : système → clair → sombre → système.
  const suivant = () =>
    choisirTheme(choix === 'systeme' ? 'clair' : choix === 'clair' ? 'sombre' : 'systeme')
  return { choix, setChoix: choisirTheme, suivant }
}

/** Les 4 couleurs proposées dans « Personnaliser » (Pêche par défaut). */
export const COULEURS = [
  { id: 'peche', nom: 'Pêche', fond: '#FFB59A', ombre: '#E8957A' },
  { id: 'menthe', nom: 'Menthe', fond: '#86DCC3', ombre: '#5DBFA3' },
  { id: 'lavande', nom: 'Lavande', fond: '#C4B8F8', ombre: '#A193E8' },
  { id: 'rose', nom: 'Rose', fond: '#F7A8BE', ombre: '#E0849E' },
] as const
