import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import Page from '../components/Page'
import Icone from '../components/Icone'
import MonCompagnon from '../components/MonCompagnon'
import { confettis } from '../components/Celebrations'
import { flashcards, melanger, qcm, titreNotion, vraiFaux } from '../lib/contenu'
import { XP } from '../lib/gamification'
import { useProgression } from '../state/progression'
import type { NotionId, Seance } from '../lib/types'

// Les modes de jeu, chacun appuyé sur une méthode de révision qui a fait ses preuves :
// - Le Pari : on mise sur sa confiance. Une erreur faite « en étant sûr·e » se corrige
//   particulièrement bien quand on voit la bonne réponse (effet d'hypercorrection).
// - Le Boss : des questions de toutes les notions mélangées (pratique de récupération + entrelacement).
// - Explique-moi : expliquer avec ses mots avant de voir la réponse (auto-explication).
// Toutes les questions viennent du cours (src/data), rien n'est inventé.

const JEUX = [
  {
    id: 'pari',
    titre: 'Le Pari',
    emoji: '🎲',
    accroche: 'Mise sur ta confiance',
    texte: 'Réponds, puis parie : un peu sûr·e, sûr·e ou certain·e ? Les erreurs « certaines » sont celles qu’on retient le mieux une fois corrigées.',
    methode: 'Effet d’hypercorrection',
    fond: '#c2385f',
    ombre: '#962746',
  },
  {
    id: 'boss',
    titre: 'Le Boss du chapitre',
    emoji: '👾',
    accroche: 'Bats le boss en 3 vies',
    texte: 'Toutes les notions mélangées. Chaque bonne réponse lui retire un point de vie, chaque erreur t’en coûte un. Tu as 3 cœurs.',
    methode: 'Récupération + entrelacement',
    fond: '#6c4cf5',
    ombre: '#4d32c4',
  },
  {
    id: 'explique',
    titre: 'Explique-moi',
    emoji: '🗣️',
    accroche: 'Deviens le prof',
    texte: 'Ton compagnon ne connaît rien au marketing : explique-lui une notion avec tes mots, puis compare avec le cours.',
    methode: 'Auto-explication',
    fond: '#137a5c',
    ombre: '#0d5a43',
  },
] as const

type IdJeu = (typeof JEUX)[number]['id']

export default function Jeux() {
  const { jeu } = useParams()
  if (jeu === 'pari') return <Pari />
  if (jeu === 'boss') return <Boss />
  if (jeu === 'explique') return <Explique />
  return (
    <Page titre="Jeux de révision 🎮" sousTitre="Trois façons de réviser en jouant, chacune basée sur une méthode qui marche vraiment.">
      <div className="grid gap-4 md:grid-cols-3">
        {JEUX.map((j) => (
          <CarteJeu key={j.id} id={j.id} />
        ))}
      </div>
      <p className="text-sm text-muted mt-6">Toutes les questions viennent de ton cours. Chaque bonne réponse rapporte des XP, et tes erreurs rejoignent « Mes erreurs à revoir ».</p>
    </Page>
  )
}

/** Une grande carte façon affiche pour lancer un jeu. */
export function CarteJeu({ id, compacte = false, className = '' }: { id: IdJeu; compacte?: boolean; className?: string }) {
  const j = JEUX.find((x) => x.id === id)!
  return (
    <Link
      to={`/jeux/${j.id}`}
      className={`tuile-vivante relative flex flex-col overflow-hidden rounded-[18px] no-underline ${compacte ? 'p-4 min-h-40' : 'p-5 min-h-64'} ${className}`}
      style={{ background: j.fond, color: '#ffffff', boxShadow: `0 4px 0 ${j.ombre}` }}
    >
      <span className="absolute right-3 top-3 text-4xl leading-none select-none" aria-hidden>
        {j.emoji}
      </span>
      <span className="relative text-xs font-extrabold uppercase tracking-widest text-[#f6f7fb]/80">{j.methode}</span>
      <span className="relative font-black text-2xl mt-1">{j.titre}</span>
      <span className="relative font-semibold mt-1">{j.accroche}</span>
      {!compacte && <span className="relative text-sm opacity-95 mt-3 flex-1">{j.texte}</span>}
      <span className="relative inline-flex self-start items-center gap-1 mt-auto pt-3 font-extrabold text-sm uppercase tracking-wider">
        Jouer <Icone nom="suivant" taille={16} />
      </span>
    </Link>
  )
}

// ---------- Outils communs ----------

interface QuestionJeu {
  id: string
  type: 'qcm' | 'exercice'
  notion: NotionId
  seance: Seance
  enonce: string
  choix: { texte: string; correct: boolean }[]
  explication: string
}

/** QCM à une seule bonne réponse, au format du jeu. */
function questionsQcm(): QuestionJeu[] {
  return qcm
    .filter((q) => !q.multiple && q.choix.filter((c) => c.correct).length === 1)
    .map((q) => ({
      id: q.id,
      type: 'qcm' as const,
      notion: q.notion,
      seance: q.seance,
      enonce: q.question,
      choix: melanger(q.choix.map((c) => ({ texte: c.texte, correct: c.correct }))),
      explication: q.explication,
    }))
}

/** Les affirmations Vrai / Faux qui ont une réponse nette (pas les « ça dépend »). */
function questionsVraiFaux(): QuestionJeu[] {
  return vraiFaux
    .filter((v) => v.reponse !== 'nuance')
    .map((v) => ({
      id: v.id,
      type: 'exercice' as const,
      notion: v.notion,
      seance: v.seance,
      enonce: `Vrai ou faux ? « ${v.affirmation} »`,
      choix: [
        { texte: 'Vrai', correct: v.reponse === 'vrai' },
        { texte: 'Faux', correct: v.reponse === 'faux' },
      ],
      explication: `${v.verdict} ${v.argument}`,
    }))
}

function EnTeteJeu({ titre, children }: { titre: string; children?: ReactNode }) {
  useEffect(() => {
    document.title = `${titre} · Mark'Up`
  }, [titre])
  return (
    <div className="flex items-center gap-3 mb-5">
      <Link to="/jeux" className="flex items-center justify-center w-11 h-11 -ml-2 text-muted rounded-full hover:bg-surface-2" aria-label="Quitter le jeu">
        <Icone nom="non" />
      </Link>
      <h1 className="text-2xl md:text-4xl flex-1">{titre}</h1>
      {children}
    </div>
  )
}

/** Les propositions d'une question, avec la correction une fois répondu. */
function Choix({
  question,
  reponse,
  onChoisir,
  desactive,
  selection,
}: {
  question: QuestionJeu
  reponse: number | null
  onChoisir: (i: number) => void
  desactive?: boolean
  selection?: number | null
}) {
  return (
    <div className="flex flex-col gap-2 mt-4" role="group" aria-label="Propositions">
      {question.choix.map((c, i) => {
        const montre = reponse !== null
        const etat = montre && c.correct ? 'juste' : montre && i === reponse ? 'faux' : null
        return (
          <button
            key={i}
            type="button"
            disabled={desactive || montre}
            onClick={() => onChoisir(i)}
            className={`text-left rounded-2xl border-2 px-4 py-3 min-h-12 font-semibold transition-colors ${
              etat === 'juste'
                ? 'border-success bg-success-bg text-success-ink'
                : etat === 'faux'
                  ? 'border-error bg-error-bg text-error-ink'
                  : selection === i
                    ? 'border-accent-600 bg-accent-100'
                    : 'border-line bg-surface hover:border-blue-500 disabled:hover:border-line'
            }`}
            aria-pressed={selection !== undefined ? selection === i : undefined}
          >
            {etat === 'juste' && <span className="sr-only">Bonne réponse : </span>}
            {etat === 'faux' && <span className="sr-only">Ta réponse, fausse : </span>}
            {c.texte}
          </button>
        )
      })}
    </div>
  )
}

function Fin({ titre, texte, humeur, children, rejouer }: { titre: string; texte: ReactNode; humeur: 'fete' | 'content' | 'reflechit'; children?: ReactNode; rejouer: () => void }) {
  return (
    <div className="apparition flex flex-col items-center text-center gap-4 pt-2">
      <MonCompagnon taille={150} humeur={humeur} anime />
      <h2 className="text-3xl md:text-5xl">{titre}</h2>
      <div className="text-muted max-w-lg">{texte}</div>
      {children}
      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
        <button type="button" className="btn btn-accent flex-1 !min-h-13" onClick={rejouer}>
          <Icone nom="recommencer" /> Rejouer
        </button>
        <Link to="/jeux" className="btn btn-contour flex-1 !min-h-13">
          Autres jeux
        </Link>
      </div>
    </div>
  )
}

// ---------- Le Pari ----------

const MISES = [
  { valeur: 1, label: 'Un peu', emoji: '🙂' },
  { valeur: 2, label: 'Sûr·e', emoji: '😎' },
  { valeur: 3, label: 'Certain·e', emoji: '🔥' },
] as const

function Pari() {
  const { repondre, terminerSession } = useProgression()
  const [partie, setPartie] = useState(0)
  const questions = useMemo(() => melanger(questionsQcm()).slice(0, 8), [partie])
  const [i, setI] = useState(0)
  const [choix, setChoix] = useState<number | null>(null)
  const [mise, setMise] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [historique, setHistorique] = useState<{ q: QuestionJeu; juste: boolean; mise: number }[]>([])
  const debut = useRef(Date.now())
  const q = questions[i]
  const fini = i >= questions.length

  const valider = (m: number) => {
    if (choix === null || !q) return
    setMise(m)
    const juste = q.choix[choix].correct
    repondre({ itemId: q.id, type: 'qcm', notion: q.notion, seance: q.seance, correct: juste }, XP.qcmJuste)
    setScore((s) => Math.max(0, s + (juste ? m * 10 : -m * 5)))
    setHistorique((h) => [...h, { q, juste, mise: m }])
  }

  const suivante = () => {
    setI((n) => n + 1)
    setChoix(null)
    setMise(null)
  }

  useEffect(() => {
    if (!fini) return
    terminerSession('libre', Math.max(1, Math.round((Date.now() - debut.current) / 60_000)), 10)
    if (historique.filter((h) => h.juste).length >= 6) confettis()
  }, [fini]) // eslint-disable-line react-hooks/exhaustive-deps

  const rejouer = () => {
    setPartie((n) => n + 1)
    setI(0)
    setChoix(null)
    setMise(null)
    setScore(0)
    setHistorique([])
    debut.current = Date.now()
  }

  if (fini) {
    const surprises = historique.filter((h) => !h.juste && h.mise === 3)
    const justes = historique.filter((h) => h.juste).length
    const bienCalibre = historique.filter((h) => (h.juste && h.mise >= 2) || (!h.juste && h.mise === 1)).length
    return (
      <div className="max-w-2xl mx-auto">
        <EnTeteJeu titre="Le Pari 🎲" />
        <Fin
          titre={`${score} points`}
          humeur={justes >= 6 ? 'fete' : 'content'}
          rejouer={rejouer}
          texte={
            <>
              {justes} bonne{justes > 1 ? 's' : ''} réponse{justes > 1 ? 's' : ''} sur {historique.length}. Tes paris étaient bien ajustés {bienCalibre} fois sur {historique.length} : plus tu sais quand tu sais, mieux tu révises.
            </>
          }
        >
          {surprises.length > 0 && (
            <div className="carte p-5 text-left w-full">
              <p className="surtitre">Tes erreurs « surprise » 💥</p>
              <p className="text-sm text-muted mt-1 mb-3">Tu étais certain·e… et c’était faux. Bonne nouvelle : ce sont les erreurs qu’on retient le mieux une fois corrigées. Relis-les bien :</p>
              <ul className="flex flex-col gap-3">
                {surprises.map((s) => (
                  <li key={s.q.id} className="rounded-xl bg-surface-2 p-3">
                    <p className="font-semibold">{s.q.enonce}</p>
                    <p className="text-sm mt-1">
                      <span className="text-success-ink font-bold">Réponse : {s.q.choix.find((c) => c.correct)?.texte}</span>
                    </p>
                    <p className="text-sm text-muted mt-1">{s.q.explication}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Fin>
      </div>
    )
  }

  if (!q) return null
  const juste = choix !== null && mise !== null ? q.choix[choix].correct : null
  return (
    <div className="max-w-2xl mx-auto">
      <EnTeteJeu titre="Le Pari 🎲">
        <span className="rounded-full bg-gold-bg text-gold-ink font-extrabold px-4 py-2 tabular-nums" aria-label={`Score : ${score} points`}>
          {score} pts
        </span>
      </EnTeteJeu>
      <Progression actuel={i + 1} total={questions.length} />
      <section className="carte p-5 md:p-6 mt-4">
        <p className="surtitre">{titreNotion(q.notion)}</p>
        <h2 className="text-xl md:text-2xl mt-1 mb-4 font-[family-name:var(--font-titre)] tracking-tight">{q.enonce}</h2>
        <Choix question={q} reponse={mise !== null ? choix : null} onChoisir={setChoix} desactive={mise !== null} selection={choix} />
        {choix !== null && mise === null && (
          <div className="apparition mt-5">
            <p className="font-bold mb-2">Tu as choisi « {q.choix[choix].texte} ». À quel point es-tu sûr·e ?</p>
            <div className="grid grid-cols-3 gap-2">
              {MISES.map((m) => (
                <button key={m.valeur} type="button" className="btn btn-contour !flex-col !min-h-20 !gap-0.5" onClick={() => valider(m.valeur)}>
                  <span className="text-2xl" aria-hidden>
                    {m.emoji}
                  </span>
                  {m.label}
                  <span className="text-xs text-muted font-semibold">
                    +{m.valeur * 10} / −{m.valeur * 5}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-2">Tu peux encore changer de réponse avant de parier.</p>
          </div>
        )}
        {mise !== null && (
          <div className={`apparition mt-5 rounded-2xl p-4 ${juste ? 'bg-success-bg' : 'bg-error-bg'}`} role="status">
            <p className={`font-extrabold ${juste ? 'text-success-ink' : 'text-error-ink'}`}>
              {juste ? `Gagné ! +${mise * 10} points` : mise === 3 ? `Erreur surprise ! −${mise * 5} points… mais celle-là, tu vas la retenir 💥` : `Raté : −${mise * 5} points`}
            </p>
            <p className="text-sm mt-1">{q.explication}</p>
            <button type="button" className="btn btn-accent mt-3" onClick={suivante} autoFocus>
              {i + 1 < questions.length ? 'Question suivante' : 'Voir mon score'} <Icone nom="suivant" />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

function Progression({ actuel, total }: { actuel: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-muted tabular-nums">
        {actuel} / {total}
      </span>
      <div className="flex-1 h-2.5 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={actuel} aria-label="Avancement">
        <div className="h-full rounded-full bg-accent-500 transition-[width] duration-500" style={{ width: `${(actuel / total) * 100}%` }} />
      </div>
    </div>
  )
}

// ---------- Le Boss ----------

const PV_BOSS = 10
const VIES = 3

function Boss() {
  const { repondre, terminerSession } = useProgression()
  const [partie, setPartie] = useState(0)
  const questions = useMemo(() => melanger([...questionsQcm(), ...questionsVraiFaux()]), [partie])
  const [i, setI] = useState(0)
  const [choix, setChoix] = useState<number | null>(null)
  const [pv, setPv] = useState(PV_BOSS)
  const [vies, setVies] = useState(VIES)
  const [coup, setCoup] = useState<'boss' | 'toi' | null>(null)
  const debut = useRef(Date.now())
  const q = questions[i % questions.length]
  const gagne = pv <= 0
  const perdu = vies <= 0
  const fini = gagne || perdu

  const repondreBoss = (k: number) => {
    setChoix(k)
    const juste = q.choix[k].correct
    repondre({ itemId: q.id, type: q.type, notion: q.notion, seance: q.seance, correct: juste }, q.type === 'qcm' ? XP.qcmJuste : XP.flashcard)
    if (juste) setPv((x) => x - 1)
    else setVies((x) => x - 1)
    setCoup(juste ? 'boss' : 'toi')
    window.setTimeout(() => setCoup(null), 600)
  }

  useEffect(() => {
    if (!fini) return
    terminerSession('libre', Math.max(1, Math.round((Date.now() - debut.current) / 60_000)), gagne ? 30 : 5)
    if (gagne) confettis()
  }, [fini]) // eslint-disable-line react-hooks/exhaustive-deps

  const rejouer = () => {
    setPartie((n) => n + 1)
    setI(0)
    setChoix(null)
    setPv(PV_BOSS)
    setVies(VIES)
    debut.current = Date.now()
  }

  if (fini) {
    return (
      <div className="max-w-2xl mx-auto">
        <EnTeteJeu titre="Le Boss 👾" />
        <Fin
          titre={gagne ? 'Boss vaincu ! 🏆' : 'Le boss a gagné… cette fois'}
          humeur={gagne ? 'fete' : 'reflechit'}
          rejouer={rejouer}
          texte={gagne ? 'Tu as battu le boss du chapitre : +30 XP bonus. Le marketing n’a plus de secret pour toi.' : `Il lui restait ${pv} point${pv > 1 ? 's' : ''} de vie. Tes erreurs sont dans « Mes erreurs à revoir » : revois-les et reviens le battre !`}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <EnTeteJeu titre="Le Boss 👾">
        <span className="text-2xl tracking-widest" aria-label={`${vies} vie${vies > 1 ? 's' : ''} sur ${VIES}`}>
          {Array.from({ length: VIES }, (_, k) => (k < vies ? '❤️' : '🖤')).join('')}
        </span>
      </EnTeteJeu>

      <section
        className="relative overflow-hidden rounded-[2rem] p-5 flex items-center gap-5"
        style={{ background: 'radial-gradient(120% 140% at 100% 0%, #8b6cff, transparent 55%), #121a2b', color: '#f6f7fb' }}
        aria-label={`Le boss a ${pv} points de vie sur ${PV_BOSS}`}
      >
        <div className={coup === 'boss' ? 'animate-[secoue_0.5s_ease-in-out]' : 'flotte-doux'}>
          <DessinBoss touche={coup === 'boss'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-[family-name:var(--font-affiche)] font-extrabold text-2xl md:text-3xl tracking-tight">Le Grand Marché</p>
          <p className="text-sm text-[#d5dbe8]">Boss du module de marketing</p>
          <div className="mt-3 h-4 rounded-full bg-[#ffffff26] overflow-hidden">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(pv / PV_BOSS) * 100}%`, background: 'linear-gradient(90deg, #ff8fb8, #f5c451)' }} />
          </div>
          <p className="text-xs font-bold mt-1 tabular-nums">
            {pv} / {PV_BOSS} PV
          </p>
        </div>
        {coup === 'toi' && <span className="pointer-events-none absolute inset-0 bg-[#e0504d55] animate-[apparition_0.3s_ease-out]" aria-hidden />}
      </section>

      <section className="carte p-5 md:p-6 mt-4">
        <p className="surtitre">{titreNotion(q.notion)}</p>
        <h2 className="text-xl md:text-2xl mt-1 mb-4 font-[family-name:var(--font-titre)] tracking-tight">{q.enonce}</h2>
        <Choix question={q} reponse={choix} onChoisir={repondreBoss} />
        {choix !== null && (
          <div className={`apparition mt-5 rounded-2xl p-4 ${q.choix[choix].correct ? 'bg-success-bg' : 'bg-error-bg'}`} role="status">
            <p className={`font-extrabold ${q.choix[choix].correct ? 'text-success-ink' : 'text-error-ink'}`}>{q.choix[choix].correct ? 'Touché ! Le boss perd 1 PV 💥' : 'Aïe ! Tu perds un cœur'}</p>
            <p className="text-sm mt-1">{q.explication}</p>
            <button
              type="button"
              className="btn btn-accent mt-3"
              autoFocus
              onClick={() => {
                setI((n) => n + 1)
                setChoix(null)
              }}
            >
              Attaque suivante <Icone nom="suivant" />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

/** Le boss : une grosse boule violette à couronne, plus drôle qu'effrayante. */
function DessinBoss({ touche }: { touche: boolean }) {
  return (
    <svg width="110" height="110" viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="112" rx="34" ry="5" fill="#000" opacity="0.25" />
      <path d="M36 30 L42 8 L52 22 L60 4 L68 22 L78 8 L84 30 Z" fill="#f5c451" stroke="#d9a22a" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="60" cy="68" rx="46" ry="42" fill={touche ? '#ff8fb8' : '#7c5cff'} />
      <path d="M20 70 q-12 -4 -14 -18 q10 2 16 10z M100 70 q12 -4 14 -18 q-10 2 -16 10z" fill={touche ? '#ff8fb8' : '#7c5cff'} />
      {touche ? (
        <g stroke="#fff" strokeWidth="4" strokeLinecap="round">
          <path d="M38 54 l12 10 M50 54 l-12 10 M70 54 l12 10 M82 54 l-12 10" />
        </g>
      ) : (
        <g>
          <ellipse cx="44" cy="60" rx="9" ry="11" fill="#fff" />
          <ellipse cx="76" cy="60" rx="9" ry="11" fill="#fff" />
          <circle cx="46" cy="62" r="5" fill="#121a2b" />
          <circle cx="74" cy="62" r="5" fill="#121a2b" />
          <path d="M34 46 l16 6 M86 46 l-16 6" stroke="#121a2b" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      <path d="M44 86 q16 10 32 0" fill="none" stroke="#121a2b" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 88 l3 6 3 -5 M64 88 l3 6 3 -5" fill="#fff" />
    </svg>
  )
}

// ---------- Explique-moi ----------

function Explique() {
  const { p, noterCarte, terminerSession } = useProgression()
  const [partie, setPartie] = useState(0)
  const cartes = useMemo(() => melanger(flashcards).slice(0, 5), [partie])
  const [i, setI] = useState(0)
  const [texte, setTexte] = useState('')
  const [revele, setRevele] = useState(false)
  const [notes, setNotes] = useState<string[]>([])
  const debut = useRef(Date.now())
  const nom = p.boutique.nom || 'Ton compagnon'
  const c = cartes[i]
  const fini = i >= cartes.length

  useEffect(() => {
    if (!fini) return
    terminerSession('libre', Math.max(1, Math.round((Date.now() - debut.current) / 60_000)), 15)
    if (notes.filter((n) => n === 'oui').length >= 3) confettis()
  }, [fini]) // eslint-disable-line react-hooks/exhaustive-deps

  const noter = (n: 'oui' | 'hesite' | 'non') => {
    noterCarte({ id: c.id, notion: c.notion, seance: c.seance }, n)
    setNotes((l) => [...l, n])
    setI((k) => k + 1)
    setTexte('')
    setRevele(false)
  }

  if (fini) {
    const oui = notes.filter((n) => n === 'oui').length
    return (
      <div className="max-w-2xl mx-auto">
        <EnTeteJeu titre="Explique-moi 🗣️" />
        <Fin
          titre={oui >= 3 ? 'Super prof ! 🎓' : 'Belle séance de prof'}
          humeur={oui >= 3 ? 'fete' : 'content'}
          rejouer={() => {
            setPartie((n) => n + 1)
            setI(0)
            setNotes([])
            debut.current = Date.now()
          }}
          texte={`Tu as expliqué ${cartes.length} notions à ${nom}, dont ${oui} parfaitement. Expliquer avec ses mots, c’est l’une des meilleures façons de comprendre (et de retenir) : +15 XP bonus.`}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <EnTeteJeu titre="Explique-moi 🗣️" />
      <Progression actuel={i + 1} total={cartes.length} />
      <section className="carte p-5 md:p-6 mt-4">
        <div className="flex items-start gap-3">
          {p.boutique.compagnon && (
            <div className="shrink-0">
              <MonCompagnon taille={84} anime humeur={revele ? 'content' : 'reflechit'} />
            </div>
          )}
          <div className="flex-1 rounded-2xl rounded-tl-sm bg-surface-2 p-4">
            <p className="text-sm font-bold text-muted">{nom} demande :</p>
            <p className="font-semibold mt-1">
              « C’est quoi, <strong className="text-ink">{c.recto}</strong> ? Explique-moi avec tes mots, comme si je n’y connaissais rien ! »
            </p>
          </div>
        </div>
        <label className="block mt-4">
          <span className="font-semibold text-sm">Ton explication (personne d’autre ne la lit)</span>
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            disabled={revele}
            rows={4}
            placeholder="C’est… Par exemple…"
            className="mt-1 w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-base outline-none focus:border-blue-500 disabled:opacity-80"
          />
        </label>
        {!revele ? (
          <button type="button" className="btn btn-accent mt-3 w-full" onClick={() => setRevele(true)}>
            {texte.trim() ? 'Comparer avec le cours' : 'Je ne sais pas, montre-moi'}
          </button>
        ) : (
          <div className="apparition mt-4">
            <div className="rounded-2xl border-2 border-success bg-success-bg p-4">
              <p className="surtitre !text-success-ink">Ce que dit le cours</p>
              <p className="mt-1">{c.verso}</p>
              {c.exemple && <p className="text-sm text-muted mt-2">{c.exemple}</p>}
            </div>
            <p className="font-bold mt-4 mb-2">Ton explication était…</p>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" className="btn btn-contour !flex-col !min-h-16" onClick={() => noter('oui')}>
                <span aria-hidden>🎯</span> Complète
              </button>
              <button type="button" className="btn btn-contour !flex-col !min-h-16" onClick={() => noter('hesite')}>
                <span aria-hidden>🤏</span> À moitié
              </button>
              <button type="button" className="btn btn-contour !flex-col !min-h-16" onClick={() => noter('non')}>
                <span aria-hidden>🌱</span> À revoir
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
