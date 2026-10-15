import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import Page from '../components/Page'
import Icone from '../components/Icone'
import { xpDeLaSemaine } from '../lib/gamification'
import { useCompte } from '../state/compte'
import { useProgression } from '../state/progression'
import { BOTS, xpBot } from '../lib/bots'

interface Ligne {
  pseudo: string
  xp_semaine: number
  bot?: boolean
  moi?: boolean
}

/**
 * Classement de la classe : volontaire, désactivé par défaut, avec un pseudo (jamais l'e-mail).
 * XP de la semaine seulement : tout le monde repart de zéro le lundi.
 * Des bots (src/lib/bots.ts, pseudos ordinaires) avancent au fil de la semaine pour donner envie de les dépasser,
 * et le classement se découvre même sans compte.
 */
export default function Classement() {
  const compte = useCompte()
  const { p, majProfil } = useProgression()
  const [lignes, setLignes] = useState<Ligne[] | null>(null)
  const [erreur, setErreur] = useState(false)
  const [pseudo, setPseudo] = useState(p.profil.pseudo)
  const participe = p.profil.apparaitClassement && p.profil.pseudo.trim().length > 0

  const charger = useCallback(async () => {
    if (!compte.client || !compte.utilisateur) return
    const { data, error } = await compte.client.from('classement_semaine').select('pseudo, xp_semaine').order('xp_semaine', { ascending: false }).limit(50)
    setErreur(!!error)
    if (!error) setLignes((data ?? []) as Ligne[])
  }, [compte.client, compte.utilisateur])

  // Les bots avancent pendant que tu regardes : on recalcule chaque minute.
  const [, setTic] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setTic((n) => n + 1), 60_000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    charger()
    const t = window.setInterval(charger, 15_000)
    return () => window.clearInterval(t)
  }, [charger])

  const entete = (
    <p className="text-muted mb-4">
      Facultatif et volontaire : tu choisis d'apparaître, sous un <strong>pseudo</strong> (jamais ton e-mail). On compte seulement les{' '}
      <strong>XP de la semaine</strong> : remise à zéro chaque lundi, pour que tout le monde puisse remonter.
    </p>
  )

  const enregistrer = () => {
    const propre = pseudo.trim().slice(0, 20)
    setPseudo(propre)
    majProfil({ pseudo: propre, apparaitClassement: propre.length > 0 })
    window.setTimeout(charger, 4000)
  }

  const connecte = !!(compte.actif && compte.utilisateur)
  const monXp = xpDeLaSemaine(p.stats)
  const monPseudo = connecte && participe ? p.profil.pseudo : p.profil.prenom || 'Toi'
  const tout: Ligne[] = [
    ...BOTS.map((b): Ligne => ({ pseudo: b.pseudo, xp_semaine: xpBot(b), bot: true })),
    ...(connecte ? (lignes ?? []).filter((l) => !(participe && l.pseudo === p.profil.pseudo)) : []),
    { pseudo: monPseudo, xp_semaine: monXp, moi: true },
  ].sort((x, y) => y.xp_semaine - x.xp_semaine || (x.moi ? -1 : y.moi ? 1 : 0))
  const rang = tout.findIndex((l) => l.moi)
  const devant = rang > 0 ? tout[rang - 1] : null

  return (
    <Page titre="Classement de la classe">
      {entete}

      <section className="carte p-5 mb-4" aria-labelledby="t-top">
        <h2 id="t-top" className="font-bold text-lg">
          Cette semaine
        </h2>
        <p className="text-sm text-muted mb-3">Dépasse un maximum de réviseurs avant lundi !</p>
        {devant ? (
          <p className="rounded-xl bg-accent-100 px-3 py-2 mb-3 font-semibold">
            Encore <strong>{devant.xp_semaine - monXp + 1} XP</strong> pour dépasser             {devant.pseudo} 💪
          </p>
        ) : (
          <p className="rounded-xl bg-gold-bg px-3 py-2 mb-3 font-semibold">Tu es en tête cette semaine ! 🏆</p>
        )}
        {connecte && erreur && <p className="text-error-ink mb-2">Impossible de charger les autres élèves pour l'instant.</p>}
        <ol className="flex flex-col gap-1">
          {tout.map((l, i) => (
            <li
              key={`${l.pseudo}-${i}`}
              className={`flex items-center gap-3 rounded-xl px-3 min-h-11 ${l.moi ? 'bg-accent-100 font-bold border-2 border-accent-500' : i % 2 ? '' : 'bg-surface-2'}`}
            >
              <span className="w-8 font-titre font-bold text-blue-700">{i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`}</span>
              <span className="flex-1 truncate">
                {l.pseudo}
                {l.moi && ' (toi)'}
              </span>
              <span className="tabular-nums">{l.xp_semaine} XP</span>
            </li>
          ))}
        </ol>
        {!connecte && (
          <p className="text-sm text-muted mt-3">Connecte-toi pour voir aussi les autres élèves de ta classe et apparaître dans leur classement.</p>
        )}
      </section>

      {!connecte ? (
        <ConnexionRapide />
      ) : (
        <section className="carte p-5 mb-4" aria-labelledby="t-participer">
          <h2 id="t-participer" className="font-bold text-lg">
            Ma participation
          </h2>
          {participe ? (
            <>
              <p className="mt-1">
                Tu apparais sous le pseudo <strong>« {p.profil.pseudo} »</strong> avec {xpDeLaSemaine(p.stats)} XP cette semaine.
              </p>
              <button type="button" className="btn btn-contour mt-3" onClick={() => majProfil({ apparaitClassement: false })}>
                Ne plus apparaître dans le classement
              </button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <label className="flex-1 flex flex-col gap-1 text-sm font-semibold">
                Choisis un pseudo (pas ton nom complet)
                <input
                  value={pseudo}
                  maxLength={20}
                  onChange={(e) => setPseudo(e.target.value)}
                  className="min-h-12 rounded-xl border-2 border-line bg-surface px-3 text-base font-normal focus:border-blue-500 outline-none"
                  placeholder="ex. LaReineDuMarketing"
                />
              </label>
              <button type="button" className="btn btn-accent sm:self-end" disabled={!pseudo.trim()} onClick={enregistrer}>
                Apparaître dans le classement
              </button>
            </div>
          )}
        </section>
      )}
    </Page>
  )
}

/** Connexion par e-mail directement depuis le classement. */
function ConnexionRapide() {
  const compte = useCompte()
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)
  const [envoi, setEnvoi] = useState(false)

  if (!compte.actif) {
    return (
      <section className="carte p-5" aria-labelledby="t-connexion">
        <h2 id="t-connexion" className="font-bold text-lg flex items-center gap-2">
          <Icone nom="info" className="text-blue-700" /> Se connecter avec son e-mail
        </h2>
        <p className="text-muted mt-1">Les comptes ne sont pas encore activés sur ce site : tu vois le classement en mode invité.</p>
      </section>
    )
  }

  const envoyer = async (e: FormEvent, mode: 'connexion' | 'inscription') => {
    e.preventDefault()
    setMessage(null)
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage({ ok: false, texte: 'Vérifie ton adresse e-mail.' })
    if (mdp.length < 6)
      return setMessage({
        ok: false,
        texte: 'Ton mot de passe doit contenir au moins 6 caractères.',
      })
    setEnvoi(true)
    const erreur = mode === 'connexion' ? await compte.connecter(email, mdp) : await compte.inscrire(email, mdp)
    setEnvoi(false)
    if (erreur) return setMessage({ ok: false, texte: erreur })
    if (mode === 'inscription')
      setMessage({
        ok: true,
        texte: 'Compte créé ! Si on te demande de confirmer ton e-mail, clique sur le lien reçu (regarde aussi dans les spams), puis reviens te connecter.',
      })
  }

  const champ = 'min-h-12 rounded-xl border-2 border-line bg-surface px-3 text-base font-normal focus:border-blue-500 outline-none'
  return (
    <section className="carte p-5" aria-labelledby="t-connexion">
      <h2 id="t-connexion" className="font-bold text-lg">
        Se connecter avec son e-mail
      </h2>
      <p className="text-muted text-sm mt-1">Pour découvrir le classement de la classe et y apparaître sous un pseudo. Ta progression d'invité est gardée.</p>
      <form onSubmit={(e) => envoyer(e, 'connexion')} className="flex flex-col gap-3 mt-4" noValidate>
        <label className="flex flex-col gap-1 font-semibold text-sm">
          Adresse e-mail
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={champ} />
        </label>
        <label className="flex flex-col gap-1 font-semibold text-sm">
          Mot de passe
          <input type="password" autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.target.value)} className={champ} />
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="submit" className="btn btn-accent flex-1" disabled={envoi}>
            {envoi ? 'Un instant…' : 'Me connecter'}
          </button>
          <button type="button" className="btn btn-contour flex-1" disabled={envoi} onClick={(e) => envoyer(e, 'inscription')}>
            Créer un compte
          </button>
        </div>
        {message && (
          <p role="status" className={message.ok ? 'text-success-ink' : 'text-error-ink'}>
            {message.texte}
          </p>
        )}
        <Link to="/connexion" className="lien text-sm">
          Mot de passe oublié ou connexion sans mot de passe
        </Link>
      </form>
    </section>
  )
}
