import { NavLink, Outlet, useLocation } from 'react-router'
import { Suspense, useEffect, useRef, useState } from 'react'
import Icone, { type NomIcone } from './Icone'
import { useTheme } from '../state/theme'
import { useProgression } from '../state/progression'
import { marksDisponibles } from '../lib/boutique'
import MonCompagnon from './MonCompagnon'

// Structure commune à toutes les pages :
// - téléphone : barre du haut + barre de navigation en bas ;
// - ordinateur : barre latérale à gauche, qu'on peut masquer pour passer en plein écran.

const CLE_BARRE = 'markup-barre-masquee'

const liens: { to: string; label: string; icone: NomIcone; mobile: boolean }[] = [
  { to: '/', label: 'Accueil', icone: 'accueil', mobile: true },
  { to: '/reviser', label: 'Tryhard', icone: 'eclair', mobile: true },
  { to: '/astuces', label: 'Astuces', icone: 'astuces', mobile: true },
  { to: '/profil', label: 'Profil', icone: 'profil', mobile: true },
  {
    to: '/classement',
    label: 'Classement',
    icone: 'classement',
    mobile: false,
  },
  { to: '/boutique', label: 'Boutique', icone: 'badge', mobile: false },
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
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-accent">
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
        <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 shrink-0 border-r border-line bg-surface sticky top-0 h-dvh p-4 gap-2">
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
          <p className="surtitre px-3 mt-6 mb-1">Menu</p>
          <nav aria-label="Navigation principale" className="flex flex-col gap-0.5">
            {liens.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 min-h-11 px-3 rounded-xl text-[0.95rem] transition-colors ${
                    isActive ? 'bg-surface-2 text-ink font-bold' : 'text-muted font-semibold hover:bg-surface-2 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full bg-accent-600" aria-hidden />}
                    <Icone nom={l.icone} className={isActive ? 'text-blue-700' : ''} />
                    {l.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            <ProfilMini />
            <BoutonTheme />
          </div>
        </aside>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barre du haut (téléphone) */}
        <header className="md:hidden sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line">
          <div className="flex items-center justify-between gap-2 px-4 h-14">
            <Logo compact />
            <BoutonTheme />
          </div>
        </header>

        <main
          id="contenu"
          ref={principal}
          tabIndex={-1}
          className={`flex-1 w-full mx-auto px-4 md:px-8 pt-5 md:pt-10 pb-28 md:pb-12 outline-none ${masquee ? 'max-w-3xl lg:max-w-5xl md:pl-20' : 'max-w-3xl lg:max-w-4xl'}`}
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
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)]"
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
                    `flex flex-col items-center justify-center gap-0.5 h-16 text-xs font-bold ${isActive ? 'text-blue-700' : 'text-muted'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`flex items-center justify-center w-12 h-7 rounded-full ${isActive ? 'bg-blue-100' : ''}`}>
                        <Icone nom={l.icone} />
                      </span>
                      {l.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
    </div>
  )
}

/** En bas du menu : ton compagnon, ton prénom et tes XP. */
function ProfilMini() {
  const { p } = useProgression()
  if (!p.onboardingFait) return null
  return (
    <NavLink to="/profil" className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/60 p-2.5 pr-3 hover:border-blue-500 no-underline">
      {p.boutique.compagnon ? (
        <MonCompagnon taille={40} />
      ) : (
        <span className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center font-bold text-accent-700">{(p.profil.prenom || '?').slice(0, 1).toUpperCase()}</span>
      )}
      <span className="min-w-0 leading-tight">
        <span className="block font-bold text-ink truncate">{p.profil.prenom || 'Mon profil'}</span>
        <span className="block text-xs text-muted">
          {p.stats.xpTotal} XP · {marksDisponibles(p)} 🪙
        </span>
      </span>
    </NavLink>
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
        {!compact && <span className="block text-xs font-medium tracking-normal text-muted font-texte whitespace-nowrap">Marketing · Chapitre 1</span>}
      </span>
    </NavLink>
  )
}
