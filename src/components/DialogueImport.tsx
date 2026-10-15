import { useEffect, useRef } from 'react'
import { useCompte } from '../state/compte'

/** À la première connexion : « importer ma progression invité dans mon compte ? ». */
export default function DialogueImport() {
  const { demandeImport, repondreImport } = useCompte()
  const bouton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (demandeImport) bouton.current?.focus()
  }, [demandeImport])

  if (!demandeImport) return null
  const { local, distant } = demandeImport
  const compteAProgression = distant.tentatives.length > 0 || distant.stats.xpTotal > 0

  return (
    <div className="fixed inset-0 z-[70] bg-ink/50 flex items-end sm:items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="t-import" className="carte p-6 max-w-md w-full apparition">
        <h2 id="t-import" className="text-xl font-bold">Importer ta progression ?</h2>
        <p className="mt-2">
          Tu as déjà révisé sur ce navigateur sans compte : <strong>{local.stats.xpTotal} XP</strong>, {local.tentatives.length} réponses
          {Object.keys(local.badges).length ? ` et ${Object.keys(local.badges).length} badge(s)` : ''}.
        </p>
        <p className="mt-2 text-muted">
          {compteAProgression
            ? `Ton compte a déjà ${distant.stats.xpTotal} XP : les deux progressions seront additionnées.`
            : 'On peut l’ajouter à ton compte pour la retrouver partout.'}
        </p>
        <div className="flex flex-col gap-2 mt-5">
          <button ref={bouton} type="button" className="btn btn-accent" onClick={() => repondreImport(true)}>
            Oui, importer ma progression
          </button>
          <button type="button" className="btn btn-contour" onClick={() => repondreImport(false)}>
            Non, repartir de mon compte
          </button>
        </div>
      </div>
    </div>
  )
}
