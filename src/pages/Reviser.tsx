import { Link } from 'react-router'
import Page from '../components/Page'
import { CarteJeu } from './Jeux'
import FiltresContenu from '../components/FiltresContenu'
import ErreursARevoir from '../components/ErreursARevoir'
import Icone, { type NomIcone } from '../components/Icone'
import { filtrer, flashcards, qcm, vraiFaux } from '../lib/contenu'
import { nombreDuJour } from '../lib/leitner'
import { useFiltres } from '../state/filtres'
import { useProgression } from '../state/progression'

// Le mode Tryhard : la séance à durée choisie, tes erreurs, et l'accès direct à toutes les activités.
export default function Reviser() {
  const { p } = useProgression()
  const { filtres } = useFiltres()
  const cartes = filtrer(flashcards, filtres.chapitre, filtres.notion)
  const aRevoir = nombreDuJour(cartes, p.cartes)
  const questions = filtrer(qcm, filtres.chapitre, filtres.notion).length

  return (
    <Page titre="Mode Tryhard ⚡" sousTitre="Pour aller plus loin que le daily : tu choisis ta durée, tu vises tes points faibles.">
      <Link
        to="/reviser/seance"
        className="carte !border-blue-500/40 flex items-center gap-4 p-4 md:p-5 mb-5 no-underline hover:!border-blue-500"
      >
        <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 text-3xl shrink-0" aria-hidden>
          ⚡
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-black text-lg text-ink">Lance ta séance Tryhard</span>
          <span className="block text-sm text-muted">5, 10, 25 min ou plus : la séance s'adapte à ton temps et à tes erreurs.</span>
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-ink text-bg px-3 py-2 text-sm font-extrabold uppercase tracking-wider shrink-0">
          💪 Tryhard
        </span>
      </Link>

      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-2xl">Jeux de révision 🎮</h2>
        <Link to="/jeux" className="lien text-sm font-semibold">
          Tout voir
        </Link>
      </div>
      <div className="flex sm:grid sm:grid-cols-3 gap-3 mb-6 overflow-x-auto snap-x snap-mandatory sans-barre -mx-4 px-4 pb-2 sm:mx-0 sm:px-0">
        <CarteJeu id="pari" compacte className="shrink-0 w-[78%] sm:w-auto snap-start" />
        <CarteJeu id="boss" compacte className="shrink-0 w-[78%] sm:w-auto snap-start" />
        <CarteJeu id="explique" compacte className="shrink-0 w-[78%] sm:w-auto snap-start" />
      </div>

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
        <Mode to="/reviser/exercices?onglet=classement" icone="main" titre="Classements" texte="Range les notions du cours : marchés, étapes, critères, stratégies…" info="Glisser-déposer" />
        <Mode to="/reviser/exercices?onglet=vraifaux" icone="info" titre="Vrai / Faux" texte="Les clichés du marketing, avec un argument nuancé." info={`${filtrer(vraiFaux, filtres.chapitre, filtres.notion).length} affirmations`} />
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
