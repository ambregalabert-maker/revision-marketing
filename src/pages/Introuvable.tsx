import { Link } from 'react-router'
import Page from '../components/Page'

export default function Introuvable() {
  return (
    <Page titre="Page introuvable" sousTitre="Cette adresse n'existe pas (ou plus).">
      <Link to="/" className="btn btn-orange">Revenir à l'accueil</Link>
    </Page>
  )
}
