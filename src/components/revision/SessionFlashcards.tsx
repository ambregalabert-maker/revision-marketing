import { useCallback, useEffect, useRef, useState } from 'react'
import type { Flashcard } from '../../lib/types'
import type { NoteCarte } from '../../lib/leitner'
import { XP } from '../../lib/gamification'
import { titreNotion } from '../../lib/contenu'
import { useProgression } from '../../state/progression'
import { Barre, Etiquette } from '../ui'
import Icone from '../Icone'

export interface BilanFlashcards {
  vues: number
  sues: number
  xp: number
}

/**
 * Une série de flashcards.
 * - Retourner : clic, touche Espace/Entrée, ou balayage sur mobile.
 * - S'auto-évaluer : boutons ou touches 1 / 2 / 3.
 * - Une carte « Je ne savais pas » revient plus loin dans la même séance (J+0).
 */
export default function SessionFlashcards({
  cartes,
  inverse = false,
  onTermine,
}: {
  cartes: Flashcard[]
  inverse?: boolean
  onTermine: (bilan: BilanFlashcards) => void
}) {
  const { noterCarte } = useProgression()
  const [file, setFile] = useState(cartes)
  const [index, setIndex] = useState(0)
  const [retournee, setRetournee] = useState(false)
  const [bilan, setBilan] = useState<BilanFlashcards>({ vues: 0, sues: 0, xp: 0 })
  const dejaRemises = useRef(new Set<string>())
  const debutBalayage = useRef<{ x: number; y: number } | null>(null)
  const ignorerClic = useRef(false)
  const zoneNotes = useRef<HTMLDivElement>(null)

  const carte = file[index]
  const total = file.length

  const retourner = useCallback(() => setRetournee((r) => !r), [])

  const evaluer = useCallback(
    (note: NoteCarte) => {
      if (!carte || !retournee) return
      noterCarte(carte, note)
      const nouveauBilan = { vues: bilan.vues + 1, sues: bilan.sues + (note === 'oui' ? 1 : 0), xp: bilan.xp + XP.flashcard }
      setBilan(nouveauBilan)
      let nouvelleFile = file
      // J+0 : la carte ratée revient 3 cartes plus loin (une seule fois par séance).
      if (note === 'non' && !dejaRemises.current.has(carte.id)) {
        dejaRemises.current.add(carte.id)
        nouvelleFile = [...file]
        nouvelleFile.splice(Math.min(index + 4, file.length), 0, carte)
        setFile(nouvelleFile)
      }
      setRetournee(false)
      if (index + 1 >= nouvelleFile.length) onTermine(nouveauBilan)
      else setIndex(index + 1)
    },
    [carte, retournee, noterCarte, bilan, file, index, onTermine],
  )

  // Raccourcis clavier : Espace = retourner, 1/2/3 = auto-évaluation.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement
      if (cible.closest('input, textarea, select')) return
      if (e.key === ' ' && !cible.closest('button')) {
        e.preventDefault()
        retourner()
      }
      if (retournee && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault()
        evaluer(({ '1': 'non', '2': 'hesite', '3': 'oui' } as const)[e.key as '1' | '2' | '3'])
      }
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [retourner, evaluer, retournee])

  // Après le retournement, on amène le focus sur les boutons d'auto-évaluation.
  useEffect(() => {
    if (retournee) zoneNotes.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
  }, [retournee])

  if (!carte) return null

  const question = inverse ? carte.verso : carte.recto
  const reponse = inverse ? carte.recto : carte.verso

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-muted whitespace-nowrap">
          Carte {index + 1} / {total}
        </span>
        <Barre valeur={index} max={total} label="Avancement de la série" />
      </div>

      <div className="flip">
        <button
          type="button"
          onClick={() => {
            // Après un balayage, le navigateur envoie aussi un clic : on l'ignore.
            if (ignorerClic.current) ignorerClic.current = false
            else retourner()
          }}
          onPointerDown={(e) => (debutBalayage.current = { x: e.clientX, y: e.clientY })}
          onPointerUp={(e) => {
            const d = debutBalayage.current
            debutBalayage.current = null
            // Balayage horizontal sur mobile = retourner.
            if (d && Math.abs(e.clientX - d.x) > 50 && Math.abs(e.clientY - d.y) < 40) {
              ignorerClic.current = true
              window.setTimeout(() => (ignorerClic.current = false), 400)
              retourner()
            }
          }}
          className="w-full text-left rounded-3xl"
        >
          <span className="sr-only">{retournee ? 'Réponse affichée. ' : 'Question. '}</span>
          <div className={`flip-inner grid ${retournee ? 'retournee' : ''}`}>
            <div
              className="flip-face [grid-area:1/1] carte min-h-64 p-6 flex flex-col"
              aria-hidden={retournee}
            >
              <div className="flex flex-wrap gap-2">
                <Etiquette>{titreNotion(carte.notion)}</Etiquette>
                <Etiquette ton="neutre">Séance {carte.seance}</Etiquette>
              </div>
              <p className={`flex-1 flex items-center justify-center text-center py-6 font-titre font-semibold ${inverse ? 'text-lg' : 'text-2xl'}`}>
                {question}
              </p>
              <p className="text-center text-sm text-muted flex items-center justify-center gap-2">
                <Icone nom="recommencer" taille={16} /> Cherche la réponse dans ta tête, puis retourne la carte
              </p>
              <span className="sr-only">Appuie pour retourner la carte.</span>
            </div>
            <div
              className="flip-face [grid-area:1/1] [transform:rotateY(180deg)] carte min-h-64 p-6 flex flex-col gap-4 !bg-surface-2"
              aria-hidden={!retournee}
            >
              <p className="text-sm font-bold text-blue-700">Réponse</p>
              <p className={`font-semibold ${inverse ? 'text-xl font-titre' : 'text-lg'}`}>{reponse}</p>
              <p className="text-muted border-t border-line pt-3">{carte.exemple}</p>
            </div>
          </div>
        </button>
      </div>

      <div aria-live="polite">
        {retournee ? (
          <div ref={zoneNotes} className="apparition">
            <p className="text-center font-semibold mb-2">Alors, tu savais ?</p>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => evaluer('non')} className="btn btn-contour flex-col !gap-0 !py-2 !border-error">
                <span>Je ne savais pas</span>
                <span className="text-xs font-normal text-muted">touche 1</span>
              </button>
              <button type="button" onClick={() => evaluer('hesite')} className="btn btn-contour flex-col !gap-0 !py-2">
                <span>Hésitant</span>
                <span className="text-xs font-normal text-muted">touche 2</span>
              </button>
              <button type="button" onClick={() => evaluer('oui')} className="btn btn-contour flex-col !gap-0 !py-2 !border-success">
                <span>Je savais</span>
                <span className="text-xs font-normal text-muted">touche 3</span>
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={retourner} className="btn btn-bleu w-full">
            Retourner la carte <span className="text-sm font-normal opacity-80">(Espace)</span>
          </button>
        )}
      </div>
    </div>
  )
}
