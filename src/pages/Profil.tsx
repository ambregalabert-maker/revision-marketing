import { useState } from 'react'
import { Link } from 'react-router'
import Page from '../components/Page'
import Icone from '../components/Icone'
import GraphiqueSeances from '../components/GraphiqueSeances'
import MaitriseNotions from '../components/MaitriseNotions'
import Compte from '../components/Compte'
import Personnaliser from '../components/Personnaliser'
import { Barre, Etiquette, Repliable } from '../components/ui'
import { BADGES, NIVEAUX, niveauPour, serieAffichee } from '../lib/gamification'
import { ETAPES, totalEtoiles } from '../lib/chemin'
import { ecartJours, formatDuree, formatJour, jour } from '../lib/dates'
import { useProgression } from '../state/progression'
import MonCompagnon from '../components/MonCompagnon'
import { marksDisponibles } from '../lib/boutique'

export default function Profil() {
  const { p, majProfil, reinitialiser } = useProgression()
  const [confirmer, setConfirmer] = useState(false)
  const niveau = niveauPour(p.stats.xpTotal)
  const serie = serieAffichee(p.stats)
  const minutesTotal = p.sessions.reduce((s, x) => s + x.dureeMinutes, 0)
  const tentatives = p.tentatives.filter((t) => t.type !== 'flashcard')
  const taux = tentatives.length ? Math.round((tentatives.filter((t) => t.correct).length / tentatives.length) * 100) : null
  const etoiles = totalEtoiles(p)
  const joursQcm = p.profil.dateQcm ? ecartJours(jour(), p.profil.dateQcm) : null

  const champ = 'min-h-11 rounded-xl border-2 border-line bg-surface px-3 focus:border-blue-500 outline-none font-normal text-base'

  return (
    <Page titre={p.profil.prenom ? `Le profil de ${p.profil.prenom}` : 'Mon profil'}>
      <Compte />

      {/* Carte « héros » : niveau, série, étoiles */}
      <section className="carte p-5 mb-4" aria-labelledby="t-niveau">
        <div className="flex items-center gap-4">
          {p.boutique.compagnon ? (
            <Link to="/boutique" className="relative shrink-0 rounded-3xl bg-accent-100 p-1" aria-label={`${p.boutique.nom} : ouvrir la boutique`}>
              <MonCompagnon taille={84} />
              <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gold text-[#1e2a3a] font-titre font-bold flex items-center justify-center border-2 border-surface" aria-hidden>
                {niveau.numero}
              </span>
            </Link>
          ) : (
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-bg text-gold-ink font-titre font-bold text-2xl shrink-0" aria-hidden>
              {niveau.numero}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted font-semibold">Niveau {niveau.numero}</p>
            <h2 id="t-niveau" className="text-xl font-bold leading-tight">
              {niveau.nom}
            </h2>
            <div className="mt-2">
              <Barre valeur={niveau.progression * 100} label="Progression vers le niveau suivant" couleur="or" hauteur="h-3" />
            </div>
            <p className="text-xs text-muted mt-1">
              {p.stats.xpTotal} XP{niveau.suivant ? ` · encore ${niveau.resteXp} XP avant « ${niveau.suivant.nom} »` : ' · niveau maximum !'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <Pastille valeur={`🔥 ${serie.serie}`} label={`jour${serie.serie > 1 ? 's' : ''} de série`} />
          <Pastille valeur={`⭐ ${etoiles}`} label={`étoiles sur ${ETAPES.length * 3}`} />
          <Pastille valeur={`🏅 ${Object.keys(p.badges).length}`} label={`badges sur ${BADGES.length}`} />
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-semibold text-blue-700">Les 10 niveaux et comment gagner des XP</summary>
          <ol className="mt-2 grid sm:grid-cols-2 gap-1">
            {NIVEAUX.map((n, i) => (
              <li key={n.nom} className={i + 1 === niveau.numero ? 'font-bold' : ''}>
                {i + 1}. {n.nom} <span className="text-muted">({n.seuil} XP)</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-muted">
            Flashcard révisée 2 XP · bonne réponse au QCM 5 XP · exercice réussi 10 XP · cas pratique terminé 25 XP · étape du chemin terminée +10 XP · séance Tryhard complète +20 XP. Une erreur ne fait jamais perdre d'XP.
          </p>
        </details>
      </section>

      <Link to="/boutique" className="carte p-4 mb-4 flex items-center gap-3 hover:border-blue-500">
        <span className="text-3xl" aria-hidden>
          🛍️
        </span>
        <span className="flex-1">
          <span className="block font-semibold">{p.boutique.compagnon ? `La boutique de ${p.boutique.nom}` : 'Adopte ton compagnon'}</span>
          <span className="block text-sm text-muted">{p.boutique.compagnon ? 'Accessoires et compagnons à débloquer avec tes Marks.' : 'Le premier est offert : renard, panda ou licorne !'}</span>
        </span>
        <span className="rounded-full bg-gold-bg text-gold-ink font-extrabold px-3 py-1">🪙 {marksDisponibles(p)}</span>
      </Link>

      <Repliable titre="Personnaliser" icone="🎨" resume="Couleur, clair ou sombre, durée, objectif">
        <Personnaliser integre />
      </Repliable>

      {/* Mes infos + évaluation */}
      <Repliable titre="Mes infos" icone="🗓️" resume={p.profil.dateQcm ? `QCM le ${formatJour(p.profil.dateQcm)}` : 'Prénom, date de ton QCM, évaluation'}>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 font-semibold text-sm">
            Prénom
            <input className={champ} value={p.profil.prenom} maxLength={30} autoComplete="given-name" onChange={(e) => majProfil({ prenom: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 font-semibold text-sm">
            Date de ton QCM (facultatif)
            <input type="date" className={champ} value={p.profil.dateQcm ?? ''} onChange={(e) => majProfil({ dateQcm: e.target.value || null })} />
          </label>
        </div>
        {joursQcm !== null && joursQcm >= 0 && (
          <p className="mt-3 rounded-2xl bg-accent-100 p-3">
            <span className="font-titre font-bold text-xl text-accent-700">J−{joursQcm}</span> avant ton QCM ({formatJour(p.profil.dateQcm!)}).
          </p>
        )}
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          <li className="flex gap-2">
            <Etiquette ton="accent">40 %</Etiquette>
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
      </Repliable>

      {/* Statistiques */}
      <Repliable titre="Mes statistiques" icone="📈" resume={`${formatDuree(minutesTotal)} de révision${taux === null ? '' : ` · ${taux} % de réussite`}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <Pastille valeur={formatDuree(minutesTotal)} label="de révision" />
          <Pastille valeur={String(p.stats.meilleureSerie)} label="meilleure série (jours)" />
          <Pastille valeur={String(p.tentatives.filter((t) => t.type === 'flashcard').length)} label="flashcards révisées" />
          <Pastille valeur={taux === null ? '—' : `${taux} %`} label="de réussite (QCM, exercices)" />
        </div>
        <h3 className="font-semibold mb-2">Séances par semaine</h3>
        <GraphiqueSeances p={p} />
        <h3 className="font-semibold mt-6 mb-3">Réussite par notion</h3>
        <MaitriseNotions />
      </Repliable>

      {/* Badges */}
      <Repliable titre="Mes badges" icone="🏅" resume={`${Object.keys(p.badges).length} sur ${BADGES.length} obtenus`}>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BADGES.map((b) => {
            const obtenu = !!p.badges[b.id]
            return (
              <li key={b.id} className={`rounded-2xl p-3 border ${obtenu ? 'border-gold bg-gold-bg' : 'border-line bg-surface-2'}`}>
                <span aria-hidden className={`text-2xl ${obtenu ? '' : 'grayscale opacity-40'}`}>
                  {b.icone}
                </span>
                <p className="font-semibold text-sm mt-1">
                  {b.nom}
                  <span className="sr-only">{obtenu ? ' (obtenu)' : ' (pas encore obtenu)'}</span>
                </p>
                <p className="text-xs text-muted">{b.description}</p>
                {obtenu && (
                  <p className="text-xs font-bold text-gold-ink mt-1 flex items-center gap-1">
                    <Icone nom="ok" taille={12} /> Obtenu
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </Repliable>

      <Link to="/classement" className="carte p-4 mb-4 flex items-center gap-3 hover:border-blue-500">
        <Icone nom="classement" className="text-blue-700" />
        <span className="flex-1">
          <span className="block font-semibold">Classement de la classe</span>
          <span className="block text-sm text-muted">Facultatif : XP de la semaine, remis à zéro chaque lundi.</span>
        </span>
        <Icone nom="suivant" className="text-muted" />
      </Link>

      {/* Zone sensible */}
      <Repliable titre="Recommencer à zéro" icone="♻️" resume="Effacer ta progression">
        <p className="text-sm text-muted">Efface tes XP, ta série, tes étoiles, tes badges et ta répétition espacée. Ton prénom et tes réglages sont gardés.</p>
        {!confirmer ? (
          <button type="button" className="btn btn-contour mt-3 !border-error text-error-ink" onClick={() => setConfirmer(true)}>
            Réinitialiser ma progression
          </button>
        ) : (
          <div role="alertdialog" aria-labelledby="t-confirm" className="mt-3 rounded-2xl bg-error-bg border border-error p-4">
            <p id="t-confirm" className="font-semibold">Sûr·e ? Cette action est définitive.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                className="btn btn-contour !border-error text-error-ink"
                onClick={() => {
                  reinitialiser()
                  setConfirmer(false)
                }}
              >
                Oui, tout effacer
              </button>
              <button type="button" className="btn btn-bleu" onClick={() => setConfirmer(false)} autoFocus>
                Non, garder ma progression
              </button>
            </div>
          </div>
        )}
      </Repliable>
    </Page>
  )
}

function Pastille({ valeur, label }: { valeur: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <p className="font-titre font-bold text-xl text-ink">{valeur}</p>
      <p className="text-xs text-muted leading-tight">{label}</p>
    </div>
  )
}
