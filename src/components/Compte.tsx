import { Link } from 'react-router'
import Icone from './Icone'

// Encadré « Mon compte » du profil (la connexion Supabase est branchée à l'étape suivante).
export default function Compte() {
  return (
    <section className="carte p-5 mb-4 flex items-center gap-3">
      <Icone nom="profil" className="text-blue-700" />
      <div className="flex-1">
        <p className="font-semibold">Mode invité</p>
        <p className="text-sm text-muted">Ta progression est sauvegardée dans ce navigateur.</p>
      </div>
      <Link to="/connexion" className="btn btn-bleu">
        Créer un compte
      </Link>
    </section>
  )
}
