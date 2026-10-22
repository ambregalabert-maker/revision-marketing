import { NavLink, Outlet, useLocation } from 'react-router'
import { Suspense, useEffect, useRef, useState } from 'react'
import Icone, { type NomIcone } from './Icone'
import { useTheme } from '../state/theme'
import { useProgression } from '../state/progression'
import { marksDisponibles } from '../lib/boutique'
import { Etoile } from './Chemin'
import { niveauPour, serieAffichee } from '../lib/gamification'
import { totalEtoiles } from '../lib/chemin'

// Structure commune à toutes les pages :
// - téléphone : barre du haut + barre de navigation en bas ;
// - ordinateur : barre latérale à gauche, qu'on peut masquer pour passer en plein écran.

const CLE_BARRE = 'markup-barre-masquee'

const liens: { to: string; label: string; icone: NomIcone; mobile: boolean; couleur?: string }[] = [
  { couleur: '#6c4cf5', to: '/', label: 'Accueil', icone: 'accueil', mobile: true },
  { couleur: '#ff8a1f', to: '/reviser', label: 'Tryhard', icone: 'eclair', mobile: true },
  { couleur: '#2fbf71', to: '/jeux', label: 'Jeux', icone: 'manette', mobile: false },
  { couleur: '#e8a400', to: '/astuces', label: 'Astuces', icone: 'astuces', mobile: true },
  { couleur: '#6c4cf5', to: '/profil', label: 'Profil', icone: 'profil', mobile: true },
  {
    couleur: '#f0506e',
    to: '/classement',
    label: 'Classement',
    icone: 'classement',
    mobile: false,
  },
  { couleur: '#33b5a5', to: '/boutique', label: 'Boutique', icone: 'badge', mobile: false },
]

function BoutonTheme() {
  const { choix, suivant } = useTheme()
  const libelle = {
    systeme: 'Thème : auto',
    clair: 'Thème : clair',
    sombre: 'Thème : sombre',
  }[choix]
  const icone: NomIcone = choix === 'clair' ? 'soleil' : choix === 'sombre' ? 'lune' : 'ecran'
  return (
    <button type="button" onClick={suivant} className="btn btn-discret !px-3" aria-label={`${libelle}. Changer de thème`} title={libelle}>
      <Icone nom={icone} />
      <span className="hidden lg:inline text-sm">{libelle}</span>
    </button>
  )
}

export default function Layout() {
  const { pathname, hash } = useLocation()
  const principal = useRef<HTMLElement>(null)
  const [masquee, setMasquee] = useState(() => {
    try {
      return localStorage.getItem(CLE_BARRE) === '1'
    } catch {
      return false
    }
  })
  const basculer = (v: boolean) => {
    setMasquee(v)
    try {
      localStorage.setItem(CLE_BARRE, v ? '1' : '0')
    } catch {
      /* préférence non mémorisée */
    }
  }

  // À chaque changement de page : on remonte en haut et on place le focus sur le contenu
  // (utile pour les lecteurs d'écran et la navigation au clavier).
  // Avec une ancre (ex. /reviser#erreurs), on descend jusqu'à la section visée.
  useEffect(() => {
    window.scrollTo(0, 0)
    principal.current?.focus({ preventScroll: true })
    if (!hash) return
    let essais = 0
    const t = window.setInterval(() => {
      const cible = document.getElementById(hash.slice(1))
      if (cible || ++essais > 20) window.clearInterval(t)
      cible?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => window.clearInterval(t)
  }, [pathname, hash])

  return (
    <div className="min-h-dvh md:flex">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-contour">
        Aller au contenu
      </a>

      {/* Barre latérale (ordinateur) */}
      {masquee ? (
        <button
          type="button"
          onClick={() => basculer(false)}
          className="hidden md:flex fixed top-4 left-4 z-40 items-center justify-center w-11 h-11 rounded-xl bg-surface border border-line shadow-carte text-muted hover:text-ink"
          aria-label="Afficher le menu"
          title="Afficher le menu"
        >
          <Icone nom="panneau" />
        </button>
      ) : (
        <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 shrink-0 border-r-2 border-line bg-surface sticky top-0 h-dvh p-4 gap-2">
          <div className="flex items-start justify-between gap-2">
            <Logo />
            <button
              type="button"
              onClick={() => basculer(true)}
              className="flex items-center justify-center w-10 h-10 -mr-1 rounded-xl text-muted hover:text-ink hover:bg-surface-2"
              aria-label="Masquer le menu (plein écran)"
              title="Masquer le menu"
            >
              <Icone nom="panneau" />
            </button>
          </div>
          <nav aria-label="Navigation principale" className="flex flex-col gap-1 mt-6">
            {liens.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 min-h-12 px-3 rounded-2xl border-2 text-sm font-extrabold uppercase tracking-wider transition-colors ${
                    isActive ? 'bg-blue-100 border-blue-500/40 text-blue-700' : 'border-transparent text-muted hover:bg-surface-2'
                  }`
                }
              >
                <span style={{ color: l.couleur }} className="flex">
                  <Icone nom={l.icone} />
                </span>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            <BoutonTheme />
          </div>
        </aside>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barre du haut (téléphone) */}
        {/* Barre du haut : tes compteurs (série, étoiles, XP, Marks), comme sur Pépin */}
        <header className="sticky top-0 z-30 bg-bg/70 backdrop-blur-md border-b-2 border-line">
          <div className="flex items-center justify-between gap-2 px-4 md:px-8 h-14 md:h-16">
            <BarreStats />
          </div>
        </header>

        <main
          id="contenu"
          ref={principal}
          tabIndex={-1}
          className="flex-1 w-full max-w-3xl mx-auto overflow-x-clip px-4 md:px-8 pt-5 md:pt-8 pb-28 md:pb-12 outline-none"
        >
          <Suspense
            fallback={
              <p className="text-muted" role="status">
                Chargement…
              </p>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Barre de navigation du bas (téléphone) */}
      <nav
        aria-label="Navigation principale"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t-2 border-line pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-4">
          {liens
            .filter((l) => l.mobile)
            .map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-0.5 h-16 m-1 rounded-2xl border-2 text-xs font-extrabold ${
                      isActive ? 'bg-blue-100 border-blue-500/40 text-blue-700' : 'border-transparent text-muted'
                    }`
                  }
                >
                  <span style={{ color: l.couleur }} className="flex">
                    <Icone nom={l.icone} />
                  </span>
                  {l.label}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
    </div>
  )
}

/** Les compteurs en haut de l'écran : série, étoiles du chemin, XP + niveau, Marks. */
function BarreStats() {
  const { p } = useProgression()
  if (!p.onboardingFait) return <span />
  const serie = serieAffichee(p.stats).serie
  const niveau = niveauPour(p.stats.xpTotal).numero
  const puce = 'inline-flex items-center gap-1 font-extrabold text-sm md:text-base rounded-xl px-1.5 py-1 hover:bg-surface-2 no-underline'
  return (
    <div className="flex items-center gap-1 md:gap-3 md:ml-auto">
      <NavLink to="/profil" className={`${puce} ${serie ? 'text-[#ff8a1f]' : 'text-muted'}`} aria-label={`Série : ${serie} jour${serie > 1 ? 's' : ''}`}>
        <Icone nom="flamme" taille={18} /> {serie}
      </NavLink>
      <span id="compteur-etoiles" className={`${puce} text-gold-ink`} aria-label={`${totalEtoiles(p)} étoiles gagnées sur le chemin`}>
        <Etoile pleine taille={18} /> {totalEtoiles(p)}
      </span>
      <NavLink to="/profil" className={`${puce} text-gold-ink`} aria-label={`${p.stats.xpTotal} XP, niveau ${niveau}`}>
        <Icone nom="eclair" taille={18} plein /> {p.stats.xpTotal}
        <span className="ml-0.5 rounded-md bg-blue-100 text-blue-700 text-[0.7rem] px-1.5 py-0.5">Niv. {niveau}</span>
      </NavLink>
      <NavLink to="/boutique" className={`${puce} text-gold-ink`} aria-label={`${marksDisponibles(p)} Marks : ouvrir la boutique`}>
        <span aria-hidden>🪙</span> {marksDisponibles(p)}
      </NavLink>
    </div>
  )
}

/** Logo Mark'Up : un « M » qui monte, avec une flèche dorée. */
export function LogoMarque({ taille = 36 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <rect x="1" y="3" width="38" height="36" rx="11" fill="var(--accent-600)" />
      <rect x="1" y="1" width="38" height="35" rx="11" fill="var(--accent-500)" />
      <path d="M10 27V13l7 8 7-8v14" fill="none" stroke="#1e2a3a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M29 22v-9m-3.5 3.5L29 13l3.5 3.5" fill="none" stroke="#1e2a3a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink to="/" className="flex items-center gap-2 font-titre font-bold text-ink no-underline" aria-label="Mark'Up, retour à l'accueil">
      <LogoMarque taille={compact ? 32 : 38} />
      <span className={compact ? 'text-lg' : 'text-xl leading-tight'}>
        Mark<span className="text-accent-700">'</span>Up
        {!compact && <span className="block text-xs font-medium tracking-normal text-muted font-texte whitespace-nowrap">Marketing · 4 chapitres</span>}
      </span>
    </NavLink>
  )
}
