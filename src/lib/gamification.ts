// Règles de motivation : XP, niveaux, série, maîtrise des notions, badges, encouragements.
// Une mauvaise réponse ne fait JAMAIS perdre d'XP : on récompense l'effort.
import { ajouterJours, ecartJours, jour, lundi } from './dates'
import { classements, flashcards, notions, qcm, vraiFaux } from './contenu'
import type { NotionId, Progression, Stats, Tentative } from './types'

export const XP = {
  flashcard: 2,
  qcmJuste: 5,
  exerciceReussi: 10,
  casTermine: 25,
  pomodoro: 15,
  bonusSeanceGuidee: 20,
} as const

// ---------- Niveaux ----------

export const NIVEAUX = [
  { nom: 'Stagiaire', seuil: 0 },
  { nom: 'Assistant·e marketing', seuil: 100 },
  { nom: "Chargé·e d'études", seuil: 250 },
  { nom: 'Chef·fe de produit junior', seuil: 450 },
  { nom: 'Chef·fe de produit', seuil: 700 },
  { nom: 'Chef·fe de groupe', seuil: 1000 },
  { nom: 'Responsable de marque', seuil: 1400 },
  { nom: 'Responsable marketing', seuil: 1900 },
  { nom: 'Directeur·rice marketing adjoint·e', seuil: 2500 },
  { nom: 'Directeur·rice marketing', seuil: 3200 },
]

export function niveauPour(xp: number) {
  let i = 0
  while (i + 1 < NIVEAUX.length && xp >= NIVEAUX[i + 1].seuil) i++
  const actuel = NIVEAUX[i]
  const suivant = NIVEAUX[i + 1]
  const progression = suivant ? (xp - actuel.seuil) / (suivant.seuil - actuel.seuil) : 1
  return { numero: i + 1, nom: actuel.nom, suivant, progression, resteXp: suivant ? suivant.seuil - xp : 0 }
}

// ---------- Série (streak) ----------

/** Minutes de révision dans la journée pour qu'elle compte dans la série. */
export const MINUTES_JOUR_ACTIF = 10

/**
 * Enregistre qu'aujourd'hui compte pour la série.
 * Si un seul jour a été manqué et que le joker de la semaine est disponible, la série continue.
 */
export function marquerJourActif(stats: Stats, aujourdhui = jour()): Stats {
  if (stats.derniereActivite === aujourdhui) return stats
  let serie = 1
  let jokerSemaine = stats.jokerSemaine
  if (stats.derniereActivite) {
    const ecart = ecartJours(stats.derniereActivite, aujourdhui)
    if (ecart === 1) serie = stats.serieActuelle + 1
    else if (ecart === 2 && jokerSemaine !== lundi(aujourdhui)) {
      // Un jour manqué : le joker de la semaine sauve la série.
      serie = stats.serieActuelle + 1
      jokerSemaine = lundi(aujourdhui)
    }
  }
  return {
    ...stats,
    serieActuelle: serie,
    meilleureSerie: Math.max(stats.meilleureSerie, serie),
    derniereActivite: aujourdhui,
    jokerSemaine,
  }
}

/** Série à afficher : 0 si elle est déjà perdue (plus d'un jour manqué, ou joker déjà utilisé). */
export function serieAffichee(stats: Stats, aujourdhui = jour()): { serie: number; enDanger: boolean; jokerDispo: boolean } {
  const jokerDispo = stats.jokerSemaine !== lundi(aujourdhui)
  if (!stats.derniereActivite) return { serie: 0, enDanger: false, jokerDispo }
  const ecart = ecartJours(stats.derniereActivite, aujourdhui)
  if (ecart <= 0) return { serie: stats.serieActuelle, enDanger: false, jokerDispo }
  if (ecart === 1) return { serie: stats.serieActuelle, enDanger: true, jokerDispo }
  if (ecart === 2 && jokerDispo) return { serie: stats.serieActuelle, enDanger: true, jokerDispo }
  return { serie: 0, enDanger: false, jokerDispo }
}

/** Ajoute des XP au total et à la semaine en cours (remise à zéro chaque lundi). */
export function ajouterXpStats(stats: Stats, xp: number, aujourdhui = jour()): Stats {
  const semaine = lundi(aujourdhui)
  const xpSemaine = stats.semaineCle === semaine ? stats.xpSemaine : 0
  return { ...stats, xpTotal: stats.xpTotal + xp, xpSemaine: xpSemaine + xp, semaineCle: semaine }
}

export function xpDeLaSemaine(stats: Stats, aujourdhui = jour()) {
  return stats.semaineCle === lundi(aujourdhui) ? stats.xpSemaine : 0
}

// ---------- Maîtrise des notions ----------

export type NiveauMaitrise = 'nouveau' | 'a-revoir' | 'en-cours' | 'maitrise'

/** Taux de réussite sur les 10 dernières réponses de la notion. */
export function maitrise(tentatives: Tentative[], notion: NotionId) {
  const dernieres = tentatives.filter((t) => t.notion === notion).slice(-10)
  if (dernieres.length === 0) return { taux: 0, nb: 0, niveau: 'nouveau' as NiveauMaitrise }
  const taux = Math.round((dernieres.filter((t) => t.correct).length / dernieres.length) * 100)
  let niveau: NiveauMaitrise = taux < 50 ? 'a-revoir' : 'en-cours'
  if (taux >= 80 && dernieres.length >= 5) niveau = 'maitrise'
  return { taux, nb: dernieres.length, niveau }
}

export const LIBELLE_MAITRISE: Record<NiveauMaitrise, string> = {
  nouveau: 'Pas encore commencé',
  'a-revoir': 'À revoir',
  'en-cours': 'En cours',
  maitrise: 'Maîtrisé',
}

/** La notion la plus faible (pour la séance guidée), en privilégiant celles déjà travaillées. */
export function notionLaPlusFaible(tentatives: Tentative[], parmi: NotionId[] = notions.map((n) => n.id)): NotionId {
  const scores = parmi.map((id) => ({ id, ...maitrise(tentatives, id) }))
  const commencees = scores.filter((s) => s.nb > 0 && s.niveau !== 'maitrise')
  if (commencees.length) return commencees.sort((a, b) => a.taux - b.taux)[0].id
  const pasCommencees = scores.filter((s) => s.nb === 0)
  if (pasCommencees.length) return pasCommencees[0].id
  return scores.sort((a, b) => a.taux - b.taux)[0].id
}

// ---------- Erreurs à revoir ----------

/**
 * Les éléments dont la DERNIÈRE réponse était fausse. Dès que tu y réponds juste,
 * ils sortent de la liste (et tu gagnes le badge « Revanche »).
 * Les calculs générés au hasard ne sont pas listés (ils changent à chaque fois).
 */
export function erreursARevoir(tentatives: Tentative[]) {
  const derniere = new Map<string, Tentative>()
  for (const t of tentatives) {
    if (t.itemId.startsWith('calc-gen')) continue
    derniere.set(t.itemId, t)
  }
  return [...derniere.values()].filter((t) => !t.correct).reverse()
}

// ---------- Séances ----------

/** Une séance compte si c'est un Pomodoro, une séance guidée, ou une révision libre d'au moins 10 min. */
export function seancesDeLaSemaine(p: Progression, aujourdhui = jour()) {
  const debut = lundi(aujourdhui)
  const fin = ajouterJours(debut, 7)
  return p.sessions.filter(
    (s) => s.debut.slice(0, 10) >= debut && s.debut.slice(0, 10) < fin && (s.type !== 'libre' || s.dureeMinutes >= MINUTES_JOUR_ACTIF),
  ).length
}

// ---------- Badges ----------

export interface Badge {
  id: string
  nom: string
  description: string
  icone: string
  /** Badges calculés à partir de la progression (les autres sont débloqués à un moment précis). */
  test?: (p: Progression) => boolean
}

const notionsSeance = (s: 1 | 2) => notions.filter((n) => n.seance === s).map((n) => n.id)
const toutesMaitrisees = (p: Progression, ids: NotionId[]) => ids.every((id) => maitrise(p.tentatives, id).niveau === 'maitrise')

function meilleureSuiteCalculs(tentatives: Tentative[]) {
  let suite = 0
  let meilleure = 0
  for (const t of tentatives) {
    if (!t.itemId.startsWith('calc-') && !t.itemId.startsWith('dc-')) continue
    suite = t.correct ? suite + 1 : 0
    meilleure = Math.max(meilleure, suite)
  }
  return meilleure
}

function aFaitUneRevanche(tentatives: Tentative[]) {
  const rate = new Set<string>()
  for (const t of tentatives) {
    if (t.type === 'flashcard') continue
    if (!t.correct) rate.add(t.itemId)
    else if (rate.has(t.itemId)) return true
  }
  return false
}

const heure = (t: Tentative) => new Date(t.le).getHours()

export const BADGES: Badge[] = [
  { id: 'premiere-seance', nom: 'Premier pas', description: 'Tu as fait ta première révision.', icone: '🚀', test: (p) => p.tentatives.length > 0 || p.sessions.length > 0 },
  { id: 'serie-3', nom: 'Bien lancé·e', description: '3 jours de révision d\'affilée.', icone: '🔥', test: (p) => p.stats.meilleureSerie >= 3 },
  { id: 'serie-7', nom: 'Une semaine pile', description: '7 jours de révision d\'affilée.', icone: '📅', test: (p) => p.stats.meilleureSerie >= 7 },
  { id: 'serie-30', nom: 'Inarrêtable', description: '30 jours de révision d\'affilée.', icone: '🏆', test: (p) => p.stats.meilleureSerie >= 30 },
  { id: 'flashcards-100', nom: 'Mémoire d\'éléphant', description: '100 flashcards révisées.', icone: '🐘', test: (p) => p.tentatives.filter((t) => t.type === 'flashcard').length >= 100 },
  { id: 'qcm-parfait', nom: 'Sans faute', description: 'Un QCM de 10 questions avec 10/10.', icone: '💯' },
  { id: 'examen-blanc', nom: 'Examen blanc', description: 'Tu as terminé un QCM en mode examen.', icone: '⏱️' },
  { id: 'seance1-maitrisee', nom: 'Séance 1 en poche', description: 'Toutes les notions de la séance 1 maîtrisées.', icone: '📘', test: (p) => toutesMaitrisees(p, notionsSeance(1)) },
  { id: 'seance2-maitrisee', nom: 'Séance 2 en poche', description: 'Toutes les notions de la séance 2 maîtrisées.', icone: '📗', test: (p) => toutesMaitrisees(p, notionsSeance(2)) },
  { id: 'chapitre1-maitrise', nom: 'Chapitre 1 maîtrisé', description: 'Toutes les notions du chapitre 1 maîtrisées.', icone: '🎓', test: (p) => toutesMaitrisees(p, notions.map((n) => n.id)) },
  { id: 'pomodoro-10', nom: 'Tomate experte', description: '10 Pomodoros terminés.', icone: '🍅', test: (p) => p.sessions.filter((s) => s.type === 'pomodoro').length >= 10 },
  { id: 'as-du-calcul', nom: 'As du calcul', description: '10 calculs justes d\'affilée.', icone: '🧮', test: (p) => meilleureSuiteCalculs(p.tentatives) >= 10 },
  { id: 'revanche', nom: 'Revanche', description: 'Tu as réussi une question que tu avais ratée.', icone: '💪', test: (p) => aFaitUneRevanche(p.tentatives) },
  { id: 'oiseau-de-nuit', nom: 'Oiseau de nuit', description: 'Une révision après 22 h.', icone: '🦉', test: (p) => p.tentatives.some((t) => heure(t) >= 22 || heure(t) < 4) },
  { id: 'leve-tot', nom: 'Lève-tôt', description: 'Une révision avant 8 h.', icone: '🌅', test: (p) => p.tentatives.some((t) => heure(t) >= 4 && heure(t) < 8) },
  { id: 'premier-cas', nom: 'Détective', description: 'Ton premier cas pratique terminé.', icone: '🔎', test: (p) => p.tentatives.some((t) => t.type === 'cas') },
  {
    id: 'vrai-faux',
    nom: 'Démineur de clichés',
    description: 'Les 11 vrai/faux du marketing faits.',
    icone: '🧨',
    test: (p) => vraiFaux.every((v) => p.tentatives.some((t) => t.itemId === v.id)),
  },
  { id: 'objectif-hebdo', nom: 'Objectif tenu', description: 'Ton objectif de séances de la semaine atteint.', icone: '🎯', test: (p) => seancesDeLaSemaine(p) >= p.profil.objectifHebdo },
  {
    id: 'touche-a-tout',
    nom: 'Touche-à-tout',
    description: 'Au moins une flashcard, un QCM, un exercice et un cas.',
    icone: '🧭',
    test: (p) => (['flashcard', 'qcm', 'exercice', 'cas'] as const).every((ty) => p.tentatives.some((t) => t.type === ty)),
  },
]

/** Badges que la progression vient de débloquer (et qui ne sont pas encore enregistrés). */
export function nouveauxBadges(p: Progression): string[] {
  return BADGES.filter((b) => b.test && !p.badges[b.id] && b.test(p)).map((b) => b.id)
}

// ---------- Encouragements (jamais culpabilisants) ----------

const ENCOURAGEMENTS = [
  'Bien joué ! Chaque séance compte.',
  "Ton cerveau te dit merci : tu viens de t'entraîner, pas juste de relire.",
  'Une séance de plus dans la boîte. Léa serait fière de toi !',
  'Petit à petit, les notions passent au vert.',
  "Tu as fait le plus dur : t'y mettre. Bravo !",
  'Les erreurs d\'aujourd\'hui sont les points gagnés de demain.',
  'Régulier·ère comme ça, le QCM va bien se passer.',
  'Super séance ! Accorde-toi une vraie pause.',
  "C'est en s'entraînant qu'on progresse : continue comme ça.",
  'Encore une victoire. Reviens demain pour garder ta série !',
]

export function encouragement(): string {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
}

// Utilisé dans le profil pour afficher le volume total de contenu.
export const TOTAL_CONTENU = {
  flashcards: flashcards.length,
  qcm: qcm.length,
  classements: classements.length,
  vraiFaux: vraiFaux.length,
}
