import Calculs from './Calculs'
import Classement from './Classement'
import VraiFauxEx from './VraiFauxEx'
import CasEx from './CasEx'
import type { Exercice } from '../../lib/plan'

/**
 * Affiche n'importe quel exercice d'une séance et prévient à la fin
 * avec le nombre de bonnes réponses (pour le score de la séance).
 */
export default function ExerciceAuto({ exo, onFin }: { exo: Exercice; onFin: (justes: number, total: number) => void }) {
  switch (exo.genre) {
    case 'calcul':
      return <Calculs genreInitial={exo.calcul} onVerifie={(juste) => onFin(juste ? 1 : 0, 1)} />
    case 'classement':
      return <Classement exo={exo.classement} onTermine={(reussi) => onFin(reussi ? 1 : 0, 1)} />
    case 'vraifaux':
      return <VraiFauxEx items={exo.items} onTermine={onFin} />
    case 'cas':
      return <CasEx cas={exo.cas} onTermine={() => onFin(1, 1)} />
  }
}
