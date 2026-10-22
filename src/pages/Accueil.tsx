import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import MonCompagnon from '../components/MonCompagnon'
import Onboarding from '../components/Onboarding'
import Chemin from '../components/Chemin'
import Icone from '../components/Icone'
import { erreursARevoir, jourSession, seancesDeLaSemaine } from '../lib/gamification'
import { ETAPES, etapeDuJour, totalEtoiles } from '../lib/chemin'
import { infoChapitre } from '../lib/chapitres'
import { flashcards } from '../lib/contenu'
import { nombreDuJour } from '../lib/leitner'
import { ecartJours, formatJour, jour } from '../lib/dates'
import { useProgression } from '../state/progression'

/**
 * L'accueil, épuré comme Pépin : deux tuiles (QCM, semaine), la carte « Aujourd'hui » avec 3 choses à faire,
 * puis le chemin. Pas de minuteur ici.
 */
export default function Accueil() {
  const { p } = useProgression()

  useEffect(() => {
    document.title = "Accueil · Mark'Up"
  }, [])

  if (!p.onboardingFait) {
    return (
      <div className="max-w-xl mx-auto">
        <Onboarding />
      </div>
    )
  }

  const aujourdhui = jour()
  const seances = seancesDeLaSemaine(p)
  const objectif = p.profil.objectifHebdo
  const pctSemaine = Math.min(100, Math.round((seances / objectif) * 100))
  const erreurs = erreursARevoir(p.tentatives).length
  const cartesDuJour = nombreDuJour(flashcards, p.cartes)
  const joursAvantQcm = p.profil.dateQcm ? ecartJours(aujourdhui, p.profil.dateQcm) : null
  const etape = etapeDuJour(p)
  const chapitre = infoChapitre(etape.chapitre)

  // Ce qui a déjà été fait aujourd'hui (pour cocher les tâches).
  const etapeFaite = p.sessions.some((s) => s.type === 'daily' && jourSession(s) === aujourdhui)
  const revisionFaite = p.tentatives.filter((t) => jour(new Date(t.le)) === aujourdhui && t.type !== 'flashcard').length >= 5
  const jeuFait = p.sessions.some((s) => s.type === 'libre' && jourSession(s) === aujourdhui)
  const faites = [etapeFaite, revisionFaite, jeuFait].filter(Boolean).length

  return (
    <div className="apparition flex flex-col gap-4">
      {/* Deux tuiles : le QCM et la semaine */}
      <div className="grid grid-cols-2 gap-3">
        {joursAvantQcm !== null && joursAvantQcm >= 0 ? (
          <Link to="/profil" className="rounded-[18px] p-4 flex items-center gap-3 no-underline text-white" style={{ background: 'var(--blue-500)', boxShadow: '0 4px 0 var(--blue-700)' }}>
            <span className="text-4xl font-black leading-none tabular-nums">{joursAvantQcm}</span>
            <span className="leading-tight">
              <span className="block font-extrabold">jour{joursAvantQcm > 1 ? 's' : ''} avant ton QCM</span>
              <span className="block text-xs opacity-90">{formatJour(p.profil.dateQcm!)}</span>
            </span>
          </Link>
        ) : (
          <Link to="/profil" className="rounded-[18px] p-4 flex items-center gap-3 no-underline text-white" style={{ background: 'var(--blue-500)', boxShadow: '0 4px 0 var(--blue-700)' }}>
            <Icone nom="calendrier" taille={28} />
            <span className="leading-tight font-extrabold">Ajoute la date de ton QCM</span>
          </Link>
        )}
        <div className="carte p-4 flex items-center gap-3" aria-label={`Objectif de la semaine : ${Math.min(seances, objectif)} séances sur ${objectif}`}>
          <Anneau pct={pctSemaine} />
          <span className="leading-tight">
            <span className="block font-extrabold">Ta semaine</span>
            <span className="block text-xs text-muted">
              {Math.min(seances, objectif)} / {objectif} séances
            </span>
          </span>
        </div>
      </div>

      {/* Aujourd'hui */}
      <section aria-labelledby="t-auj" className="carte !border-blue-500/40 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
              Chapitre {chapitre.numero} · {chapitre.titre}
            </p>
            <h1 id="t-auj" className="text-2xl mt-0.5">
              Aujourd’hui
            </h1>
            <p className="text-muted text-sm">
              {faites} / 3 tâches · {totalEtoiles(p)} étoiles sur {ETAPES.length * 3}
            </p>
          </div>
          {p.boutique.compagnon && (
            <div className="shrink-0 -mt-1">
              <MonCompagnon taille={72} anime humeur={faites === 3 ? 'fete' : 'coucou'} />
            </div>
          )}
        </div>
        <ul className="flex flex-col gap-2.5 mt-4">
          <Tache
            to={`/chemin/${etape.id}`}
            fait={etapeFaite}
            emoji="🌱"
            titre="Une étape du chemin"
            texte={`${etape.titre} · 3 min`}
          />
          {erreurs > 0 ? (
            <Tache to="/reviser#erreurs" fait={revisionFaite} emoji="🔁" titre="Mes erreurs à revoir" texte={`${erreurs} à rattraper · 5 min`} />
          ) : (
            <Tache
              to="/reviser/flashcards"
              fait={revisionFaite}
              emoji="🔁"
              titre="Révisions"
              texte={cartesDuJour ? `${cartesDuJour} flashcards à revoir (répétition espacée) · 5 min` : 'Flashcards et QCM · 5 min'}
            />
          )}
          <Tache to="/jeux" fait={jeuFait} emoji="🎮" titre="Un jeu de révision" texte="Le Pari, le Boss ou Explique-moi · 5 min" />
        </ul>
      </section>

      <Chemin />
    </div>
  )
}

/** Une tâche du jour : un rond à cocher et une carte cliquable. */
function Tache({ to, fait, emoji, titre, texte }: { to: string; fait: boolean; emoji: string; titre: string; texte: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center ${fait ? 'bg-success border-success text-white' : 'border-line'}`}
        aria-hidden
      >
        {fait && <Icone nom="ok" taille={16} />}
      </span>
      <Link to={to} className="carte flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 hover:!border-blue-500/50 no-underline">
        <span className="text-2xl shrink-0" aria-hidden>
          {emoji}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-extrabold text-ink">
            {titre}
            {fait && <span className="sr-only"> (fait aujourd’hui)</span>}
          </span>
          <span className="block text-xs text-muted truncate">{texte}</span>
        </span>
        <Icone nom="suivant" className="text-muted shrink-0" taille={18} />
      </Link>
    </li>
  )
}

/** Un petit anneau de progression (en %). */
function Anneau({ pct }: { pct: number }) {
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0" aria-hidden="true">
      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="var(--success)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ink)">
        {pct}%
      </text>
    </svg>
  )
}
