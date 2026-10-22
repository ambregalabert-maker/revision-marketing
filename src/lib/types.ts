// Types partagés par tout le site.

/** Les séances du module (la séance 7 = présentations, la 9 = oral : pas de contenu). */
export type Seance = 1 | 2 | 3 | 4 | 5 | 6 | 8
/** Les 4 chapitres : 1 Le concept de marché, 2 Le parcours d'achat, 3 Stratégie marketing, 4 Marketing mix. */
export type Chapitre = 1 | 2 | 3 | 4
/** Filtre des pages de révision : un chapitre ou tous. */
export type FiltreChapitre = 'tous' | '1' | '2' | '3' | '4'

export type NotionId =
  | 'definition-marketing'
  | 'marketing-management'
  | 'recherche-marketing'
  | 'besoins-offres'
  | 'types-de-marche'
  | 'acteurs-canaux'
  | 'taux-evolution'
  | 'part-de-marche'
  | 'micro-environnement'
  | 'macro-environnement'
  // Chapitre 2 : le parcours d'achat
  | 'etapes-parcours'
  | 'facteurs-influence'
  | 'facteurs-psychologiques'
  | 'motivations-freins'
  // Chapitre 3 : segmentation, ciblage, positionnement
  | 'segmentation'
  | 'criteres-segmentation'
  | 'ciblage'
  | 'positionnement'
  | 'leader-challenger-niche'
  // Chapitre 4 : le marketing mix
  | 'produit-gamme'
  | 'prix'
  | 'distribution'
  | 'promotion'
  | 'coherence-mix'

export interface Notion {
  id: NotionId
  titre: string
  seance: Seance
  chapitre: Chapitre
}

// ---------- Contenu pédagogique (fichiers JSON de src/data) ----------

export interface Flashcard {
  id: string
  seance: Seance
  notion: NotionId
  recto: string
  verso: string
  exemple: string
}

export interface QuestionQcm {
  id: string
  seance: Seance
  notion: NotionId
  question: string
  /** Les propositions, dans l'ordre d'écriture (elles sont mélangées à l'affichage). */
  choix: { texte: string; correct: boolean; pourquoi: string }[]
  /** true = « plusieurs réponses possibles » (affiché clairement à l'étudiant). */
  multiple?: boolean
  explication: string
}

export interface CategorieClassement {
  id: string
  label: string
  aide?: string
}

export interface ElementClassement {
  id: string
  texte: string
  /** id de la catégorie attendue (étape 1). */
  categorie: string
  /** id de la sous-catégorie attendue (étape 2, seulement pour l'environnement). */
  sousCategorie?: string
  explication: string
}

export interface ExerciceClassement {
  id: string
  seance: Seance
  notion: NotionId
  titre: string
  consigne: string
  categories: CategorieClassement[]
  /** Sous-catégories, rangées par catégorie (ex. : macro → démographique, économique…). */
  sousCategories?: Record<string, CategorieClassement[]>
  elements: ElementClassement[]
}

export interface VraiFaux {
  id: string
  seance: Seance
  notion: NotionId
  affirmation: string
  /** "nuance" : les deux réponses se défendent, l'important est l'argument. */
  reponse: 'vrai' | 'faux' | 'nuance'
  verdict: string
  argument: string
}

export interface QuestionCas {
  question: string
  aide?: string
  corrige: string
}

export interface CasPratique {
  id: string
  seance: Seance
  notions: NotionId[]
  titre: string
  type: 'court' | '6-etapes'
  duree: string
  enonce: string
  questions: QuestionCas[]
}

export interface QuestionDonneesCours {
  id: string
  notion: NotionId
  question: string
  reponse: number
  unite: string
  calcul: string[]
  source: string
}

// ---------- Progression de l'étudiant ----------

export type TypeTentative = 'flashcard' | 'qcm' | 'exercice' | 'cas'

export interface Tentative {
  itemId: string
  type: TypeTentative
  notion: NotionId
  seance: Seance
  correct: boolean
  /** Date ISO complète. */
  le: string
}

export interface RevisionCarte {
  boite: 1 | 2 | 3 | 4 | 5
  /** Date "AAAA-MM-JJ" à partir de laquelle la carte est à revoir. */
  prochaine: string
  derniere: string | null
  nbRevisions: number
  nbEchecs: number
}

/** guidee = séance Tryhard · daily = mini-séance du chemin · libre = temps de révision hors séance. */
export type TypeSession = 'pomodoro' | 'guidee' | 'daily' | 'libre'

export interface SessionEtude {
  id: string
  debut: string
  dureeMinutes: number
  type: TypeSession
  xp: number
}

export type CouleurTheme = 'peche' | 'menthe' | 'lavande' | 'rose'

/** Le monde (décor) du chemin, choisi gratuitement dans « Personnaliser ». */
export type Monde = 'arc' | 'jardin' | 'galaxie' | 'hiver'

export interface Preferences {
  /** Petit son doux à la fin du minuteur (mode Tryhard). */
  son: boolean
  /** Couleur d'accent choisie dans « Personnaliser ». */
  couleur: CouleurTheme
  /** Durée proposée en premier pour une séance Tryhard (minutes). */
  dureeSeance: number
  /** Afficher le minuteur pendant une séance Tryhard. */
  minuteur: boolean
  /** Le décor du chemin. */
  monde: Monde
}

export interface Profil {
  prenom: string
  pseudo: string
  objectifHebdo: 3 | 5 | 7
  dateQcm: string | null
  apparaitClassement: boolean
  preferences: Preferences
}

export interface Stats {
  xpTotal: number
  serieActuelle: number
  meilleureSerie: number
  /** Clé de la semaine (lundi "AAAA-MM-JJ") où le joker a été utilisé. */
  jokerSemaine: string | null
  /** Dernier jour "AAAA-MM-JJ" qui a compté pour la série. */
  derniereActivite: string | null
  /** XP gagnés pendant la semaine en cours (pour le classement). */
  xpSemaine: number
  semaineCle: string | null
}

export interface Progression {
  version: 1
  /** Date ISO de la dernière modification (sert à fusionner avec Supabase). */
  majLe: string
  onboardingFait: boolean
  profil: Profil
  cartes: Record<string, RevisionCarte>
  tentatives: Tentative[]
  sessions: SessionEtude[]
  stats: Stats
  /** badgeId → date ISO d'obtention. */
  badges: Record<string, string>
  /** Minutes de révision par jour ("AAAA-MM-JJ" → minutes). */
  minutesParJour: Record<string, number>
  /** Étoiles gagnées sur chaque étape du chemin (mode daily). */
  chemin: Record<string, EtoilesEtape>
  /** Le compagnon et la boutique (Marks, accessoires). */
  boutique: Boutique
}

export type Espece = 'renard' | 'panda' | 'licorne'

export interface Boutique {
  /** Compagnon actuellement choisi (null tant qu'il n'est pas adopté). */
  compagnon: Espece | null
  /** Le nom donné par l'étudiant. */
  nom: string
  /** Compagnons et accessoires achetés (identifiants). */
  possedes: string[]
  /** Accessoires portés, un par emplacement (tête, yeux, cou). */
  porte: string[]
  /** Marks déjà dépensés (les Marks gagnés se calculent à partir des XP). */
  depenses: number
  /** Marks bonus (coffres des bilans). */
  bonus: number
}

export interface EtoilesEtape {
  /** 0 à 3 étoiles. */
  etoiles: number
  /** Jour "AAAA-MM-JJ" où la dernière étoile a été gagnée. */
  le: string | null
}
