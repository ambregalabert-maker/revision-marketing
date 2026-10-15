import { useMemo, useRef, useState, type PointerEvent } from 'react'
import type { ExerciceClassement } from '../../lib/types'
import { melanger, titreNotion } from '../../lib/contenu'
import { XP } from '../../lib/gamification'
import { useProgression } from '../../state/progression'
import { Correction, Etiquette, PuceXp } from '../ui'
import Icone from '../Icone'

type Phase = 'tri' | 'corrige-tri' | 'sous' | 'fin'

/**
 * Exercice de classement.
 * Trois façons de jouer : glisser-déposer (souris ou doigt), ou toucher/cliquer un élément
 * puis la catégorie, ou au clavier (Tab + Entrée). Pour l'environnement, une 2e étape
 * demande la bonne composante (démographique, clients, etc.).
 */
export default function Classement({ exo, onTermine }: { exo: ExerciceClassement; onTermine?: (reussi: boolean) => void }) {
  const { repondre } = useProgression()
  const elements = useMemo(() => melanger(exo.elements), [exo])
  const [place, setPlace] = useState<Record<string, string>>({})
  const [sous, setSous] = useState<Record<string, string>>({})
  const [selection, setSelection] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('tri')
  const [resultat, setResultat] = useState<{ score: number; total: number; xp: number } | null>(null)
  const [fantome, setFantome] = useState<{ id: string; x: number; y: number } | null>(null)
  const glisse = useRef<{ id: string; x: number; y: number; actif: boolean } | null>(null)
  const ignorerClic = useRef(false)
  const pointeurY = useRef(0)

  const deuxEtapes = !!exo.sousCategories
  const restants = elements.filter((e) => !place[e.id])
  const label = (id: string) => exo.categories.find((c) => c.id === id)?.label ?? id

  const placer = (elementId: string, categorie: string) => {
    if (phase !== 'tri') return
    setPlace((p) => ({ ...p, [elementId]: categorie }))
    setSelection(null)
  }

  // ---------- Glisser-déposer (souris et tactile) ----------
  const debut = (e: PointerEvent, id: string) => {
    if (phase !== 'tri') return
    glisse.current = { id, x: e.clientX, y: e.clientY, actif: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const mouvement = (e: PointerEvent) => {
    const g = glisse.current
    if (!g) return
    if (!g.actif && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8) {
      g.actif = true
      defiler()
    }
    if (g.actif) {
      pointeurY.current = e.clientY
      setFantome({ id: g.id, x: e.clientX, y: e.clientY })
    }
  }
  // Défilement automatique quand on approche du haut ou du bas de l'écran en glissant.
  const defiler = () => {
    if (!glisse.current?.actif) return
    const y = pointeurY.current
    if (y > window.innerHeight - 90) window.scrollBy(0, 14)
    else if (y < 120) window.scrollBy(0, -14)
    requestAnimationFrame(defiler)
  }
  const fin = (e: PointerEvent) => {
    const g = glisse.current
    glisse.current = null
    setFantome(null)
    if (!g?.actif) return
    ignorerClic.current = true
    window.setTimeout(() => (ignorerClic.current = false), 300)
    const zone = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-zone]')
    if (zone?.dataset.zone) placer(g.id, zone.dataset.zone)
  }
  const clicPuce = (id: string) => {
    if (ignorerClic.current || phase !== 'tri') return
    setSelection((s) => (s === id ? null : id))
  }

  // ---------- Vérifications ----------
  const verifierTri = () => {
    if (deuxEtapes) setPhase('corrige-tri')
    else conclure()
  }

  const conclure = () => {
    const justes1 = elements.filter((e) => place[e.id] === e.categorie).length
    const justes2 = deuxEtapes ? elements.filter((e) => sous[e.id] === e.sousCategorie).length : 0
    const total = elements.length * (deuxEtapes ? 2 : 1)
    const score = justes1 + justes2
    // L'exercice est « réussi » à partir de 80 % de bonnes réponses.
    const reussi = score / total >= 0.8
    const xp = repondre({ itemId: exo.id, type: 'exercice', notion: exo.notion, seance: exo.seance, correct: reussi }, XP.exerciceReussi)
    setResultat({ score, total, xp })
    setPhase('fin')
    onTermine?.(reussi)
  }

  const recommencer = () => {
    setPlace({})
    setSous({})
    setSelection(null)
    setResultat(null)
    setPhase('tri')
  }

  const puce = (id: string, texte: string, dansZone: boolean) => {
    const el = elements.find((x) => x.id === id)!
    const corrige = phase !== 'tri'
    const juste = place[id] === el.categorie
    return (
      <li key={id}>
        <button
          type="button"
          onPointerDown={(e) => debut(e, id)}
          onPointerMove={mouvement}
          onPointerUp={fin}
          onPointerCancel={() => {
            glisse.current = null
            setFantome(null)
          }}
          onClick={() => clicPuce(id)}
          aria-pressed={phase === 'tri' ? selection === id : undefined}
          disabled={corrige && !dansZone}
          className={`flex items-center gap-2 text-left min-h-11 px-3 py-2 rounded-xl border-2 text-sm md:text-base select-none touch-none transition-colors ${
            selection === id
              ? 'border-accent-500 bg-accent-100'
              : corrige
                ? juste
                  ? 'border-success bg-success-bg'
                  : 'border-error bg-error-bg'
                : 'border-line bg-surface hover:border-blue-500 cursor-grab'
          } ${fantome?.id === id ? 'opacity-40' : ''}`}
        >
          {corrige && <Icone nom={juste ? 'ok' : 'non'} taille={18} label={juste ? 'Bien placé' : 'Mal placé'} className={juste ? 'text-success-ink' : 'text-error-ink'} />}
          <span>{texte}</span>
        </button>
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="carte p-5">
        <div className="flex flex-wrap gap-2 mb-2">
          <Etiquette>{titreNotion(exo.notion)}</Etiquette>
          <Etiquette ton="neutre">Séance {exo.seance}</Etiquette>
        </div>
        <h2 className="text-xl font-bold">{exo.titre}</h2>
        <p className="text-muted mt-1">{exo.consigne}</p>
      </div>

      {phase === 'tri' && (
        <div className="carte p-4">
          <p className="text-sm font-semibold text-muted mb-2" id={`aide-${exo.id}`}>
            {restants.length > 0
              ? selection
                ? '→ Maintenant, choisis la catégorie ci-dessous.'
                : 'Glisse un élément dans une catégorie, ou touche-le puis touche la catégorie.'
              : 'Tout est placé ! Tu peux encore déplacer un élément, ou vérifier.'}
          </p>
          {restants.length > 0 && <ul className="flex flex-wrap gap-2">{restants.map((e) => puce(e.id, e.texte, false))}</ul>}
        </div>
      )}

      {/* Les catégories (zones de dépôt) */}
      {phase !== 'sous' && phase !== 'fin' && (
        <div className="grid gap-2 sm:gap-3 grid-cols-2">
          {exo.categories.map((c) => {
            const dedans = elements.filter((e) => place[e.id] === c.id)
            return (
              <section
                key={c.id}
                data-zone={c.id}
                aria-label={c.label}
                className={`rounded-2xl border-2 border-dashed p-3 min-h-28 transition-colors ${
                  selection ? 'border-accent-500 bg-accent-100/40' : 'border-line bg-surface-2'
                }`}
              >
                <button
                  type="button"
                  onClick={() => selection && placer(selection, c.id)}
                  disabled={!selection || phase !== 'tri'}
                  className="w-full text-left min-h-11 rounded-xl px-1 disabled:cursor-default"
                  aria-label={selection ? `Placer dans ${c.label}` : c.label}
                >
                  <span className="block font-titre font-semibold">{c.label}</span>
                  {c.aide && <span className="block text-sm text-muted">{c.aide}</span>}
                </button>
                {dedans.length > 0 && <ul className="flex flex-wrap gap-2 mt-2">{dedans.map((e) => puce(e.id, e.texte, true))}</ul>}
              </section>
            )
          })}
        </div>
      )}

      {phase === 'tri' && (
        <button type="button" className="btn btn-accent" disabled={restants.length > 0} onClick={verifierTri}>
          {restants.length > 0 ? `Encore ${restants.length} élément${restants.length > 1 ? 's' : ''} à placer` : 'Vérifier'}
        </button>
      )}

      {phase === 'corrige-tri' && (
        <div className="flex flex-col gap-3" aria-live="polite">
          <Correction
            juste={elements.every((e) => place[e.id] === e.categorie)}
            titre={`Étape 1 : ${elements.filter((e) => place[e.id] === e.categorie).length} / ${elements.length} bien placés`}
          >
            <ExplicationsErreurs elements={elements.filter((e) => place[e.id] !== e.categorie)} label={label} />
          </Correction>
          <button type="button" className="btn btn-accent" onClick={() => setPhase('sous')}>
            Étape 2 : trouver la composante <Icone nom="suivant" />
          </button>
        </div>
      )}

      {phase === 'sous' && exo.sousCategories && (
        <div className="flex flex-col gap-3">
          <p className="font-semibold">Étape 2 : pour chaque élément (rangé maintenant dans le bon environnement), choisis sa composante.</p>
          {elements.map((e) => (
            <fieldset key={e.id} className="carte p-4">
              <legend className="sr-only">{e.texte}</legend>
              <p className="font-semibold">
                {e.texte} <span className="text-sm font-normal text-muted">· {label(e.categorie)}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {exo.sousCategories![e.categorie].map((s) => (
                  <label
                    key={s.id}
                    className={`inline-flex items-center gap-2 min-h-11 px-3 rounded-xl border-2 cursor-pointer text-sm ${
                      sous[e.id] === s.id ? 'border-blue-500 bg-blue-100' : 'border-line hover:border-blue-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`sous-${exo.id}-${e.id}`}
                      className="accent-[var(--blue-700)]"
                      checked={sous[e.id] === s.id}
                      onChange={() => setSous((x) => ({ ...x, [e.id]: s.id }))}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <button type="button" className="btn btn-accent" disabled={elements.some((e) => !sous[e.id])} onClick={conclure}>
            {elements.some((e) => !sous[e.id]) ? `Encore ${elements.filter((e) => !sous[e.id]).length} à choisir` : 'Vérifier'}
          </button>
        </div>
      )}

      {phase === 'fin' && resultat && (
        <div className="flex flex-col gap-3" aria-live="polite">
          <Correction juste={resultat.score / resultat.total >= 0.8} titre={`Score : ${resultat.score} / ${resultat.total}`}>
            {deuxEtapes ? (
              <ul className="flex flex-col gap-2 text-sm">
                {elements.map((e) => {
                  const ok1 = place[e.id] === e.categorie
                  const ok2 = sous[e.id] === e.sousCategorie
                  const bonne = exo.sousCategories![e.categorie].find((s) => s.id === e.sousCategorie)?.label
                  return (
                    <li key={e.id} className="flex gap-2">
                      <Icone nom={ok1 && ok2 ? 'ok' : 'non'} taille={18} className={ok1 && ok2 ? 'text-success-ink' : 'text-error-ink'} label={ok1 && ok2 ? 'Juste' : 'À revoir'} />
                      <span>
                        <span className="font-semibold">{e.texte}</span> → {label(e.categorie)}, {bonne}. {e.explication}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <ExplicationsErreurs elements={elements.filter((e) => place[e.id] !== e.categorie)} label={label} tout={elements} />
            )}
            <p className="mt-2">
              <PuceXp xp={resultat.xp} />
            </p>
          </Correction>
          <button type="button" className="btn btn-contour" onClick={recommencer}>
            <Icone nom="recommencer" /> Recommencer cet exercice
          </button>
        </div>
      )}

      {/* Élément qui suit le doigt / la souris pendant le glisser-déposer */}
      {fantome && (
        <div
          aria-hidden
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-xl border-2 border-accent-500 bg-surface shadow-carte text-sm max-w-64"
          style={{ left: fantome.x, top: fantome.y, transform: 'translate(-50%, -120%)' }}
        >
          {elements.find((e) => e.id === fantome.id)?.texte}
        </div>
      )}
    </div>
  )
}

function ExplicationsErreurs({
  elements,
  label,
  tout,
}: {
  elements: ExerciceClassement['elements']
  label: (id: string) => string
  tout?: ExerciceClassement['elements']
}) {
  if (elements.length === 0 && !tout) return <p>Parfait, tout est bien rangé !</p>
  const liste = tout ?? elements
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {liste.map((e) => {
        const erreur = elements.includes(e)
        return (
          <li key={e.id} className="flex gap-2">
            <Icone nom={erreur ? 'non' : 'ok'} taille={18} className={erreur ? 'text-error-ink' : 'text-success-ink'} label={erreur ? 'Mal placé' : 'Bien placé'} />
            <span>
              <span className="font-semibold">{e.texte}</span> → {label(e.categorie)}. {e.explication}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
