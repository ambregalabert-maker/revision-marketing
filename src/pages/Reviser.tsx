import { Link } from 'react-router'
import Page from '../components/Page'
import FiltresContenu from '../components/FiltresContenu'
import ErreursARevoir from '../components/ErreursARevoir'
import Icone, { type NomIcone } from '../components/Icone'
import { filtrer, flashcards, qcm } from '../lib/contenu'
import { nombreDuJour } from '../lib/leitner'
import { useFiltres } from '../state/filtres'
import { useProgression } from '../state/progression'

// Le mode Tryhard : la séance à durée choisie, tes erreurs, et l'accès direct à toutes les activités.
export default function Reviser() {
  const { p } = useProgression()
  const { filtres } = useFiltres()
  const cartes = filtrer(flashcards, filtres.seance, filtres.notion)
  const aRevoir = nombreDuJour(cartes, p.cartes)
  const questions = filtrer(qcm, filtres.seance, filtres.notion).length

  return (
    <Page titre="Mode Tryhard ⚡" sousTitre="Pour aller plus loin que le daily : tu choisis ta durée, tu vises tes points faibles.">
      <Link
        to="/reviser/seance"
        className="block rounded-3xl p-5 md:p-6 mb-5 bg-accent-500 text-on-accent transition-transform active:translate-y-1"
        style={{ boxShadow: '0 6px 0 var(--accent-600)' }}
      >
        <span className="flex items-center gap-2 font-titre font-bold text-xl">
          <Icone nom="eclair" plein /> Commencer une séance Tryhard
        </span>
        <span className="block mt-1">5 min, 10 min, 25 min ou plus : la séance s'adapte à ton temps et à tes erreurs.</span>
        <span className="inline-flex items-center gap-1 mt-3 font-bold">
          Choisir ma durée <Icone nom="suivant" />
        </span>
      </Link>

      <div className="mb-5">
        <ErreursARevoir />
      </div>

      <h2 className="text-lg font-bold mb-3">Ou vise une activité précise</h2>
      <div className="mb-4">
        <FiltresContenu />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Mode
          to="/reviser/flashcards"
          icone="cartes"
          titre="Flashcards"
          texte="Teste ta mémoire, carte par carte, avec la répétition espacée."
          info={aRevoir ? `${aRevoir} à réviser aujourd'hui` : 'À jour pour ce filtre ✓'}
        />
        <Mode to="/reviser/qcm" icone="qcm" titre="QCM" texte="Séries de 10 questions, en entraînement ou en mode examen noté sur 10." info={`${questions} questions`} />
        <Mode to="/reviser/exercices?onglet=calculs" icone="calcul" titre="Calculs" texte="Taux d'évolution et part de marché, avec correction pas à pas." info="Calculs illimités" />
        <Mode to="/reviser/exercices?onglet=classement" icone="main" titre="Classements" texte="Range les marchés, le micro et le macro-environnement." info="Glisser-déposer" />
        <Mode to="/reviser/exercices?onglet=vraifaux" icone="info" titre="Vrai / Faux" texte="Les 11 clichés du marketing, avec un argument nuancé." info="11 affirmations" />
        <Mode to="/reviser/exercices?onglet=cas" icone="cible" titre="Cas pratiques" texte="Des marques et des marketplaces, avec un corrigé type." info="Dont la méthode des 6 étapes" />
      </div>
    </Page>
  )
}

function Mode({ to, icone, titre, texte, info }: { to: string; icone: NomIcone; titre: string; texte: string; info: string }) {
  return (
    <Link to={to} className="carte p-5 flex flex-col gap-2 hover:border-blue-500 transition-colors">
      <span className="flex items-center gap-2 font-titre font-semibold text-lg">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-700">
          <Icone nom={icone} />
        </span>
        {titre}
      </span>
      <span className="text-muted flex-1">{texte}</span>
      <span className="text-sm font-bold text-blue-700">{info}</span>
    </Link>
  )
}
