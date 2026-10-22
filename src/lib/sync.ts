// Synchronisation entre la progression (dans le navigateur) et Supabase.
// Principe : on garde une « photo » de ce qui est déjà en ligne, et on n'envoie que
// les différences (nouvelles réponses, cartes modifiées, stats…).
import type { SupabaseClient } from '@supabase/supabase-js'
import { niveauPour } from './gamification'
import { normaliser, progressionVide } from '../state/progression'
import type { Progression, RevisionCarte, Seance, Tentative } from './types'

type Ligne = Record<string, unknown>

/** Lit toutes les lignes d'une table (par paquets de 1000, limite de Supabase). */
async function toutLire(client: SupabaseClient, table: string, tri: string): Promise<Ligne[]> {
  const lignes: Ligne[] = []
  for (let debut = 0; ; debut += 1000) {
    const { data, error } = await client.from(table).select('*').order(tri).range(debut, debut + 999)
    if (error) throw error
    lignes.push(...(data ?? []))
    if (!data || data.length < 1000) return lignes
  }
}

/** Télécharge la progression du compte et la transforme au format du site. */
export async function chargerDistant(client: SupabaseClient, userId: string): Promise<Progression> {
  const [profil, stats, cartes, tentatives, sessions, badges] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).maybeSingle(),
    client.from('user_stats').select('*').eq('user_id', userId).maybeSingle(),
    toutLire(client, 'card_reviews', 'card_id'),
    toutLire(client, 'attempts', 'created_at'),
    toutLire(client, 'study_sessions', 'debut'),
    toutLire(client, 'badges', 'badge_id'),
  ])
  if (profil.error) throw profil.error
  if (stats.error) throw stats.error
  const pr = (profil.data ?? {}) as Ligne
  const st = (stats.data ?? {}) as Ligne
  const vide = progressionVide()

  return normaliser({
    version: 1,
    majLe: (st.maj_le as string) ?? vide.majLe,
    onboardingFait: Boolean(pr.onboarding_fait),
    profil: {
      prenom: (pr.prenom as string) ?? '',
      pseudo: (pr.pseudo as string) ?? '',
      objectifHebdo: ((pr.objectif_hebdo as number) ?? 5) as 3 | 5 | 7,
      dateQcm: (pr.date_qcm as string) ?? null,
      apparaitClassement: Boolean(pr.apparait_classement),
      preferences: { ...vide.profil.preferences, ...((pr.preferences as object) ?? {}) },
    },
    cartes: Object.fromEntries(
      cartes.map((c) => [
        c.card_id as string,
        {
          boite: c.boite as RevisionCarte['boite'],
          prochaine: c.prochaine_revision as string,
          derniere: (c.derniere_revision as string) ?? null,
          nbRevisions: c.nb_revisions as number,
          nbEchecs: c.nb_echecs as number,
        },
      ]),
    ),
    tentatives: tentatives.map((t) => ({
      itemId: t.item_id as string,
      type: t.type as Tentative['type'],
      notion: t.notion as Tentative['notion'],
      seance: t.seance as Seance,
      correct: t.correct as boolean,
      le: new Date(t.created_at as string).toISOString(),
    })),
    sessions: sessions.map((s) => ({
      id: s.id as string,
      debut: new Date(s.debut as string).toISOString(),
      dureeMinutes: s.duree_minutes as number,
      type: s.type as 'pomodoro' | 'guidee' | 'daily' | 'libre',
      xp: s.xp_gagnes as number,
    })),
    stats: {
      xpTotal: (st.xp_total as number) ?? 0,
      serieActuelle: (st.serie_actuelle as number) ?? 0,
      meilleureSerie: (st.meilleure_serie as number) ?? 0,
      jokerSemaine: (st.joker_utilise_semaine as string) ?? null,
      derniereActivite: (st.derniere_activite as string) ?? null,
      xpSemaine: (st.xp_semaine as number) ?? 0,
      semaineCle: (st.semaine_cle as string) ?? null,
    },
    badges: Object.fromEntries(badges.map((b) => [b.badge_id as string, new Date(b.obtenu_le as string).toISOString()])),
    minutesParJour: (st.minutes_par_jour as Record<string, number>) ?? {},
    chemin: (st.chemin as Progression['chemin']) ?? {},
    boutique: { ...vide.boutique, ...((pr.boutique as object) ?? {}) },
  })
}

export const aDeLaProgression = (p: Progression) => p.tentatives.length > 0 || p.sessions.length > 0 || p.stats.xpTotal > 0

/**
 * Envoie à Supabase ce qui a changé entre « deja » (ce qui est en ligne) et « actuel ».
 * Si la progression a été réinitialisée, on efface tout en ligne puis on renvoie tout.
 */
export async function pousser(client: SupabaseClient, userId: string, deja: Progression, actuel: Progression) {
  const erreur = (r: { error: unknown }) => {
    if (r.error) throw r.error
  }

  // Réinitialisation détectée : moins de réponses qu'avant.
  if (actuel.tentatives.length < deja.tentatives.length) {
    for (const table of ['card_reviews', 'attempts', 'study_sessions', 'badges']) {
      erreur(await client.from(table).delete().eq('user_id', userId))
    }
    deja = { ...progressionVide(), profil: deja.profil, onboardingFait: deja.onboardingFait }
  }

  const travaux: PromiseLike<{ error: unknown }>[] = []

  if (
    JSON.stringify(deja.profil) !== JSON.stringify(actuel.profil) ||
    deja.onboardingFait !== actuel.onboardingFait ||
    JSON.stringify(deja.boutique) !== JSON.stringify(actuel.boutique)
  ) {
    const pr = actuel.profil
    travaux.push(
      client.from('profiles').upsert({
        id: userId,
        prenom: pr.prenom,
        pseudo: pr.pseudo,
        objectif_hebdo: pr.objectifHebdo,
        date_qcm: pr.dateQcm,
        apparait_classement: pr.apparaitClassement,
        onboarding_fait: actuel.onboardingFait,
        preferences: pr.preferences,
        boutique: actuel.boutique,
      }),
    )
  }

  const cartes = Object.entries(actuel.cartes).filter(([id, c]) => JSON.stringify(deja.cartes[id]) !== JSON.stringify(c))
  if (cartes.length) {
    travaux.push(
      client.from('card_reviews').upsert(
        cartes.map(([id, c]) => ({
          user_id: userId,
          card_id: id,
          boite: c.boite,
          prochaine_revision: c.prochaine,
          derniere_revision: c.derniere,
          nb_revisions: c.nbRevisions,
          nb_echecs: c.nbEchecs,
        })),
      ),
    )
  }

  const nouvelles = actuel.tentatives.slice(deja.tentatives.length)
  if (nouvelles.length) {
    travaux.push(
      client.from('attempts').upsert(
        nouvelles.map((t) => ({ user_id: userId, item_id: t.itemId, type: t.type, notion: t.notion, seance: t.seance, correct: t.correct, created_at: t.le })),
        { onConflict: 'user_id,item_id,created_at', ignoreDuplicates: true },
      ),
    )
  }

  const avantSessions = new Map(deja.sessions.map((s) => [s.id, s]))
  const sessions = actuel.sessions.filter((s) => JSON.stringify(avantSessions.get(s.id)) !== JSON.stringify(s))
  if (sessions.length) {
    travaux.push(
      client.from('study_sessions').upsert(
        sessions.map((s) => ({ id: s.id, user_id: userId, debut: s.debut, duree_minutes: s.dureeMinutes, type: s.type, xp_gagnes: s.xp })),
      ),
    )
  }

  if (
    JSON.stringify(deja.stats) !== JSON.stringify(actuel.stats) ||
    JSON.stringify(deja.minutesParJour) !== JSON.stringify(actuel.minutesParJour) ||
    JSON.stringify(deja.chemin) !== JSON.stringify(actuel.chemin)
  ) {
    const s = actuel.stats
    travaux.push(
      client.from('user_stats').upsert({
        user_id: userId,
        xp_total: s.xpTotal,
        niveau: niveauPour(s.xpTotal).numero,
        serie_actuelle: s.serieActuelle,
        meilleure_serie: s.meilleureSerie,
        joker_utilise_semaine: s.jokerSemaine,
        derniere_activite: s.derniereActivite,
        xp_semaine: s.xpSemaine,
        semaine_cle: s.semaineCle,
        minutes_par_jour: actuel.minutesParJour,
        chemin: actuel.chemin,
        maj_le: actuel.majLe,
      }),
    )
  }

  const badges = Object.entries(actuel.badges).filter(([id]) => !deja.badges[id])
  if (badges.length) {
    travaux.push(client.from('badges').upsert(badges.map(([id, le]) => ({ user_id: userId, badge_id: id, obtenu_le: le }))))
  }

  const resultats = await Promise.all(travaux)
  resultats.forEach(erreur)
}

/**
 * Fusionne la progression invité dans celle du compte (quand l'étudiant importe sa progression).
 * On additionne les efforts : réponses, séances et XP des deux côtés.
 */
export function fusionner(compte: Progression, invite: Progression): Progression {
  const cle = (t: Tentative) => `${t.itemId}|${t.le}`
  const vues = new Set(compte.tentatives.map(cle))
  const tentatives = [...compte.tentatives, ...invite.tentatives.filter((t) => !vues.has(cle(t)))].sort((a, b) => a.le.localeCompare(b.le))
  const idsSessions = new Set(compte.sessions.map((s) => s.id))
  const cartes = { ...compte.cartes }
  for (const [id, c] of Object.entries(invite.cartes)) {
    const autre = cartes[id]
    if (!autre || (c.derniere ?? '') > (autre.derniere ?? '')) cartes[id] = c
  }
  const minutes = { ...compte.minutesParJour }
  for (const [j, m] of Object.entries(invite.minutesParJour)) minutes[j] = (minutes[j] ?? 0) + m
  const badges = { ...invite.badges, ...compte.badges }
  // Chemin : on garde, pour chaque étape, le plus d'étoiles des deux côtés.
  const chemin = { ...compte.chemin }
  for (const [id, e] of Object.entries(invite.chemin)) if (!chemin[id] || e.etoiles > chemin[id].etoiles) chemin[id] = e
  const memeSemaine = compte.stats.semaineCle === invite.stats.semaineCle
  const plusRecente = (compte.stats.derniereActivite ?? '') >= (invite.stats.derniereActivite ?? '') ? compte.stats : invite.stats

  return normaliser({
    ...compte,
    onboardingFait: true,
    // Compte tout neuf : on garde le profil de l'invité (prénom, objectif, réglages).
    profil: compte.onboardingFait ? { ...compte.profil, prenom: compte.profil.prenom || invite.profil.prenom } : invite.profil,
    tentatives,
    sessions: [...compte.sessions, ...invite.sessions.filter((s) => !idsSessions.has(s.id))],
    cartes,
    badges,
    minutesParJour: minutes,
    chemin,
    boutique: {
      ...(compte.boutique.compagnon ? compte.boutique : invite.boutique),
      possedes: [...new Set([...compte.boutique.possedes, ...invite.boutique.possedes])],
      depenses: compte.boutique.depenses + invite.boutique.depenses,
      bonus: Math.max(compte.boutique.bonus, invite.boutique.bonus),
    },
    stats: {
      ...plusRecente,
      xpTotal: compte.stats.xpTotal + invite.stats.xpTotal,
      meilleureSerie: Math.max(compte.stats.meilleureSerie, invite.stats.meilleureSerie),
      xpSemaine: memeSemaine ? compte.stats.xpSemaine + invite.stats.xpSemaine : plusRecente.xpSemaine,
      semaineCle: plusRecente.semaineCle,
    },
  })
}
