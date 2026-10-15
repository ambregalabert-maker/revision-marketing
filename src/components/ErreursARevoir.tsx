import { Link } from 'react-router'
import Icone from './Icone'
import { Etiquette } from './ui'
import { titreNotion, trouverItem } from '../lib/contenu'
import { erreursARevoir } from '../lib/gamification'
import { useProgression } from '../state/progression'
import type { Tentative } from '../lib/types'

/** Où aller pour retravailler une erreur. */
function lienErreur(t: Tentative): { to: string; titre: string; genre: string } {
  const trouve = trouverItem(t.itemId)
  if (!trouve) return { to: '/reviser', titre: titreNotion(t.notion), genre: 'Exercice' }
  switch (trouve.genre) {
    case 'qcm':
      return { to: `/reviser/qcm?ids=${t.itemId}`, titre: trouve.item.question, genre: 'QCM' }
    case 'flashcard':
      return { to: `/reviser/flashcards?ids=${t.itemId}`, titre: trouve.item.recto, genre: 'Flashcard' }
    case 'classement':
      return { to: `/reviser/exercices?onglet=classement&id=${t.itemId}`, titre: trouve.item.titre, genre: 'Classement' }
    case 'vraifaux':
      return { to: '/reviser/exercices?onglet=vraifaux', titre: `« ${trouve.item.affirmation} »`, genre: 'Vrai / Faux' }
    case 'cas':
      return { to: `/reviser/exercices?onglet=cas&id=${t.itemId}`, titre: trouve.item.titre, genre: 'Cas pratique' }
    case 'donnees':
      return { to: '/reviser/exercices?onglet=calculs', titre: trouve.item.question, genre: 'Calcul' }
  }
}

/** La liste « Mes erreurs à revoir », alimentée automatiquement par les mauvaises réponses. */
export default function ErreursARevoir() {
  const { p } = useProgression()
  const erreurs = erreursARevoir(p.tentatives)
  const qcmRates = erreurs.filter((e) => e.type === 'qcm').map((e) => e.itemId)

  return (
    <section id="erreurs" className="carte p-5 scroll-mt-20" aria-labelledby="titre-erreurs">
      <div className="flex items-center justify-between gap-2">
        <h2 id="titre-erreurs" className="text-lg font-bold">
          Mes erreurs à revoir
        </h2>
        {erreurs.length > 0 && <Etiquette ton="accent">{erreurs.length}</Etiquette>}
      </div>
      {erreurs.length === 0 ? (
        <p className="text-muted mt-2">
          {p.tentatives.length ? 'Aucune erreur en attente. Bravo !' : 'Tes erreurs apparaîtront ici automatiquement : ce sont elles qui te font progresser.'}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted mt-1">Réussis-les pour les faire disparaître (et gagner le badge « Revanche »).</p>
          <ul className="mt-3 flex flex-col gap-2">
            {erreurs.slice(0, 6).map((e) => {
              const l = lienErreur(e)
              return (
                <li key={e.itemId}>
                  <Link to={l.to} className="flex items-center gap-3 rounded-xl border border-line p-3 hover:border-blue-500">
                    <Icone nom="recommencer" taille={18} className="text-accent-700" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-muted">
                        {l.genre} · {titreNotion(e.notion)}
                      </span>
                      <span className="block truncate">{l.titre}</span>
                    </span>
                    <Icone nom="suivant" taille={18} className="text-muted" />
                  </Link>
                </li>
              )
            })}
          </ul>
          {qcmRates.length > 1 && (
            <Link to={`/reviser/qcm?ids=${qcmRates.join(',')}`} className="btn btn-bleu w-full mt-3">
              Refaire mes {qcmRates.length} questions de QCM ratées
            </Link>
          )}
        </>
      )}
    </section>
  )
}
