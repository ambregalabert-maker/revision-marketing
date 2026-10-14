import { notions } from '../lib/contenu'
import type { FiltreSeance, NotionId } from '../lib/types'
import { useFiltres } from '../state/filtres'

// Filtres « Séance 1 / Séance 2 / Tout le chapitre » + « par notion ».
export default function FiltresContenu() {
  const { filtres, changerFiltres } = useFiltres()
  const notionsVisibles = notions.filter((n) => filtres.seance === 'toutes' || String(n.seance) === filtres.seance)

  const choisirSeance = (s: FiltreSeance) => {
    // Si la notion choisie n'appartient pas à la séance, on revient à « toutes les notions ».
    const garde = filtres.notion === 'toutes' || s === 'toutes' || String(notions.find((n) => n.id === filtres.notion)?.seance) === s
    changerFiltres({ seance: s, notion: garde ? filtres.notion : 'toutes' })
  }

  return (
    <fieldset className="carte p-4 flex flex-col gap-3">
      <legend className="sr-only">Filtrer le contenu</legend>
      <div role="radiogroup" aria-label="Séance" className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-surface-2 border border-line">
        {(
          [
            { id: '1', label: 'Séance 1' },
            { id: '2', label: 'Séance 2' },
            { id: 'toutes', label: 'Tout le chapitre' },
          ] as { id: FiltreSeance; label: string }[]
        ).map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={filtres.seance === o.id}
            onClick={() => choisirSeance(o.id)}
            className={`min-h-11 px-2 rounded-xl text-sm md:text-base font-semibold transition-colors ${
              filtres.seance === o.id ? 'bg-surface text-blue-700 shadow-carte' : 'text-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
        Notion
        <select
          value={filtres.notion}
          onChange={(e) => changerFiltres({ notion: e.target.value as NotionId | 'toutes' })}
          className="min-h-11 rounded-xl border border-line bg-surface text-ink px-3 text-base font-normal"
        >
          <option value="toutes">Toutes les notions</option>
          {notionsVisibles.map((n) => (
            <option key={n.id} value={n.id}>
              {n.titre} (séance {n.seance})
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  )
}
