import type { ReactNode } from 'react'
import { Link } from 'react-router'
import Page from '../components/Page'
import Onboarding from '../components/Onboarding'
import Chemin, { Etoile } from '../components/Chemin'
import Icone from '../components/Icone'
import { erreursARevoir, joursDeLaSemaine, seancesDeLaSemaine, serieAffichee } from '../lib/gamification'
import { etapeDuJour, totalEtoiles } from '../lib/chemin'
import { ecartJours, jour } from '../lib/dates'
import { useProgression } from '../state/progression'
import { marksDisponibles } from '../lib/boutique'

/**
 * L'accueil = le mode « daily » : tes pastilles, ta semaine, un bouton, et le chemin.
 * Pas de minuteur ici.
 */
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
  const serie = serieAffichee(p.stats)
  const semaine = joursDeLaSemaine(p)
  const seances = seancesDeLaSemaine(p)
  const objectif = p.profil.objectifHebdo
  const erreurs = erreursARevoir(p.tentatives).length
  const joursAvantQcm = p.profil.dateQcm ? ecartJours(jour(), p.profil.dateQcm) : null
  const etape = etapeDuJour(p)

  return (
    <Page
      titre={prenom ? `Salut ${prenom} 👋` : 'Salut 👋'}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            to="/profil"
            className="inline-flex items-center gap-1 rounded-full bg-surface border border-line px-3 min-h-10 font-extrabold text-accent-700"
            aria-label={`Série : ${serie.serie} jour${serie.serie > 1 ? 's' : ''}`}
          >
            <Icone nom="flamme" taille={18} /> {serie.serie}
          </Link>
          <span
            id="compteur-etoiles"
            className="inline-flex items-center gap-1 rounded-full bg-surface border border-line px-3 min-h-10 font-extrabold text-gold-ink"
            aria-label={`${totalEtoiles(p)} étoiles gagnées sur le chemin`}
          >
            <Etoile pleine taille={18} /> {totalEtoiles(p)}
          </span>
          <Link
            to="/profil"
            className="inline-flex items-center gap-1 rounded-full bg-surface border border-line px-3 min-h-10 font-extrabold text-gold-ink"
            aria-label={`${p.stats.xpTotal} XP`}
          >
            <Icone nom="eclair" taille={18} plein /> {p.stats.xpTotal}
          </Link>
          <Link
            to="/boutique"
            className="inline-flex items-center gap-1 rounded-full bg-surface border border-line px-3 min-h-10 font-extrabold text-gold-ink"
            aria-label={`${marksDisponibles(p)} Marks : ouvrir la boutique`}
          >
            🪙 {marksDisponibles(p)}
          </Link>
        </div>
      }
    >
      {/* Petites bulles d'info, discrètes */}
      <div className="flex gap-2 overflow-x-auto sans-barre -mx-4 px-4 mb-4">
        {joursAvantQcm !== null && joursAvantQcm >= 0 ? (
          <Bulle to="/profil" icone="calendrier">
            QCM dans <strong>{joursAvantQcm} jour{joursAvantQcm > 1 ? 's' : ''}</strong>
          </Bulle>
        ) : (
          <Bulle to="/profil" icone="calendrier">
            Ajoute la date de ton QCM
          </Bulle>
        )}
        {!p.boutique.compagnon && (
          <Bulle to="/boutique" icone="astuces">
            🐾 <strong>Adopte ton compagnon</strong>
          </Bulle>
        )}
        {erreurs > 0 && (
          <Bulle to="/reviser#erreurs" icone="recommencer">
            <strong>{erreurs}</strong> erreur{erreurs > 1 ? 's' : ''} à rattraper
          </Bulle>
        )}
        <Bulle to="/astuces" icone="astuces">
          Quel·le réviseur·se es-tu ?
        </Bulle>
      </div>

      {/* Ta semaine */}
      <section className="carte p-4 mb-4" aria-labelledby="t-semaine">
        <div className="flex justify-between items-baseline">
          <h2 id="t-semaine" className="font-bold">
            Ta semaine
          </h2>
          <span className="text-sm text-muted font-semibold">
            {Math.min(seances, objectif)} / {objectif} séances {seances >= objectif ? '🎯' : ''}
          </span>
        </div>
        <ol className="flex justify-between mt-3">
          {semaine.map((j) => (
            <li key={j.jour} className="flex flex-col items-center gap-1 text-xs font-bold text-muted">
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  j.fait ? 'bg-accent-500 text-[#1e2a3a]' : j.aujourdhui ? 'border-2 border-dashed border-accent-600' : 'border-2 border-line'
                }`}
              >
                {j.fait && <Icone nom="ok" taille={16} />}
                <span className="sr-only">
                  {j.lettre} {j.fait ? ': séance faite' : j.aujourdhui ? ": aujourd'hui" : ''}
                </span>
              </span>
              <span aria-hidden className={j.aujourdhui ? 'text-ink' : ''}>
                {j.lettre}
              </span>
            </li>
          ))}
        </ol>
        {serie.enDanger && <p className="text-sm text-center mt-3 text-accent-700 font-semibold">Une petite étape aujourd'hui et ta série continue 🔥</p>}
      </section>

      {/* Le bouton : lance l'étape du jour */}
      <Link to={`/chemin/${etape.id}`} className="btn btn-accent w-full !min-h-14 text-lg">
        <Icone nom="lecture" /> Commencer ma séance
      </Link>
      <p className="text-center text-sm text-muted mt-2">
        {etape.titre} · environ 3 min ·{' '}
        <Link to="/reviser" className="lien">
          envie de plus ? Mode Tryhard
        </Link>
      </p>

      <div className="mt-6">
        <Chemin />
      </div>
    </Page>
  )
}

function Bulle({ to, icone, children }: { to: string; icone: 'calendrier' | 'recommencer' | 'astuces'; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="shrink-0 inline-flex items-center gap-2 rounded-full bg-surface border border-line px-3 min-h-10 text-sm whitespace-nowrap hover:border-blue-500"
    >
      <Icone nom={icone} taille={16} className="text-blue-700" />
      <span>{children}</span>
    </Link>
  )
}
