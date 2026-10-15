import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Page from '../components/Page'
import FiltresContenu from '../components/FiltresContenu'
import SessionFlashcards, { type BilanFlashcards } from '../components/revision/SessionFlashcards'
import { EcranFin, Retour } from '../components/ui'
import Icone from '../components/Icone'
import { filtrer, flashcards, melanger } from '../lib/contenu'
import { NOUVELLES_PAR_JOUR, ordonner } from '../lib/leitner'
import { encouragement } from '../lib/gamification'
import { formatDans } from '../lib/dates'
import { useProgression } from '../state/progression'
import { useFiltres } from '../state/filtres'
import { useTempsEtude } from '../state/useTempsEtude'
import type { Flashcard } from '../lib/types'

export default function Flashcards() {
  useTempsEtude()
  const { p } = useProgression()
  const { filtres } = useFiltres()
  const [params] = useSearchParams()
  const idsDemandes = params.get('ids')?.split(',')
  const [inverse, setInverse] = useState(false)
  const [serie, setSerie] = useState<Flashcard[] | null>(null)
  const [bilan, setBilan] = useState<BilanFlashcards | null>(null)

  const choisies = useMemo(
    () => (idsDemandes ? flashcards.filter((c) => idsDemandes.includes(c.id)) : filtrer(flashcards, filtres.seance, filtres.notion)),
    [filtres.seance, filtres.notion, params],
  )
  // La série en cours garde sa propre copie des cartes : la liste ne bouge pas pendant qu'on révise.
  const { dues, nouvelles, plusTard } = ordonner(choisies, p.cartes)
  const duJour = [...dues, ...nouvelles.slice(0, NOUVELLES_PAR_JOUR)]
  const prochaine = plusTard[0] ? p.cartes[plusTard[0].id]?.prochaine : null

  const commencer = (cartes: Flashcard[]) => {
    setBilan(null)
    setSerie(cartes)
  }

  if (serie && !bilan) {
    return (
      <Page titre="Flashcards" sousTitre={inverse ? 'Mode inversé : trouve la notion à partir de la définition.' : 'Cherche la réponse avant de retourner la carte.'}>
        <SessionFlashcards key={serie.map((c) => c.id).join()} cartes={serie} inverse={inverse} onTermine={(b) => { setBilan(b); window.scrollTo(0, 0) }} />
        <button type="button" onClick={() => setSerie(null)} className="btn btn-discret w-full mt-4">
          Arrêter la série
        </button>
      </Page>
    )
  }

  if (bilan) {
    return (
      <Page titre="Flashcards">
        <EcranFin
          titre="Série terminée !"
          message={`${bilan.sues} carte${bilan.sues > 1 ? 's' : ''} sue${bilan.sues > 1 ? 's' : ''} sur ${bilan.vues} révisée${bilan.vues > 1 ? 's' : ''}. ${encouragement()}`}
          xp={bilan.xp}
        >
          <button type="button" className="btn btn-accent" onClick={() => { setBilan(null); setSerie(null) }}>
            Retour aux flashcards
          </button>
          <Link to="/reviser/qcm" className="btn btn-contour">Enchaîner avec un QCM</Link>
        </EcranFin>
      </Page>
    )
  }

  return (
    <Page titre="Flashcards" sousTitre="Rappel actif + répétition espacée : ce que tu rates revient plus tôt, ce que tu sais revient plus tard.">
      <Retour />
      {idsDemandes ? (
        <p className="carte p-4 mb-4">Tu révises {choisies.length} carte{choisies.length > 1 ? 's' : ''} de ta liste « à revoir ».</p>
      ) : (
        <div className="mb-4">
          <FiltresContenu />
        </div>
      )}

      <div className="carte p-5 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat valeur={dues.length} label="à revoir aujourd'hui" />
          <Stat valeur={nouvelles.length} label="jamais vues" />
          <Stat valeur={plusTard.length} label="programmées plus tard" />
        </div>

        <label className="flex items-center justify-between gap-3 min-h-11 cursor-pointer">
          <span>
            <span className="font-semibold">Mode inversé</span>
            <span className="block text-sm text-muted">Tu vois la définition, tu dois retrouver la notion.</span>
          </span>
          <input type="checkbox" className="w-6 h-6 accent-[var(--blue-700)]" checked={inverse} onChange={(e) => setInverse(e.target.checked)} />
        </label>

        {idsDemandes ? (
          <button type="button" className="btn btn-accent" onClick={() => commencer(choisies)} disabled={!choisies.length}>
            <Icone nom="lecture" /> Revoir ces cartes
          </button>
        ) : duJour.length > 0 ? (
          <button type="button" className="btn btn-accent" onClick={() => commencer(duJour)}>
            <Icone nom="lecture" /> Réviser mes {duJour.length} carte{duJour.length > 1 ? 's' : ''} du jour
          </button>
        ) : (
          <p className="text-center rounded-2xl bg-success-bg text-success-ink p-4 font-semibold">
            <Icone nom="ok" className="inline mr-1" /> Tout est à jour pour ce filtre !
            {prochaine && <span className="block font-normal text-ink">Prochaine révision : {formatDans(prochaine)}.</span>}
          </p>
        )}
        {!idsDemandes && choisies.length > 0 && (
          <button type="button" className="btn btn-contour" onClick={() => commencer(melanger(choisies))}>
            <Icone nom="melanger" /> Réviser toutes les cartes ({choisies.length}) dans le désordre
          </button>
        )}
        <p className="text-sm text-muted">
          Raccourcis : <kbd className="font-bold">Espace</kbd> pour retourner, <kbd className="font-bold">1</kbd> / <kbd className="font-bold">2</kbd> / <kbd className="font-bold">3</kbd> pour t'évaluer. Sur téléphone, tu peux aussi balayer la carte.
        </p>
      </div>
    </Page>
  )
}

function Stat({ valeur, label }: { valeur: number; label: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <p className="text-2xl font-titre font-bold text-blue-700">{valeur}</p>
      <p className="text-xs text-muted leading-tight">{label}</p>
    </div>
  )
}
