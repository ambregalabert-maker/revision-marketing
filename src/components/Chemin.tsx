import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ETAPES, etapeDuJour, etoileDisponible, prochaineEtoile, type Etape } from '../lib/chemin'
import { formatDans } from '../lib/dates'
import { decorDuMonde } from '../lib/mondes'
import { CHAPITRES, infoChapitre } from '../lib/chapitres'
import type { Chapitre } from '../lib/types'
import { useProgression } from '../state/progression'
import MonCompagnon, { useCompagnonEndormi } from './MonCompagnon'
import DecorMonde from './DecorMonde'

/** Une étoile dorée (pleine) ou grise (vide). */
export function Etoile({ pleine, taille = 16 }: { pleine: boolean; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9z"
        fill={pleine ? 'var(--gold)' : 'var(--line)'}
        stroke={pleine ? 'var(--gold-600)' : 'var(--line)'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const ICONES = {
  jouer: 'M8 5.5v13l10.5-6.5z',
  ok: 'M5 12.5l4.5 4.5L19 7.5',
  etoile: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  coffre: 'M4 10h16v10H4zM4 10l2-5h12l2 5M12 13v3',
  trophee: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3',
}

/** Après une étoile gagnée, Daily note l'étape ici : l'étoile s'envole vers le compteur. */
export const CLE_ETOILE_ENVOLEE = 'markup-etoile-envolee'
/** L'étape où le compagnon attendait la dernière fois (pour le faire sauter jusqu'à la suivante). */
const CLE_COMPAGNON = 'markup-compagnon-ici'

// Le chemin serpente : décalage horizontal de chaque rond (fraction de l'amplitude).
const VAGUE = [0, 0.7, 1, 0.5, -0.2, -0.85, -0.4, 0.3]

const sansAnimation = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function lireSession(cle: string, stockage: 'local' | 'session') {
  try {
    return (stockage === 'local' ? localStorage : sessionStorage).getItem(cle)
  } catch {
    return null
  }
}
function ecrireSession(cle: string, valeur: string | null, stockage: 'local' | 'session') {
  try {
    const s = stockage === 'local' ? localStorage : sessionStorage
    if (valeur === null) s.removeItem(cle)
    else s.setItem(cle, valeur)
  } catch {
    /* stockage indisponible : tant pis pour l'animation */
  }
}

/** Largeur disponible (pour dessiner le chemin à la bonne taille sur téléphone et sur ordinateur). */
function useLargeur() {
  const ref = useRef<HTMLDivElement>(null)
  const [largeur, setLargeur] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setLargeur(el.clientWidth)
    const obs = new ResizeObserver(() => setLargeur(el.clientWidth))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, largeur }
}

interface Point {
  etape: Etape
  x: number
  y: number
}

/** Calcule la position de chaque rond et des bandeaux de séance. */
function dessiner(largeur: number) {
  const grand = largeur >= 600
  const t = {
    grand,
    rond: grand ? 104 : 80,
    pas: grand ? 196 : 164,
    amplitude: grand ? Math.min(230, largeur * 0.26) : Math.min(100, largeur * 0.27),
    colonne: grand ? 220 : 140,
    compagnon: grand ? 150 : 108,
    marge: grand ? 24 : 16,
    bandeau: grand ? 76 : 64,
  }
  const centre = largeur / 2
  const points: Point[] = []
  // Un bandeau (et une couleur) par chapitre.
  const bandeaux: { numero: Chapitre; y: number }[] = [{ numero: 1, y: t.marge }]
  let y = t.marge + t.bandeau + (grand ? 120 : 104)
  ETAPES.forEach((etape, i) => {
    if (i > 0 && etape.chapitre !== ETAPES[i - 1].chapitre) {
      const haut = points[points.length - 1].y + t.rond / 2 + (grand ? 100 : 88)
      bandeaux.push({ numero: etape.chapitre, y: haut })
      y = haut + t.bandeau + (grand ? 120 : 104)
    }
    points.push({ etape, x: centre + VAGUE[i % VAGUE.length] * t.amplitude, y })
    y += t.pas
  })
  const hauteur = points[points.length - 1].y + t.rond / 2 + (grand ? 110 : 90)
  // La zone de couleur de chaque chapitre, d'un bandeau au suivant.
  const zones = bandeaux.map((b, k) => ({ numero: b.numero, haut: b.y - (k ? 40 : t.marge), bas: k + 1 < bandeaux.length ? bandeaux[k + 1].y - 40 : hauteur }))
  return { t, points, bandeaux, zones, hauteur }
}

/** La route qui relie les ronds : des courbes douces. */
function trace(points: Point[]) {
  if (points.length === 0) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const ym = (a.y + b.y) / 2
    d += ` C ${a.x} ${ym}, ${b.x} ${ym}, ${b.x} ${b.y}`
  }
  return d
}

/** Le chemin des 4 chapitres, façon Duolingo : toutes les étapes sont ouvertes, chaque chapitre a sa couleur. */
export default function Chemin() {
  const { p } = useProgression()
  const { ref, largeur } = useLargeur()
  const monde = p.profil.preferences.monde ?? 'arc'
  const ici = etapeDuJour(p).id
  const plan = useMemo(() => (largeur ? dessiner(largeur) : null), [largeur])
  const decor = useMemo(() => (plan ? decorDuMonde(monde, plan.hauteur) : []), [monde, plan])
  const indexIci = ETAPES.findIndex((e) => e.id === ici)

  // L'étoile gagnée s'envole jusqu'au compteur ⭐ de l'accueil.
  useEffect(() => {
    if (!plan) return
    const id = lireSession(CLE_ETOILE_ENVOLEE, 'session')
    if (!id) return
    const t = window.setTimeout(() => {
      ecrireSession(CLE_ETOILE_ENVOLEE, null, 'session')
      envolerEtoile(id)
    }, 350)
    return () => window.clearTimeout(t)
  }, [plan])

  return (
    <section aria-labelledby="t-chemin" className="pb-4">
      <h2 id="t-chemin" className="sr-only">
        Ton chemin
      </h2>
      <div ref={ref} data-monde={monde} className="monde relative -mx-4 md:mx-0 md:rounded-[2rem] overflow-hidden" style={{ height: plan?.hauteur ?? 600 }}>
        {plan && (
          <>
            {/* Chaque chapitre a sa couleur : un voile doux derrière le décor */}
            {plan.zones.map((z) => (
              <div
                key={z.numero}
                className={`chap-${z.numero} absolute inset-x-0 pointer-events-none`}
                style={{
                  top: z.haut,
                  height: z.bas - z.haut,
                  background:
                    'linear-gradient(180deg, transparent, color-mix(in srgb, var(--accent-500) 22%, transparent) 90px, color-mix(in srgb, var(--accent-500) 22%, transparent) calc(100% - 90px), transparent)',
                }}
                aria-hidden
              />
            ))}
            <DecorMonde elements={decor} echelle={plan.t.grand ? 1.4 : 1} />

            {/* La route en pointillés, colorée jusqu'à ta position */}
            <svg width={largeur} height={plan.hauteur} className="absolute inset-0" aria-hidden="true">
              <path d={trace(plan.points)} fill="none" stroke="var(--m-route)" strokeWidth={plan.t.grand ? 28 : 22} strokeLinecap="round" />
              <path d={trace(plan.points)} fill="none" stroke="var(--m-trait)" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
              {/* La partie déjà parcourue, dans la couleur de chaque chapitre */}
              {CHAPITRES.map((c) => {
                const debut = plan.points.findIndex((pt) => pt.etape.chapitre === c.numero)
                const fin = Math.min(indexIci, debut + plan.points.filter((pt) => pt.etape.chapitre === c.numero).length - 1)
                if (debut < 0 || fin < Math.max(debut, 1)) return null
                const morceau = plan.points.slice(Math.max(0, debut - 1), fin + 1)
                return (
                  <g key={c.numero} className={`chap-${c.numero}`}>
                    <path d={trace(morceau)} fill="none" stroke="var(--accent-400)" strokeWidth={plan.t.grand ? 28 : 22} strokeLinecap="round" />
                    <path d={trace(morceau)} fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" opacity=".85" />
                  </g>
                )
              })}
            </svg>

            {plan.bandeaux.map((b) => (
              <Bandeau key={b.numero} {...b} marge={plan.t.marge} hauteur={plan.t.bandeau} grand={plan.t.grand} />
            ))}

            {/* Les ronds, dans l'ordre du cours (liste ordonnée pour les lecteurs d'écran) */}
            <ol>
              {plan.points.map((pt) => (
                <Rond
                  key={pt.etape.id}
                  point={pt}
                  ici={pt.etape.id === ici}
                  taille={plan.t}
                  galaxie={monde === 'galaxie'}
                  // Avec un compagnon, c'est lui qui dit « C'est ici ! » ; sinon une bulle à côté du rond.
                  bulle={p.boutique.compagnon ? null : pt.x > largeur / 2 ? 'gauche' : 'droite'}
                />
              ))}
            </ol>

            {p.boutique.compagnon && <CompagnonDuChemin ici={ici} points={plan.points} t={plan.t} largeur={largeur} />}
          </>
        )}
      </div>
    </section>
  )
}

type Tailles = ReturnType<typeof dessiner>['t']

function Rond({ point, ici, taille, galaxie, bulle }: { point: Point; ici: boolean; taille: Tailles; galaxie: boolean; bulle: 'gauche' | 'droite' | null }) {
  const { p } = useProgression()
  const { etape, x, y } = point
  const etat = p.chemin[etape.id]
  const etoiles = etat?.etoiles ?? 0
  const dispo = etoiles > 0 && etoileDisponible(etat)
  const prochaine = prochaineEtoile(etat)
  const n = taille.rond

  // Couleurs selon l'avancement : à faire (blanc), commencé (accent), en or (3 étoiles).
  let fond = 'var(--m-carte)'
  let ombre = 'var(--m-ligne)'
  let trait = galaxie ? 'var(--accent-500)' : 'var(--accent-700)'
  let bord = `${taille.grand ? 5 : 4}px solid var(--accent-500)`
  if (ici) {
    fond = 'var(--accent-500)'
    ombre = 'var(--accent-600)'
    trait = '#1e2a3a'
    bord = 'none'
  } else if (etoiles >= 3) {
    fond = 'var(--gold)'
    ombre = 'var(--gold-600)'
    trait = '#1e2a3a'
    bord = 'none'
  } else if (etoiles > 0) {
    fond = 'var(--accent-400)'
    ombre = 'var(--accent-600)'
    trait = '#1e2a3a'
    bord = 'none'
  }
  const icone =
    etape.genre === 'bilan' ? ICONES.coffre : etape.genre === 'final' ? ICONES.trophee : etoiles >= 3 ? ICONES.etoile : etoiles > 0 && !ici ? ICONES.ok : ICONES.jouer

  const etatTexte =
    etoiles === 0
      ? 'pas encore commencée'
      : `${etoiles} étoile${etoiles > 1 ? 's' : ''} sur 3${etoiles < 3 && prochaine ? (dispo ? ', une étoile à gagner aujourd’hui' : `, prochaine étoile ${formatDans(prochaine)}`) : ''}`

  return (
    <li className={`chap-${etape.chapitre} absolute z-[2] flex flex-col items-center`} style={{ left: x - taille.colonne / 2, top: y - n / 2, width: taille.colonne }}>
      {ici && bulle && (
        <span
          className="rebond absolute px-3 py-1 rounded-xl bg-surface border-2 border-accent-500 font-extrabold text-accent-700 shadow-carte whitespace-nowrap"
          style={{ top: n / 2 - 18, fontSize: taille.grand ? 16 : 14, [bulle === 'droite' ? 'left' : 'right']: taille.colonne / 2 + n / 2 + 12 }}
          aria-hidden
        >
          C'est ici !
        </span>
      )}
      <Link
        to={`/chemin/${etape.id}`}
        data-etape={etape.id}
        className={`relative flex items-center justify-center rounded-full transition-transform active:translate-y-1 hover:scale-105 ${ici ? 'respire' : ''}`}
        style={{
          width: n,
          height: n,
          background: fond,
          border: bord,
          boxShadow: `0 ${taille.grand ? 8 : 7}px 0 ${ombre}${ici ? `, 0 0 0 ${taille.grand ? 12 : 10}px color-mix(in srgb, var(--accent-500) 35%, transparent)` : ''}`,
        }}
        aria-label={`${etape.titre} : ${etatTexte}${ici ? ' (étape conseillée aujourd’hui)' : ''}. Lancer la mini-séance.`}
      >
        <svg
          width={Math.round(n * 0.4)}
          height={Math.round(n * 0.4)}
          viewBox="0 0 24 24"
          fill={icone === ICONES.jouer ? trait : 'none'}
          stroke={trait}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={icone} />
        </svg>
        {dispo && !ici && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gold border-2 border-surface" aria-hidden title="Une étoile à gagner aujourd'hui" />
        )}
      </Link>
      <span
        className={`mt-2.5 px-2 rounded-lg font-extrabold text-center leading-tight ${taille.grand ? 'text-base' : 'text-sm'}`}
        style={{ color: 'var(--m-ink)', background: 'color-mix(in srgb, var(--m-bg) 80%, transparent)' }}
      >
        {etape.titre}
      </span>
      <span className="flex gap-0.5 mt-1" aria-hidden>
        {[1, 2, 3].map((k) => (
          <Etoile key={k} pleine={k <= etoiles} taille={taille.grand ? 20 : 16} />
        ))}
      </span>
    </li>
  )
}

/** Le compagnon posé à côté du rond du jour, avec une petite bulle. Il saute jusqu'au rond suivant quand tu avances. */
function CompagnonDuChemin({ ici, points, t, largeur }: { ici: string; points: Point[]; t: Tailles; largeur: number }) {
  const endormi = useCompagnonEndormi()
  const [pos, setPos] = useState(() => {
    const avant = lireSession(CLE_COMPAGNON, 'local')
    return avant && avant !== ici && points.some((pt) => pt.etape.id === avant) && !sansAnimation() ? avant : ici
  })
  const [saute, setSaute] = useState(false)

  useEffect(() => {
    if (pos === ici) {
      ecrireSession(CLE_COMPAGNON, ici, 'local')
      return
    }
    const t1 = window.setTimeout(() => {
      setSaute(true)
      setPos(ici)
    }, 600)
    return () => window.clearTimeout(t1)
  }, [pos, ici])

  useEffect(() => {
    if (!saute) return
    const t2 = window.setTimeout(() => setSaute(false), 1200)
    return () => window.clearTimeout(t2)
  }, [saute])

  const pt = points.find((x) => x.etape.id === pos) ?? points[0]
  const c = t.compagnon
  const { gauche, haut, cote } = placeLibre(pt, points, t, largeur)
  const phrase = endormi ? 'Zzz… on révise ?' : ['C’est ici ! On y va ? ✨', 'C’est ici ! 3 minutes ?', 'C’est ici, je t’attends !'][new Date().getDate() % 3]

  return (
    <div
      className={`absolute z-[1] flex flex-col pointer-events-none ${cote < 0 ? 'items-end' : 'items-start'}`}
      style={{ left: gauche, top: haut, width: c, transition: 'left 1.1s ease-in-out, top 1.1s ease-in-out' }}
      aria-hidden
    >
      <span
        className="rebond mb-1 whitespace-nowrap rounded-xl bg-surface border border-line px-2.5 py-0.5 font-bold text-ink shadow-carte"
        style={{ fontSize: t.grand ? 15 : 12 }}
      >
        {phrase}
      </span>
      <div className={saute ? 'saut' : undefined}>
        <MonCompagnon taille={c} anime humeur={saute ? 'content' : endormi ? undefined : 'coucou'} />
      </div>
    </div>
  )
}

type Boite = { g: number; h: number; d: number; b: number }
const chevauchement = (a: Boite, z: Boite) => Math.max(0, Math.min(a.d, z.d) - Math.max(a.g, z.g)) * Math.max(0, Math.min(a.b, z.b) - Math.max(a.h, z.h))

/** Cherche, à côté du rond, la place où le compagnon (et sa bulle) ne cache ni un rond ni le nom d'une notion. */
function placeLibre(pt: Point, points: Point[], t: Tailles, largeur: number) {
  const c = t.compagnon
  const bulle = t.grand ? 230 : 180
  const largeurBoite = Math.max(c, bulle)
  const hauteurBoite = c + (t.grand ? 30 : 26)
  const lettre = t.grand ? 10 : 8.4
  const ligne = t.grand ? 21 : 18
  // Ce qu'il ne faut pas cacher : les ronds, leur nom, leurs étoiles et la bulle « C'est ici ! ».
  const obstacles: Boite[] = []
  for (const q of points) {
    if (Math.abs(q.y - pt.y) > t.pas * 2) continue
    const r = t.rond / 2
    obstacles.push({ g: q.x - r - 6, d: q.x + r + 6, h: q.y - r - 6, b: q.y + r + 10 })
    const texte = q.etape.titre.length * lettre
    const lignes = Math.ceil(texte / (t.colonne - 16))
    const l = Math.min(t.colonne, texte + 16)
    obstacles.push({ g: q.x - l / 2, d: q.x + l / 2, h: q.y + r + 8, b: q.y + r + 14 + lignes * ligne + (t.grand ? 26 : 22) })
  }
  // La bulle part vers l'extérieur (loin du rond) : à gauche du rond, elle déborde à gauche du compagnon.
  let meilleur = { gauche: 0, haut: 0, score: Infinity, cote: 1 }
  const prefere = pt.x > largeur / 2 ? -1 : 1
  for (const cote of [prefere, -prefere]) {
    for (const ecart of [0, 30, 60]) {
      for (const dy of [0, 20, -20, 40, -40, 60, 80, -60, 100, 120]) {
        // Position du compagnon lui-même, collé au rond (plus ou moins écarté).
        let gC = cote < 0 ? pt.x - t.rond / 2 - 12 - ecart - c : pt.x + t.rond / 2 + 12 + ecart
        gC = Math.max(2 + (cote < 0 ? largeurBoite - c : 0), Math.min(largeur - 2 - (cote < 0 ? c : largeurBoite), gC))
        const gB = cote < 0 ? gC + c - largeurBoite : gC
        const haut = pt.y - c / 2 - 18 + dy
        const boite = { g: gB, d: gB + largeurBoite, h: haut, b: haut + hauteurBoite }
        const score =
          obstacles.reduce((s, o) => s + chevauchement(boite, o), 0) * 4 + Math.abs(dy) * 2 + ecart * 2 + (cote === prefere ? 0 : 30)
        if (score < meilleur.score) meilleur = { gauche: gC, haut, score, cote }
      }
    }
  }
  return meilleur
}

/** L'étoile part du rond et vole jusqu'au compteur ⭐, qui fait « boing ». */
function envolerEtoile(etapeId: string) {
  const cible = document.getElementById('compteur-etoiles')
  const depart = document.querySelector<HTMLElement>(`[data-etape="${etapeId}"]`)
  if (!cible || sansAnimation()) return
  const rc = cible.getBoundingClientRect()
  const rd = depart?.getBoundingClientRect()
  const visible = rd && rd.top > 0 && rd.bottom < window.innerHeight
  const x0 = visible ? rd.left + rd.width / 2 : window.innerWidth / 2
  const y0 = visible ? rd.top + rd.height / 2 : window.innerHeight * 0.7
  const x1 = rc.left + rc.width / 2
  const y1 = rc.top + rc.height / 2

  const etoile = document.createElement('div')
  etoile.setAttribute('aria-hidden', 'true')
  etoile.style.cssText = `position:fixed;left:${x0 - 22}px;top:${y0 - 22}px;width:44px;height:44px;z-index:60;pointer-events:none`
  etoile.innerHTML =
    '<svg width="44" height="44" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9z" fill="#f5c451" stroke="#d9a22a" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  document.body.appendChild(etoile)
  const dx = x1 - x0
  const dy = y1 - y0
  const vol = etoile.animate(
    [
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: 'translate(0,-24px) scale(1.5)', opacity: 1, offset: 0.2 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(1.1) rotate(160deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(.5) rotate(360deg)`, opacity: 1 },
    ],
    { duration: 1100, easing: 'ease-in-out' },
  )
  vol.onfinish = () => {
    etoile.remove()
    cible.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' })
  }
}

function Bandeau({ numero, y, marge, hauteur, grand }: { numero: Chapitre; y: number; marge: number; hauteur: number; grand: boolean }) {
  const c = infoChapitre(numero)
  return (
    <div
      className={`chap-${numero} absolute rounded-2xl px-4 flex items-center gap-3 shadow-carte border`}
      style={{
        left: marge,
        right: marge,
        top: y,
        height: hauteur,
        background: 'linear-gradient(100deg, var(--accent-100), var(--m-bande))',
        borderColor: 'color-mix(in srgb, var(--accent-500) 45%, transparent)',
      }}
    >
      <span
        className={`shrink-0 flex items-center justify-center rounded-xl font-[family-name:var(--font-affiche)] font-extrabold text-[#1e2a3a] ${grand ? 'w-12 h-12 text-2xl' : 'w-10 h-10 text-xl'}`}
        style={{ background: 'var(--accent-500)', boxShadow: '0 3px 0 var(--accent-600)' }}
        aria-hidden
      >
        {numero}
      </span>
      <div className="min-w-0">
        <p className={`font-extrabold tracking-wide uppercase ${grand ? 'text-sm' : 'text-xs'}`} style={{ color: 'var(--accent-700)' }}>
          Chapitre {numero} · {c.seances}
        </p>
        <p className={`font-titre font-bold truncate ${grand ? 'text-xl' : ''}`} style={{ color: 'var(--m-ink)' }}>
          {c.titre}
        </p>
      </div>
    </div>
  )
}
