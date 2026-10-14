import { useState } from 'react'
import { vraiFaux as tousLesVraiFaux } from '../../lib/contenu'
import type { VraiFaux } from '../../lib/types'
import { XP } from '../../lib/gamification'
import { useProgression } from '../../state/progression'
import { Barre, Correction, EcranFin, PuceXp } from '../ui'
import Icone from '../Icone'

/**
 * Le « Vrai / Faux du marketing » (les clichés de la séance 1).
 * Tu choisis, puis tu lis l'argument nuancé, construit à partir de la définition de l'AFM.
 */
export default function VraiFauxEx({ items, onTermine }: { items?: VraiFaux[]; onTermine?: () => void } = {}) {
  const vraiFaux = items ?? tousLesVraiFaux
  const { repondre, p } = useProgression()
  const [index, setIndex] = useState(0)
  const [choix, setChoix] = useState<'vrai' | 'faux' | null>(null)
  const [xp, setXp] = useState(0)
  const [gain, setGain] = useState(0)
  const [fini, setFini] = useState(false)

  const item = vraiFaux[index]
  const dejaFaits = new Set(p.tentatives.filter((t) => t.itemId.startsWith('vf-')).map((t) => t.itemId)).size

  const repondreVF = (c: 'vrai' | 'faux') => {
    if (choix) return
    setChoix(c)
    const juste = item.reponse === 'nuance' || item.reponse === c
    const g = repondre({ itemId: item.id, type: 'exercice', notion: item.notion, seance: item.seance, correct: juste }, XP.exerciceReussi)
    setGain(g)
    setXp((x) => x + g)
  }

  const suivant = () => {
    if (index + 1 >= vraiFaux.length) {
      if (onTermine) return onTermine()
      return setFini(true)
    }
    setIndex(index + 1)
    setChoix(null)
    setGain(0)
  }

  if (fini) {
    return (
      <EcranFin titre="Clichés démontés !" message="Tu sais maintenant argumenter à partir de la définition du marketing. Utile en examen comme à l'oral." xp={xp}>
        <button type="button" className="btn btn-orange" onClick={() => { setFini(false); setIndex(0); setChoix(null); setXp(0) }}>
          Recommencer
        </button>
      </EcranFin>
    )
  }

  const juste = choix !== null && (item.reponse === 'nuance' || item.reponse === choix)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-muted whitespace-nowrap">
          {index + 1} / {vraiFaux.length}
        </span>
        <Barre valeur={index + (choix ? 1 : 0)} max={vraiFaux.length} label="Avancement du vrai/faux" />
      </div>
      {!items && <p className="text-sm text-muted">Clichés déjà travaillés : {dejaFaits} / {vraiFaux.length}</p>}

      <div className="carte p-6 text-center">
        <p className="text-sm font-bold text-blue-700 mb-2">Vrai ou faux ?</p>
        <p className="font-titre text-2xl font-semibold">« {item.affirmation} »</p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {(['vrai', 'faux'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => repondreVF(c)}
              disabled={!!choix}
              aria-pressed={choix === c}
              className={`btn ${choix === c ? 'btn-bleu' : 'btn-contour'} !min-h-14 text-lg`}
            >
              {c === 'vrai' ? 'Vrai' : 'Faux'}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite">
        {choix && (
          <Correction juste={juste} titre={item.reponse === 'nuance' ? `${item.verdict} : les deux se défendent, c'est l'argument qui compte.` : `${item.verdict}.`}>
            <p>{item.argument}</p>
            {gain > 0 && (
              <p className="mt-2">
                <PuceXp xp={gain} />
              </p>
            )}
          </Correction>
        )}
      </div>
      {choix && (
        <button type="button" className="btn btn-orange" onClick={suivant}>
          {index + 1 >= vraiFaux.length ? 'Terminer' : 'Cliché suivant'} <Icone nom="suivant" />
        </button>
      )}
    </div>
  )
}
