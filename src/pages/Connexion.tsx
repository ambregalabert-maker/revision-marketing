import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import Page from '../components/Page'
import Icone from '../components/Icone'
import { Onglets } from '../components/ui'
import { useCompte } from '../state/compte'

type Mode = 'connexion' | 'inscription' | 'oubli' | 'magique'

export default function Connexion() {
  const compte = useCompte()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('connexion')
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)
  const [envoi, setEnvoi] = useState(false)

  if (!compte.actif) {
    return (
      <Page titre="Mon compte">
        <div className="carte p-5">
          <p className="font-semibold flex items-center gap-2">
            <Icone nom="info" className="text-blue-700" /> Les comptes ne sont pas encore activés sur ce site.
          </p>
          <p className="text-muted mt-2">
            Pas de souci : tout fonctionne en <strong>mode invité</strong>, et ta progression est sauvegardée dans ce navigateur. (Pour activer les comptes, voir la section « Supabase » du fichier README.)
          </p>
          <Link to="/" className="btn btn-accent mt-4">
            Revenir à l'accueil
          </Link>
        </div>
      </Page>
    )
  }

  // Lien « mot de passe oublié » reçu par e-mail : on choisit un nouveau mot de passe.
  if (compte.recuperation) {
    const valider = async (e: FormEvent) => {
      e.preventDefault()
      setEnvoi(true)
      const erreur = await compte.nouveauMotDePasse(mdp)
      setEnvoi(false)
      setMessage(erreur ? { ok: false, texte: erreur } : { ok: true, texte: 'Mot de passe modifié ! Tu es connecté·e.' })
    }
    return (
      <Page titre="Nouveau mot de passe">
        <form onSubmit={valider} className="carte p-5 flex flex-col gap-4">
          <ChampMotDePasse valeur={mdp} onChange={setMdp} nouveau />
          <button type="submit" className="btn btn-accent" disabled={envoi}>
            Enregistrer mon nouveau mot de passe
          </button>
          <Message message={message} />
        </form>
      </Page>
    )
  }

  if (compte.utilisateur) {
    return (
      <Page titre="Mon compte">
        <div className="carte p-5">
          <p className="flex items-center gap-2 font-semibold">
            <Icone nom="ok" className="text-success-ink" /> Tu es connecté·e avec {compte.utilisateur.email}.
          </p>
          <p className="text-muted mt-1">Ta progression est sauvegardée en ligne : retrouve-la sur tous tes appareils.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button type="button" className="btn btn-accent" onClick={() => navigate('/')}>
              Aller à l'accueil
            </button>
            <button type="button" className="btn btn-contour" onClick={() => compte.deconnecter()}>
              <Icone nom="sortie" /> Me déconnecter
            </button>
          </div>
        </div>
      </Page>
    )
  }

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage({ ok: false, texte: 'Vérifie ton adresse e-mail.' })
    if ((mode === 'connexion' || mode === 'inscription') && mdp.length < 6) return setMessage({ ok: false, texte: 'Ton mot de passe doit contenir au moins 6 caractères.' })
    setEnvoi(true)
    let erreur: string | null = null
    if (mode === 'connexion') erreur = await compte.connecter(email, mdp)
    if (mode === 'inscription') erreur = await compte.inscrire(email, mdp)
    if (mode === 'oubli') erreur = await compte.motDePasseOublie(email)
    if (mode === 'magique') erreur = await compte.lienMagique(email)
    setEnvoi(false)
    if (erreur) return setMessage({ ok: false, texte: erreur })
    if (mode === 'connexion') return navigate('/')
    setMessage({
      ok: true,
      texte:
        mode === 'inscription'
          ? "Compte créé ! Si on te demande de confirmer ton e-mail, clique sur le lien reçu (pense à regarder dans les spams), puis reviens te connecter."
          : mode === 'oubli'
            ? 'Si un compte existe avec cet e-mail, tu vas recevoir un lien pour choisir un nouveau mot de passe.'
            : 'Regarde tes e-mails : clique sur le lien reçu pour te connecter sans mot de passe.',
    })
  }

  const titreBouton = { connexion: 'Me connecter', inscription: 'Créer mon compte', oubli: 'Recevoir le lien', magique: 'Recevoir mon lien de connexion' }[mode]

  return (
    <Page titre="Mon compte" sousTitre="Un compte te permet de retrouver ta progression sur ton téléphone et ton ordinateur. C'est facultatif.">
      <div className="mb-4">
        <Onglets
          label="Connexion ou inscription"
          valeur={mode === 'inscription' ? 'inscription' : 'connexion'}
          onChange={(m) => {
            setMode(m)
            setMessage(null)
          }}
          options={[
            { id: 'connexion', label: 'Se connecter' },
            { id: 'inscription', label: 'Créer un compte' },
          ]}
        />
      </div>

      <form onSubmit={soumettre} className="carte p-5 flex flex-col gap-4" noValidate>
        {mode === 'oubli' && <p className="font-semibold">Mot de passe oublié ? Indique ton e-mail, on t'envoie un lien.</p>}
        {mode === 'magique' && <p className="font-semibold">Connexion sans mot de passe : on t'envoie un lien par e-mail.</p>}
        <label className="flex flex-col gap-1 font-semibold text-sm">
          Adresse e-mail
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 rounded-xl border-2 border-line bg-surface px-3 text-base font-normal focus:border-blue-500 outline-none"
          />
        </label>
        {(mode === 'connexion' || mode === 'inscription') && <ChampMotDePasse valeur={mdp} onChange={setMdp} nouveau={mode === 'inscription'} />}
        <button type="submit" className="btn btn-accent" disabled={envoi}>
          {envoi ? 'Un instant…' : titreBouton}
        </button>
        <Message message={message} />

        <div className="flex flex-col gap-1 text-sm">
          {mode !== 'oubli' && (
            <button type="button" className="lien text-left min-h-9" onClick={() => { setMode('oubli'); setMessage(null) }}>
              Mot de passe oublié ?
            </button>
          )}
          {mode !== 'magique' && (
            <button type="button" className="lien text-left min-h-9" onClick={() => { setMode('magique'); setMessage(null) }}>
              Me connecter avec un lien par e-mail (sans mot de passe)
            </button>
          )}
          {(mode === 'oubli' || mode === 'magique') && (
            <button type="button" className="lien text-left min-h-9" onClick={() => { setMode('connexion'); setMessage(null) }}>
              Revenir à la connexion avec mot de passe
            </button>
          )}
        </div>
      </form>

      <p className="text-sm text-muted mt-4">
        Pas envie de créer un compte ? <Link to="/" className="lien">Continue en mode invité</Link> : ta progression reste dans ce navigateur. Si tu crées un compte plus tard, on te proposera de l'importer.
      </p>
    </Page>
  )
}

function ChampMotDePasse({ valeur, onChange, nouveau }: { valeur: string; onChange: (v: string) => void; nouveau?: boolean }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="flex flex-col gap-1 font-semibold text-sm">
      {nouveau ? 'Mot de passe (6 caractères minimum)' : 'Mot de passe'}
      <span className="flex items-center rounded-xl border-2 border-line bg-surface focus-within:border-blue-500">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={nouveau ? 'new-password' : 'current-password'}
          minLength={6}
          required
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 min-h-12 bg-transparent px-3 text-base font-normal outline-none"
        />
        <button type="button" className="btn btn-discret !min-h-10 text-sm" onClick={() => setVisible((v) => !v)} aria-pressed={visible}>
          {visible ? 'Masquer' : 'Afficher'}
        </button>
      </span>
    </label>
  )
}

function Message({ message }: { message: { ok: boolean; texte: string } | null }) {
  if (!message) return null
  return (
    <p role={message.ok ? 'status' : 'alert'} className={`flex gap-2 rounded-xl p-3 ${message.ok ? 'bg-success-bg text-success-ink' : 'bg-error-bg text-error-ink'}`}>
      <Icone nom={message.ok ? 'ok' : 'erreur'} className="mt-0.5" />
      <span>{message.texte}</span>
    </p>
  )
}
