import { useEffect, useRef, useState } from 'react'
import MonCompagnon from './MonCompagnon'
import type { Humeur } from './Compagnon'
import { useProgression } from '../state/progression'

const BRAVO = ['Bien joué !', 'Yes !', 'Trop fort·e !', 'Exactement !', 'Tu gères !']
const COURAGE = ['Pas grave !', 'Tu vas l’avoir !', 'On retient et on continue', 'L’erreur, ça fait apprendre']

const auHasard = (l: string[]) => l[Math.floor(Math.random() * l.length)]

/** Le compagnon, en petit pendant les séances : il réagit à chacune de tes réponses. */
export default function CompagnonReactif() {
  const { p } = useProgression()
  const nb = p.tentatives.length
  const precedent = useRef(nb)
  const [reaction, setReaction] = useState<{ humeur: Humeur; texte: string } | null>(null)

  useEffect(() => {
    if (nb <= precedent.current) {
      precedent.current = nb
      return
    }
    precedent.current = nb
    const derniere = p.tentatives[nb - 1]
    setReaction(derniere.correct ? { humeur: 'content', texte: auHasard(BRAVO) } : { humeur: 'reflechit', texte: auHasard(COURAGE) })
    const t = window.setTimeout(() => setReaction(null), 2600)
    return () => window.clearTimeout(t)
  }, [nb, p.tentatives])

  if (!p.boutique.compagnon) return null
  return (
    <div className="relative shrink-0 order-last" aria-live="polite">
      <MonCompagnon taille={46} anime humeur={reaction?.humeur ?? 'normal'} />
      {reaction && (
        <span className="pop absolute right-0 top-full mt-1 z-20 whitespace-nowrap rounded-xl bg-surface border-2 border-accent-500 px-2 py-0.5 text-xs font-bold shadow-carte">
          {reaction.texte}
        </span>
      )}
    </div>
  )
}
