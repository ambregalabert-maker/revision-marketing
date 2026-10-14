// Petites fonctions de dates, toujours en heure locale de l'étudiant.

/** "AAAA-MM-JJ" pour une date donnée (par défaut : aujourd'hui). */
export function jour(d: Date = new Date()): string {
  const a = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const j = String(d.getDate()).padStart(2, '0')
  return `${a}-${m}-${j}`
}

/** Convertit "AAAA-MM-JJ" en Date (à minuit, heure locale). */
export function versDate(j: string): Date {
  const [a, m, d] = j.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function ajouterJours(j: string, n: number): string {
  const d = versDate(j)
  d.setDate(d.getDate() + n)
  return jour(d)
}

/** Nombre de jours entre deux dates "AAAA-MM-JJ" (b − a). */
export function ecartJours(a: string, b: string): number {
  return Math.round((versDate(b).getTime() - versDate(a).getTime()) / 86_400_000)
}

/** Lundi de la semaine d'une date, au format "AAAA-MM-JJ" (sert de clé de semaine). */
export function lundi(j: string = jour()): string {
  const d = versDate(j)
  const decalage = (d.getDay() + 6) % 7 // lundi = 0
  d.setDate(d.getDate() - decalage)
  return jour(d)
}

const fmtCourt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export function formatJour(j: string): string {
  return fmtCourt.format(versDate(j))
}

/** "aujourd'hui", "demain", "dans 3 jours"… */
export function formatDans(j: string): string {
  const n = ecartJours(jour(), j)
  if (n <= 0) return "aujourd'hui"
  if (n === 1) return 'demain'
  return `dans ${n} jours`
}

export function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

export function idUnique(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}
