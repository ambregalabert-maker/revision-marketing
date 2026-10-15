import type { ReactNode } from 'react'
import Icone, { type NomIcone } from './Icone'
import { COULEURS, useTheme, type ChoixTheme } from '../state/theme'
import { useProgression } from '../state/progression'
import type { CouleurTheme } from '../lib/types'

export const DUREES = [5, 10, 25] as const

/** Le menu « Personnaliser » : couleur, thème, durée de séance, minuteur, son, objectif. */
export default function Personnaliser() {
  const { p, majProfil } = useProgression()
  const { choix, setChoix } = useTheme()
  const prefs = p.profil.preferences
  const dureeLibre = !DUREES.includes(prefs.dureeSeance as (typeof DUREES)[number])

  return (
    <section className="carte p-5 mb-4" aria-labelledby="t-perso">
      <h2 id="t-perso" className="text-lg font-bold flex items-center gap-2">
        <Icone nom="reglages" className="text-accent-700" /> Personnaliser
      </h2>
      <p className="text-sm text-muted mt-1">Fais de Mark'Up ton espace : tout est modifiable à tout moment.</p>

      <fieldset className="mt-5">
        <legend className="font-semibold mb-2">Ta couleur</legend>
        <div className="grid grid-cols-4 gap-2">
          {COULEURS.map((c) => {
            const actif = prefs.couleur === c.id
            return (
              <label key={c.id} className="flex flex-col items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="couleur"
                  className="sr-only peer"
                  checked={actif}
                  onChange={() => majProfil({ preferences: { couleur: c.id as CouleurTheme } })}
                />
                <span
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform peer-focus-visible:outline-3 peer-focus-visible:outline-blue-500 ${actif ? 'scale-110' : ''}`}
                  style={{ background: c.fond, boxShadow: `0 4px 0 ${c.ombre}${actif ? ', 0 0 0 3px var(--surface), 0 0 0 6px var(--ink)' : ''}` }}
                >
                  {actif && <Icone nom="ok" className="text-[#1e2a3a]" />}
                </span>
                <span className={`text-sm ${actif ? 'font-bold' : 'text-muted'}`}>{c.nom}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <Choix
        legende="Ambiance"
        nom="theme"
        valeur={choix}
        onChange={(v) => setChoix(v as ChoixTheme)}
        options={[
          { v: 'systeme', l: 'Auto', i: 'ecran' },
          { v: 'clair', l: 'Clair', i: 'soleil' },
          { v: 'sombre', l: 'Sombre', i: 'lune' },
        ]}
      />

      <fieldset className="mt-5">
        <legend className="font-semibold">Ta séance Tryhard préférée</legend>
        <p className="text-sm text-muted mb-2">Proposée en premier quand tu lances une séance (tu pourras toujours changer).</p>
        <div className="grid grid-cols-4 gap-2">
          {DUREES.map((d) => (
            <BoutonRadio key={d} nom="duree" actif={prefs.dureeSeance === d} onChange={() => majProfil({ preferences: { dureeSeance: d } })}>
              {d} min
            </BoutonRadio>
          ))}
          <BoutonRadio nom="duree" actif={dureeLibre} onChange={() => majProfil({ preferences: { dureeSeance: 40 } })}>
            Plus
          </BoutonRadio>
        </div>
        {dureeLibre && (
          <label className="flex items-center gap-3 mt-3 text-sm">
            <span className="whitespace-nowrap">{prefs.dureeSeance} min</span>
            <input
              type="range"
              min={30}
              max={60}
              step={5}
              value={prefs.dureeSeance}
              onChange={(e) => majProfil({ preferences: { dureeSeance: Number(e.target.value) } })}
              className="flex-1 accent-[var(--accent-600)]"
              aria-label="Durée de la séance en minutes"
            />
          </label>
        )}
      </fieldset>

      <div className="mt-5 flex flex-col gap-1">
        <Interrupteur label="Afficher le minuteur pendant les séances Tryhard" coche={prefs.minuteur} onChange={(v) => majProfil({ preferences: { minuteur: v } })} />
        <Interrupteur label="Petit son doux à la fin du minuteur" coche={prefs.son} onChange={(v) => majProfil({ preferences: { son: v } })} />
      </div>

      <Choix
        legende="Ton objectif de la semaine"
        nom="objectif"
        valeur={String(p.profil.objectifHebdo)}
        onChange={(v) => majProfil({ objectifHebdo: Number(v) as 3 | 5 | 7 })}
        options={[
          { v: '3', l: '3 séances' },
          { v: '5', l: '5 séances' },
          { v: '7', l: '7 séances' },
        ]}
      />
    </section>
  )
}

function BoutonRadio({ nom, actif, onChange, children }: { nom: string; actif: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label
      className={`flex items-center justify-center gap-1.5 min-h-11 rounded-xl border-2 cursor-pointer font-semibold text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-blue-500 ${
        actif ? 'border-accent-600 bg-accent-100' : 'border-line hover:border-blue-500'
      }`}
    >
      <input type="radio" name={nom} className="sr-only" checked={actif} onChange={onChange} />
      {children}
    </label>
  )
}

function Choix({
  legende,
  nom,
  valeur,
  onChange,
  options,
}: {
  legende: string
  nom: string
  valeur: string
  onChange: (v: string) => void
  options: { v: string; l: string; i?: NomIcone }[]
}) {
  return (
    <fieldset className="mt-5">
      <legend className="font-semibold mb-2">{legende}</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <BoutonRadio key={o.v} nom={nom} actif={valeur === o.v} onChange={() => onChange(o.v)}>
            {o.i && <Icone nom={o.i} taille={18} />}
            {o.l}
          </BoutonRadio>
        ))}
      </div>
    </fieldset>
  )
}

export function Interrupteur({ label, aide, coche, onChange }: { label: string; aide?: string; coche: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 min-h-11 cursor-pointer">
      <span>
        {label}
        {aide && <span className="block text-xs text-muted">{aide}</span>}
      </span>
      <input type="checkbox" role="switch" className="w-6 h-6 shrink-0 accent-[var(--accent-600)]" checked={coche} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}
