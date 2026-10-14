import { Link } from 'react-router'
import { notions } from '../lib/contenu'
import { LIBELLE_MAITRISE, maitrise, type NiveauMaitrise } from '../lib/gamification'
import { changerFiltres } from '../state/filtres'
import { useProgression } from '../state/progression'
import Icone, { type NomIcone } from './Icone'
import { Barre } from './ui'

const STYLE: Record<NiveauMaitrise, { couleur: 'erreur' | 'attention' | 'succes' | 'bleu'; icone: NomIcone; texte: string }> = {
  nouveau: { couleur: 'bleu', icone: 'plus', texte: 'text-muted' },
  'a-revoir': { couleur: 'erreur', icone: 'erreur', texte: 'text-error-ink' },
  'en-cours': { couleur: 'attention', icone: 'recommencer', texte: 'text-orange-700' },
  maitrise: { couleur: 'succes', icone: 'ok', texte: 'text-success-ink' },
}

/**
 * Barres de maîtrise par notion : % de réussite sur les 10 dernières réponses.
 * Chaque niveau a une couleur ET une icône ET un texte (jamais la couleur seule).
 */
export default function MaitriseNotions() {
  const { p } = useProgression()
  return (
    <ul className="flex flex-col gap-3">
      {notions.map((n) => {
        const m = maitrise(p.tentatives, n.id)
        const s = STYLE[m.niveau]
        return (
          <li key={n.id}>
            <Link
              to="/reviser/flashcards"
              onClick={() => changerFiltres({ seance: String(n.seance) as '1' | '2', notion: n.id })}
              className="block rounded-xl p-2 -m-2 hover:bg-surface-2"
              aria-label={`${n.titre} : ${LIBELLE_MAITRISE[m.niveau]}${m.nb ? `, ${m.taux} % de réussite` : ''}. Réviser cette notion.`}
            >
              <span className="flex items-center justify-between gap-2 text-sm mb-1">
                <span className="font-semibold">
                  {n.titre} <span className="font-normal text-muted">· S{n.seance}</span>
                </span>
                <span className={`flex items-center gap-1 font-bold whitespace-nowrap ${s.texte}`}>
                  <Icone nom={s.icone} taille={14} />
                  {m.nb ? `${m.taux} %` : ''} {LIBELLE_MAITRISE[m.niveau]}
                </span>
              </span>
              <Barre valeur={m.nb ? Math.max(m.taux, 4) : 0} label={`Maîtrise : ${n.titre}`} couleur={s.couleur} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
