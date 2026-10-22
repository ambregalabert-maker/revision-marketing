import { useMemo } from 'react'
import { useProgression } from '../state/progression'
import type { Fond } from '../lib/types'

// Les mondes : un décor qui remplit tout le fond du site, derrière les pages, sans rien déplacer.
// « Normal » = pas de monde (le fond aurore d'origine). Les éléments sont placés en % de l'écran,
// surtout sur les bords et en bas, pour ne pas gêner la lecture. Animations coupées si
// « réduire les animations » est activé (règle globale dans index.css).

export interface InfoFond {
  id: Fond
  nom: string
  emoji: string
  vignette: string
}

export const FONDS: InfoFond[] = [
  { id: 'normal', nom: 'Normal', emoji: '✨', vignette: 'linear-gradient(135deg, #ffd9cc, #e3dcff 55%, #cfe8ff)' },
  { id: 'arc', nom: 'Arc-en-ciel', emoji: '🌈', vignette: 'linear-gradient(180deg, #dff0ff, #ffe9f1)' },
  { id: 'jardin', nom: 'Jardin', emoji: '🌸', vignette: 'linear-gradient(180deg, #e3f6e9, #fbf3df)' },
  { id: 'nuit', nom: 'Nuit étoilée', emoji: '🌙', vignette: 'linear-gradient(180deg, #12172e, #2a1f5c)' },
  { id: 'hiver', nom: 'Hiver', emoji: '❄️', vignette: 'linear-gradient(180deg, #e3eefa, #ffffff)' },
]

/** Petit générateur pseudo-aléatoire (toujours le même décor d'une visite à l'autre). */
function hasard(graine: number) {
  let x = graine
  return () => {
    x = (x * 9301 + 49297) % 233280
    return x / 233280
  }
}

export default function FondMonde() {
  const { p } = useProgression()
  const fond = p.profil.preferences.fond ?? 'normal'
  if (fond === 'normal') return null
  return (
    <div className={`fond-monde fond-${fond}`} aria-hidden="true">
      {fond === 'arc' && <ArcEnCiel />}
      {fond === 'jardin' && <Jardin />}
      {fond === 'nuit' && <Nuit />}
      {fond === 'hiver' && <Hiver />}
    </div>
  )
}

/** Un élément placé en % de l'écran. */
function Pos({ x, y, enBas, anim, delai, duree, children }: { x: number; y?: number; enBas?: number; anim?: string; delai?: number; duree?: number; children: React.ReactNode }) {
  return (
    <div
      className={`el ${anim ? `anim-${anim}` : ''}`}
      style={{
        position: 'absolute',
        left: `${x}%`,
        ...(enBas !== undefined ? { bottom: `${enBas}%` } : { top: `${y}%` }),
        animationDelay: delai ? `${delai}s` : undefined,
        animationDuration: duree ? `${duree}s` : undefined,
      }}
    >
      {children}
    </div>
  )
}

// ---------- Arc-en-ciel ----------

function Nuage({ l }: { l: number }) {
  return (
    <svg width={l} height={l / 2} viewBox="0 0 100 50">
      <path d="M20 45 a16 16 0 0 1 2 -31 a20 20 0 0 1 36 -6 a16 16 0 0 1 26 12 a12 12 0 0 1 -4 25 z" fill="#ffffff" opacity="0.95" />
    </svg>
  )
}

function Arc({ l }: { l: number }) {
  return (
    <svg width={l} height={l / 2} viewBox="0 0 200 100">
      <g fill="none" strokeWidth="11" strokeLinecap="round" opacity="0.85">
        <path d="M14 100 a86 86 0 0 1 172 0" stroke="#ffb3c7" />
        <path d="M25 100 a75 75 0 0 1 150 0" stroke="#ffd3a8" />
        <path d="M36 100 a64 64 0 0 1 128 0" stroke="#ffefa0" />
        <path d="M47 100 a53 53 0 0 1 106 0" stroke="#bdefd6" />
        <path d="M58 100 a42 42 0 0 1 84 0" stroke="#bfe0fa" />
        <path d="M69 100 a31 31 0 0 1 62 0" stroke="#d9cffb" />
      </g>
    </svg>
  )
}

function Etincelle({ t, c }: { t: number; c: string }) {
  return (
    <svg width={t} height={t} viewBox="0 0 24 24">
      <path d="M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z" fill={c} />
    </svg>
  )
}

function ArcEnCiel() {
  const nuages: [number, number, number, number][] = [
    [-4, 8, 150, 22],
    [80, 18, 120, 26],
    [2, 38, 110, 20],
    [84, 52, 140, 24],
    [-2, 70, 130, 28],
    [78, 82, 110, 21],
  ]
  const etincelles: [number, number, string][] = [
    [12, 16, '#ffd966'],
    [90, 30, '#ffb3c7'],
    [6, 52, '#c4b8f8'],
    [93, 66, '#ffd966'],
    [16, 86, '#9fe3c9'],
    [70, 8, '#c4b8f8'],
  ]
  return (
    <>
      <Pos x={62} y={4}>
        <Arc l={320} />
      </Pos>
      <Pos x={-8} enBas={-1}>
        <Arc l={420} />
      </Pos>
      {nuages.map(([x, y, l, d], i) => (
        <Pos key={i} x={x} y={y} anim="flotte" delai={-i * 3} duree={d}>
          <Nuage l={l} />
        </Pos>
      ))}
      {etincelles.map(([x, y, c], i) => (
        <Pos key={i} x={x} y={y} anim="scintille" delai={-i * 0.6}>
          <Etincelle t={18} c={c} />
        </Pos>
      ))}
    </>
  )
}

// ---------- Jardin ----------

function Fleur({ t, c }: { t: number; c: string }) {
  return (
    <svg width={t} height={t * 1.6} viewBox="0 0 40 64">
      <path d="M20 26 Q22 46 20 64" stroke="#5fb37a" strokeWidth="3" fill="none" />
      <path d="M20 46 q-10 -2 -12 -10 q10 0 12 10z" fill="#7cc6a4" />
      <g fill={c}>
        <circle cx="20" cy="9" r="8" />
        <circle cx="31" cy="17" r="8" />
        <circle cx="27" cy="30" r="8" />
        <circle cx="13" cy="30" r="8" />
        <circle cx="9" cy="17" r="8" />
      </g>
      <circle cx="20" cy="20" r="6" fill="#ffd27a" />
    </svg>
  )
}

function Papillon({ t, c }: { t: number; c: string }) {
  return (
    <svg width={t} height={t} viewBox="0 0 40 40">
      <g className="ailes">
        <ellipse cx="12" cy="14" rx="10" ry="9" fill={c} />
        <ellipse cx="28" cy="14" rx="10" ry="9" fill={c} />
        <ellipse cx="13" cy="28" rx="7" ry="6" fill="#ffe08a" />
        <ellipse cx="27" cy="28" rx="7" ry="6" fill="#ffe08a" />
      </g>
      <rect x="18.5" y="8" width="3" height="24" rx="1.5" fill="#5b4a3a" />
    </svg>
  )
}

function Collines({ couleurs, neige = false }: { couleurs: [string, string]; neige?: boolean }) {
  return (
    <svg className="absolute bottom-0 left-0 w-full" height="22%" viewBox="0 0 1440 260" preserveAspectRatio="none">
      <path d="M0 120 Q240 30 520 110 T1040 90 T1440 70 V260 H0 Z" fill={couleurs[0]} />
      <path d="M0 180 Q300 100 660 170 T1440 150 V260 H0 Z" fill={couleurs[1]} stroke={neige ? '#d6e6f5' : 'none'} strokeWidth="3" />
    </svg>
  )
}

function Jardin() {
  const fleurs: [number, number, string][] = [
    [3, 4, '#ffb3c7'],
    [10, 2, '#c4b8f8'],
    [20, 5, '#ffe08a'],
    [74, 3, '#ffb3c7'],
    [84, 6, '#9ccbf5'],
    [93, 2, '#c4b8f8'],
  ]
  const r = hasard(7)
  const petales = Array.from({ length: 10 }, (_, i) => ({ x: r() * 100, d: 12 + r() * 8, delai: -i * 2.2, c: i % 2 ? '#ffc9d6' : '#ffb3c7' }))
  return (
    <>
      <Collines couleurs={['#c9ebd2', '#ade0bb']} />
      {fleurs.map(([x, b, c], i) => (
        <Pos key={i} x={x} enBas={b}>
          <Fleur t={i % 2 ? 30 : 38} c={c} />
        </Pos>
      ))}
      {[
        [8, 22, '#c4b8f8'],
        [86, 36, '#ffb3c7'],
        [12, 58, '#9ccbf5'],
      ].map(([x, y, c], i) => (
        <Pos key={i} x={x as number} y={y as number} anim="papillon" delai={-i * 3}>
          <Papillon t={40} c={c as string} />
        </Pos>
      ))}
      {petales.map((pe, i) => (
        <Pos key={i} x={pe.x} y={-4} anim="tombe-ecran" delai={pe.delai} duree={pe.d}>
          <svg width="14" height="14" viewBox="0 0 20 20">
            <ellipse cx="10" cy="10" rx="5" ry="9" fill={pe.c} transform="rotate(30 10 10)" />
          </svg>
        </Pos>
      ))}
    </>
  )
}

// ---------- Nuit étoilée ----------

function Nuit() {
  const etoiles = useMemo(() => {
    const r = hasard(42)
    return Array.from({ length: 46 }, (_, i) => ({ x: r() * 100, y: r() * 100, t: 2 + Math.round(r() * 3), delai: -r() * 4, c: i % 5 === 0 ? '#ffe08a' : '#ffffff' }))
  }, [])
  return (
    <>
      {etoiles.map((e, i) => (
        <Pos key={i} x={e.x} y={e.y} anim="scintille" delai={e.delai} duree={3}>
          <span style={{ display: 'block', width: e.t, height: e.t, borderRadius: '50%', background: e.c, boxShadow: `0 0 ${e.t * 3}px ${e.c}` }} />
        </Pos>
      ))}
      <Pos x={80} y={8}>
        <svg width="120" height="120" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="22" fill="#f7a8be" />
          <circle cx="32" cy="32" r="5" fill="#ffc9d6" />
          <circle cx="48" cy="48" r="3.5" fill="#e0849e" />
          <ellipse cx="40" cy="42" rx="38" ry="9" fill="none" stroke="#ffe08a" strokeWidth="4" transform="rotate(-18 40 42)" />
        </svg>
      </Pos>
      <Pos x={3} y={58}>
        <svg width="80" height="80" viewBox="0 0 60 60">
          <path d="M40 8 a24 24 0 1 0 14 38 a20 20 0 1 1 -14 -38z" fill="#ffe08a" />
        </svg>
      </Pos>
      {[
        [70, 22, 0],
        [40, 6, -4],
      ].map(([x, y, d], i) => (
        <Pos key={i} x={x} y={y} anim="filante" delai={d} duree={7}>
          <svg width="120" height="50" viewBox="0 0 90 40">
            <path d="M10 30 L80 6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
            <circle cx="10" cy="30" r="4" fill="#ffe08a" />
          </svg>
        </Pos>
      ))}
    </>
  )
}

// ---------- Hiver ----------

function Sapin({ h }: { h: number }) {
  return (
    <svg width={h * 0.72} height={h} viewBox="0 0 50 70">
      <path d="M25 2 L44 30 H34 L48 52 H2 L16 30 H6 Z" fill="#6fbf9c" />
      <path d="M25 2 L33 14 H17 Z M10 50 Q25 44 40 50" fill="#ffffff" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <rect x="21" y="52" width="8" height="12" rx="2" fill="#b8865a" />
    </svg>
  )
}

function Hiver() {
  const flocons = useMemo(() => {
    const r = hasard(11)
    return Array.from({ length: 28 }, (_, i) => ({ x: r() * 100, t: 6 + Math.round(r() * 8), d: 10 + r() * 10, delai: -i * 0.9 }))
  }, [])
  return (
    <>
      <Collines couleurs={['#f4f9ff', '#ffffff']} neige />
      {[
        [4, 9, 70],
        [12, 6, 54],
        [82, 8, 66],
        [91, 5, 50],
      ].map(([x, b, h], i) => (
        <Pos key={i} x={x} enBas={b}>
          <Sapin h={h} />
        </Pos>
      ))}
      {flocons.map((f, i) => (
        <Pos key={i} x={f.x} y={-4} anim="tombe-ecran" delai={f.delai} duree={f.d}>
          <svg width={f.t} height={f.t} viewBox="0 0 24 24">
            <g stroke="#9cc3e8" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2v20M3 7l18 10M21 7L3 17" />
            </g>
          </svg>
        </Pos>
      ))}
    </>
  )
}
