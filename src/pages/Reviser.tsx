import { Link } from 'react-router'
import Page from '../components/Page'
import FiltresContenu from '../components/FiltresContenu'
import Icone, { type NomIcone } from '../components/Icone'
import { filtrer, flashcards, qcm } from '../lib/contenu'
import { nombreDuJour } from '../lib/leitner'
import { useFiltres } from '../state/filtres'
import { useProgression } from '../state/progression'

// Le hub « Réviser » : la séance guidée en vedette, puis les 3 modes.
export default function Reviser() {
  const { p } = useProgression()
  const { filtres } = useFiltres()
  const cartes = filtrer(flashcards, filtres.seance, filtres.notion)
  const aRevoir = nombreDuJour(cartes, p.cartes)
  const questions = filtrer(qcm, filtres.seance, filtres.notion).length

  return (
    <Page titre="Réviser" sousTitre="Choisis ce que tu révises, puis ta façon de t'entraîner.">
      <Link
        to="/reviser/seance"
        className="block rounded-3xl p-5 md:p-6 mb-5 bg-orange-500 text-on-orange shadow-carte hover:bg-orange-400 transition-colors"
      >
        <span className="flex items-center gap-2 font-titre font-bold text-xl">
          <Icone nom="minuteur" /> Séance guidée · 25 minutes
        </span>
        <span className="block mt-1">
          Tes flashcards du jour → 5 questions sur ta notion la plus faible → 1 exercice d'application. Le minuteur est inclus.
        </span>
        <span className="inline-flex items-center gap-1 mt-3 font-bold">
          Commencer ma séance <Icone nom="suivant" />
        </span>
      </Link>

      <div className="mb-5">
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
        <Mode
          to="/reviser/exercices?onglet=calculs"
          icone="calcul"
          titre="Calculs"
          texte="Taux d'évolution et part de marché, avec correction pas à pas."
          info="Calculs illimités"
        />
        <Mode
          to="/reviser/exercices?onglet=classement"
          icone="main"
          titre="Classements"
          texte="Range les marchés, le micro et le macro-environnement."
          info="Glisser-déposer"
        />
        <Mode to="/reviser/exercices?onglet=vraifaux" icone="info" titre="Vrai / Faux" texte="Les 11 clichés du marketing, avec un argument nuancé." info="11 affirmations" />
        <Mode
          to="/reviser/exercices?onglet=cas"
          icone="cible"
          titre="Cas pratiques"
          texte="Des marques et des marketplaces, avec un corrigé type."
          info="Dont la méthode des 6 étapes"
        />
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
