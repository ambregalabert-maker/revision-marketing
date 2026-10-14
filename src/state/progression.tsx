// Cœur de la progression de l'étudiant : un seul état, sauvegardé dans le navigateur
// (mode invité) et synchronisé avec Supabase quand l'étudiant est connecté (voir sync.ts).
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { ecrire, lire } from '../lib/stockage'
import { idUnique, jour } from '../lib/dates'
import { noter, type NoteCarte } from '../lib/leitner'
import {
  BADGES,
  MINUTES_JOUR_ACTIF,
  XP,
  ajouterXpStats,
  marquerJourActif,
  niveauPour,
  nouveauxBadges,
} from '../lib/gamification'
import type { NotionId, Profil, Progression, Seance, SessionEtude, Tentative, TypeSession, TypeTentative } from '../lib/types'

export const CLE_PROGRESSION = 'rm-progression'

export function progressionVide(): Progression {
  return {
    version: 1,
    majLe: new Date(0).toISOString(),
    onboardingFait: false,
    profil: {
      prenom: '',
      pseudo: '',
      objectifHebdo: 5,
      dateQcm: null,
      apparaitClassement: false,
      preferences: { son: true, notifications: false, travail: 25, pause: 5, pauseLongue: 15 },
    },
    cartes: {},
    tentatives: [],
    sessions: [],
    stats: {
      xpTotal: 0,
      serieActuelle: 0,
      meilleureSerie: 0,
      jokerSemaine: null,
      derniereActivite: null,
      xpSemaine: 0,
      semaineCle: null,
    },
    badges: {},
    minutesParJour: {},
  }
}

/** Complète une progression ancienne ou partielle avec les valeurs par défaut. */
export function normaliser(p: Partial<Progression> | null | undefined): Progression {
  const vide = progressionVide()
  if (!p || typeof p !== 'object') return vide
  return {
    ...vide,
    ...p,
    profil: { ...vide.profil, ...p.profil, preferences: { ...vide.profil.preferences, ...p.profil?.preferences } },
    stats: { ...vide.stats, ...p.stats },
    cartes: p.cartes ?? {},
    tentatives: p.tentatives ?? [],
    sessions: p.sessions ?? [],
    badges: p.badges ?? {},
    minutesParJour: p.minutesParJour ?? {},
  }
}

/** Ce qui mérite une petite fête à l'écran (confettis + message). */
export interface Celebration {
  id: string
  type: 'niveau' | 'badge'
  titre: string
  detail: string
  icone: string
}

interface ValeurContexte {
  p: Progression
  /** Fêtes en attente d'affichage. */
  celebrations: Celebration[]
  retirerCelebration: (id: string) => void
  /** Enregistre une réponse (QCM, exercice, cas…). Renvoie les XP gagnés. */
  repondre: (t: { itemId: string; type: TypeTentative; notion: NotionId; seance: Seance; correct: boolean }, xp: number) => number
  /** Auto-évaluation d'une flashcard (Leitner). */
  noterCarte: (carte: { id: string; notion: NotionId; seance: Seance }, note: NoteCarte) => void
  /** Termine une séance (Pomodoro ou guidée). */
  terminerSession: (type: TypeSession, minutes: number, xp: number) => void
  /** Ajoute une minute de révision « libre » (compteur de temps sur les pages de révision). */
  ajouterMinute: () => void
  debloquerBadge: (id: string) => void
  majProfil: (modif: Partial<Profil>) => void
  terminerOnboarding: () => void
  reinitialiser: () => void
  /** Remplace toute la progression (import depuis Supabase ou fusion). */
  remplacer: (p: Progression) => void
}

const Contexte = createContext<ValeurContexte | null>(null)

/** Écouteurs appelés après chaque modification (utilisé par la synchronisation Supabase). */
type Ecouteur = (avant: Progression, apres: Progression) => void
const ecouteurs = new Set<Ecouteur>()
export function ecouterProgression(f: Ecouteur) {
  ecouteurs.add(f)
  return () => {
    ecouteurs.delete(f)
  }
}

export function ProgressionProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Progression>(() => normaliser(lire<Progression | null>(CLE_PROGRESSION, null)))
  const [celebrations, setCelebrations] = useState<Celebration[]>([])
  const ref = useRef(p)
  const libre = useRef<{ id: string; maj: number } | null>(null)

  /**
   * Applique une modification, puis :
   * 1) vérifie si la journée compte pour la série ;
   * 2) débloque les badges mérités ;
   * 3) prépare les fêtes (niveau, badges) ;
   * 4) sauvegarde.
   */
  const appliquer = useCallback((modif: (avant: Progression) => Progression, options: { silencieux?: boolean } = {}) => {
    const avant = ref.current
    let apres = modif(avant)
    const aujourdhui = jour()
    const fetes: Celebration[] = []

    const minutes = apres.minutesParJour[aujourdhui] ?? 0
    const seanceDuJour = apres.sessions.some((s) => s.debut.slice(0, 10) === aujourdhui && s.type !== 'libre')
    if (minutes >= MINUTES_JOUR_ACTIF || seanceDuJour) {
      apres = { ...apres, stats: marquerJourActif(apres.stats, aujourdhui) }
    }

    const badges = nouveauxBadges(apres)
    if (badges.length) {
      const maintenant = new Date().toISOString()
      apres = { ...apres, badges: { ...apres.badges, ...Object.fromEntries(badges.map((b) => [b, maintenant])) } }
      for (const id of badges) {
        const b = BADGES.find((x) => x.id === id)!
        fetes.push({ id: idUnique(), type: 'badge', titre: `Badge débloqué : ${b.nom}`, detail: b.description, icone: b.icone })
      }
    }

    const nAvant = niveauPour(avant.stats.xpTotal)
    const nApres = niveauPour(apres.stats.xpTotal)
    if (nApres.numero > nAvant.numero) {
      fetes.unshift({ id: idUnique(), type: 'niveau', titre: `Niveau ${nApres.numero} !`, detail: `Tu es maintenant ${nApres.nom}.`, icone: '⭐' })
    }

    apres = { ...apres, majLe: new Date().toISOString() }
    ref.current = apres
    setP(apres)
    ecrire(CLE_PROGRESSION, apres)
    if (fetes.length && !options.silencieux) setCelebrations((c) => [...c, ...fetes])
    ecouteurs.forEach((f) => f(avant, apres))
  }, [])

  const repondre = useCallback<ValeurContexte['repondre']>(
    (t, xp) => {
      const gain = t.correct || t.type === 'cas' ? xp : 0
      appliquer((avant) => {
        const tentative: Tentative = { ...t, le: new Date().toISOString() }
        return {
          ...avant,
          tentatives: [...avant.tentatives, tentative],
          stats: gain ? ajouterXpStats(avant.stats, gain) : avant.stats,
        }
      })
      return gain
    },
    [appliquer],
  )

  const noterCarte = useCallback<ValeurContexte['noterCarte']>(
    (carte, note) => {
      appliquer((avant) => ({
        ...avant,
        cartes: { ...avant.cartes, [carte.id]: noter(avant.cartes[carte.id], note) },
        tentatives: [
          ...avant.tentatives,
          { itemId: carte.id, type: 'flashcard', notion: carte.notion, seance: carte.seance, correct: note === 'oui', le: new Date().toISOString() },
        ],
        // Une flashcard révisée rapporte toujours des XP, quelle que soit la réponse.
        stats: ajouterXpStats(avant.stats, XP.flashcard),
      }))
    },
    [appliquer],
  )

  const terminerSession = useCallback<ValeurContexte['terminerSession']>(
    (type, minutes, xp) => {
      appliquer((avant) => {
        const session: SessionEtude = { id: idUnique(), debut: new Date(Date.now() - minutes * 60_000).toISOString(), dureeMinutes: minutes, type, xp }
        return { ...avant, sessions: [...avant.sessions, session], stats: ajouterXpStats(avant.stats, xp) }
      })
    },
    [appliquer],
  )

  const ajouterMinute = useCallback(() => {
    appliquer(
      (avant) => {
        const aujourdhui = jour()
        const maintenant = Date.now()
        let sessions = avant.sessions
        // On prolonge la session libre en cours si la dernière minute date de moins de 5 min.
        const enCours = libre.current && maintenant - libre.current.maj < 5 * 60_000 ? libre.current : null
        if (enCours && sessions.some((s) => s.id === enCours.id)) {
          sessions = sessions.map((s) => (s.id === enCours.id ? { ...s, dureeMinutes: s.dureeMinutes + 1 } : s))
          libre.current = { id: enCours.id, maj: maintenant }
        } else {
          const id = idUnique()
          sessions = [...sessions, { id, debut: new Date(maintenant - 60_000).toISOString(), dureeMinutes: 1, type: 'libre', xp: 0 }]
          libre.current = { id, maj: maintenant }
        }
        return {
          ...avant,
          sessions,
          minutesParJour: { ...avant.minutesParJour, [aujourdhui]: (avant.minutesParJour[aujourdhui] ?? 0) + 1 },
        }
      },
    )
  }, [appliquer])

  const debloquerBadge = useCallback(
    (id: string) => {
      if (ref.current.badges[id]) return
      const b = BADGES.find((x) => x.id === id)
      if (!b) return
      appliquer((avant) => ({ ...avant, badges: { ...avant.badges, [id]: new Date().toISOString() } }))
      setCelebrations((c) => [...c, { id: idUnique(), type: 'badge', titre: `Badge débloqué : ${b.nom}`, detail: b.description, icone: b.icone }])
    },
    [appliquer],
  )

  const majProfil = useCallback(
    (modif: Partial<Profil>) =>
      appliquer((avant) => ({
        ...avant,
        profil: { ...avant.profil, ...modif, preferences: { ...avant.profil.preferences, ...modif.preferences } },
      })),
    [appliquer],
  )

  const terminerOnboarding = useCallback(() => appliquer((avant) => ({ ...avant, onboardingFait: true })), [appliquer])

  const reinitialiser = useCallback(() => {
    // On garde le profil (prénom, préférences) : seule la progression repart de zéro.
    appliquer((avant) => ({ ...progressionVide(), onboardingFait: true, profil: avant.profil }), { silencieux: true })
    libre.current = null
  }, [appliquer])

  const remplacer = useCallback((nouvelle: Progression) => appliquer(() => normaliser(nouvelle), { silencieux: true }), [appliquer])

  const retirerCelebration = useCallback((id: string) => setCelebrations((c) => c.filter((x) => x.id !== id)), [])

  const valeur = useMemo<ValeurContexte>(
    () => ({
      p,
      celebrations,
      retirerCelebration,
      repondre,
      noterCarte,
      terminerSession,
      ajouterMinute,
      debloquerBadge,
      majProfil,
      terminerOnboarding,
      reinitialiser,
      remplacer,
    }),
    [p, celebrations, retirerCelebration, repondre, noterCarte, terminerSession, ajouterMinute, debloquerBadge, majProfil, terminerOnboarding, reinitialiser, remplacer],
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export function useProgression() {
  const v = useContext(Contexte)
  if (!v) throw new Error('useProgression doit être utilisé dans <ProgressionProvider>')
  return v
}
