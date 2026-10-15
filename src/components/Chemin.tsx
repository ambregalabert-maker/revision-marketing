import { Link } from 'react-router'
import { ETAPES, etapeDuJour, etoileDisponible, prochaineEtoile, type Etape } from '../lib/chemin'
import { formatDans } from '../lib/dates'
import { useProgression } from '../state/progression'
import MonCompagnon, { useCompagnonEndormi } from './MonCompagnon'

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

// Le chemin serpente : décalage horizontal de chaque rond (en px).
const VAGUE = [0, 56, 84, 56, 0, -56, -84, -56]

function Rond({ etape, index, ici }: { etape: Etape; index: number; ici: boolean }) {
  const { p } = useProgression()
  const etat = p.chemin[etape.id]
  const etoiles = etat?.etoiles ?? 0
  const dispo = etoiles > 0 && etoileDisponible(etat)
  const prochaine = prochaineEtoile(etat)
  const decalage = VAGUE[index % VAGUE.length]

  // Couleurs selon l'avancement : à faire (blanc), commencé (accent), en or (3 étoiles).
  let fond = 'var(--surface)'
  let ombre = 'var(--line)'
  let trait = 'var(--accent-700)'
  let bord = '3px solid var(--accent-500)'
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
    <li className="flex flex-col items-center" style={{ transform: `translateX(${decalage}px)` }}>
      {ici && (
        <span className="rebond mb-2 px-3 py-1 rounded-xl bg-surface border-2 border-accent-500 text-sm font-extrabold text-accent-700 shadow-carte" aria-hidden>
          C'est ici !
        </span>
      )}
      <div className="relative">
      {/* Le compagnon attend à côté de l'étape du jour */}
      {ici && p.boutique.compagnon && <CompagnonDuChemin cote={decalage > 0 ? 'gauche' : 'droite'} />}
      <Link
        to={`/chemin/${etape.id}`}
        className={`relative flex items-center justify-center w-[72px] h-[72px] rounded-full transition-transform active:translate-y-1 ${ici ? 'respire' : ''}`}
        style={{
          background: fond,
          border: bord,
          boxShadow: `0 6px 0 ${ombre}${ici ? ', 0 0 0 8px var(--accent-100)' : ''}`,
        }}
        aria-label={`${etape.titre} : ${etatTexte}${ici ? ' (étape conseillée aujourd’hui)' : ''}. Lancer la mini-séance.`}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill={icone === ICONES.jouer ? trait : 'none'} stroke={trait} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={icone} />
        </svg>
        {dispo && !ici && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold border-2 border-surface" aria-hidden title="Une étoile à gagner aujourd'hui" />
        )}
      </Link>
      </div>
      <span className="mt-2 text-sm font-bold text-center max-w-36 leading-tight">{etape.titre}</span>
      <span className="flex gap-0.5 mt-1" aria-hidden>
        {[1, 2, 3].map((n) => (
          <Etoile key={n} pleine={n <= etoiles} taille={15} />
        ))}
      </span>
    </li>
  )
}

/** Le compagnon posé à côté du rond du jour, avec une petite bulle. */
function CompagnonDuChemin({ cote }: { cote: 'gauche' | 'droite' }) {
  const endormi = useCompagnonEndormi()
  const phrase = endormi ? 'Zzz… on révise ?' : ['On y va ?', 'Allez, 3 minutes !', 'Je t’attends !'][new Date().getDate() % 3]
  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none ${cote === 'gauche' ? 'right-full mr-3' : 'left-full ml-3'}`}
      aria-hidden
    >
      <span className="mb-1 whitespace-nowrap rounded-xl bg-surface border border-line px-2 py-0.5 text-xs font-bold shadow-carte">{phrase}</span>
      <MonCompagnon taille={72} anime={!endormi} />
    </div>
  )
}

/** Le chemin du chapitre 1, façon Duolingo : toutes les étapes sont ouvertes. */
export default function Chemin() {
  const { p } = useProgression()
  const ici = etapeDuJour(p).id
  const seance1 = ETAPES.filter((e) => e.seance === 1)
  const seance2 = ETAPES.filter((e) => e.seance === 2)

  return (
    <section aria-labelledby="t-chemin" className="pb-4">
      <h2 id="t-chemin" className="sr-only">
        Ton chemin
      </h2>
      <Bandeau numero={1} titre="Marketing & marché" />
      <ol className="flex flex-col gap-6 py-7">
        {seance1.map((e, i) => (
          <Rond key={e.id} etape={e} index={i} ici={e.id === ici} />
        ))}
      </ol>
      <Bandeau numero={2} titre="L'environnement du marketing" />
      <ol className="flex flex-col gap-6 py-7">
        {seance2.map((e, i) => (
          <Rond key={e.id} etape={e} index={i + 2} ici={e.id === ici} />
        ))}
      </ol>
    </section>
  )
}

function Bandeau({ numero, titre }: { numero: number; titre: string }) {
  return (
    <div className="rounded-2xl bg-blue-100 text-blue-700 px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs font-extrabold tracking-wide">SÉANCE {numero}</p>
        <p className="font-titre font-semibold text-ink">{titre}</p>
      </div>
    </div>
  )
}
