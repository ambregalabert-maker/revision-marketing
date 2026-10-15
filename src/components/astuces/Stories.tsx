import { useRef, useState } from 'react'
import { Link } from 'react-router'
import Icone from '../Icone'
import astuces from '../../data/astuces.json'

interface Story {
  emoji: string
  fond: 'accent' | 'bleu' | 'or' | 'rose'
  titre: string
  texte: string
  points?: string[]
  chute?: string
  lien?: { label: string; to: string }
}
const stories = astuces.stories as Story[]
const FOND: Record<Story['fond'], string> = { accent: 'bg-accent-100', bleu: 'bg-blue-100', or: 'bg-gold-bg', rose: 'bg-rose-bg' }

/** Les astuces en cartes, façon « stories » : une idée par carte, peu de texte. */
export default function Stories() {
  const [i, setI] = useState(0)
  const debut = useRef<number | null>(null)
  const s = stories[i]
  const aller = (n: number) => setI(Math.max(0, Math.min(stories.length - 1, n)))

  return (
    <div
      className={`rounded-3xl ${FOND[s.fond]} p-5 border border-line select-none`}
      onPointerDown={(e) => (debut.current = e.clientX)}
      onPointerUp={(e) => {
        if (debut.current === null) return
        const dx = e.clientX - debut.current
        debut.current = null
        if (Math.abs(dx) > 50) aller(i + (dx < 0 ? 1 : -1))
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') aller(i + 1)
        if (e.key === 'ArrowLeft') aller(i - 1)
      }}
      role="group"
      aria-roledescription="carrousel"
      aria-label={`Astuce ${i + 1} sur ${stories.length} : ${s.titre}`}
    >
      {/* Barres de progression façon stories */}
      <div className="flex gap-1 mb-5" aria-hidden>
        {stories.map((_, k) => (
          <button key={k} type="button" tabIndex={-1} onClick={() => setI(k)} className="flex-1 h-1.5 rounded-full bg-surface/70 overflow-hidden">
            <span className="block h-full bg-ink/70 rounded-full" style={{ width: k <= i ? '100%' : '0%', transition: 'width .3s' }} />
          </button>
        ))}
      </div>

      <div key={i} className="apparition min-h-72 flex flex-col" aria-live="polite">
        <span className="text-5xl pop" aria-hidden>
          {s.emoji}
        </span>
        <h3 className="text-2xl font-bold mt-3 leading-tight">{s.titre}</h3>
        <p className="mt-2 text-lg">{s.texte}</p>
        {s.points && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {s.points.map((pt) => (
              <li key={pt} className="flex gap-2">
                <Icone nom="ok" taille={18} className="mt-1 text-ink/70" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        )}
        {s.chute && <p className="mt-3 font-titre font-semibold">{s.chute}</p>}
        {s.lien && (
          <Link to={s.lien.to} className="btn btn-accent self-start mt-4">
            {s.lien.label} <Icone nom="suivant" taille={18} />
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between mt-5">
        <button type="button" className="btn btn-contour !px-3" onClick={() => aller(i - 1)} disabled={i === 0} aria-label="Astuce précédente">
          <Icone nom="retour" />
        </button>
        <span className="text-sm font-bold text-muted">
          {i + 1} / {stories.length}
        </span>
        <button type="button" className="btn btn-contour !px-3" onClick={() => aller(i + 1)} disabled={i === stories.length - 1} aria-label="Astuce suivante">
          <Icone nom="suivant" />
        </button>
      </div>
    </div>
  )
}
