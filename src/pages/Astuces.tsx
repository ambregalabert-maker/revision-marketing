import { Link } from 'react-router'
import Page from '../components/Page'
import Icone from '../components/Icone'
import astuces from '../data/astuces.json'

// Page de méthode, lisible en 5 minutes. Tout le texte vient de src/data/astuces.json.

interface LienAstuce {
  label: string
  to: string
}
interface Section {
  id: string
  titre: string
  intro?: string
  tableau?: { colonnes: string[]; lignes: string[][] }
  points?: string[]
  cartes?: { titre: string; texte: string; marketing: string; lien: LienAstuce }[]
  semaine?: { quand: string; duree: string; quoi: string; lien: LienAstuce }[]
  liste?: { titre: string; texte: string }[]
  etapes?: { titre: string; texte: string }[]
  pieges?: { piege: string; parade: string }[]
  lien?: LienAstuce
}

const sections = astuces.sections as Section[]

export default function Astuces() {
  return (
    <Page titre="Astuces & conseils" sousTitre="La méthode pour réviser mieux, pas plus. 5 minutes de lecture.">
      <p className="rounded-3xl bg-blue-700 text-surface p-5 font-titre font-semibold text-xl text-center mb-5">{astuces.accroche}</p>

      <div className="flex flex-col gap-3">
        {sections.map((s, i) => (
          <details key={s.id} className="carte group" open={i === 0}>
            <summary className="flex items-center justify-between gap-3 p-5 cursor-pointer list-none min-h-11 [&::-webkit-details-marker]:hidden">
              <h2 className="text-lg font-bold">{s.titre}</h2>
              <Icone nom="bas" className="text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5 flex flex-col gap-4">
              {s.intro && <p>{s.intro}</p>}

              {s.tableau && (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm border-separate border-spacing-1">
                    <thead>
                      <tr>
                        {s.tableau.colonnes.map((c, k) => (
                          <th key={c} scope="col" className={`text-left p-2 rounded-lg ${k === 0 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.tableau.lignes.map((l) => (
                        <tr key={l[0]}>
                          {l.map((cell, k) => (
                            <td key={k} className="p-2 align-top bg-surface-2 rounded-lg">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {s.points && (
                <ul className="flex flex-col gap-2 list-disc pl-5">
                  {s.points.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              )}

              {s.cartes && (
                <div className="grid md:grid-cols-3 gap-3">
                  {s.cartes.map((c) => (
                    <div key={c.titre} className="rounded-2xl bg-surface-2 p-4 flex flex-col gap-2">
                      <h3 className="font-bold">{c.titre}</h3>
                      <p className="text-sm">{c.texte}</p>
                      <p className="text-sm text-muted flex-1">
                        <span className="font-semibold text-ink">En marketing : </span>
                        {c.marketing}
                      </p>
                      <Link to={c.lien.to} className="btn btn-contour !min-h-10 text-sm">
                        {c.lien.label}
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {s.semaine && (
                <ol className="flex flex-col gap-2">
                  {s.semaine.map((l) => (
                    <li key={l.quand} className="rounded-2xl bg-surface-2 p-3 flex flex-wrap items-center gap-3">
                      <span className="w-16 text-center shrink-0 rounded-xl bg-orange-100 text-orange-700 font-titre font-bold py-1">{l.duree}</span>
                      <span className="flex-1 min-w-40">
                        <span className="block font-semibold">{l.quand}</span>
                        <span className="block text-sm text-muted">{l.quoi}</span>
                      </span>
                      <Link to={l.lien.to} className="btn btn-bleu !min-h-10 text-sm">
                        {l.lien.label} <Icone nom="suivant" taille={16} />
                      </Link>
                    </li>
                  ))}
                </ol>
              )}

              {s.liste && (
                <ul className="flex flex-col gap-3">
                  {s.liste.map((x) => (
                    <li key={x.titre} className="flex gap-3">
                      <Icone nom="ok" className="text-blue-700 mt-1" />
                      <span>
                        <span className="block font-semibold">{x.titre}</span>
                        <span className="block text-muted">{x.texte}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {s.etapes && (
                <ol className="grid sm:grid-cols-5 gap-2">
                  {s.etapes.map((e, k) => (
                    <li key={e.titre} className="rounded-2xl bg-surface-2 p-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-700 text-surface font-titre font-bold mb-2">{k + 1}</span>
                      <span className="block font-semibold">{e.titre}</span>
                      <span className="block text-sm text-muted">{e.texte}</span>
                    </li>
                  ))}
                </ol>
              )}

              {s.pieges && (
                <ul className="flex flex-col gap-2">
                  {s.pieges.map((x) => (
                    <li key={x.piege} className="rounded-2xl border border-line p-3">
                      <p className="font-semibold flex gap-2 text-error-ink">
                        <Icone nom="erreur" taille={18} className="mt-0.5" /> {x.piege}
                      </p>
                      <p className="flex gap-2 mt-1">
                        <Icone nom="ok" taille={18} className="text-success-ink mt-0.5" /> {x.parade}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {s.lien && (
                <Link to={s.lien.to} className="btn btn-orange self-start">
                  {s.lien.label}
                </Link>
              )}
            </div>
          </details>
        ))}
      </div>

      <section aria-labelledby="titre-regles" className="mt-6 rounded-3xl border-2 border-orange-500 bg-orange-100 p-5">
        <h2 id="titre-regles" className="text-xl font-bold mb-3">
          3 règles à retenir
        </h2>
        <ol className="flex flex-col gap-2">
          {astuces.regles.map((r, i) => (
            <li key={r} className="flex items-center gap-3 font-titre font-semibold text-lg">
              <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-orange-500 text-on-orange">{i + 1}</span>
              {r}
            </li>
          ))}
        </ol>
      </section>
    </Page>
  )
}
