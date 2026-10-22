import { useState, type FormEvent } from 'react'
import Page from '../components/Page'
import Compagnon from '../components/Compagnon'
import MonCompagnon from '../components/MonCompagnon'
import Icone from '../components/Icone'
import { Onglets, Retour } from '../components/ui'
import { ACCESSOIRES, COMPAGNONS, XP_PAR_MARK, acheter, adopter, basculerAccessoire, marksDisponibles, nomParDefaut, possede } from '../lib/boutique'
import { useProgression } from '../state/progression'
import type { Espece } from '../lib/types'

/** Pastille 🪙 du solde de Marks. */
export function SoldeMarks({ marks }: { marks: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold-bg text-gold-ink border border-gold px-3 min-h-10 font-extrabold" aria-label={`${marks} Marks`}>
      🪙 {marks}
    </span>
  )
}

export default function Boutique() {
  const { p, majBoutique } = useProgression()
  const marks = marksDisponibles(p)
  const b = p.boutique

  if (!b.compagnon) return <Adoption />

  return (
    <Page titre="La boutique" sousTitre={`Les Marks 🪙 se gagnent tout seuls : 1 Mark pour ${XP_PAR_MARK} XP. Ton niveau ne baisse jamais quand tu achètes.`} actions={<SoldeMarks marks={marks} />}>
      <Retour to="/profil" label="Profil" />
      <Vitrine />
      <BoutiqueOnglets
        marks={marks}
        onAcheter={(id) => majBoutique((pr) => acheter(pr, id))}
        onPorter={(id) => majBoutique((pr) => basculerAccessoire(pr.boutique, id))}
        onChoisir={(e) => majBoutique((pr) => ({ ...pr.boutique, compagnon: e }))}
      />
    </Page>
  )
}

/** Le compagnon en grand, avec son nom (modifiable). */
function Vitrine() {
  const { p, majBoutique } = useProgression()
  const [edition, setEdition] = useState(false)
  const [nom, setNom] = useState(p.boutique.nom)
  const valider = (e: FormEvent) => {
    e.preventDefault()
    majBoutique((pr) => ({ ...pr.boutique, nom: nom.trim() || pr.boutique.nom }))
    setEdition(false)
  }
  return (
    <section className="carte p-5 mb-4 flex flex-col items-center text-center" style={{ background: 'linear-gradient(180deg, var(--accent-100), var(--surface))' }}>
      <MonCompagnon taille={170} anime humeur="coucou" />
      {edition ? (
        <form onSubmit={valider} className="flex gap-2 mt-2 w-full max-w-xs">
          <label className="sr-only" htmlFor="nom-compagnon">
            Nom de ton compagnon
          </label>
          <input id="nom-compagnon" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={20} autoFocus className="flex-1 min-w-0 min-h-11 rounded-xl border-2 border-line bg-surface px-3 outline-none focus:border-blue-500" />
          <button type="submit" className="btn btn-accent">
            OK
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setEdition(true)} className="mt-2 inline-flex items-center gap-2 font-titre font-bold text-2xl rounded-xl px-2 hover:bg-surface-2" aria-label={`Renommer ${p.boutique.nom}`}>
          {p.boutique.nom} <Icone nom="reglages" taille={16} className="text-muted" />
        </button>
      )}
      <p className="text-sm text-muted mt-1">Touche le nom pour le changer. Habille-le avec les accessoires ci-dessous !</p>
    </section>
  )
}

function BoutiqueOnglets({ marks, onAcheter, onPorter, onChoisir }: { marks: number; onAcheter: (id: string) => void; onPorter: (id: string) => void; onChoisir: (e: Espece) => void }) {
  const { p } = useProgression()
  const [onglet, setOnglet] = useState<'accessoires' | 'compagnons'>('accessoires')
  const [gagne, setGagne] = useState<string | null>(null)
  const b = p.boutique

  const acheterEtPorter = (id: string, porter: boolean) => {
    onAcheter(id)
    if (porter) onPorter(id)
    setGagne(id)
    window.setTimeout(() => setGagne(null), 1200)
  }

  return (
    <>
      <Onglets
        label="Rayons de la boutique"
        valeur={onglet}
        onChange={setOnglet}
        options={[
          { id: 'accessoires', label: '🎀 Accessoires' },
          { id: 'compagnons', label: '🐾 Compagnons' },
        ]}
      />
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        {onglet === 'accessoires'
          ? ACCESSOIRES.map((a) => {
              const aLui = possede(p, a.id)
              const porte = b.porte.includes(a.id)
              const manque = a.prix - marks
              return (
                <li key={a.id} className={`carte p-3 flex flex-col items-center text-center ${porte ? '!border-accent-600 border-2' : ''}`}>
                  <div className={gagne === a.id ? 'pop' : ''}>
                    <Compagnon espece={b.compagnon!} accessoires={[a.id]} taille={92} />
                  </div>
                  <p className="font-semibold text-sm mt-1">{a.nom}</p>
                  {a.badge && !aLui ? (
                    <p className="text-xs text-muted mt-1 flex-1">
                      ✨ Objet spécial
                      <br />
                      {a.condition}
                    </p>
                  ) : (
                    <span className="flex-1" />
                  )}
                  {aLui ? (
                    <button type="button" onClick={() => onPorter(a.id)} className={`btn w-full mt-2 !min-h-10 text-sm ${porte ? 'btn-bleu' : 'btn-accent'}`} aria-pressed={porte}>
                      {porte ? 'Enlever' : 'Mettre'}
                    </button>
                  ) : a.badge ? (
                    <span className="btn btn-contour w-full mt-2 !min-h-10 text-sm cursor-default" aria-disabled>
                      🔒 À gagner
                    </span>
                  ) : (
                    <button type="button" disabled={manque > 0} onClick={() => acheterEtPorter(a.id, true)} className="btn btn-accent w-full mt-2 !min-h-10 text-sm">
                      {manque > 0 ? `Encore ${manque} 🪙` : `Acheter · ${a.prix} 🪙`}
                    </button>
                  )}
                </li>
              )
            })
          : COMPAGNONS.map((c) => {
              const aLui = b.possedes.includes(c.id)
              const actif = b.compagnon === c.id
              const manque = c.prix - marks
              return (
                <li key={c.id} className={`carte p-3 flex flex-col items-center text-center ${actif ? '!border-accent-600 border-2' : ''}`}>
                  <div className={gagne === c.id ? 'pop' : ''}>
                    <Compagnon espece={c.id} accessoires={actif ? b.porte : []} taille={92} />
                  </div>
                  <p className="font-semibold mt-1">{c.nom}</p>
                  <p className="text-xs text-muted flex-1">{c.description}</p>
                  {actif ? (
                    <span className="btn btn-bleu w-full mt-2 !min-h-10 text-sm cursor-default">C'est le tien ✓</span>
                  ) : aLui ? (
                    <button type="button" onClick={() => onChoisir(c.id)} className="btn btn-accent w-full mt-2 !min-h-10 text-sm">
                      Le choisir
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={manque > 0}
                      onClick={() => {
                        acheterEtPorter(c.id, false)
                        onChoisir(c.id)
                      }}
                      className="btn btn-accent w-full mt-2 !min-h-10 text-sm"
                    >
                      {manque > 0 ? `Encore ${manque} 🪙` : `Adopter · ${c.prix} 🪙`}
                    </button>
                  )}
                </li>
              )
            })}
      </ul>
      {onglet === 'compagnons' && <p className="text-sm text-muted mt-3 text-center">Tes accessoires vont à tous tes compagnons. Le nom reste le même : tu peux le changer en touchant le nom.</p>}
    </>
  )
}

/** Premier passage : on choisit son compagnon (gratuit) et on le baptise. */
function Adoption() {
  const { majBoutique } = useProgression()
  const [choix, setChoix] = useState<Espece>('renard')
  const [nom, setNom] = useState('')

  const adopterMaintenant = (e: FormEvent) => {
    e.preventDefault()
    majBoutique((pr) => adopter(pr.boutique, choix, nom))
  }

  return (
    <Page titre="Adopte ton compagnon 🐾" sousTitre="Il t'accompagne sur ton chemin, fête tes étoiles et réagit pendant tes séances. Le premier est offert !">
      <Retour to="/profil" label="Profil" />
      <form onSubmit={adopterMaintenant}>
        <div role="radiogroup" aria-label="Choisis ton compagnon" className="grid grid-cols-3 gap-3">
          {COMPAGNONS.map((c) => {
            const actif = choix === c.id
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => setChoix(c.id)}
                className={`rounded-3xl border-2 p-2 flex flex-col items-center transition-transform ${actif ? 'border-accent-600 bg-accent-100 scale-105' : 'border-line bg-surface'}`}
                style={{ boxShadow: `0 4px 0 ${actif ? 'var(--accent-600)' : 'var(--line)'}` }}
              >
                <Compagnon espece={c.id} humeur={actif ? 'content' : 'normal'} taille={96} anime={actif} />
                <span className="font-titre font-bold">{c.nom}</span>
              </button>
            )
          })}
        </div>
        <p className="text-center text-muted mt-3">{COMPAGNONS.find((c) => c.id === choix)!.description}</p>
        <label className="flex flex-col gap-1 font-semibold mt-5">
          Comment veux-tu l'appeler ?
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={20}
            placeholder={`Par exemple : ${nomParDefaut(choix)}`}
            className="min-h-12 rounded-xl border-2 border-line bg-surface px-3 font-normal outline-none focus:border-blue-500"
          />
        </label>
        <button type="submit" className="btn btn-accent w-full !min-h-14 text-lg mt-5">
          Adopter {nom.trim() || nomParDefaut(choix)} 💛
        </button>
      </form>
    </Page>
  )
}
