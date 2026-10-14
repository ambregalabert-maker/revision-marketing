import { useState } from 'react'
import { Link } from 'react-router'
import Icone from './Icone'
import { useCompte, type StatutSync } from '../state/compte'

const LIBELLE_STATUT: Record<StatutSync, string> = {
  invite: 'Mode invité',
  chargement: 'Récupération de ta progression…',
  'a-jour': 'Progression sauvegardée en ligne ✓',
  envoi: 'Sauvegarde en cours…',
  'hors-ligne': 'Hors ligne : sauvegarde dès le retour du réseau',
}

/** Encadré « Mon compte » du profil. */
export default function Compte() {
  const compte = useCompte()
  const [confirmer, setConfirmer] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (!compte.utilisateur) {
    return (
      <section className="carte p-5 mb-4 flex flex-wrap items-center gap-3">
        <Icone nom="profil" className="text-blue-700" />
        <div className="flex-1 min-w-48">
          <p className="font-semibold">Mode invité</p>
          <p className="text-sm text-muted">
            Ta progression est sauvegardée dans ce navigateur.
            {compte.actif ? ' Crée un compte pour la retrouver sur tous tes appareils.' : ''}
          </p>
        </div>
        {compte.actif && (
          <Link to="/connexion" className="btn btn-bleu">
            Créer un compte / me connecter
          </Link>
        )}
      </section>
    )
  }

  return (
    <section className="carte p-5 mb-4" aria-labelledby="t-compte">
      <h2 id="t-compte" className="text-lg font-bold">Mon compte</h2>
      <p className="text-sm mt-1">{compte.utilisateur.email}</p>
      <p className="text-sm text-muted" role="status">
        {LIBELLE_STATUT[compte.statut]}
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <button type="button" className="btn btn-contour" onClick={() => compte.deconnecter()}>
          <Icone nom="sortie" /> Me déconnecter
        </button>
        {!confirmer && (
          <button type="button" className="btn btn-discret text-error-ink" onClick={() => setConfirmer(true)}>
            Supprimer mon compte
          </button>
        )}
      </div>
      {confirmer && (
        <div role="alertdialog" aria-labelledby="t-suppr" className="mt-3 rounded-2xl bg-error-bg border border-error p-4">
          <p id="t-suppr" className="font-semibold">Supprimer ton compte et toute ta progression en ligne ? C'est définitif.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              className="btn btn-contour !border-error text-error-ink"
              onClick={async () => {
                const e = await compte.supprimerCompte()
                setErreur(e)
                if (!e) setConfirmer(false)
              }}
            >
              Oui, supprimer définitivement
            </button>
            <button type="button" className="btn btn-bleu" autoFocus onClick={() => setConfirmer(false)}>
              Non, annuler
            </button>
          </div>
          {erreur && <p className="text-error-ink mt-2">{erreur}</p>}
        </div>
      )}
    </section>
  )
}
