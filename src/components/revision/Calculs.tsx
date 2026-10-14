import { useRef, useState, type FormEvent } from 'react'
import { donneesCours } from '../../lib/contenu'
import { estProche, genererCalcul, lireNombre, nombre, type ExerciceCalcul, type GenreCalcul } from '../../lib/calculs'
import { XP } from '../../lib/gamification'
import { useProgression } from '../../state/progression'
import { Correction, Onglets, PuceXp } from '../ui'
import Icone from '../Icone'

/** Données du cours, transformées en exercices. */
const exercicesCours: ExerciceCalcul[] = donneesCours.map((d) => ({
  id: d.id,
  notion: d.notion,
  enonce: d.question,
  reponse: d.reponse,
  unite: d.unite,
  calcul: d.calcul,
  source: d.source,
}))

/** Parts de marché des eaux plates en GMS, en volume, 2016 (Xerfi / Iri), pour la lecture de graphique. */
const PDM_EAUX = [
  { marque: 'Cristaline (Alma)', part: 34.5 },
  { marque: 'MDD', part: 18.9 },
  { marque: 'Vittel (Nestlé)', part: 8.5 },
  { marque: 'Évian (Danone)', part: 7.9 },
  { marque: 'Volvic (Danone)', part: 7.1 },
  { marque: 'Contrex (Nestlé)', part: 6.3 },
  { marque: 'Hépar (Nestlé)', part: 4.2 },
  { marque: 'Autres', part: 12.6 },
]

function GraphiqueEaux() {
  return (
    <figure className="rounded-2xl bg-surface-2 p-4">
      <figcaption className="text-sm font-semibold mb-3">
        Parts de marché des eaux plates en GMS, en volume, 2016 <span className="text-muted font-normal">(Xerfi / Iri)</span>
      </figcaption>
      <table className="w-full text-sm">
        <caption className="sr-only">Part de marché par marque</caption>
        <tbody>
          {PDM_EAUX.map((l) => (
            <tr key={l.marque}>
              <th scope="row" className="text-left font-normal py-1 pr-2 w-36 align-middle">{l.marque}</th>
              <td className="py-1 w-full">
                <div className="flex items-center gap-2">
                  <div className="h-4 rounded bg-blue-500" style={{ width: `${(l.part / 34.5) * 75}%` }} aria-hidden />
                  <span className="tabular-nums font-semibold">{nombre(l.part, 1)} %</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/**
 * Exercices de calcul : données aléatoires (illimitées) ou données réelles du cours.
 * Tolérance d'arrondi de ±0,1 point, correction pas à pas.
 */
export default function Calculs({ onVerifie, genreInitial = 'tous' }: { onVerifie?: (juste: boolean) => void; genreInitial?: GenreCalcul } = {}) {
  const { repondre } = useProgression()
  const [source, setSource] = useState<GenreCalcul | 'cours'>(genreInitial)
  const [exo, setExo] = useState<ExerciceCalcul>(() => genererCalcul(genreInitial))
  const [indexCours, setIndexCours] = useState(0)
  const [saisie, setSaisie] = useState('')
  const [verdict, setVerdict] = useState<{ juste: boolean; xp: number } | null>(null)
  const [erreurSaisie, setErreurSaisie] = useState('')
  const [suite, setSuite] = useState(0)
  const champ = useRef<HTMLInputElement>(null)

  const nouveau = (s = source, i = indexCours) => {
    setExo(s === 'cours' ? exercicesCours[i % exercicesCours.length] : genererCalcul(s))
    setSaisie('')
    setVerdict(null)
    setErreurSaisie('')
    window.setTimeout(() => champ.current?.focus(), 0)
  }

  const changerSource = (s: GenreCalcul | 'cours') => {
    setSource(s)
    setIndexCours(0)
    nouveau(s, 0)
  }

  const verifier = (e: FormEvent) => {
    e.preventDefault()
    if (verdict) return
    const n = lireNombre(saisie)
    if (n === null) {
      setErreurSaisie('Écris seulement un nombre, par exemple 20 ou -3,5.')
      return
    }
    setErreurSaisie('')
    const juste = estProche(n, exo.reponse)
    const xp = repondre({ itemId: exo.id, type: 'exercice', notion: exo.notion, seance: 1, correct: juste }, XP.exerciceReussi)
    setSuite((s) => (juste ? s + 1 : 0))
    setVerdict({ juste, xp })
    onVerifie?.(juste)
  }

  const suivant = () => {
    const i = indexCours + 1
    setIndexCours(i)
    nouveau(source, i)
  }

  return (
    <div className="flex flex-col gap-4">
      {!onVerifie && (
      <Onglets
        label="Type de calcul"
        valeur={source}
        onChange={changerSource}
        options={[
          { id: 'tous', label: 'Au hasard' },
          { id: 'taux', label: "Taux d'évolution" },
          { id: 'pdm', label: 'Part de marché' },
          { id: 'cours', label: 'Données du cours' },
        ]}
      />
      )}

      <div className="carte p-5 flex flex-col gap-4">
        {source === 'cours' && exo.notion === 'part-de-marche' && <GraphiqueEaux />}
        <p className="text-lg font-semibold">{exo.enonce}</p>
        {exo.source && <p className="text-sm text-muted -mt-2">Source : {exo.source}</p>}

        <form onSubmit={verifier} className="flex flex-col sm:flex-row gap-2" noValidate>
          <label htmlFor="reponse-calcul" className="sr-only">
            Ta réponse en {exo.unite}
          </label>
          <div className="flex-1 flex items-center rounded-xl border-2 border-line bg-surface focus-within:border-blue-500">
            <input
              id="reponse-calcul"
              ref={champ}
              inputMode="decimal"
              autoComplete="off"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              disabled={!!verdict}
              placeholder="Ta réponse"
              aria-describedby={erreurSaisie ? 'erreur-calcul' : undefined}
              className="flex-1 min-w-0 min-h-12 bg-transparent px-3 text-lg outline-none"
            />
            <span className="px-3 text-muted font-semibold">{exo.unite}</span>
          </div>
          {!verdict && (
            <button type="submit" className="btn btn-bleu">
              Vérifier
            </button>
          )}
        </form>
        {erreurSaisie && (
          <p id="erreur-calcul" className="text-error-ink text-sm flex items-center gap-1">
            <Icone nom="erreur" taille={16} /> {erreurSaisie}
          </p>
        )}

        <div aria-live="polite">
          {verdict && (
            <Correction
              juste={verdict.juste}
              titre={verdict.juste ? 'Juste !' : `Pas tout à fait : la réponse est ${nombre(exo.reponse, 1)} ${exo.unite}.`}
            >
              <p className="font-semibold mb-1">Le calcul pas à pas :</p>
              <ol className="flex flex-col gap-1 font-mono text-sm">
                {exo.calcul.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ol>
              {verdict.xp > 0 && (
                <p className="mt-2">
                  <PuceXp xp={verdict.xp} />
                </p>
              )}
            </Correction>
          )}
        </div>

        {verdict && !onVerifie && (
          <button type="button" className="btn btn-orange" onClick={suivant}>
            {source === 'cours' ? 'Question suivante' : 'Nouveau calcul'} <Icone nom="suivant" />
          </button>
        )}
        {suite >= 2 && (
          <p className="text-sm text-center font-semibold text-orange-700">
            🔥 {suite} calculs justes d'affilée {suite < 10 ? `(badge « As du calcul » à 10)` : ''}
          </p>
        )}
      </div>
    </div>
  )
}
