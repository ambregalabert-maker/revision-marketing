import { useState } from 'react'
import { useProgression } from '../state/progression'
import Icone from './Icone'
import { COULEURS } from '../state/theme'
import type { CouleurTheme } from '../lib/types'

/** Parcours d'accueil en 3 écrans pour un nouvel utilisateur. */
export default function Onboarding() {
  const { p, majProfil, terminerOnboarding } = useProgression()
  const [ecran, setEcran] = useState(0)
  const [prenom, setPrenom] = useState(p.profil.prenom)
  const [objectif, setObjectif] = useState(p.profil.objectifHebdo)
  const [couleur, setCouleur] = useState<CouleurTheme>(p.profil.preferences.couleur)

  const finir = () => {
    majProfil({ prenom: prenom.trim(), objectifHebdo: objectif, preferences: { couleur } })
    terminerOnboarding()
  }

  return (
    <div className="carte p-6 md:p-8 apparition" aria-labelledby="titre-onboarding">
      <p className="text-sm font-bold text-blue-700 mb-2">Bienvenue · {ecran + 1} / 3</p>
      <div className="flex gap-1 mb-6" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= ecran ? 'bg-accent-500' : 'bg-blue-100'}`} />
        ))}
      </div>

      {ecran === 0 && (
        <div className="flex flex-col gap-4">
          <h1 id="titre-onboarding" className="text-2xl font-bold">Bienvenue sur Mark'Up !</h1>
          <p>Ici, tu révises le module de Marketing : 4 chapitres (le concept de marché, le parcours d’achat, la stratégie marketing et le marketing mix), de deux façons :</p>
          <ul className="flex flex-col gap-3">
            <li className="flex gap-3">
              <span className="text-2xl" aria-hidden>🗺️</span>
              <span><strong>Le daily</strong> : un chemin, une étape de 3 minutes par notion. Tu gagnes des étoiles en revenant le lendemain, puis une semaine après.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-2xl" aria-hidden>⚡</span>
              <span><strong>Le mode Tryhard</strong> : tu choisis ta durée (5, 10, 25 min ou plus) et tu t'entraînes sur tes points faibles, avec QCM, exercices et cas corrigés.</span>
            </li>
          </ul>
          <label className="flex flex-col gap-1 font-semibold">
            Comment tu t'appelles ? <span className="text-sm font-normal text-muted">(facultatif, juste pour te dire bonjour)</span>
            <input
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              autoComplete="given-name"
              maxLength={30}
              className="min-h-12 rounded-xl border-2 border-line bg-surface px-3 font-normal focus:border-blue-500 outline-none"
              placeholder="Ton prénom"
            />
          </label>
        </div>
      )}

      {ecran === 1 && (
        <div className="flex flex-col gap-4">
          <h1 id="titre-onboarding" className="text-2xl font-bold">Pourquoi se tester plutôt que relire ?</h1>
          <p>Quand tu relis tes slides, tu <em>reconnais</em> le cours… et tu crois le savoir. Le jour du QCM, il faut le <em>retrouver</em> seul·e et l'<em>appliquer</em> à un cas.</p>
          <p>Chercher une réponse dans ta mémoire, même quand tu te trompes, c'est ce qui la fixe. Et revoir une notion juste avant de l'oublier (J+1, J+7, J+30) est bien plus efficace que tout relire la veille.</p>
          <p className="rounded-2xl bg-blue-100 p-4 font-titre font-semibold text-center">
            Le cours donne les notions.
            <br />
            L'entraînement donne les notes.
          </p>
        </div>
      )}

      {ecran === 2 && (
        <div className="flex flex-col gap-4">
          <h1 id="titre-onboarding" className="text-2xl font-bold">Choisis ton objectif de la semaine</h1>
          <p>Combien de séances veux-tu faire par semaine ? Une séance = une étape du chemin (3 min), une séance Tryhard ou 10 min de révision. Mieux vaut un objectif tenable : tu pourras le changer dans ton profil.</p>
          <div role="radiogroup" aria-label="Objectif hebdomadaire" className="grid grid-cols-3 gap-3">
            {([3, 5, 7] as const).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={objectif === n}
                onClick={() => setObjectif(n)}
                className={`rounded-2xl border-2 p-4 min-h-24 flex flex-col items-center justify-center transition-colors ${
                  objectif === n ? 'border-accent-500 bg-accent-100' : 'border-line hover:border-blue-500'
                }`}
              >
                <span className="font-titre font-bold text-3xl">{n}</span>
                <span className="text-sm text-muted">séances</span>
              </button>
            ))}
          </div>
          <p className="font-semibold mt-2">Et ta couleur préférée ?</p>
          <div role="radiogroup" aria-label="Couleur du site" className="grid grid-cols-4 gap-2">
            {COULEURS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={couleur === c.id}
                onClick={() => {
                  setCouleur(c.id)
                  document.documentElement.dataset.accent = c.id
                }}
                className="flex flex-col items-center gap-1 text-sm"
              >
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: c.fond, boxShadow: `0 4px 0 ${c.ombre}${couleur === c.id ? ', 0 0 0 3px var(--surface), 0 0 0 6px var(--ink)' : ''}` }}
                >
                  {couleur === c.id && <Icone nom="ok" className="text-[#1e2a3a]" />}
                </span>
                <span className={couleur === c.id ? 'font-bold' : 'text-muted'}>{c.nom}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-8">
        {ecran > 0 && (
          <button type="button" className="btn btn-contour" onClick={() => setEcran(ecran - 1)}>
            <Icone nom="retour" /> Retour
          </button>
        )}
        {ecran < 2 ? (
          <button type="button" className="btn btn-bleu flex-1" onClick={() => setEcran(ecran + 1)}>
            Suivant <Icone nom="suivant" />
          </button>
        ) : (
          <button type="button" className="btn btn-accent flex-1" onClick={finir}>
            C'est parti !
          </button>
        )}
      </div>
      {ecran < 2 && (
        <button type="button" className="btn btn-discret w-full mt-2 text-sm" onClick={finir}>
          Passer l'introduction
        </button>
      )}
    </div>
  )
}
