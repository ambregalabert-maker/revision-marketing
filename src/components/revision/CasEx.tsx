import { useState } from 'react'
import type { CasPratique } from '../../lib/types'
import { titreNotion } from '../../lib/contenu'
import { XP } from '../../lib/gamification'
import { lire, ecrire } from '../../lib/stockage'
import { useProgression } from '../../state/progression'
import { Barre, Correction, Etiquette, PuceXp } from '../ui'
import Icone from '../Icone'

type AutoEval = 'essentiel' | 'moitie' | 'pas'

/**
 * Cas pratique court : un énoncé, des questions guidées, ta réponse, puis un corrigé type
 * à comparer, et une auto-évaluation. Tes brouillons restent dans ce navigateur.
 */
export default function CasEx({ cas, onTermine }: { cas: CasPratique; onTermine?: () => void }) {
  const { repondre } = useProgression()
  const cleBrouillon = `rm-brouillon-${cas.id}`
  const [reponses, setReponses] = useState<string[]>(() => lire<string[]>(cleBrouillon, cas.questions.map(() => '')))
  const [index, setIndex] = useState(0)
  const [corrigeVu, setCorrigeVu] = useState<boolean[]>(() => cas.questions.map(() => false))
  const [aideVue, setAideVue] = useState(false)
  const [evaluation, setEvaluation] = useState<AutoEval | null>(null)
  const [xp, setXp] = useState(0)

  const q = cas.questions[index]
  const toutesVues = corrigeVu.every(Boolean)

  const ecrireReponse = (texte: string) => {
    const r = reponses.map((x, i) => (i === index ? texte : x))
    setReponses(r)
    ecrire(cleBrouillon, r)
  }

  const evaluer = (e: AutoEval) => {
    if (evaluation) return
    setEvaluation(e)
    // Un cas terminé rapporte toujours ses XP : c'est l'effort qui compte.
    setXp(repondre({ itemId: cas.id, type: 'cas', notion: cas.notions[0], seance: cas.seance, correct: e === 'essentiel' }, XP.casTermine))
    onTermine?.()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="carte p-5">
        <div className="flex flex-wrap gap-2 mb-2">
          {cas.type === '6-etapes' && <Etiquette ton="orange">Méthode des 6 étapes</Etiquette>}
          <Etiquette ton="neutre">
            <Icone nom="minuteur" taille={14} /> {cas.duree}
          </Etiquette>
          {cas.notions.slice(0, 3).map((n) => (
            <Etiquette key={n}>{titreNotion(n)}</Etiquette>
          ))}
        </div>
        <h2 className="text-xl font-bold">{cas.titre}</h2>
        <p className="mt-2">{cas.enonce}</p>
      </div>

      {!evaluation || !toutesVues ? (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted whitespace-nowrap">
              Question {index + 1} / {cas.questions.length}
            </span>
            <Barre valeur={corrigeVu.filter(Boolean).length} max={cas.questions.length} label="Questions corrigées" />
          </div>

          <div className="carte p-5 flex flex-col gap-3">
            <label htmlFor={`rep-${cas.id}-${index}`} className="font-semibold text-lg">
              {q.question}
            </label>
            {q.aide && (
              <div>
                {aideVue ? (
                  <p className="text-sm rounded-xl bg-blue-100 text-ink p-3">
                    <Icone nom="astuces" taille={16} className="inline mr-1" />
                    {q.aide}
                  </p>
                ) : (
                  <button type="button" className="btn btn-discret !min-h-9 !px-2 text-sm" onClick={() => setAideVue(true)}>
                    <Icone nom="astuces" taille={16} /> Un indice ?
                  </button>
                )}
              </div>
            )}
            <textarea
              id={`rep-${cas.id}-${index}`}
              value={reponses[index]}
              onChange={(e) => ecrireReponse(e.target.value)}
              rows={4}
              placeholder="Écris ta réponse ici, sans regarder le cours…"
              className="w-full rounded-xl border-2 border-line bg-surface p-3 focus:border-blue-500 outline-none"
            />
            {!corrigeVu[index] ? (
              <button
                type="button"
                className="btn btn-bleu"
                onClick={() => setCorrigeVu((c) => c.map((x, i) => (i === index ? true : x)))}
              >
                {reponses[index].trim().length < 10 ? 'Voir le corrigé (essaie d\'abord d\'écrire !)' : 'Comparer avec le corrigé'}
              </button>
            ) : (
              <div aria-live="polite" className="rounded-2xl border border-blue-500 bg-blue-100 p-4 apparition">
                <p className="font-titre font-semibold text-blue-700 mb-1">Corrigé type</p>
                <p>{q.corrige}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {index > 0 && (
              <button type="button" className="btn btn-contour" onClick={() => { setIndex(index - 1); setAideVue(false) }}>
                <Icone nom="retour" /> Précédente
              </button>
            )}
            {index < cas.questions.length - 1 && corrigeVu[index] && (
              <button type="button" className="btn btn-orange flex-1" onClick={() => { setIndex(index + 1); setAideVue(false) }}>
                Question suivante <Icone nom="suivant" />
              </button>
            )}
          </div>

          {toutesVues && (
            <div className="carte p-5">
              <p className="font-semibold mb-3">Compare honnêtement tes réponses aux corrigés. Tu avais…</p>
              <div className="grid sm:grid-cols-3 gap-2">
                <button type="button" className="btn btn-contour !border-success" onClick={() => evaluer('essentiel')}>
                  L'essentiel
                </button>
                <button type="button" className="btn btn-contour" onClick={() => evaluer('moitie')}>
                  À moitié
                </button>
                <button type="button" className="btn btn-contour !border-error" onClick={() => evaluer('pas')}>
                  Pas du tout
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}

      {evaluation && (
        <Correction
          juste={evaluation === 'essentiel'}
          titre={evaluation === 'essentiel' ? 'Bravo, tu as la méthode !' : evaluation === 'moitie' ? 'Bon début : tu y es presque.' : 'Pas grave : maintenant, tu as vu la méthode.'}
        >
          <p>
            {evaluation === 'essentiel'
              ? 'Refais un autre cas dans quelques jours pour ancrer la méthode.'
              : 'Ce cas est ajouté à ta liste « à revoir » : refais-le dans 1 ou 2 jours, sans regarder le corrigé. Entre-temps, révise les flashcards des notions concernées.'}
          </p>
          <p className="mt-2">
            <PuceXp xp={xp} />
          </p>
        </Correction>
      )}
    </div>
  )
}
