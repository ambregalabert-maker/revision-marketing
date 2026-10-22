import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Page from '../components/Page'
import FiltresContenu from '../components/FiltresContenu'
import SerieQcm, { type ResultatQcm } from '../components/revision/SerieQcm'
import { Correction, PuceXp, Retour } from '../components/ui'
import Icone from '../components/Icone'
import { filtrer, melanger, qcm } from '../lib/contenu'
import { encouragement } from '../lib/gamification'
import { useFiltres } from '../state/filtres'
import { useProgression } from '../state/progression'
import { useTempsEtude } from '../state/useTempsEtude'
import type { QuestionQcm } from '../lib/types'

const TAILLE_SERIE = 10

export default function Qcm() {
  useTempsEtude()
  const { filtres } = useFiltres()
  const { debloquerBadge } = useProgression()
  const [params] = useSearchParams()
  const idsDemandes = params.get('ids')?.split(',')
  const [mode, setMode] = useState<'entrainement' | 'examen'>('entrainement')
  const [serie, setSerie] = useState<QuestionQcm[] | null>(null)
  const [resultat, setResultat] = useState<ResultatQcm | null>(null)

  const disponibles = idsDemandes ? qcm.filter((q) => idsDemandes.includes(q.id)) : filtrer(qcm, filtres.chapitre, filtres.notion)

  const commencer = (m: 'entrainement' | 'examen') => {
    // Le mode examen pioche toujours dans tout le chapitre… sauf si un filtre est choisi.
    setMode(m)
    setResultat(null)
    setSerie(melanger(disponibles).slice(0, TAILLE_SERIE))
  }

  const fin = (r: ResultatQcm) => {
    setResultat(r)
    window.scrollTo(0, 0)
    if (r.total === TAILLE_SERIE && r.bonnes === TAILLE_SERIE) debloquerBadge('qcm-parfait')
    if (mode === 'examen') debloquerBadge('examen-blanc')
  }

  if (serie && !resultat) {
    return (
      <Page titre={mode === 'examen' ? 'QCM · mode examen' : 'QCM · entraînement'}>
        <SerieQcm key={serie.map((q) => q.id).join()} questions={serie} mode={mode} onTermine={fin} />
        <button type="button" onClick={() => setSerie(null)} className="btn btn-discret w-full mt-4">
          Abandonner la série
        </button>
      </Page>
    )
  }

  if (resultat) {
    const note = Math.round((resultat.bonnes / resultat.total) * 10 * 10) / 10
    return (
      <Page titre="Résultat du QCM">
        <div className="carte p-6 text-center apparition">
          <p className="text-muted font-semibold">{mode === 'examen' ? 'Ta note' : 'Ton score'}</p>
          <p className="font-titre font-bold text-5xl text-blue-700 my-2">
            {note.toString().replace('.', ',')}
            <span className="text-2xl text-muted"> / 10</span>
          </p>
          <p className="text-muted">
            {resultat.bonnes} bonne{resultat.bonnes > 1 ? 's' : ''} réponse{resultat.bonnes > 1 ? 's' : ''} sur {resultat.total}. {encouragement()}
          </p>
          {resultat.xp > 0 && (
            <p className="mt-3">
              <PuceXp xp={resultat.xp} />
            </p>
          )}
          {resultat.bonnes < resultat.total && (
            <p className="mt-3 text-sm">Tes erreurs sont ajoutées à ta liste « Mes erreurs à revoir » sur l'accueil.</p>
          )}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" className="btn btn-accent" onClick={() => commencer(mode)}>
              Nouvelle série
            </button>
            <button type="button" className="btn btn-contour" onClick={() => { setSerie(null); setResultat(null) }}>
              Retour au menu QCM
            </button>
          </div>
        </div>

        {mode === 'examen' && (
          <section className="mt-6 flex flex-col gap-3" aria-labelledby="titre-correction">
            <h2 id="titre-correction" className="text-xl font-bold">Correction détaillée</h2>
            {resultat.details.map((d, n) => (
              <Correction key={d.question.id} juste={d.juste} titre={`${n + 1}. ${d.question.question}`}>
                <p className="text-sm">
                  <span className="font-semibold">Ta réponse : </span>
                  {d.choisis.length ? d.choisis.map((i) => d.question.choix[i].texte).join(' · ') : 'pas de réponse'}
                </p>
                {!d.juste && (
                  <p className="text-sm">
                    <span className="font-semibold">Bonne réponse : </span>
                    {d.question.choix.filter((c) => c.correct).map((c) => c.texte).join(' · ')}
                  </p>
                )}
                <p className="text-sm mt-1">{d.question.explication}</p>
                {!d.juste && d.choisis.filter((i) => !d.question.choix[i].correct).map((i) => (
                  <p key={i} className="text-sm text-muted mt-1">
                    Pourquoi « {d.question.choix[i].texte} » est faux : {d.question.choix[i].pourquoi}
                  </p>
                ))}
              </Correction>
            ))}
          </section>
        )}
      </Page>
    )
  }

  return (
    <Page titre="QCM" sousTitre="Le même format que le QCM noté « Marché + parcours d'achat » : entraîne-toi dans les conditions réelles.">
      <Retour />
      {idsDemandes ? (
        <p className="carte p-4 mb-4">Tu refais {disponibles.length} question{disponibles.length > 1 ? 's' : ''} de ta liste « à revoir ».</p>
      ) : (
        <div className="mb-4">
          <FiltresContenu />
        </div>
      )}
      <p className="text-sm text-muted mb-4">
        {disponibles.length} question{disponibles.length > 1 ? 's' : ''} disponible{disponibles.length > 1 ? 's' : ''} avec ce filtre
        {disponibles.length < TAILLE_SERIE && disponibles.length > 0 ? ` (la série en comptera ${disponibles.length})` : ''}.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="carte p-5 flex flex-col gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Icone nom="qcm" className="text-blue-700" /> Entraînement
          </h2>
          <p className="text-muted flex-1">10 questions tirées au hasard. Correction et explication immédiates après chaque réponse.</p>
          <button type="button" className="btn btn-accent" onClick={() => commencer('entrainement')} disabled={!disponibles.length}>
            Commencer
          </button>
        </div>
        <div className="carte p-5 flex flex-col gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Icone nom="minuteur" className="text-blue-700" /> Mode examen
          </h2>
          <p className="text-muted flex-1">10 questions en 10 minutes chrono. Correction seulement à la fin, avec ta note sur 10.</p>
          <button type="button" className="btn btn-bleu" onClick={() => commencer('examen')} disabled={!disponibles.length}>
            Lancer l'examen blanc
          </button>
        </div>
      </div>
      {idsDemandes && (
        <Link to="/reviser/qcm" className="btn btn-discret w-full mt-4">
          Voir toutes les questions
        </Link>
      )}
    </Page>
  )
}
