import { useState } from 'react'
import Icone from '../Icone'
import { Correction } from '../ui'
import astuces from '../../data/astuces.json'
import { useProgression } from '../../state/progression'

interface Piege {
  contexte: string
  copie: string
  choix: string[]
  bonne: number
  explication: string
}
const pieges = astuces.repereErreur as Piege[]

/** Mini-jeu « Repère l'erreur » : les pièges classiques du chapitre 1, dans la copie d'une étudiante. */
export default function RepereErreur() {
  const { debloquerBadge } = useProgression()
  const [i, setI] = useState(0)
  const [choix, setChoix] = useState<number | null>(null)
  const [justes, setJustes] = useState(0)
  const [fini, setFini] = useState(false)
  const piege = pieges[i]

  const choisir = (k: number) => {
    if (choix !== null) return
    setChoix(k)
    if (k === piege.bonne) setJustes((j) => j + 1)
  }

  const suivant = () => {
    if (i + 1 >= pieges.length) {
      setFini(true)
      if (justes === pieges.length) debloquerBadge('chasseur-erreurs')
      return
    }
    setI(i + 1)
    setChoix(null)
  }

  if (fini) {
    const parfait = justes === pieges.length
    return (
      <div className="carte p-6 text-center apparition">
        <p className="text-5xl" aria-hidden>
          {parfait ? '🕵️' : '🔍'}
        </p>
        <h3 className="text-xl font-bold mt-2">
          {justes} / {pieges.length} erreurs repérées
        </h3>
        <p className="text-muted mt-1">
          {parfait ? 'Rien ne t’échappe : ces pièges ne te piégeront pas le jour du QCM !' : 'Chaque piège repéré aujourd’hui, c’est un point sauvé le jour du QCM. Rejoue pour tous les trouver.'}
        </p>
        <button
          type="button"
          className="btn btn-accent mt-4"
          onClick={() => {
            setI(0)
            setChoix(null)
            setJustes(0)
            setFini(false)
          }}
        >
          <Icone nom="recommencer" taille={18} /> Rejouer
        </button>
      </div>
    )
  }

  return (
    <div className="carte p-5">
      <div className="flex items-center justify-between text-sm font-bold text-muted">
        <span>
          Piège {i + 1} / {pieges.length}
        </span>
        <span>🎯 {justes}</span>
      </div>
      <p className="mt-3">{piege.contexte}</p>
      {/* La « copie » de l'étudiante, façon feuille à carreaux */}
      <div
        className="mt-3 rounded-2xl border border-line p-4 font-semibold text-lg"
        style={{
          backgroundColor: 'var(--surface)',
          backgroundImage: 'linear-gradient(var(--blue-100) 1px, transparent 1px), linear-gradient(90deg, var(--blue-100) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      >
        <span className="text-xs font-bold text-muted block mb-1">📝 La copie de Léa</span>
        {piege.copie}
      </div>
      <p className="font-bold mt-4 mb-2">Où est l'erreur ?</p>
      <div className="flex flex-col gap-2">
        {piege.choix.map((c, k) => {
          let style = 'border-line bg-surface hover:border-blue-500'
          if (choix !== null && k === piege.bonne) style = 'border-success bg-success-bg'
          else if (choix === k) style = 'border-error bg-error-bg'
          return (
            <button key={c} type="button" onClick={() => choisir(k)} disabled={choix !== null} className={`text-left min-h-12 px-4 py-2 rounded-2xl border-2 font-semibold flex items-center gap-2 ${style}`}>
              <span className="flex-1">{c}</span>
              {choix !== null && k === piege.bonne && <Icone nom="ok" className="text-success-ink" label="Bonne réponse" />}
              {choix === k && k !== piege.bonne && <Icone nom="non" className="text-error-ink" label="Mauvaise réponse" />}
            </button>
          )
        })}
      </div>
      <div aria-live="polite" className="mt-3">
        {choix !== null && (
          <Correction juste={choix === piege.bonne} titre={choix === piege.bonne ? 'Bien vu !' : 'Raté, voici le piège :'}>
            <p>{piege.explication}</p>
          </Correction>
        )}
      </div>
      {choix !== null && (
        <button type="button" className="btn btn-accent w-full mt-3" onClick={suivant}>
          {i + 1 >= pieges.length ? 'Voir mon score' : 'Piège suivant'} <Icone nom="suivant" />
        </button>
      )}
    </div>
  )
}
