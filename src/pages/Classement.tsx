import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import Page from '../components/Page'
import Icone from '../components/Icone'
import { xpDeLaSemaine } from '../lib/gamification'
import { useCompte } from '../state/compte'
import { useProgression } from '../state/progression'

interface Ligne {
  pseudo: string
  xp_semaine: number
}

/**
 * Classement de la classe : volontaire, désactivé par défaut, avec un pseudo (jamais l'e-mail).
 * XP de la semaine seulement : tout le monde repart de zéro le lundi.
 */
export default function Classement() {
  const compte = useCompte()
  const { p, majProfil } = useProgression()
  const [lignes, setLignes] = useState<Ligne[] | null>(null)
  const [erreur, setErreur] = useState(false)
  const [pseudo, setPseudo] = useState(p.profil.pseudo)
  const participe = p.profil.apparaitClassement && p.profil.pseudo.trim().length > 0

  const charger = useCallback(async () => {
    if (!compte.client || !compte.utilisateur) return
    const { data, error } = await compte.client.from('classement_semaine').select('pseudo, xp_semaine').order('xp_semaine', { ascending: false }).limit(50)
    setErreur(!!error)
    if (!error) setLignes((data ?? []) as Ligne[])
  }, [compte.client, compte.utilisateur])

  useEffect(() => {
    charger()
    const t = window.setInterval(charger, 15_000)
    return () => window.clearInterval(t)
  }, [charger])

  const entete = (
    <p className="text-muted mb-4">
      Facultatif et volontaire : tu choisis d'apparaître, sous un <strong>pseudo</strong> (jamais ton e-mail). On compte seulement les <strong>XP de la semaine</strong> : remise à zéro chaque lundi, pour que tout le monde puisse remonter.
    </p>
  )

  if (!compte.actif || !compte.utilisateur) {
    return (
      <Page titre="Classement de la classe">
        {entete}
        <div className="carte p-5">
          <p className="font-semibold flex items-center gap-2">
            <Icone nom="info" className="text-blue-700" />
            {compte.actif ? 'Il faut un compte pour participer au classement.' : "Le classement n'est pas encore activé sur ce site."}
          </p>
          <p className="text-muted mt-1">Tes XP de la semaine en mode invité : {xpDeLaSemaine(p.stats)} XP.</p>
          {compte.actif && (
            <Link to="/connexion" className="btn btn-bleu mt-4">
              Créer un compte / me connecter
            </Link>
          )}
        </div>
      </Page>
    )
  }

  const enregistrer = () => {
    const propre = pseudo.trim().slice(0, 20)
    setPseudo(propre)
    majProfil({ pseudo: propre, apparaitClassement: propre.length > 0 })
    window.setTimeout(charger, 4000)
  }

  return (
    <Page titre="Classement de la classe">
      {entete}

      <section className="carte p-5 mb-4" aria-labelledby="t-participer">
        <h2 id="t-participer" className="font-bold text-lg">Ma participation</h2>
        {participe ? (
          <>
            <p className="mt-1">
              Tu apparais sous le pseudo <strong>« {p.profil.pseudo} »</strong> avec {xpDeLaSemaine(p.stats)} XP cette semaine.
            </p>
            <button type="button" className="btn btn-contour mt-3" onClick={() => majProfil({ apparaitClassement: false })}>
              Ne plus apparaître dans le classement
            </button>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <label className="flex-1 flex flex-col gap-1 text-sm font-semibold">
              Choisis un pseudo (pas ton nom complet)
              <input
                value={pseudo}
                maxLength={20}
                onChange={(e) => setPseudo(e.target.value)}
                className="min-h-12 rounded-xl border-2 border-line bg-surface px-3 text-base font-normal focus:border-blue-500 outline-none"
                placeholder="ex. LaReineDuMarketing"
              />
            </label>
            <button type="button" className="btn btn-orange sm:self-end" disabled={!pseudo.trim()} onClick={enregistrer}>
              Apparaître dans le classement
            </button>
          </div>
        )}
      </section>

      <section className="carte p-5" aria-labelledby="t-top">
        <h2 id="t-top" className="font-bold text-lg mb-3">Cette semaine</h2>
        {erreur && <p className="text-error-ink">Impossible de charger le classement pour l'instant.</p>}
        {lignes === null && !erreur && <p className="text-muted">Chargement…</p>}
        {lignes && lignes.length === 0 && <p className="text-muted">Personne pour l'instant : sois le premier ou la première !</p>}
        {lignes && lignes.length > 0 && (
          <ol className="flex flex-col gap-1">
            {lignes.map((l, i) => {
              const moi = participe && l.pseudo === p.profil.pseudo
              return (
                <li key={`${l.pseudo}-${i}`} className={`flex items-center gap-3 rounded-xl px-3 min-h-11 ${moi ? 'bg-orange-100 font-bold' : i % 2 ? '' : 'bg-surface-2'}`}>
                  <span className="w-8 font-titre font-bold text-blue-700">{i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`}</span>
                  <span className="flex-1 truncate">
                    {l.pseudo}
                    {moi && ' (toi)'}
                  </span>
                  <span className="tabular-nums">{l.xp_semaine} XP</span>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </Page>
  )
}
