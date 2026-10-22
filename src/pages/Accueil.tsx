import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import MonCompagnon from '../components/MonCompagnon'
import { Barre } from '../components/ui'
import Onboarding from '../components/Onboarding'
import Chemin, { Etoile } from '../components/Chemin'
import Icone from '../components/Icone'
import { erreursARevoir, joursDeLaSemaine, niveauPour, seancesDeLaSemaine, serieAffichee } from '../lib/gamification'
import { ETAPES, etapeDuJour, totalEtoiles } from '../lib/chemin'
import { ecartJours, formatJour, jour } from '../lib/dates'
import { useProgression } from '../state/progression'
import { marksDisponibles } from '../lib/boutique'

/**
 * L'accueil = le mode « daily », en tableau de bord : la carte du jour, tes stats, ta semaine, et le chemin.
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
  const niveau = niveauPour(p.stats.xpTotal)
  const etoiles = totalEtoiles(p)
  const etoilesMax = ETAPES.length * 3

  return (
    <div className="apparition grid grid-cols-[minmax(0,1fr)] gap-5 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <Titre texte={prenom ? `Salut ${prenom}` : 'Accueil'} />

      {/* La carte d'accueil : bonjour, l'étape du jour, le bouton */}
      <section
        aria-labelledby="t-bonjour"
        className="bordure-vivante projecteur relative overflow-hidden rounded-[2rem] p-5 md:p-8 shadow-carte"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
          e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
        }}
      >
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <p className="surtitre capitalize">{formatJour(jour())}</p>
            <h1 id="t-bonjour" className="text-4xl md:text-6xl xl:text-7xl mt-1 leading-[0.95]">
              Salut{' '}
              <span className="whitespace-nowrap">
                {prenom && <span className="texte-degrade">{prenom}</span>}{' '}
                <span aria-hidden className="inline-block text-[0.8em] animate-[coucou-main_2.4s_ease-in-out_infinite] origin-[70%_80%]">
                  👋
                </span>
              </span>
            </h1>
            <p className="text-muted mt-2 max-w-md">
              Ta séance du jour : <strong className="text-ink">{etape.titre}</strong>, environ 3 minutes.
            </p>
          </div>
          {p.boutique.compagnon ? (
            <div className="halo flotte-doux shrink-0 -my-4 hidden min-[380px]:block">
              <span className="md:hidden">
                <MonCompagnon taille={104} anime humeur="coucou" />
              </span>
              <span className="hidden md:block">
                <MonCompagnon taille={170} anime humeur="coucou" />
              </span>
            </div>
          ) : (
            <Link to="/boutique" className="shrink-0 hidden min-[380px]:flex flex-col items-center gap-1 rounded-2xl border border-dashed border-accent-600 px-3 py-3 text-sm font-bold text-accent-700 hover:bg-surface">
              <span className="text-3xl" aria-hidden>🐾</span>
              Adopte ton
              <br />
              compagnon
            </Link>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-5">
          <Link to={`/chemin/${etape.id}`} className="btn btn-accent !min-h-13 text-base sm:flex-1">
            <Icone nom="lecture" /> Commencer ma séance
          </Link>
          <Link to="/reviser" className="btn btn-contour !min-h-13">
            <Icone nom="eclair" /> Mode Tryhard
          </Link>
        </div>
      </section>

      <BandeauDefile />

      {/* La colonne de droite (en dessous sur téléphone) : tes stats, ton niveau, ta semaine */}
      <aside aria-label="Tes statistiques" className="min-w-0 flex flex-col gap-4 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-8">
        <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 lg:gap-3">
          <Stat to="/profil" valeur={serie.serie} libelle={`jour${serie.serie > 1 ? 's' : ''} de série`} icone={<Icone nom="flamme" taille={18} />} couleur="text-accent-700" />
          <Stat id="compteur-etoiles" valeur={etoiles} libelle={`étoiles sur ${etoilesMax}`} icone={<Etoile pleine taille={18} />} couleur="text-gold-ink" />
          <Stat to="/profil" valeur={p.stats.xpTotal} libelle="XP" icone={<Icone nom="eclair" taille={18} plein />} couleur="text-gold-ink" />
          <Stat to="/boutique" valeur={marksDisponibles(p)} libelle="Marks" icone={<span aria-hidden>🪙</span>} couleur="text-gold-ink" />
        </div>

        <Link to="/profil" className="carte p-4 hidden lg:block hover:border-blue-500 no-underline">
          <p className="surtitre">Niveau {niveau.numero}</p>
          <p className="font-bold text-ink leading-tight mt-0.5">{niveau.nom}</p>
          <div className="mt-3">
            <Barre valeur={niveau.progression * 100} label="Progression vers le niveau suivant" couleur="or" />
          </div>
          <p className="text-xs text-muted mt-2">{niveau.suivant ? `Encore ${niveau.resteXp} XP avant « ${niveau.suivant.nom} »` : 'Niveau maximum atteint !'}</p>
        </Link>

        <section className="carte p-4" aria-labelledby="t-semaine">
          <div className="flex justify-between items-baseline">
            <h2 id="t-semaine" className="font-bold text-base">
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
                  className={`w-9 h-9 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${
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

        {/* Raccourcis */}
        <nav aria-label="Raccourcis" className="flex lg:flex-col gap-2 overflow-x-auto sans-barre -mx-4 px-4 lg:mx-0 lg:px-0">
          {joursAvantQcm !== null && joursAvantQcm >= 0 ? (
            <Bulle to="/profil" icone="calendrier">
              QCM dans <strong>{joursAvantQcm} jour{joursAvantQcm > 1 ? 's' : ''}</strong>
            </Bulle>
          ) : (
            <Bulle to="/profil" icone="calendrier">
              Ajoute la date de ton QCM
            </Bulle>
          )}
          {erreurs > 0 && (
            <Bulle to="/reviser#erreurs" icone="recommencer">
              <strong>{erreurs}</strong> erreur{erreurs > 1 ? 's' : ''} à rattraper
            </Bulle>
          )}
          <Bulle to="/jeux" icone="manette">
            🎮 <strong>Jeux</strong> : Pari, Boss, Explique-moi
          </Bulle>
          <Bulle to="/astuces" icone="astuces">
            Quel·le réviseur·se es-tu ?
          </Bulle>
        </nav>
      </aside>

      <div className="lg:col-start-1">
        <Chemin />
      </div>
    </div>
  )
}

/** Le bandeau qui défile, façon affiche de festival. */
function BandeauDefile() {
  const mots = ['Le concept de marché', '3 minutes par jour', 'Objectif QCM', 'Mark’Up', 'Offre & demande', 'Tu gères']
  const ligne = (
    <div className="flex shrink-0 items-center">
      {mots.map((m) => (
        <span key={m} className="flex items-center gap-5 px-5 py-2.5 font-[family-name:var(--font-affiche)] font-extrabold uppercase tracking-tight text-lg md:text-xl whitespace-nowrap">
          {m} <span className="text-accent-500" aria-hidden>✦</span>
        </span>
      ))}
    </div>
  )
  return (
    <div className="bandeau-defile -mx-4 md:mx-0 md:rounded-2xl lg:col-start-1" aria-hidden>
      <div className="piste">
        {ligne}
        {ligne}
      </div>
    </div>
  )
}

/** Fait défiler un nombre de 0 jusqu'à sa valeur (une seule fois, à l'arrivée sur la page). */
function useCompteur(cible: number) {
  const [valeur, setValeur] = useState(() => (sansAnimation() ? cible : 0))
  const depart = useRef<number | null>(null)
  useEffect(() => {
    if (sansAnimation()) {
      setValeur(cible)
      return
    }
    let frame = 0
    const debut = performance.now()
    const de = depart.current ?? 0
    const pas = (t: number) => {
      const k = Math.min(1, (t - debut) / 900)
      const doux = 1 - Math.pow(1 - k, 3)
      setValeur(Math.round(de + (cible - de) * doux))
      if (k < 1) frame = requestAnimationFrame(pas)
      else depart.current = cible
    }
    frame = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(frame)
  }, [cible])
  return valeur
}

const sansAnimation = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Met le titre de l'onglet du navigateur. */
function Titre({ texte }: { texte: string }) {
  useEffect(() => {
    document.title = `${texte} · Mark'Up`
  }, [texte])
  return null
}

/** Une tuile de statistique (lien ou simple affichage). */
function Stat({ to, id, valeur, libelle, icone, couleur }: { to?: string; id?: string; valeur: number; libelle: string; icone: ReactNode; couleur: string }) {
  const affiche = useCompteur(valeur)
  const contenu = (
    <>
      <span className={`flex items-center gap-1 font-extrabold text-lg lg:text-3xl leading-none tabular-nums font-[family-name:var(--font-affiche)] ${couleur}`}>
        {icone} {affiche}
      </span>
      <span className="text-[0.7rem] lg:text-xs text-muted font-semibold leading-tight mt-1 text-center lg:text-left">{libelle}</span>
    </>
  )
  const classe = 'carte tuile-vivante !rounded-2xl flex flex-col items-center lg:items-start px-2 py-2.5 lg:p-4 no-underline'
  return to ? (
    <Link to={to} id={id} className={`${classe} hover:border-blue-500`} aria-label={`${valeur} ${libelle}`}>
      {contenu}
    </Link>
  ) : (
    <div id={id} className={classe} aria-label={`${valeur} ${libelle}`}>
      {contenu}
    </div>
  )
}

function Bulle({ to, icone, children }: { to: string; icone: 'calendrier' | 'recommencer' | 'astuces' | 'manette'; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="shrink-0 inline-flex items-center gap-2 rounded-full lg:rounded-xl bg-surface border border-line px-3 min-h-10 lg:min-h-11 text-sm whitespace-nowrap hover:border-blue-500"
    >
      <Icone nom={icone} taille={16} className="text-blue-700" />
      <span>{children}</span>
    </Link>
  )
}
