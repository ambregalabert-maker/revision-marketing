import { useSearchParams } from 'react-router'
import Page from '../components/Page'
import FiltresContenu from '../components/FiltresContenu'
import Calculs from '../components/revision/Calculs'
import Classement from '../components/revision/Classement'
import VraiFauxEx from '../components/revision/VraiFauxEx'
import CasEx from '../components/revision/CasEx'
import { Etiquette, Onglets, Retour } from '../components/ui'
import Icone from '../components/Icone'
import { casPratiques, classements, filtrer, titreNotion, vraiFaux } from '../lib/contenu'
import { useFiltres } from '../state/filtres'
import { useProgression } from '../state/progression'
import { useTempsEtude } from '../state/useTempsEtude'

type Onglet = 'calculs' | 'classement' | 'vraifaux' | 'cas'

export default function Exercices() {
  useTempsEtude()
  const [params, setParams] = useSearchParams()
  const onglet = (params.get('onglet') as Onglet) || 'calculs'
  const idChoisi = params.get('id')
  const { filtres } = useFiltres()
  const { p } = useProgression()

  const changerOnglet = (o: Onglet) => setParams({ onglet: o })
  const ouvrir = (id: string) => setParams({ onglet, id })
  const fermer = () => setParams({ onglet })

  // Dernier résultat obtenu sur un exercice (pour afficher ✓ ou « à refaire »).
  const statut = (id: string) => {
    const t = [...p.tentatives].reverse().find((x) => x.itemId === id)
    if (!t) return null
    return t.correct ? 'reussi' : 'a-refaire'
  }

  const classementChoisi = classements.find((c) => c.id === idChoisi)
  const casChoisi = casPratiques.find((c) => c.id === idChoisi)

  return (
    <Page titre="Exercices" sousTitre="Applique le cours : c'est ce que demande l'examen.">
      <Retour />
      <div className="mb-4">
        <Onglets
          label="Type d'exercice"
          valeur={onglet}
          onChange={changerOnglet}
          options={[
            { id: 'calculs', label: 'Calculs' },
            { id: 'classement', label: 'Classement' },
            { id: 'vraifaux', label: 'Vrai / Faux' },
            { id: 'cas', label: 'Cas pratiques' },
          ]}
        />
      </div>

      {onglet === 'calculs' && <Calculs />}

      {onglet === 'vraifaux' &&
        (() => {
          const tous = filtres.chapitre === 'tous' && filtres.notion === 'toutes'
          const liste = filtrer(vraiFaux, filtres.chapitre, filtres.notion)
          if (!liste.length) return <p className="carte p-5 text-muted">Pas de vrai/faux pour ce filtre : essaie un autre chapitre ou une autre notion.</p>
          return <VraiFauxEx key={`${filtres.chapitre}-${filtres.notion}`} items={tous ? undefined : liste} />
        })()}

      {onglet === 'classement' &&
        (classementChoisi ? (
          <>
            <button type="button" onClick={fermer} className="btn btn-discret mb-2 !px-1">
              <Icone nom="retour" /> Tous les classements
            </button>
            <Classement key={classementChoisi.id} exo={classementChoisi} />
          </>
        ) : (
          <ListeExercices
            items={filtrer(classements, filtres.chapitre, filtres.notion).map((c) => ({
              id: c.id,
              titre: c.titre,
              sousTitre: `${titreNotion(c.notion)} · séance ${c.seance} · ${c.elements.length} éléments`,
            }))}
            statut={statut}
            ouvrir={ouvrir}
          />
        ))}

      {onglet === 'cas' &&
        (casChoisi ? (
          <>
            <button type="button" onClick={fermer} className="btn btn-discret mb-2 !px-1">
              <Icone nom="retour" /> Tous les cas pratiques
            </button>
            <CasEx key={casChoisi.id} cas={casChoisi} />
          </>
        ) : (
          <ListeExercices
            items={filtrer(casPratiques, filtres.chapitre, filtres.notion).map((c) => ({
              id: c.id,
              titre: c.titre,
              sousTitre: `${c.type === '6-etapes' ? 'Méthode des 6 étapes · ' : ''}${c.duree} · séance ${c.seance}`,
            }))}
            statut={statut}
            ouvrir={ouvrir}
          />
        ))}
    </Page>
  )
}

function ListeExercices({
  items,
  statut,
  ouvrir,
}: {
  items: { id: string; titre: string; sousTitre: string }[]
  statut: (id: string) => 'reussi' | 'a-refaire' | null
  ouvrir: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <FiltresContenu />
      {items.length === 0 && <p className="carte p-4 text-muted">Aucun exercice pour ce filtre : essaie « Tout le chapitre ».</p>}
      <ul className="flex flex-col gap-2">
        {items.map((it) => {
          const s = statut(it.id)
          return (
            <li key={it.id}>
              <button type="button" onClick={() => ouvrir(it.id)} className="carte w-full text-left p-4 flex items-center gap-3 hover:border-blue-500">
                <span className="flex-1">
                  <span className="block font-titre font-semibold">{it.titre}</span>
                  <span className="block text-sm text-muted">{it.sousTitre}</span>
                </span>
                {s === 'reussi' && (
                  <Etiquette>
                    <Icone nom="ok" taille={14} /> Réussi
                  </Etiquette>
                )}
                {s === 'a-refaire' && <Etiquette ton="accent">À refaire</Etiquette>}
                <Icone nom="suivant" className="text-muted" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
