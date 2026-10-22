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
        className="tuile-vivante relative block overflow-hidden rounded-[2rem] p-6 md:p-8 mb-5 no-underline"
        style={{ background: 'radial-gradient(120% 140% at 100% 0%, var(--accent-500), transparent 55%), radial-gradient(90% 120% at 0% 100%, #8b6cff, transparent 60%), #121a2b', color: '#f6f7fb', boxShadow: '0 24px 60px -24px #8b6cff' }}
      >
        <span className="absolute -right-4 -top-10 text-[9rem] md:text-[12rem] leading-none opacity-20 rotate-12 select-none" aria-hidden>
          ⚡
        </span>
        <span className="relative flex items-center gap-2 font-[family-name:var(--font-affiche)] font-extrabold text-3xl md:text-5xl tracking-tight">
          <Icone nom="eclair" plein /> Lance ta séance Tryhard
        </span>
        <span className="relative block mt-2 max-w-xl text-[#d5dbe8]">5 min, 10 min, 25 min ou plus : la séance s'adapte à ton temps et à tes erreurs.</span>
        <span className="relative inline-flex items-center gap-1 mt-5 rounded-full bg-[#f6f7fb] text-[#121a2b] px-4 py-2 font-bold">
          Choisir ma durée <Icone nom="suivant" />
        </span>
      </Link>

      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-2xl">Jeux de révision 🎮</h2>
        <Link to="/jeux" className="lien text-sm font-semibold">
          Tout voir
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <CarteJeu id="pari" compacte />
        <CarteJeu id="boss" compacte />
        <CarteJeu id="explique" compacte />
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
