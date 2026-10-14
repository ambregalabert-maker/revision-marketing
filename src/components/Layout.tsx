import { NavLink, Outlet, useLocation } from 'react-router'
import { Suspense, useEffect, useRef } from 'react'
import Icone, { type NomIcone } from './Icone'
import { useTheme } from '../state/theme'
import PomodoroWidget from './PomodoroWidget'

// Structure commune à toutes les pages :
// - téléphone : barre du haut + barre de navigation en bas ;
// - ordinateur : barre latérale à gauche.

const liens: { to: string; label: string; icone: NomIcone; mobile: boolean }[] = [
  { to: '/', label: 'Accueil', icone: 'accueil', mobile: true },
  { to: '/reviser', label: 'Réviser', icone: 'reviser', mobile: true },
  { to: '/astuces', label: 'Astuces', icone: 'astuces', mobile: true },
  { to: '/profil', label: 'Profil', icone: 'profil', mobile: true },
  { to: '/classement', label: 'Classement', icone: 'classement', mobile: false },
]

function BoutonTheme() {
  const { choix, suivant } = useTheme()
  const libelle = { systeme: 'Thème : auto', clair: 'Thème : clair', sombre: 'Thème : sombre' }[choix]
  const icone: NomIcone = choix === 'clair' ? 'soleil' : choix === 'sombre' ? 'lune' : 'ecran'
  return (
    <button
      type="button"
      onClick={suivant}
      className="btn btn-discret !px-3"
      aria-label={`${libelle}. Changer de thème`}
      title={libelle}
    >
      <Icone nom={icone} />
      <span className="hidden lg:inline text-sm">{libelle}</span>
    </button>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const principal = useRef<HTMLElement>(null)

  // À chaque changement de page : on remonte en haut et on place le focus sur le contenu
  // (utile pour les lecteurs d'écran et la navigation au clavier).
  useEffect(() => {
    window.scrollTo(0, 0)
    principal.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-orange"
      >
        Aller au contenu
      </a>

      {/* Barre latérale (ordinateur) */}
      <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 shrink-0 border-r border-line bg-surface sticky top-0 h-dvh p-4 gap-2">
        <Logo />
        <nav aria-label="Navigation principale" className="flex flex-col gap-1 mt-4">
          {liens.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 min-h-11 px-3 rounded-xl font-semibold transition-colors ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'text-ink hover:bg-surface-2'
                }`
              }
            >
              <Icone nom={l.icone} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <PomodoroWidget variante="lateral" />
          <BoutonTheme />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barre du haut (téléphone) */}
        <header className="md:hidden sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line">
          <div className="flex items-center justify-between gap-2 px-4 h-14">
            <Logo compact />
            <div className="flex items-center gap-1">
              <PomodoroWidget variante="compact" />
              <BoutonTheme />
            </div>
          </div>
        </header>

        <main
          id="contenu"
          ref={principal}
          tabIndex={-1}
          className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-8 pt-5 md:pt-10 pb-28 md:pb-12 outline-none"
        >
          <Suspense fallback={<p className="text-muted" role="status">Chargement…</p>}>
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
                    `flex flex-col items-center justify-center gap-0.5 h-16 text-xs font-bold ${
                      isActive ? 'text-blue-700' : 'text-muted'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex items-center justify-center w-12 h-7 rounded-full ${
                          isActive ? 'bg-blue-100' : ''
                        }`}
                      >
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

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink to="/" className="flex items-center gap-2 font-titre font-bold text-ink no-underline">
      <span
        aria-hidden
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-700 text-surface font-titre text-lg"
      >
        M
      </span>
      <span className={compact ? 'text-base' : 'text-lg leading-tight'}>
        Révision Marketing
        {!compact && <span className="block text-sm font-normal text-muted font-texte">Chapitre 1 · Le concept de marché</span>}
      </span>
    </NavLink>
  )
}
