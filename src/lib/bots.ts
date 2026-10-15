// Les bots du classement : des réviseurs fictifs (présentés comme des pseudos ordinaires) qui gagnent des XP
// au fil de la semaine, à des rythmes différents, pour donner envie de les dépasser.
// Ils repartent de zéro chaque lundi, comme tout le monde. Pour les retirer : vider la liste BOTS.
import { lundi } from './dates'

export interface Bot {
  pseudo: string
  /** XP gagnés en moyenne par jour. */
  rythme: number
}

export const BOTS: Bot[] = [
  { pseudo: 'Clem_mkt', rythme: 20 },
  { pseudo: 'Yanis.B', rythme: 40 },
  { pseudo: 'Ines_revise', rythme: 65 },
  { pseudo: 'Lucas_TBS', rythme: 95 },
  { pseudo: 'Sarah.M', rythme: 130 },
  { pseudo: 'Noé_QCM', rythme: 180 },
]

/** Petit nombre pseudo-aléatoire (toujours le même pour une même graine). */
function hasard(graine: string) {
  let h = 2166136261
  for (let i = 0; i < graine.length; i++) h = Math.imul(h ^ graine.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

/** XP de la semaine d'un bot à un instant donné : ça monte doucement du lundi au dimanche. */
export function xpBot(bot: Bot, maintenant = new Date()) {
  const debut = new Date(lundi() + 'T00:00:00')
  const jours = Math.min(7, Math.max(0, (maintenant.getTime() - debut.getTime()) / 86_400_000))
  // Chaque semaine, un bot est un peu plus ou un peu moins motivé (entre 80 % et 120 %).
  const forme = 0.8 + 0.4 * hasard(bot.pseudo + lundi())
  // Les bots révisent surtout en journée : on arrondit par paliers de 5 XP.
  return Math.round((bot.rythme * forme * jours) / 5) * 5
}
