import { Link } from 'react-router'
import Page from '../components/Page'
import Onboarding from '../components/Onboarding'
import MaitriseNotions from '../components/MaitriseNotions'
import Icone from '../components/Icone'
import { Barre, Etiquette } from '../components/ui'
import { flashcards, titreNotion, trouverItem } from '../lib/contenu'
import { nombreDuJour } from '../lib/leitner'
import { erreursARevoir, niveauPour, seancesDeLaSemaine, serieAffichee } from '../lib/gamification'
import { ecartJours, formatJour, jour } from '../lib/dates'
import { useProgression } from '../state/progression'
import type { Tentative } from '../lib/types'

/** Où aller pour retravailler une erreur. */
function lienErreur(t: Tentative): { to: string; titre: string; genre: string } {
  const trouve = trouverItem(t.itemId)
  if (!trouve) return { to: '/reviser', titre: titreNotion(t.notion), genre: 'Exercice' }
  switch (trouve.genre) {
    case 'qcm':
      return { to: `/reviser/qcm?ids=${t.itemId}`, titre: trouve.item.question, genre: 'QCM' }
    case 'flashcard':
      return { to: `/reviser/flashcards?ids=${t.itemId}`, titre: trouve.item.recto, genre: 'Flashcard' }
    case 'classement':
      return { to: `/reviser/exercices?onglet=classement&id=${t.itemId}`, titre: trouve.item.titre, genre: 'Classement' }
    case 'vraifaux':
      return { to: '/reviser/exercices?onglet=vraifaux', titre: `« ${trouve.item.affirmation} »`, genre: 'Vrai / Faux' }
    case 'cas':
      return { to: `/reviser/exercices?onglet=cas&id=${t.itemId}`, titre: trouve.item.titre, genre: 'Cas pratique' }
    case 'donnees':
      return { to: '/reviser/exercices?onglet=calculs', titre: trouve.item.question, genre: 'Calcul' }
  }
}

export default function Accueil() {
  const { p } = useProgression()

  if (!p.onboardingFait) {
    return (
      <div className="max-w-xl mx-auto">
        <Onboarding />
      </div>
    )
  }

  const prenom = p.profil.prenom
  const niveau = niveauPour(p.stats.xpTotal)
  const serie = serieAffichee(p.stats)
  const aReviser = nombreDuJour(flashcards, p.cartes)
  const erreurs = erreursARevoir(p.tentatives)
  const seances = seancesDeLaSemaine(p)
  const objectif = p.profil.objectifHebdo
  const qcmRates = erreurs.filter((e) => e.type === 'qcm').map((e) => e.itemId)
  const joursAvantQcm = p.profil.dateQcm ? ecartJours(jour(), p.profil.dateQcm) : null
  const actifAujourdhui = p.stats.derniereActivite === jour()

  return (
    <Page titre={prenom ? `Salut ${prenom} 👋` : 'Salut 👋'} sousTitre="Prêt·e pour une petite séance ?">
      {/* Série + niveau */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="carte p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Icone nom="flamme" taille={18} className="text-orange-700" /> Série
          </p>
          <p className="font-titre font-bold text-3xl mt-1">
            {serie.serie} <span className="text-base font-semibold text-muted">jour{serie.serie > 1 ? 's' : ''}</span>
          </p>
          <p className="text-xs text-muted mt-1">
            {actifAujourdhui
              ? "Aujourd'hui compte déjà ✓"
              : serie.enDanger
                ? 'Révise 10 min aujourd\'hui pour la garder !'
                : serie.serie === 0
                  ? '10 min aujourd\'hui pour la lancer'
                  : ''}
            {serie.jokerDispo ? ' · 🃏 joker dispo' : ' · joker utilisé'}
          </p>
        </div>
        <Link to="/profil" className="carte p-4 hover:border-blue-500">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Icone nom="etoile" taille={18} className="text-orange-700" /> Niveau {niveau.numero}
          </p>
          <p className="font-titre font-bold text-lg leading-tight mt-1">{niveau.nom}</p>
          <div className="mt-2">
            <Barre valeur={niveau.progression * 100} label="Progression vers le niveau suivant" couleur="orange" />
          </div>
          <p className="text-xs text-muted mt-1">
            {p.stats.xpTotal} XP{niveau.suivant ? ` · encore ${niveau.resteXp} XP` : ' · niveau max !'}
          </p>
        </Link>
      </div>

      {/* À réviser aujourd'hui */}
      <section className="carte p-5 mb-4 border-2 !border-orange-400" aria-labelledby="titre-jour">
        <h2 id="titre-jour" className="text-xl font-bold">À réviser aujourd'hui</h2>
        <p className="text-muted mt-1">
          {aReviser > 0 ? (
            <>
              <strong className="text-ink">{aReviser} flashcard{aReviser > 1 ? 's' : ''}</strong> t'attend{aReviser > 1 ? 'ent' : ''}, puis un QCM et un exercice sur ta notion la plus faible.
            </>
          ) : (
            'Toutes tes flashcards sont à jour ! La séance guidée te propose un QCM et un exercice.'
          )}
        </p>
        <Link to="/reviser/seance" className="btn btn-orange w-full mt-4 !min-h-14 text-lg">
          <Icone nom="lecture" /> Commencer ma séance (25 min)
        </Link>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">Objectif de la semaine</span>
            <span className="text-muted">
              {Math.min(seances, objectif)} / {objectif} séances {seances >= objectif ? '🎯' : ''}
            </span>
          </div>
          <Barre valeur={seances} max={objectif} label="Séances de la semaine" couleur={seances >= objectif ? 'succes' : 'bleu'} />
        </div>
      </section>

      {/* Évaluation */}
      <section className="carte p-5 mb-4" aria-labelledby="titre-eval">
        <h2 id="titre-eval" className="text-lg font-bold flex items-center gap-2">
          <Icone nom="calendrier" className="text-blue-700" /> Ce qui t'attend
        </h2>
        {joursAvantQcm !== null && joursAvantQcm >= 0 ? (
          <p className="mt-2 rounded-2xl bg-orange-100 p-3">
            <span className="font-titre font-bold text-2xl text-orange-700">J−{joursAvantQcm}</span>{' '}
            {joursAvantQcm === 0 ? "C'est aujourd'hui : tu es prêt·e !" : `avant ton QCM (${formatJour(p.profil.dateQcm!)}).`}
          </p>
        ) : (
          <p className="text-sm text-muted mt-1">
            <Link to="/profil" className="lien">Ajoute la date de ton QCM</Link> pour voir le compte à rebours.
          </p>
        )}
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          <li className="flex gap-2">
            <Etiquette ton="orange">40 %</Etiquette>
            <span>
              <strong>Contrôle continu</strong>, dont un <strong>QCM individuel « Marché + parcours d'achat » sur 10 points</strong> : ce chapitre en fait partie.
            </span>
          </li>
          <li className="flex gap-2">
            <Etiquette>60 %</Etiquette>
            <span>
              <strong>Examen final écrit</strong> : il faudra savoir appliquer le cours à un cas.
            </span>
          </li>
        </ul>
      </section>

      {/* Erreurs à revoir */}
      <section className="carte p-5 mb-4" aria-labelledby="titre-erreurs">
        <div className="flex items-center justify-between gap-2">
          <h2 id="titre-erreurs" className="text-lg font-bold">Mes erreurs à revoir</h2>
          {erreurs.length > 0 && <Etiquette ton="orange">{erreurs.length}</Etiquette>}
        </div>
        {erreurs.length === 0 ? (
          <p className="text-muted mt-2">
            {p.tentatives.length ? 'Aucune erreur en attente. Bravo !' : 'Tes erreurs apparaîtront ici automatiquement : elles sont précieuses, ce sont elles qui te font progresser.'}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted mt-1">Réussis-les pour les faire disparaître (et gagner le badge « Revanche »).</p>
            <ul className="mt-3 flex flex-col gap-2">
              {erreurs.slice(0, 6).map((e) => {
                const l = lienErreur(e)
                return (
                  <li key={e.itemId}>
                    <Link to={l.to} className="flex items-center gap-3 rounded-xl border border-line p-3 hover:border-blue-500">
                      <Icone nom="recommencer" taille={18} className="text-orange-700" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-muted">
                          {l.genre} · {titreNotion(e.notion)}
                        </span>
                        <span className="block truncate">{l.titre}</span>
                      </span>
                      <Icone nom="suivant" taille={18} className="text-muted" />
                    </Link>
                  </li>
                )
              })}
            </ul>
            {qcmRates.length > 1 && (
              <Link to={`/reviser/qcm?ids=${qcmRates.join(',')}`} className="btn btn-bleu w-full mt-3">
                Refaire mes {qcmRates.length} questions de QCM ratées
              </Link>
            )}
          </>
        )}
      </section>

      {/* Maîtrise */}
      <section className="carte p-5 mb-4" aria-labelledby="titre-maitrise">
        <h2 id="titre-maitrise" className="text-lg font-bold">Ma maîtrise du chapitre</h2>
        <p className="text-sm text-muted mt-1 mb-4">Réussite sur tes 10 dernières réponses par notion. Touche une notion pour la réviser.</p>
        <MaitriseNotions />
      </section>

      <Link to="/classement" className="carte p-4 flex items-center gap-3 hover:border-blue-500">
        <Icone nom="classement" className="text-blue-700" />
        <span className="flex-1">
          <span className="block font-semibold">Classement de la classe</span>
          <span className="block text-sm text-muted">Facultatif : XP de la semaine, remis à zéro chaque lundi.</span>
        </span>
        <Icone nom="suivant" className="text-muted" />
      </Link>
    </Page>
  )
}
