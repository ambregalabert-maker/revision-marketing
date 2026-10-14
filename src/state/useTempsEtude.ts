import { useEffect, useRef } from 'react'
import { useProgression } from './progression'

/**
 * Compte le temps de révision « libre » : une minute est ajoutée si l'onglet est visible
 * et que tu as interagi avec la page (clic, touche) dans les 2 dernières minutes.
 * 10 minutes dans la journée = la journée compte pour ta série.
 */
export function useTempsEtude(actif = true) {
  const { ajouterMinute } = useProgression()
  const derniereAction = useRef(Date.now())

  useEffect(() => {
    if (!actif) return
    const noter = () => {
      derniereAction.current = Date.now()
    }
    window.addEventListener('pointerdown', noter)
    window.addEventListener('keydown', noter)
    const minuteur = window.setInterval(() => {
      const visible = document.visibilityState === 'visible'
      if (visible && Date.now() - derniereAction.current < 2 * 60_000) ajouterMinute()
    }, 60_000)
    return () => {
      window.removeEventListener('pointerdown', noter)
      window.removeEventListener('keydown', noter)
      window.clearInterval(minuteur)
    }
  }, [actif, ajouterMinute])
}
