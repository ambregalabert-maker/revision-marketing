import type { Espece } from '../lib/types'

// Les compagnons kawaii de Mark'Up, dessinés en SVG (aucune image à charger).
// Tous partagent la même silhouette : grosse tête ronde, petit corps, grands yeux brillants, joues roses.

export type Humeur = 'normal' | 'content' | 'fete' | 'sieste'

const ENCRE = '#2B2B38'
const JOUES = '#FF8FAB'

const ARC_EN_CIEL = ['#FF8FB8', '#FFB59A', '#FFE08A', '#9FE3C9', '#9CCBF5', '#C4B8F8']

function Yeux({ humeur, panda }: { humeur: Humeur; panda: boolean }) {
  if (humeur === 'content' || humeur === 'fete') {
    return (
      <g fill="none" stroke={panda ? '#FFFFFF' : ENCRE} strokeWidth="3.6" strokeLinecap="round">
        <path d="M39 60 q7 -8 14 0" />
        <path d="M67 60 q7 -8 14 0" />
      </g>
    )
  }
  if (humeur === 'sieste') {
    return (
      <g fill="none" stroke={panda ? '#FFFFFF' : ENCRE} strokeWidth="3.4" strokeLinecap="round">
        <path d="M39 58 q7 6 14 0" />
        <path d="M67 58 q7 6 14 0" />
      </g>
    )
  }
  return (
    <g>
      <ellipse cx="46" cy="58" rx="6" ry="7.5" fill={panda ? '#121218' : ENCRE} />
      <ellipse cx="74" cy="58" rx="6" ry="7.5" fill={panda ? '#121218' : ENCRE} />
      <circle cx="48" cy="55" r="2.4" fill="#FFFFFF" />
      <circle cx="76" cy="55" r="2.4" fill="#FFFFFF" />
      <circle cx="44.5" cy="61" r="1.1" fill="#FFFFFF" />
      <circle cx="72.5" cy="61" r="1.1" fill="#FFFFFF" />
    </g>
  )
}

function Bouche({ humeur, nez }: { humeur: Humeur; nez: boolean }) {
  return (
    <g>
      {nez && <ellipse cx="60" cy="66" rx="3.2" ry="2.3" fill={ENCRE} />}
      {humeur === 'content' || humeur === 'fete' ? (
        <path d="M53 70 q7 9 14 0 z" fill="#E8667E" stroke={ENCRE} strokeWidth="2" strokeLinejoin="round" />
      ) : humeur === 'sieste' ? (
        <ellipse cx="60" cy="72" rx="2.4" ry="2" fill={ENCRE} />
      ) : (
        <path d="M54.5 70 q2.75 3.2 5.5 0 q2.75 3.2 5.5 0" fill="none" stroke={ENCRE} strokeWidth="2.2" strokeLinecap="round" />
      )}
    </g>
  )
}

function Joues() {
  return (
    <g fill={JOUES} opacity="0.55">
      <ellipse cx="36" cy="70" rx="7.5" ry="4.5" />
      <ellipse cx="84" cy="70" rx="7.5" ry="4.5" />
    </g>
  )
}

function Renard({ humeur }: { humeur: Humeur }) {
  const roux = '#F59E5B'
  const clair = '#FFF4E8'
  return (
    <g>
      {/* Queue touffue */}
      <ellipse cx="94" cy="96" rx="20" ry="10" fill={roux} transform="rotate(-35 94 96)" />
      <ellipse cx="106" cy="86" rx="8" ry="6" fill={clair} transform="rotate(-35 106 86)" />
      {/* Corps */}
      <ellipse cx="60" cy="100" rx="25" ry="15" fill={roux} />
      <ellipse cx="60" cy="102" rx="14" ry="10" fill={clair} />
      <ellipse cx="48" cy="112" rx="7" ry="4" fill="#8A4B2A" />
      <ellipse cx="72" cy="112" rx="7" ry="4" fill="#8A4B2A" />
      {/* Oreilles */}
      <path d="M24 42 L22 8 L52 26 Z" fill={roux} stroke={roux} strokeWidth="6" strokeLinejoin="round" />
      <path d="M96 42 L98 8 L68 26 Z" fill={roux} stroke={roux} strokeWidth="6" strokeLinejoin="round" />
      <path d="M29 34 L28 16 L44 26 Z" fill="#FFC2C7" />
      <path d="M91 34 L92 16 L76 26 Z" fill="#FFC2C7" />
      {/* Tête */}
      <ellipse cx="60" cy="56" rx="40" ry="34" fill={roux} />
      <circle cx="45" cy="72" r="17" fill={clair} />
      <circle cx="75" cy="72" r="17" fill={clair} />
      <ellipse cx="60" cy="78" rx="18" ry="11" fill={clair} />
      <Joues />
      <Yeux humeur={humeur} panda={false} />
      <Bouche humeur={humeur} nez />
    </g>
  )
}

function Panda({ humeur }: { humeur: Humeur }) {
  const blanc = '#FFFFFF'
  const noir = '#3A3A46'
  return (
    <g>
      {/* Corps */}
      <ellipse cx="60" cy="100" rx="25" ry="15" fill={noir} />
      <ellipse cx="60" cy="102" rx="15" ry="11" fill={blanc} />
      <ellipse cx="47" cy="112" rx="7" ry="4" fill={noir} />
      <ellipse cx="73" cy="112" rx="7" ry="4" fill={noir} />
      {/* Oreilles */}
      <circle cx="26" cy="26" r="13" fill={noir} />
      <circle cx="94" cy="26" r="13" fill={noir} />
      {/* Tête */}
      <ellipse cx="60" cy="56" rx="40" ry="34" fill={blanc} stroke="#E3E8F0" strokeWidth="1.5" />
      {/* Taches autour des yeux */}
      <ellipse cx="46" cy="59" rx="11" ry="13" fill={noir} transform="rotate(22 46 59)" />
      <ellipse cx="74" cy="59" rx="11" ry="13" fill={noir} transform="rotate(-22 74 59)" />
      <Joues />
      <Yeux humeur={humeur} panda />
      <Bouche humeur={humeur} nez />
    </g>
  )
}

function Licorne({ humeur }: { humeur: Humeur }) {
  const rose = '#FFE1EC'
  return (
    <g>
      {/* Queue arc-en-ciel */}
      {ARC_EN_CIEL.map((c, i) => (
        <circle key={c} cx={88 + i * 3.4} cy={104 - i * 6} r={8 - i * 0.6} fill={c} />
      ))}
      {/* Corps */}
      <ellipse cx="60" cy="100" rx="25" ry="15" fill={rose} stroke="#F7C3D6" strokeWidth="1.5" />
      <ellipse cx="47" cy="112" rx="7" ry="4" fill="#F7A8BE" />
      <ellipse cx="73" cy="112" rx="7" ry="4" fill="#F7A8BE" />
      {/* Crinière arrière */}
      {ARC_EN_CIEL.map((c, i) => (
        <circle key={c} cx={22 - (i % 2) * 3} cy={30 + i * 9} r="10" fill={c} />
      ))}
      {/* Oreilles */}
      <path d="M30 34 L30 10 L50 24 Z" fill={rose} stroke={rose} strokeWidth="6" strokeLinejoin="round" />
      <path d="M90 34 L90 10 L70 24 Z" fill={rose} stroke={rose} strokeWidth="6" strokeLinejoin="round" />
      <path d="M34 28 L34 16 L44 24 Z" fill="#FF9EC0" />
      <path d="M86 28 L86 16 L76 24 Z" fill="#FF9EC0" />
      {/* Tête */}
      <ellipse cx="60" cy="56" rx="40" ry="34" fill={rose} stroke="#F7C3D6" strokeWidth="1.5" />
      {/* Corne dorée */}
      <path d="M53 26 L60 -2 L67 26 Z" fill="#FFD966" stroke="#E0B030" strokeWidth="2" strokeLinejoin="round" />
      <path d="M55 18 L65 14 M56 11 L64 7" stroke="#E0B030" strokeWidth="2" strokeLinecap="round" />
      {/* Mèche arc-en-ciel sur le front */}
      {ARC_EN_CIEL.slice(0, 4).map((c, i) => (
        <circle key={c} cx={36 + i * 8} cy={27 + i * 1.5} r="8.5" fill={c} />
      ))}
      <Joues />
      <Yeux humeur={humeur} panda={false} />
      <Bouche humeur={humeur} nez={false} />
    </g>
  )
}

/** Les accessoires, dessinés par-dessus le compagnon. */
function Accessoire({ id }: { id: string }) {
  switch (id) {
    case 'bonnet':
      return (
        <g>
          <path d="M22 40 Q60 -8 98 40 Z" fill="#E85D75" />
          <rect x="20" y="34" width="80" height="11" rx="5.5" fill="#FBE3E8" />
          <path d="M30 36 v7 M40 36 v7 M50 36 v7 M60 36 v7 M70 36 v7 M80 36 v7 M90 36 v7" stroke="#F2B8C4" strokeWidth="2" />
          <circle cx="60" cy="6" r="8" fill="#FFFFFF" stroke="#F2B8C4" strokeWidth="1.5" />
        </g>
      )
    case 'fleurs':
      return (
        <g>
          <path d="M24 34 Q60 10 96 34" fill="none" stroke="#6CC28F" strokeWidth="3" />
          {[
            [26, 32, '#FF8FB8'],
            [38, 24, '#FFE08A'],
            [51, 19, '#C4B8F8'],
            [64, 18, '#FF8FB8'],
            [77, 21, '#FFE08A'],
            [90, 28, '#C4B8F8'],
          ].map(([x, y, c]) => (
            <g key={`${x}`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={(x as number) + 4.5 * Math.cos((a * Math.PI) / 180)} cy={(y as number) + 4.5 * Math.sin((a * Math.PI) / 180)} r="3.6" fill={c as string} />
              ))}
              <circle cx={x as number} cy={y as number} r="2.6" fill="#FFB547" />
            </g>
          ))}
        </g>
      )
    case 'magicien':
      return (
        <g>
          <path d="M34 30 L58 -14 L86 30 Z" fill="#7C6FD6" stroke="#5B4FB8" strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx="60" cy="30" rx="36" ry="7" fill="#5B4FB8" />
          <path d="M55 6 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z" fill="#FFD966" />
          <circle cx="70" cy="18" r="2" fill="#FFD966" />
          <circle cx="48" cy="22" r="1.6" fill="#FFD966" />
        </g>
      )
    case 'casquette':
      return (
        <g>
          <path d="M26 36 Q60 0 94 36 Z" fill="#4A90D9" />
          <path d="M84 33 q22 -4 30 5 q-14 6 -34 1 z" fill="#2F6DB0" />
          <circle cx="60" cy="14" r="3.5" fill="#2F6DB0" />
          <path d="M60 14 L60 34 M42 20 Q46 28 46 35 M78 20 Q74 28 74 35" stroke="#3B7FC4" strokeWidth="1.5" fill="none" />
        </g>
      )
    case 'couronne':
      return (
        <g>
          <path d="M36 30 L40 6 L50 20 L60 2 L70 20 L80 6 L84 30 Z" fill="#F5C451" stroke="#D9A22A" strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="60" cy="22" r="3.4" fill="#E85D75" />
          <circle cx="46" cy="25" r="2.4" fill="#5BA3E6" />
          <circle cx="74" cy="25" r="2.4" fill="#4CC38A" />
        </g>
      )
    case 'bonnet-nuit':
      return (
        <g>
          <path d="M24 38 Q34 -2 80 8 Q106 14 110 40 Q98 26 92 34 Q80 26 24 38 Z" fill="#6C8EF5" />
          <rect x="22" y="32" width="74" height="9" rx="4.5" fill="#DDE6FF" />
          <circle cx="110" cy="42" r="6.5" fill="#FFFFFF" />
          <path d="M50 18 l1.5 3 3 .5 -2 2 .5 3 -3 -1.5 -2.5 1.5 .5 -3 -2 -2 3 -.5z" fill="#FFE08A" />
          <circle cx="72" cy="14" r="1.6" fill="#FFE08A" />
          <circle cx="88" cy="22" r="1.4" fill="#FFE08A" />
        </g>
      )
    case 'lunettes-rondes':
      return (
        <g fill="rgba(255,255,255,0.25)" stroke={ENCRE} strokeWidth="2.6">
          <circle cx="46" cy="58" r="11" />
          <circle cx="74" cy="58" r="11" />
          <path d="M57 57 q3 -3 6 0 M35 56 l-9 -3 M85 56 l9 -3" fill="none" />
        </g>
      )
    case 'lunettes-soleil':
      return (
        <g>
          <rect x="33" y="50" width="26" height="17" rx="8" fill={ENCRE} />
          <rect x="61" y="50" width="26" height="17" rx="8" fill={ENCRE} />
          <path d="M58 56 h4 M33 55 l-8 -3 M87 55 l8 -3" stroke={ENCRE} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M38 55 l6 -2 M66 55 l6 -2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </g>
      )
    case 'noeud':
      return (
        <g>
          <path d="M60 92 L45 84 L45 100 Z" fill="#E85D75" stroke="#C9455D" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M60 92 L75 84 L75 100 Z" fill="#E85D75" stroke="#C9455D" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="60" cy="92" r="4" fill="#C9455D" />
        </g>
      )
    case 'echarpe':
      return (
        <g>
          <rect x="32" y="84" width="56" height="11" rx="5.5" fill="#4CC38A" />
          <rect x="68" y="88" width="11" height="22" rx="4" fill="#4CC38A" />
          <path d="M42 85 v9 M52 85 v9 M62 85 v9 M72 85 v9 M80 85 v9" stroke="#FFFFFF" strokeWidth="2.4" opacity="0.6" />
          <path d="M69 106 h9" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
        </g>
      )
    default:
      return null
  }
}

/** Ordre de dessin : le cou, puis les yeux, puis la tête (le chapeau passe par-dessus tout). */
const ORDRE: Record<string, number> = { noeud: 0, echarpe: 0, 'lunettes-rondes': 1, 'lunettes-soleil': 1 }

export default function Compagnon({
  espece,
  accessoires = [],
  humeur = 'normal',
  taille = 96,
  anime = false,
  label,
}: {
  espece: Espece
  accessoires?: string[]
  humeur?: Humeur
  taille?: number
  anime?: boolean
  /** Si fourni, le dessin est annoncé aux lecteurs d'écran. */
  label?: string
}) {
  const tries = [...accessoires].sort((a, b) => (ORDRE[a] ?? 2) - (ORDRE[b] ?? 2))
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="-6 -16 132 136"
      className={`shrink-0 overflow-visible ${anime ? 'rebond' : ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <ellipse cx="60" cy="117" rx="30" ry="4" fill="#000" opacity="0.08" />
      {espece === 'renard' && <Renard humeur={humeur} />}
      {espece === 'panda' && <Panda humeur={humeur} />}
      {espece === 'licorne' && <Licorne humeur={humeur} />}
      {tries.map((id) => (
        <Accessoire key={id} id={id} />
      ))}
      {humeur === 'sieste' && (
        <g fill="#7A8AA0" fontFamily="Rubik, sans-serif" fontWeight="700">
          <text x="96" y="20" fontSize="14">
            z
          </text>
          <text x="106" y="6" fontSize="18">
            Z
          </text>
        </g>
      )}
      {humeur === 'fete' && (
        <g fill="#F5C451">
          <path d="M8 30 l2 5 5 1 -4 3 1 5 -4 -3 -4 3 1 -5 -4 -3 5 -1z" />
          <path d="M104 52 l1.5 4 4 .8 -3 2.4 .8 4 -3.3 -2.4 -3.3 2.4 .8 -4 -3 -2.4 4 -.8z" />
          <circle cx="16" cy="64" r="2.5" fill="#FF8FB8" />
          <circle cx="102" cy="20" r="2.5" fill="#9CCBF5" />
        </g>
      )}
    </svg>
  )
}
