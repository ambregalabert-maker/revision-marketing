// Comptes (Supabase) : inscription, connexion, synchronisation de la progression.
// Sans clés Supabase, tout ce fichier reste inactif et le site marche en mode invité.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getSupabase, supabaseConfigure } from '../lib/supabase'
import { aDeLaProgression, chargerDistant, fusionner, pousser } from '../lib/sync'
import { ecrire, lire } from '../lib/stockage'
import { progressionVide, useProgression } from './progression'
import type { Progression } from '../lib/types'

/** À qui appartient la progression gardée dans ce navigateur : « invite » ou l'identifiant du compte. */
const CLE_PROPRIETAIRE = 'rm-proprietaire'
/** Copie de secours de la progression invité, au moment de la connexion. */
const CLE_SAUVEGARDE_INVITE = 'rm-progression-invite'

export type StatutSync = 'invite' | 'chargement' | 'a-jour' | 'envoi' | 'hors-ligne'

interface DemandeImport {
  local: Progression
  distant: Progression
}

interface ValeurCompte {
  actif: boolean
  pret: boolean
  utilisateur: User | null
  statut: StatutSync
  demandeImport: DemandeImport | null
  /** Réponse à la question « importer ma progression invité ? ». */
  repondreImport: (importer: boolean) => void
  recuperation: boolean
  client: SupabaseClient | null
  inscrire: (email: string, mdp: string) => Promise<string | null>
  connecter: (email: string, mdp: string) => Promise<string | null>
  lienMagique: (email: string) => Promise<string | null>
  motDePasseOublie: (email: string) => Promise<string | null>
  nouveauMotDePasse: (mdp: string) => Promise<string | null>
  deconnecter: () => Promise<void>
  supprimerCompte: () => Promise<string | null>
}

const Contexte = createContext<ValeurCompte | null>(null)

/** Traduit les messages d'erreur de Supabase en français. */
export function traduireErreur(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Un compte existe déjà avec cet e-mail : connecte-toi.'
  if (m.includes('email not confirmed')) return "Ton e-mail n'est pas encore confirmé : clique sur le lien reçu par e-mail."
  if (m.includes('password should be at least') || m.includes('weak password')) return 'Ton mot de passe doit contenir au moins 6 caractères.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives : attends quelques minutes avant de réessayer.'
  if (m.includes('invalid email') || m.includes('unable to validate email')) return "Cette adresse e-mail n'est pas valide."
  if (m.includes('fetch') || m.includes('network')) return 'Pas de connexion internet. Réessaie dans un instant.'
  return `Une erreur est survenue (${message}).`
}

export function CompteProvider({ children }: { children: ReactNode }) {
  const { p, remplacer } = useProgression()
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [pret, setPret] = useState(!supabaseConfigure)
  const [utilisateur, setUtilisateur] = useState<User | null>(null)
  const [statut, setStatut] = useState<StatutSync>('invite')
  const [demandeImport, setDemandeImport] = useState<DemandeImport | null>(null)
  const [recuperation, setRecuperation] = useState(false)

  const pRef = useRef(p)
  pRef.current = p
  /** Ce qui est déjà enregistré en ligne (null = synchronisation en pause). */
  const enLigne = useRef<Progression | null>(null)
  const envoiEnCours = useRef(false)
  const demarreePour = useRef<string | null>(null)

  // ---------- Démarrage : session existante + écoute des connexions ----------
  useEffect(() => {
    if (!supabaseConfigure) return
    let annule = false
    let desabonner: (() => void) | undefined
    getSupabase().then((c) => {
      if (annule) return
      setClient(c)
      if (!c) return setPret(true)
      c.auth.getSession().then(({ data }) => {
        if (annule) return
        setUtilisateur(data.session?.user ?? null)
        setPret(true)
      })
      const { data } = c.auth.onAuthStateChange((evenement, session) => {
        if (evenement === 'PASSWORD_RECOVERY') setRecuperation(true)
        setUtilisateur(session?.user ?? null)
      })
      desabonner = () => data.subscription.unsubscribe()
    })
    return () => {
      annule = true
      desabonner?.()
    }
  }, [])

  // ---------- À la connexion : récupérer la progression du compte ----------
  useEffect(() => {
    if (!client || !utilisateur) {
      enLigne.current = null
      demarreePour.current = null
      setStatut('invite')
      return
    }
    if (demarreePour.current === utilisateur.id) return
    demarreePour.current = utilisateur.id
    const id = utilisateur.id
    setStatut('chargement')

    chargerDistant(client, id)
      .then((distant) => {
        const local = pRef.current
        const proprietaire = lire<string>(CLE_PROPRIETAIRE, 'invite')
        if (proprietaire === id) {
          // Ce navigateur avait déjà la progression de ce compte : on garde la plus récente.
          if (local.majLe > distant.majLe) remplacer(local)
          else remplacer(distant)
          enLigne.current = distant
        } else if (proprietaire === 'invite' && aDeLaProgression(local)) {
          // Progression invité : on demande avant de l'importer.
          ecrire(CLE_SAUVEGARDE_INVITE, local)
          setDemandeImport({ local, distant })
          return
        } else {
          // Compte tout neuf sans progression invité : on garde au moins le prénom et l'accueil déjà faits.
          const base = !distant.onboardingFait && proprietaire === 'invite' && local.onboardingFait ? { ...distant, onboardingFait: true, profil: local.profil } : distant
          remplacer(base)
          enLigne.current = distant
        }
        ecrire(CLE_PROPRIETAIRE, id)
        setStatut('a-jour')
      })
      .catch(() => {
        demarreePour.current = null
        setStatut('hors-ligne')
      })
  }, [client, utilisateur, remplacer])

  const repondreImport = useCallback(
    (importer: boolean) => {
      if (!demandeImport || !utilisateur) return
      const { local, distant } = demandeImport
      remplacer(importer ? fusionner(distant, local) : distant)
      enLigne.current = distant
      ecrire(CLE_PROPRIETAIRE, utilisateur.id)
      setDemandeImport(null)
      setStatut('a-jour')
    },
    [demandeImport, utilisateur, remplacer],
  )

  // ---------- Envoi régulier des changements ----------
  const synchroniser = useCallback(async () => {
    const deja = enLigne.current
    const actuel = pRef.current
    if (!client || !utilisateur || !deja || envoiEnCours.current || deja === actuel) return
    envoiEnCours.current = true
    setStatut('envoi')
    try {
      await pousser(client, utilisateur.id, deja, actuel)
      enLigne.current = actuel
      setStatut('a-jour')
    } catch {
      // Hors ligne ou erreur : on réessaiera au prochain tour.
      setStatut('hors-ligne')
    } finally {
      envoiEnCours.current = false
    }
  }, [client, utilisateur])

  useEffect(() => {
    if (!utilisateur) return
    const t = window.setInterval(synchroniser, 3000)
    const cache = () => document.visibilityState === 'hidden' && synchroniser()
    document.addEventListener('visibilitychange', cache)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', cache)
    }
  }, [utilisateur, synchroniser])

  // ---------- Actions du compte ----------
  const redirection = `${window.location.origin}/connexion`
  const avecClient = useCallback(
    async (action: (c: SupabaseClient) => Promise<{ error: { message: string } | null }>) => {
      if (!client) return "Les comptes ne sont pas activés sur ce site : tu peux l'utiliser en mode invité."
      try {
        const { error } = await action(client)
        return error ? traduireErreur(error.message) : null
      } catch (e) {
        return traduireErreur(String(e))
      }
    },
    [client],
  )

  const inscrire = useCallback(
    (email: string, mdp: string) => avecClient((c) => c.auth.signUp({ email, password: mdp, options: { emailRedirectTo: redirection } })),
    [avecClient, redirection],
  )
  const connecter = useCallback((email: string, mdp: string) => avecClient((c) => c.auth.signInWithPassword({ email, password: mdp })), [avecClient])
  const lienMagique = useCallback(
    (email: string) => avecClient((c) => c.auth.signInWithOtp({ email, options: { emailRedirectTo: redirection } })),
    [avecClient, redirection],
  )
  const motDePasseOublie = useCallback(
    (email: string) => avecClient((c) => c.auth.resetPasswordForEmail(email, { redirectTo: redirection })),
    [avecClient, redirection],
  )
  const nouveauMotDePasse = useCallback(
    async (mdp: string) => {
      const erreur = await avecClient((c) => c.auth.updateUser({ password: mdp }))
      if (!erreur) setRecuperation(false)
      return erreur
    },
    [avecClient],
  )

  /** Revenir en mode invité : la progression du compte reste en ligne, ce navigateur repart d'une page blanche. */
  const repartirEnInvite = useCallback(() => {
    enLigne.current = null
    demarreePour.current = null
    ecrire(CLE_PROPRIETAIRE, 'invite')
    remplacer({ ...progressionVide(), onboardingFait: true })
  }, [remplacer])

  const deconnecter = useCallback(async () => {
    await synchroniser()
    await client?.auth.signOut()
    repartirEnInvite()
  }, [client, synchroniser, repartirEnInvite])

  const supprimerCompte = useCallback(async () => {
    const erreur = await avecClient(async (c) => {
      const r = await c.rpc('supprimer_mon_compte')
      return { error: r.error }
    })
    if (erreur) return erreur
    await client?.auth.signOut()
    repartirEnInvite()
    return null
  }, [avecClient, client, repartirEnInvite])

  const valeur = useMemo<ValeurCompte>(
    () => ({
      actif: supabaseConfigure,
      pret,
      utilisateur,
      statut,
      demandeImport,
      repondreImport,
      recuperation,
      client,
      inscrire,
      connecter,
      lienMagique,
      motDePasseOublie,
      nouveauMotDePasse,
      deconnecter,
      supprimerCompte,
    }),
    [pret, utilisateur, statut, demandeImport, repondreImport, recuperation, client, inscrire, connecter, lienMagique, motDePasseOublie, nouveauMotDePasse, deconnecter, supprimerCompte],
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export function useCompte() {
  const v = useContext(Contexte)
  if (!v) throw new Error('useCompte doit être utilisé dans <CompteProvider>')
  return v
}
