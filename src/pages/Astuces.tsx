import type { ReactNode } from 'react'
import Page from '../components/Page'
import QuizReviseur from '../components/astuces/QuizReviseur'
import Stories from '../components/astuces/Stories'
import RepereErreur from '../components/astuces/RepereErreur'
import SemaineType from '../components/astuces/SemaineType'
import astuces from '../data/astuces.json'

// Astuces & conseils, version ludique : un quiz, des « stories », un mini-jeu et une liste à cocher.
// Tout le texte vient de src/data/astuces.json.
export default function Astuces() {
  return (
    <Page titre="Astuces" sousTitre="La méthode pour réviser mieux, pas plus.">
      <p
        className="rounded-3xl bg-accent-100 border-2 border-accent-500 p-5 font-titre font-semibold text-xl text-center mb-6"
        style={{ boxShadow: '0 5px 0 var(--accent-500)' }}
      >
        {astuces.accroche}
      </p>

      <Bloc id="quiz" titre="Quel·le réviseur·se es-tu ?" emoji="🔮">
        <QuizReviseur />
      </Bloc>
      <Bloc id="stories" titre="Les astuces en 1 minute" emoji="📱" aide="Fais défiler les cartes (ou balaie avec le doigt).">
        <Stories />
      </Bloc>
      <Bloc id="pieges" titre="Repère l'erreur" emoji="🕵️" aide="Les pièges classiques du chapitre 1, cachés dans une copie. Sauras-tu tous les trouver ?">
        <RepereErreur />
      </Bloc>
      <Bloc id="semaine" titre="Ta semaine type" emoji="✅">
        <SemaineType />
      </Bloc>
    </Page>
  )
}

function Bloc({ id, titre, emoji, aide, children }: { id: string; titre: string; emoji: string; aide?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`t-${id}`} className="mb-8 scroll-mt-20">
      <h2 id={`t-${id}`} className="text-xl font-bold flex items-center gap-2">
        <span aria-hidden>{emoji}</span> {titre}
      </h2>
      {aide && <p className="text-sm text-muted mt-1">{aide}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}
