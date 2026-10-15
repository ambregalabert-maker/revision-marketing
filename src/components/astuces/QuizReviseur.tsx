import { useState } from 'react'
import { Link } from 'react-router'
import Icone from '../Icone'
import astuces from '../../data/astuces.json'
import { ecrire, lire } from '../../lib/stockage'
import { useProgression } from '../../state/progression'

type IdProfil = 'sprint' | 'relecteur' | 'organise' | 'social'
const ORDRE: IdProfil[] = ['sprint', 'relecteur', 'organise', 'social']
const quiz = astuces.quiz as {
  questions: { question: string; reponses: { texte: string; profil: IdProfil }[] }[]
  profils: Record<IdProfil, { nom: string; emoji: string; couleur: string; description: string; astuces: { titre: string; texte: string; lien: { label: string; to: string } }[] }>
}
const COULEUR: Record<string, string> = { jaune: 'var(--q-jaune)', rouge: 'var(--q-rouge)', bleu: 'var(--q-bleu)', rose: 'var(--q-rose)' }
const CLE = 'rm-profil-reviseur'

/** Mini-quiz « Quel·le réviseur·se es-tu ? » : 5 questions → un profil, un graphique, 3 astuces. */
export default function QuizReviseur() {
  const { debloquerBadge } = useProgression()
  const [scores, setScores] = useState<Record<IdProfil, number> | null>(() => lire(CLE, null))
  const [enCours, setEnCours] = useState<IdProfil[] | null>(null)
  const [choixActuel, setChoixActuel] = useState<number | null>(null)

  const commencer = () => {
    setEnCours([])
    setChoixActuel(null)
  }

  const repondre = (profil: IdProfil, i: number) => {
    if (!enCours) return
    setChoixActuel(i)
    // Petite pause pour voir son choix s'allumer, puis question suivante.
    window.setTimeout(() => {
      const reponses = [...enCours, profil]
      setChoixActuel(null)
      if (reponses.length < quiz.questions.length) return setEnCours(reponses)
      const total = Object.fromEntries(ORDRE.map((id) => [id, reponses.filter((r) => r === id).length])) as Record<IdProfil, number>
      setScores(total)
      ecrire(CLE, total)
      setEnCours(null)
      debloquerBadge('profil-reviseur')
    }, 280)
  }

  // ---------- Questions ----------
  if (enCours) {
    const q = quiz.questions[enCours.length]
    return (
      <div className="carte p-5 apparition" key={enCours.length}>
        <div className="flex gap-1.5 mb-4" aria-hidden>
          {quiz.questions.map((_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < enCours.length ? 'bg-accent-500' : i === enCours.length ? 'bg-accent-400' : 'bg-blue-100'}`} />
          ))}
        </div>
        <p className="text-sm font-bold text-muted">
          Question {enCours.length + 1} / {quiz.questions.length}
        </p>
        <h3 className="text-xl font-bold mt-1">{q.question}</h3>
        <div className="flex flex-col gap-2 mt-4">
          {q.reponses.map((r, i) => (
            <button
              key={r.texte}
              type="button"
              onClick={() => repondre(r.profil, i)}
              disabled={choixActuel !== null}
              className={`text-left min-h-12 px-4 py-3 rounded-2xl border-2 font-semibold transition-colors ${
                choixActuel === i ? 'border-accent-600 bg-accent-100' : 'border-line bg-surface hover:border-blue-500'
              }`}
              style={{ boxShadow: `0 3px 0 ${choixActuel === i ? 'var(--accent-600)' : 'var(--line)'}` }}
            >
              {r.texte}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ---------- Intro ----------
  if (!scores) {
    return (
      <div className="carte p-5 overflow-hidden relative">
        <div className="flex gap-2 text-4xl" aria-hidden>
          <span className="rebond">🏃</span>
          <span className="rebond" style={{ animationDelay: '.2s' }}>📖</span>
          <span className="rebond" style={{ animationDelay: '.4s' }}>🗓️</span>
          <span className="rebond" style={{ animationDelay: '.6s' }}>👯</span>
        </div>
        <h3 className="text-xl font-bold mt-3">Quel·le réviseur·se es-tu ?</h3>
        <p className="text-muted mt-1">5 questions, 1 minute : découvre ton style de révision et les 3 astuces faites pour toi.</p>
        <button type="button" className="btn btn-accent w-full mt-4 !min-h-12" onClick={commencer}>
          Faire le quiz
        </button>
      </div>
    )
  }

  // ---------- Résultat ----------
  const total = ORDRE.reduce((s, id) => s + scores[id], 0) || 1
  const gagnant = [...ORDRE].sort((a, b) => scores[b] - scores[a])[0]
  const profil = quiz.profils[gagnant]
  return (
    <div className="carte p-5 apparition">
      <p className="text-sm font-bold text-muted">Ton profil</p>
      <div className="flex items-center gap-4 mt-2">
        <span className="pop w-20 h-20 shrink-0 rounded-3xl flex items-center justify-center text-5xl" style={{ background: COULEUR[profil.couleur] }} aria-hidden>
          {profil.emoji}
        </span>
        <div>
          <h3 className="text-2xl font-bold leading-tight">{profil.nom}</h3>
          <p className="text-muted mt-1">{profil.description}</p>
        </div>
      </div>

      {/* Graphique : la part de chaque style dans tes réponses */}
      <figure className="mt-6">
        <figcaption className="font-semibold mb-3">Ton mélange de styles</figcaption>
        <ul className="flex flex-col gap-3">
          {ORDRE.map((id, i) => {
            const pct = Math.round((scores[id] / total) * 100)
            const p = quiz.profils[id]
            return (
              <li key={id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">
                    <span aria-hidden>{p.emoji}</span> {p.nom}
                  </span>
                  <span className="font-bold tabular-nums">{pct} %</span>
                </div>
                <div className="h-4 rounded-full bg-surface-2 overflow-hidden" role="img" aria-label={`${p.nom} : ${pct} %`}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(pct, pct ? 4 : 0)}%`,
                      background: COULEUR[p.couleur],
                      transformOrigin: 'left',
                      animation: `pousser 0.9s ${i * 0.12}s ease-out both`,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </figure>

      <h4 className="font-bold mt-6 mb-2">Tes 3 astuces prioritaires</h4>
      <ol className="flex flex-col gap-2">
        {profil.astuces.map((a, i) => (
          <li key={a.titre} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2 p-3">
            <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-titre font-bold text-[#1e2a3a]" style={{ background: COULEUR[profil.couleur] }}>
              {i + 1}
            </span>
            <span className="flex-1 min-w-48">
              <span className="block font-semibold">{a.titre}</span>
              <span className="block text-sm text-muted">{a.texte}</span>
            </span>
            <Link to={a.lien.to} className="btn btn-bleu !min-h-10 !px-3 text-sm shrink-0 ml-11 sm:ml-0">
              {a.lien.label}
            </Link>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-discret w-full mt-3" onClick={commencer}>
        <Icone nom="recommencer" taille={18} /> Refaire le quiz
      </button>
    </div>
  )
}
