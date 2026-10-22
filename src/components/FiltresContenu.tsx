import { notions } from '../lib/contenu'
import { CHAPITRES } from '../lib/chapitres'
import type { FiltreChapitre, NotionId } from '../lib/types'
import { useFiltres } from '../state/filtres'

// Filtres « Chapitre 1 à 4 / Tous » + « par notion ».
export default function FiltresContenu() {
  const { filtres, changerFiltres } = useFiltres()
  const notionsVisibles = notions.filter((n) => filtres.chapitre === 'tous' || String(n.chapitre) === filtres.chapitre)

  const choisirChapitre = (c: FiltreChapitre) => {
    // Si la notion choisie n'appartient pas au chapitre, on revient à « toutes les notions ».
    const garde = filtres.notion === 'toutes' || c === 'tous' || String(notions.find((n) => n.id === filtres.notion)?.chapitre) === c
    changerFiltres({ chapitre: c, notion: garde ? filtres.notion : 'toutes' })
  }

  const options: { id: FiltreChapitre; label: string; titre: string }[] = [
    ...CHAPITRES.map((c) => ({ id: String(c.numero) as FiltreChapitre, label: `Ch. ${c.numero}`, titre: `Chapitre ${c.numero} : ${c.titre}` })),
    { id: 'tous', label: 'Tout', titre: 'Tous les chapitres' },
  ]

  return (
    <fieldset className="carte p-4 flex flex-col gap-3">
      <legend className="sr-only">Filtrer le contenu</legend>
      <div role="radiogroup" aria-label="Chapitre" className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-surface-2 border border-line">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={filtres.chapitre === o.id}
            aria-label={o.titre}
            title={o.titre}
            onClick={() => choisirChapitre(o.id)}
            className={`min-h-11 px-1 rounded-xl text-sm md:text-base font-semibold transition-colors ${
              filtres.chapitre === o.id ? 'bg-surface text-blue-700 shadow-carte' : 'text-muted hover:text-ink'
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
              {n.titre} (chapitre {n.chapitre})
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  )
}
