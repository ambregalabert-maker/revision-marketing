import type { Espece } from '../lib/types'

// Les compagnons kawaii de Mark'Up, style « Mochi » : tout ronds comme une petite boule,
// grands yeux brillants à double reflet, bouche en « ω », grosses joues roses.
// Dessinés en SVG (aucune image à charger), animés en CSS comme Pépin (index.css, « Le rig des compagnons ») :
// bras, queue, oreilles et yeux bougent chacun de leur côté.

export type Humeur = 'normal' | 'content' | 'fete' | 'sieste' | 'coucou' | 'reflechit'

const ENCRE = '#1E1E2A'

function Visage({ humeur, panda }: { humeur: Humeur; panda: boolean }) {
  const trait = panda ? '#FFFFFF' : ENCRE
  const rieur = humeur === 'content' || humeur === 'fete'
  return (
    <g>
      <g fill="#FF8FAB" opacity="0.6">
        <ellipse cx="30" cy="84" rx="8.5" ry="5" />
        <ellipse cx="90" cy="84" rx="8.5" ry="5" />
      </g>
      {(humeur === 'normal' || humeur === 'coucou' || humeur === 'reflechit') && (
        <g className="c-yeux">
          <ellipse cx="44" cy="68" rx="8.5" ry="10" fill={panda ? '#0E0E14' : ENCRE} />
          <ellipse cx="76" cy="68" rx="8.5" ry="10" fill={panda ? '#0E0E14' : ENCRE} />
          <circle cx="47.5" cy="63.5" r="3.8" fill="#FFFFFF" />
          <circle cx="79.5" cy="63.5" r="3.8" fill="#FFFFFF" />
          <circle cx="41" cy="72.5" r="1.8" fill="#FFFFFF" />
          <circle cx="73" cy="72.5" r="1.8" fill="#FFFFFF" />
        </g>
      )}
      {rieur && (
        <g fill="none" stroke={trait} strokeWidth="4" strokeLinecap="round">
          <path d="M36 70 q8 -10 16 0" />
          <path d="M68 70 q8 -10 16 0" />
        </g>
      )}
      {humeur === 'sieste' && (
        <g fill="none" stroke={trait} strokeWidth="3.6" strokeLinecap="round">
          <path d="M36 68 q8 7 16 0" />
          <path d="M68 68 q8 7 16 0" />
        </g>
      )}
      {humeur === 'reflechit' && (
        <g fill="none" stroke={trait} strokeWidth="3" strokeLinecap="round">
          <path d="M36 54 q8 -5 15 -1" />
          <path d="M69 52 l14 0" />
        </g>
      )}
      {rieur ? (
        <path d="M53 80 q7 10 14 0 z" fill="#E8667E" stroke="#2B2B38" strokeWidth="2" strokeLinejoin="round" />
      ) : (
        <path d="M54 80 q3 3.6 6 0 q3 3.6 6 0" fill="none" stroke="#2B2B38" strokeWidth="2.4" strokeLinecap="round" />
      )}
    </g>
  )
}

/** Les petits bras, dessinés derrière le corps : ils se lèvent pour faire la fête ou coucou. */
function Bras({ couleur, bord }: { couleur: string; bord?: string }) {
  return (
    <>
      <g className="c-bras c-bras-g">
        <ellipse cx="17" cy="90" rx="7.5" ry="12" fill={couleur} stroke={bord} strokeWidth={bord ? 2 : 0} transform="rotate(25 17 90)" />
      </g>
      <g className="c-bras c-bras-d">
        <ellipse cx="103" cy="90" rx="7.5" ry="12" fill={couleur} stroke={bord} strokeWidth={bord ? 2 : 0} transform="rotate(-25 103 90)" />
      </g>
    </>
  )
}

function Renard({ humeur }: { humeur: Humeur }) {
  const roux = '#F7A262'
  return (
    <g>
      <g className="c-queue">
        <path d="M100 92 q22 -2 16 -26 q-8 12 -20 16 z" fill={roux} />
        <path d="M113 70 q4 -4 3 -8 q-6 4 -8 8 z" fill="#FFF3E6" />
      </g>
      <g className="c-oreilles">
        <path d="M28 50 Q20 18 50 34 Z" fill={roux} stroke={roux} strokeWidth="8" strokeLinejoin="round" />
        <path d="M92 50 Q100 18 70 34 Z" fill={roux} stroke={roux} strokeWidth="8" strokeLinejoin="round" />
        <path d="M32 44 Q28 28 44 36 Z" fill="#FFC2CC" />
        <path d="M88 44 Q92 28 76 36 Z" fill="#FFC2CC" />
      </g>
      <Bras couleur="#E8894A" />
      <ellipse cx="42" cy="110" rx="10" ry="5" fill="#B8643A" />
      <ellipse cx="78" cy="110" rx="10" ry="5" fill="#B8643A" />
      <ellipse cx="60" cy="72" rx="46" ry="40" fill={roux} />
      <ellipse cx="60" cy="88" rx="32" ry="22" fill="#FFF3E6" />
      <ellipse cx="60" cy="75" rx="3.6" ry="2.6" fill="#2B2B38" />
      <Visage humeur={humeur} panda={false} />
    </g>
  )
}

function Panda({ humeur }: { humeur: Humeur }) {
  const noir = '#3A3A46'
  return (
    <g>
      <g className="c-oreilles">
        <circle cx="30" cy="40" r="13" fill={noir} />
        <circle cx="90" cy="40" r="13" fill={noir} />
      </g>
      <Bras couleur={noir} />
      <ellipse cx="40" cy="110" rx="10" ry="5" fill={noir} />
      <ellipse cx="80" cy="110" rx="10" ry="5" fill={noir} />
      <ellipse cx="60" cy="72" rx="46" ry="40" fill="#FFFFFF" stroke="#E3E8F0" strokeWidth="2" />
      <ellipse cx="43" cy="67" rx="13" ry="14" fill={noir} transform="rotate(18 43 67)" />
      <ellipse cx="77" cy="67" rx="13" ry="14" fill={noir} transform="rotate(-18 77 67)" />
      <ellipse cx="60" cy="77" rx="3.6" ry="2.6" fill="#2B2B38" />
      <Visage humeur={humeur} panda />
    </g>
  )
}

function Licorne({ humeur }: { humeur: Humeur }) {
  const rose = '#FFE1EC'
  return (
    <g>
      <g className="c-queue">
        <circle cx="104" cy="96" r="9" fill="#FF8FB8" />
        <circle cx="110" cy="86" r="7.5" fill="#FFE08A" />
        <circle cx="113" cy="77" r="6" fill="#9FE3C9" />
        <circle cx="114" cy="69" r="4.5" fill="#C4B8F8" />
      </g>
      <g className="c-oreilles">
        <path d="M34 46 L32 24 L50 36 Z" fill={rose} stroke={rose} strokeWidth="7" strokeLinejoin="round" />
        <path d="M86 46 L88 24 L70 36 Z" fill={rose} stroke={rose} strokeWidth="7" strokeLinejoin="round" />
        <path d="M37 40 L36 30 L45 36 Z" fill="#FF9EC0" />
        <path d="M83 40 L84 30 L75 36 Z" fill="#FF9EC0" />
      </g>
      <Bras couleur={rose} bord="#F7C3D6" />
      <ellipse cx="42" cy="110" rx="10" ry="5" fill="#F7A8BE" />
      <ellipse cx="78" cy="110" rx="10" ry="5" fill="#F7A8BE" />
      <ellipse cx="60" cy="72" rx="46" ry="40" fill={rose} stroke="#F7C3D6" strokeWidth="2" />
      <path d="M53 38 L60 6 L67 38 Z" fill="#FFD966" stroke="#E0B030" strokeWidth="2" strokeLinejoin="round" />
      <path d="M55 29 L65 25 M57 20 L64 17" stroke="#E0B030" strokeWidth="2" strokeLinecap="round" />
      <circle cx="34" cy="44" r="10" fill="#FF8FB8" />
      <circle cx="44" cy="37" r="9" fill="#FFB59A" />
      <circle cx="26" cy="54" r="8.5" fill="#FFE08A" />
      <circle cx="23" cy="66" r="7.5" fill="#9FE3C9" />
      <circle cx="24" cy="77" r="6.5" fill="#9CCBF5" />
      <circle cx="27" cy="86" r="5.5" fill="#C4B8F8" />
      <Visage humeur={humeur} panda={false} />
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

/** Décalage vertical des accessoires pour la silhouette ronde « Mochi ». */
const DECALAGE: Record<string, number> = { 'lunettes-rondes': 10, 'lunettes-soleil': 10, noeud: 12, echarpe: 14 }

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
      className={`compagnon compagnon--${humeur} ${anime ? 'est-anime' : ''} shrink-0 overflow-visible`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <ellipse className="c-ombre" cx="60" cy="117" rx="30" ry="4" fill="#000" opacity="0.08" />
      <g className="c-tout">
      {espece === 'renard' && <Renard humeur={humeur} />}
      {espece === 'panda' && <Panda humeur={humeur} />}
      {espece === 'licorne' && <Licorne humeur={humeur} />}
      {tries.map((id) => (
        <g key={id} transform={`translate(0 ${DECALAGE[id] ?? 12})`}>
          <Accessoire id={id} />
        </g>
      ))}
      </g>
      {humeur === 'sieste' && (
        <g className="c-zzz" fill="#7A8AA0" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700">
          <text x="96" y="20" fontSize="14">
            z
          </text>
          <text x="106" y="6" fontSize="18">
            Z
          </text>
          <text x="114" y="-10" fontSize="22">
            Z
          </text>
        </g>
      )}
      {humeur === 'fete' && (
        <g className="c-confettis" fill="#F5C451">
          <path d="M8 30 l2 5 5 1 -4 3 1 5 -4 -3 -4 3 1 -5 -4 -3 5 -1z" />
          <path d="M104 52 l1.5 4 4 .8 -3 2.4 .8 4 -3.3 -2.4 -3.3 2.4 .8 -4 -3 -2.4 4 -.8z" />
          <circle cx="16" cy="64" r="2.5" fill="#FF8FB8" />
          <circle cx="102" cy="20" r="2.5" fill="#9CCBF5" />
        </g>
      )}
    </svg>
  )
}
