import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import DeroulementSeance, { type Score } from '../components/revision/DeroulementSeance'
import Icone from '../components/Icone'
import { Etoile } from '../components/Chemin'
import { ETAPES, SEUIL_REUSSITE, etapeDuJour, prochaineEtoile } from '../lib/chemin'
import { planDaily } from '../lib/plan'
import { encouragement } from '../lib/gamification'
import { formatDans } from '../lib/dates'
import { useProgression } from '../state/progression'
import MonCompagnon from '../components/MonCompagnon'
import { XP_PAR_MARK } from '../lib/boutique'

/**
 * Mode daily : la mini-séance d'environ 3 minutes d'une étape du chemin.
 * Pas de minuteur ici : on joue, tout simplement.
 */
export default function Daily() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { p, terminerEtape } = useProgression()
  const etape = ETAPES.find((e) => e.id === id)
  // Le programme est figé à l'ouverture (sinon il changerait à chaque réponse).
  const plan = useMemo(() => (etape ? planDaily(etape, p) : null), [etape?.id]) // volontairement figé
  const debut = useRef(Date.now())
  const xpDepart = useRef(p.stats.xpTotal)
  const [resultat, setResultat] = useState<{ score: Score; avant: number; apres: number } | null>(null)

  useEffect(() => {
    document.title = `${etape?.titre ?? 'Étape'} · Mark'Up`
  }, [etape])

  if (!etape || !plan) {
    return (
      <div className="carte p-6">
        <p>Cette étape n'existe pas.</p>
        <Link to="/" className="btn btn-accent mt-4">
          Revenir au chemin
        </Link>
      </div>
    )
  }

  const fin = (score: Score) => {
    const reussi = score.total === 0 || score.justes / score.total >= SEUIL_REUSSITE
    const minutes = Math.max(1, Math.round((Date.now() - debut.current) / 60_000))
    const r = terminerEtape(etape.id, reussi, minutes)
    setResultat({ score, ...r })
    window.scrollTo(0, 0)
  }

  if (resultat) {
    const nouvelle = resultat.apres > resultat.avant
    const pct = resultat.score.total ? Math.round((resultat.score.justes / resultat.score.total) * 100) : 100
    const prochaine = prochaineEtoile(p.chemin[etape.id])
    const suivante = etapeDuJour(p)
    let message: string
    if (nouvelle && resultat.apres === 1) message = 'Première étoile ! Reviens demain pour gagner la deuxième.'
    else if (nouvelle && resultat.apres === 2) message = 'Deuxième étoile ! La troisième se gagne dans une semaine : ta mémoire aura bien travaillé.'
    else if (nouvelle && resultat.apres === 3) message = 'Trois étoiles : cette notion est en or. Tu la connais vraiment !'
    else if (resultat.apres >= 3) message = 'Déjà 3 étoiles ici : cette révision consolide ta mémoire.'
    else if (pct < SEUIL_REUSSITE * 100) message = `Il faut 70 % de bonnes réponses pour l'étoile suivante. Tu es à ${pct} % : retente quand tu veux, chaque essai compte.`
    else message = `Bien joué ! La prochaine étoile sera disponible ${prochaine ? formatDans(prochaine) : 'bientôt'}.`

    return (
      <div className="flex flex-col items-center text-center gap-5 apparition pt-4">
        <p className="text-sm font-bold text-muted">{etape.titre}</p>
        <MonCompagnon taille={120} humeur={nouvelle ? 'fete' : 'content'} anime />
        <div className="flex items-end gap-2" role="img" aria-label={`${resultat.apres} étoile${resultat.apres > 1 ? 's' : ''} sur 3`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n === resultat.apres && nouvelle ? 'pop' : ''} style={{ animationDelay: `${n * 0.12}s` }}>
              <Etoile pleine={n <= resultat.apres} taille={n === 2 ? 72 : 56} />
            </span>
          ))}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{nouvelle ? 'Étoile gagnée !' : 'Étape terminée !'}</h1>
          <p className="text-muted mt-2 max-w-sm">{message}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
          <div className="carte p-3">
            <p className="font-titre font-bold text-2xl text-ink">{pct} %</p>
            <p className="text-xs text-muted">de bonnes réponses</p>
          </div>
          <div className="carte p-3">
            <p className="font-titre font-bold text-2xl text-gold-ink">+{p.stats.xpTotal - xpDepart.current}</p>
            <p className="text-xs text-muted">XP gagnés</p>
          </div>
          <div className="carte p-3">
            <p className="font-titre font-bold text-2xl text-gold-ink">
              +{Math.floor(p.stats.xpTotal / XP_PAR_MARK) - Math.floor(xpDepart.current / XP_PAR_MARK)}
            </p>
            <p className="text-xs text-muted">🪙 Marks</p>
          </div>
        </div>
        <p className="text-muted text-sm">{encouragement()}</p>
        <div className="flex flex-col gap-2 w-full max-w-sm">
          {suivante.id !== etape.id && (
            <button type="button" className="btn btn-accent !min-h-14 text-lg" onClick={() => navigate(`/chemin/${suivante.id}`, { replace: true })}>
              Étape suivante : {suivante.titre}
            </button>
          )}
          <Link to="/" className={`btn ${suivante.id !== etape.id ? 'btn-contour' : 'btn-accent !min-h-14 text-lg'}`}>
            Retour au chemin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="apparition">
      <DeroulementSeance
        plan={plan}
        onFin={fin}
        entete={
          <Link to="/" className="flex items-center justify-center w-11 h-11 -ml-2 text-muted rounded-full hover:bg-surface-2" aria-label="Quitter l'étape et revenir au chemin">
            <Icone nom="non" />
          </Link>
        }
      />
    </div>
  )
}
