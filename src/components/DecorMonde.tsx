import type { ElementDecor } from '../lib/mondes'

/** Un élément du décor (nuage, fleur, flocon…), purement décoratif. */
function Dessin({ e, t, h }: { e: ElementDecor; t: number; h: number }) {
  const c = e.couleur
  switch (e.type) {
    case 'nuage':
      return (
        <svg width={t} height={h} viewBox="0 0 100 50">
          <path d="M20 45 a16 16 0 0 1 2 -31 a20 20 0 0 1 36 -6 a16 16 0 0 1 26 12 a12 12 0 0 1 -4 25 z" fill={c} />
        </svg>
      )
    case 'etoile':
      return (
        <svg width={t} height={t} viewBox="0 0 24 24">
          <path d="M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z" fill={c} />
        </svg>
      )
    case 'fleur':
      return (
        <svg width={t} height={t} viewBox="0 0 40 40">
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
    case 'petale':
      return (
        <svg width={t} height={t} viewBox="0 0 20 20">
          <ellipse cx="10" cy="10" rx="5" ry="9" fill={c} transform="rotate(30 10 10)" />
        </svg>
      )
    case 'papillon':
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
    case 'planete':
      return (
        <svg width={t} height={t} viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="22" fill="#f7a8be" />
          <circle cx="32" cy="32" r="5" fill="#ffc9d6" />
          <circle cx="48" cy="48" r="3.5" fill="#e0849e" />
          <ellipse cx="40" cy="42" rx="38" ry="9" fill="none" stroke="#ffe08a" strokeWidth="4" transform="rotate(-18 40 42)" />
        </svg>
      )
    case 'lune':
      return (
        <svg width={t} height={t} viewBox="0 0 60 60">
          <path d="M40 8 a24 24 0 1 0 14 38 a20 20 0 1 1 -14 -38z" fill="#ffe08a" />
          <circle cx="24" cy="30" r="2.4" fill="#2b2b38" />
          <path d="M30 38 q3 3 6 0" stroke="#2b2b38" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      )
    case 'filante':
      return (
        <svg width={t} height={h} viewBox="0 0 90 40">
          <path d="M10 30 L80 6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
          <circle cx="10" cy="30" r="4" fill="#ffe08a" />
        </svg>
      )
    case 'flocon':
      return (
        <svg width={t} height={t} viewBox="0 0 24 24">
          <g stroke={c} strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v20M3 7l18 10M21 7L3 17" />
          </g>
          <circle cx="12" cy="12" r="2.5" fill={c} />
        </svg>
      )
    case 'sapin':
      return (
        <svg width={t} height={h} viewBox="0 0 50 70">
          <path d="M25 2 L44 30 H34 L48 52 H2 L16 30 H6 Z" fill="#7cc6a4" />
          <path d="M10 50 Q25 44 40 50" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="21" y="52" width="8" height="12" rx="2" fill="#b8865a" />
          <circle cx="25" cy="3" r="3.5" fill="#ffd966" />
        </svg>
      )
    case 'arc':
      return (
        <svg width={t} height={h} viewBox="0 0 200 100">
          <g fill="none" strokeWidth="9" strokeLinecap="round">
            <path d="M14 100 a86 86 0 0 1 172 0" stroke="#ffb3c7" />
            <path d="M23 100 a77 77 0 0 1 154 0" stroke="#ffd3a8" />
            <path d="M32 100 a68 68 0 0 1 136 0" stroke="#ffefa0" />
            <path d="M41 100 a59 59 0 0 1 118 0" stroke="#bdefd6" />
            <path d="M50 100 a50 50 0 0 1 100 0" stroke="#bfe0fa" />
            <path d="M59 100 a41 41 0 0 1 82 0" stroke="#d9cffb" />
          </g>
        </svg>
      )
    case 'herbe':
      return (
        <svg width={t} height={h} viewBox="0 0 40 20">
          <path d="M4 20 Q6 8 10 4 Q10 12 14 20 M14 20 Q18 6 22 2 Q22 12 26 20 M26 20 Q30 10 34 6 Q33 14 36 20" fill="#a9ddb7" />
        </svg>
      )
    case 'butte':
      return (
        <svg width={t} height={h} viewBox="0 0 120 40">
          <path d="M0 40 Q30 4 60 18 Q90 0 120 40 Z" fill="#ffffff" stroke="#dce6f0" strokeWidth="2" />
        </svg>
      )
  }
}

/** Tout le décor d'un monde, derrière le chemin. `echelle` agrandit le décor sur ordinateur. */
export default function DecorMonde({ elements, echelle = 1 }: { elements: ElementDecor[]; echelle?: number }) {
  return (
    <div className="decor absolute inset-0 pointer-events-none" aria-hidden>
      {elements.map((e, i) => (
        <div
          key={i}
          className={e.anim ? `anim-${e.anim}` : undefined}
          style={{
            position: 'absolute',
            left: `${e.x}%`,
            top: e.y,
            animationDelay: e.delai ? `${e.delai}s` : undefined,
            animationDuration: e.duree ? `${e.duree}s` : undefined,
          }}
        >
          <Dessin e={e} t={Math.round(e.t * echelle)} h={Math.round(e.h * echelle)} />
        </div>
      ))}
    </div>
  )
}
