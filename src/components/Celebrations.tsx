import { useEffect, useRef } from 'react'
import { useProgression } from '../state/progression'
import Icone from './Icone'

/** Confettis légers dessinés sur un canvas (désactivés si « réduire les animations » est activé). */
export function confettis() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '60' })
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.remove()
  // Les confettis prennent la couleur choisie dans « Personnaliser », plus le doré des récompenses.
  const css = getComputedStyle(document.documentElement)
  const v = (nom: string, defaut: string) => css.getPropertyValue(nom).trim() || defaut
  const couleurs = [v('--accent-500', '#ffb59a'), v('--accent-600', '#e8957a'), v('--gold', '#f5c451'), v('--blue-500', '#5ba3e6'), '#2E9E6B']
  const morceaux = Array.from({ length: 110 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 120,
    y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 12 - 4,
    r: Math.random() * 6 + 4,
    a: Math.random() * Math.PI,
    c: couleurs[Math.floor(Math.random() * couleurs.length)],
  }))
  const debut = performance.now()
  const image = (t: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const m of morceaux) {
      m.vy += 0.35
      m.x += m.vx
      m.y += m.vy
      m.a += 0.15
      ctx.save()
      ctx.translate(m.x, m.y)
      ctx.rotate(m.a)
      ctx.fillStyle = m.c
      ctx.fillRect(-m.r / 2, -m.r / 4, m.r, m.r / 2)
      ctx.restore()
    }
    if (t - debut < 1800) requestAnimationFrame(image)
    else canvas.remove()
  }
  requestAnimationFrame(image)
}

/** Affiche les fêtes en attente (montée de niveau, badges) une par une. */
export default function Celebrations() {
  const { celebrations, retirerCelebration } = useProgression()
  const actuelle = celebrations[0]
  const deja = useRef(new Set<string>())

  useEffect(() => {
    if (!actuelle || deja.current.has(actuelle.id)) return
    deja.current.add(actuelle.id)
    confettis()
    const t = window.setTimeout(() => retirerCelebration(actuelle.id), 5000)
    return () => window.clearTimeout(t)
  }, [actuelle, retirerCelebration])

  if (!actuelle) return null
  return (
    <div className="fixed inset-x-0 bottom-20 md:bottom-6 z-50 flex justify-center px-4 pointer-events-none">
      <div role="status" className="pointer-events-auto carte !border-accent-500 border-2 p-4 flex items-center gap-3 max-w-md w-full apparition">
        <span aria-hidden className="text-3xl">{actuelle.icone}</span>
        <div className="flex-1">
          <p className="font-titre font-bold">{actuelle.titre}</p>
          <p className="text-sm text-muted">{actuelle.detail}</p>
        </div>
        <button type="button" className="btn btn-discret !px-2" onClick={() => retirerCelebration(actuelle.id)} aria-label="Fermer">
          <Icone nom="non" taille={18} />
        </button>
      </div>
    </div>
  )
}
