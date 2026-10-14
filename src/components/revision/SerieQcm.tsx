import { useEffect, useMemo, useRef, useState } from 'react'
import type { QuestionQcm } from '../../lib/types'
import { melanger, titreNotion } from '../../lib/contenu'
import { XP } from '../../lib/gamification'
import { useProgression } from '../../state/progression'
import { Barre, Correction, Etiquette, PuceXp } from '../ui'
import Icone from '../Icone'

export interface ResultatQcm {
  bonnes: number
  total: number
  xp: number
  /** Détail question par question (pour la correction du mode examen). */
  details: { question: QuestionQcm; choisis: number[]; ordre: number[]; juste: boolean }[]
}

/** Une question est juste si l'ensemble des réponses cochées = l'ensemble des bonnes réponses. */
function estJuste(q: QuestionQcm, choisis: number[]) {
  const bonnes = q.choix.map((c, i) => (c.correct ? i : -1)).filter((i) => i >= 0)
  return bonnes.length === choisis.length && bonnes.every((i) => choisis.includes(i))
}

/**
 * Série de QCM.
 * - mode « entrainement » : correction immédiate et expliquée après chaque question ;
 * - mode « examen » : 10 minutes, correction seulement à la fin, note sur 10.
 */
export default function SerieQcm({
  questions,
  mode,
  dureeExamenMin = 10,
  onTermine,
}: {
  questions: QuestionQcm[]
  mode: 'entrainement' | 'examen'
  dureeExamenMin?: number
  onTermine: (r: ResultatQcm) => void
}) {
  const { repondre } = useProgression()
  // L'ordre des propositions est mélangé une fois pour toute la série.
  const ordres = useMemo(() => questions.map((q) => melanger(q.choix.map((_, i) => i))), [questions])
  const [index, setIndex] = useState(0)
  const [choisis, setChoisis] = useState<number[][]>(() => questions.map(() => []))
  const [valide, setValide] = useState(false)
  const [xpGagne, setXpGagne] = useState(0)
  const [dernierGain, setDernierGain] = useState(0)
  const [resteSec, setResteSec] = useState(dureeExamenMin * 60)
  const fini = useRef(false)
  const titre = useRef<HTMLHeadingElement>(null)

  const q = questions[index]
  const ordre = ordres[index]
  const mesChoix = choisis[index]
  const derniere = index === questions.length - 1

  // Focus sur la question à chaque changement (lecteurs d'écran, clavier).
  useEffect(() => {
    titre.current?.focus({ preventScroll: false })
  }, [index])

  const terminer = (liste = choisis, xp = xpGagne) => {
    if (fini.current) return
    fini.current = true
    const details = questions.map((question, i) => ({ question, choisis: liste[i], ordre: ordres[i], juste: estJuste(question, liste[i]) }))
    let xpTotal = xp
    if (mode === 'examen') {
      // En examen, on enregistre toutes les réponses à la fin.
      for (const d of details) {
        xpTotal += repondre({ itemId: d.question.id, type: 'qcm', notion: d.question.notion, seance: d.question.seance, correct: d.juste }, XP.qcmJuste)
      }
    }
    onTermine({ bonnes: details.filter((d) => d.juste).length, total: questions.length, xp: xpTotal, details })
  }

  // Chronomètre du mode examen.
  useEffect(() => {
    if (mode !== 'examen') return
    const t = window.setInterval(() => setResteSec((s) => s - 1), 1000)
    return () => window.clearInterval(t)
  }, [mode])
  useEffect(() => {
    if (mode === 'examen' && resteSec <= 0) terminer()
  })

  const cocher = (i: number) => {
    if (valide) return
    const nouveau = q.multiple ? (mesChoix.includes(i) ? mesChoix.filter((x) => x !== i) : [...mesChoix, i]) : [i]
    const liste = choisis.map((c, k) => (k === index ? nouveau : c))
    setChoisis(liste)
    // Entraînement, question à réponse unique : correction immédiate au clic.
    if (mode === 'entrainement' && !q.multiple) valider(liste)
  }

  const valider = (liste = choisis) => {
    if (mode !== 'entrainement' || valide || liste[index].length === 0) return
    const juste = estJuste(q, liste[index])
    const gain = repondre({ itemId: q.id, type: 'qcm', notion: q.notion, seance: q.seance, correct: juste }, XP.qcmJuste)
    setXpGagne((x) => x + gain)
    setDernierGain(gain)
    setValide(true)
  }

  const suivante = () => {
    if (derniere) return terminer()
    setValide(false)
    setDernierGain(0)
    setIndex(index + 1)
  }

  const juste = valide && estJuste(q, mesChoix)
  const mm = Math.max(0, Math.floor(resteSec / 60))
  const ss = String(Math.max(0, resteSec % 60)).padStart(2, '0')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-muted whitespace-nowrap">
          Question {index + 1} / {questions.length}
        </span>
        <Barre valeur={index + (valide ? 1 : 0)} max={questions.length} label="Avancement du QCM" />
        {mode === 'examen' && (
          <span
            className={`flex items-center gap-1 font-titre font-bold tabular-nums whitespace-nowrap ${resteSec < 60 ? 'text-error-ink' : 'text-blue-700'}`}
            aria-label={`Temps restant : ${mm} minutes ${ss} secondes`}
            role="timer"
          >
            <Icone nom="minuteur" taille={18} /> {mm}:{ss}
          </span>
        )}
      </div>

      <div className="carte p-5 md:p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <Etiquette>{titreNotion(q.notion)}</Etiquette>
          {q.multiple && (
            <Etiquette ton="orange">
              <Icone nom="info" taille={14} /> Plusieurs réponses possibles
            </Etiquette>
          )}
        </div>
        <h2 ref={titre} tabIndex={-1} className="text-xl font-semibold leading-snug">
          {q.question}
        </h2>

        <fieldset className="mt-5 flex flex-col gap-2">
          <legend className="sr-only">{q.multiple ? 'Coche toutes les bonnes réponses' : 'Choisis une réponse'}</legend>
          {ordre.map((i, pos) => {
            const c = q.choix[i]
            const coche = mesChoix.includes(i)
            let etat = coche ? 'border-blue-500 bg-blue-100' : 'border-line hover:border-blue-500'
            let icone: 'ok' | 'non' | null = null
            if (valide) {
              if (c.correct) {
                etat = 'border-success bg-success-bg'
                icone = 'ok'
              } else if (coche) {
                etat = 'border-error bg-error-bg'
                icone = 'non'
              } else etat = 'border-line opacity-80'
            }
            return (
              <div key={i}>
                <label className={`flex items-start gap-3 min-h-12 rounded-2xl border-2 p-3 cursor-pointer transition-colors ${etat}`}>
                  <input
                    type={q.multiple ? 'checkbox' : 'radio'}
                    name={`q-${q.id}`}
                    checked={coche}
                    disabled={valide}
                    onChange={() => cocher(i)}
                    className="mt-1 w-5 h-5 shrink-0 accent-[var(--blue-700)]"
                  />
                  <span className="flex-1">
                    <span className="font-bold text-muted mr-1">{String.fromCharCode(65 + pos)}.</span> {c.texte}
                  </span>
                  {icone && (
                    <Icone
                      nom={icone}
                      className={icone === 'ok' ? 'text-success-ink' : 'text-error-ink'}
                      label={icone === 'ok' ? 'Bonne réponse' : 'Mauvaise réponse'}
                    />
                  )}
                </label>
                {valide && (c.correct || coche) && (
                  <p className="text-sm text-muted mt-1 ml-11">{c.pourquoi}</p>
                )}
              </div>
            )
          })}
        </fieldset>
      </div>

      <div aria-live="polite">
        {valide && (
          <Correction juste={juste} titre={juste ? 'Bonne réponse !' : 'Pas tout à fait… voici la correction.'}>
            <p>{q.explication}</p>
            {!juste && (
              <details className="mt-2">
                <summary className="cursor-pointer font-semibold text-blue-700">Pourquoi les autres réponses sont fausses</summary>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {ordre
                    .filter((i) => !q.choix[i].correct)
                    .map((i) => (
                      <li key={i}>
                        <span className="font-semibold">{q.choix[i].texte} :</span> {q.choix[i].pourquoi}
                      </li>
                    ))}
                </ul>
              </details>
            )}
            {dernierGain > 0 && (
              <p className="mt-2">
                <PuceXp xp={dernierGain} />
              </p>
            )}
          </Correction>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {mode === 'entrainement' && q.multiple && !valide && (
          <button type="button" className="btn btn-bleu flex-1" onClick={() => valider()} disabled={mesChoix.length === 0}>
            Valider ma réponse
          </button>
        )}
        {mode === 'entrainement' && valide && (
          <button type="button" className="btn btn-orange flex-1" onClick={suivante}>
            {derniere ? 'Voir mon résultat' : 'Question suivante'} <Icone nom="suivant" />
          </button>
        )}
        {mode === 'examen' && (
          <>
            {index > 0 && (
              <button type="button" className="btn btn-contour" onClick={() => setIndex(index - 1)}>
                <Icone nom="retour" /> Précédente
              </button>
            )}
            {!derniere ? (
              <button type="button" className="btn btn-bleu flex-1" onClick={() => setIndex(index + 1)}>
                Question suivante <Icone nom="suivant" />
              </button>
            ) : (
              <button type="button" className="btn btn-orange flex-1" onClick={() => terminer()}>
                Rendre ma copie
              </button>
            )}
          </>
        )}
      </div>
      {mode === 'examen' && (
        <p className="text-sm text-muted text-center">
          {choisis.filter((c) => c.length > 0).length} / {questions.length} questions répondues · la correction s'affiche à la fin.
        </p>
      )}
    </div>
  )
}
