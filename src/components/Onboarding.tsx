import { useState } from 'react'
import { useProgression } from '../state/progression'
import Icone from './Icone'

/** Parcours d'accueil en 3 écrans pour un nouvel utilisateur. */
export default function Onboarding() {
  const { p, majProfil, terminerOnboarding } = useProgression()
  const [ecran, setEcran] = useState(0)
  const [prenom, setPrenom] = useState(p.profil.prenom)
  const [objectif, setObjectif] = useState(p.profil.objectifHebdo)

  const finir = () => {
    majProfil({ prenom: prenom.trim(), objectifHebdo: objectif })
    terminerOnboarding()
  }

  return (
    <div className="carte p-6 md:p-8 apparition" aria-labelledby="titre-onboarding">
      <p className="text-sm font-bold text-blue-700 mb-2">Bienvenue · {ecran + 1} / 3</p>
      <div className="flex gap-1 mb-6" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= ecran ? 'bg-orange-500' : 'bg-blue-100'}`} />
        ))}
      </div>

      {ecran === 0 && (
        <div className="flex flex-col gap-4">
          <h1 id="titre-onboarding" className="text-2xl font-bold">Comment marche le site</h1>
          <p>Ici, tu révises le chapitre 1 de Marketing, « Le concept de marché », en petites séances :</p>
          <ul className="flex flex-col gap-2">
            <li className="flex gap-2"><Icone nom="cartes" className="text-blue-700" /> des <strong>flashcards</strong> qui reviennent au bon moment ;</li>
            <li className="flex gap-2"><Icone nom="qcm" className="text-blue-700" /> des <strong>QCM</strong> au format du vrai QCM noté ;</li>
            <li className="flex gap-2"><Icone nom="cible" className="text-blue-700" /> des <strong>exercices et des cas</strong> corrigés, pour savoir appliquer ;</li>
            <li className="flex gap-2"><Icone nom="minuteur" className="text-blue-700" /> un <strong>minuteur</strong> de 25 minutes pour rester concentré·e.</li>
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
          <p>Combien de séances veux-tu faire par semaine ? Une séance = un Pomodoro de 25 min, une séance guidée ou 10 min de révision. Mieux vaut un objectif tenable : tu pourras le changer dans ton profil.</p>
          <div role="radiogroup" aria-label="Objectif hebdomadaire" className="grid grid-cols-3 gap-3">
            {([3, 5, 7] as const).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={objectif === n}
                onClick={() => setObjectif(n)}
                className={`rounded-2xl border-2 p-4 min-h-24 flex flex-col items-center justify-center transition-colors ${
                  objectif === n ? 'border-orange-500 bg-orange-100' : 'border-line hover:border-blue-500'
                }`}
              >
                <span className="font-titre font-bold text-3xl">{n}</span>
                <span className="text-sm text-muted">séances</span>
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
          <button type="button" className="btn btn-orange flex-1" onClick={finir}>
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
