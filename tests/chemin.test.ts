// Tests des étoiles du chemin (mode daily) : 1er passage, puis J+1, puis J+7.
import { describe, expect, it } from 'vitest'
import { ETAPES, gagnerEtoile, prochaineEtoile } from '../src/lib/chemin'
import { planDaily, planTryhard } from '../src/lib/plan'
import { progressionVide } from '../src/state/progression'

describe('Étoiles du chemin', () => {
  it('1re étoile dès la première mini-séance, même ratée', () => {
    expect(gagnerEtoile(undefined, false, '2026-10-14')).toEqual({ etoiles: 1, le: '2026-10-14' })
  })
  it('2e étoile seulement un jour plus tard, et avec 70 %', () => {
    const une = { etoiles: 1, le: '2026-10-14' }
    expect(gagnerEtoile(une, true, '2026-10-14').etoiles).toBe(1)
    expect(gagnerEtoile(une, false, '2026-10-15').etoiles).toBe(1)
    expect(gagnerEtoile(une, true, '2026-10-15')).toEqual({ etoiles: 2, le: '2026-10-15' })
  })
  it('3e étoile une semaine après la 2e', () => {
    const deux = { etoiles: 2, le: '2026-10-15' }
    expect(gagnerEtoile(deux, true, '2026-10-21').etoiles).toBe(2)
    expect(gagnerEtoile(deux, true, '2026-10-22').etoiles).toBe(3)
    expect(prochaineEtoile(deux)).toBe('2026-10-22')
    expect(gagnerEtoile({ etoiles: 3, le: '2026-10-22' }, true, '2027-01-01').etoiles).toBe(3)
  })
})

describe('Préparation des séances', () => {
  it('chaque étape du chemin a du contenu', () => {
    for (const e of ETAPES) {
      const plan = planDaily(e, progressionVide())
      expect(plan.cartes.length + plan.questions.length).toBeGreaterThan(0)
    }
  })
  it('la séance Tryhard grossit avec la durée', () => {
    const p = progressionVide()
    const courte = planTryhard(5, p)
    const longue = planTryhard(40, p)
    expect(courte.exercices).toHaveLength(0)
    expect(longue.questions.length).toBeGreaterThan(courte.questions.length)
    expect(longue.exercices.length).toBeGreaterThan(0)
  })
})

import { acheter, adopter, basculerAccessoire, marksDisponibles } from '../src/lib/boutique'

describe('Boutique', () => {
  it('1 Mark pour 10 XP, et les achats ne touchent pas aux XP', () => {
    const p = progressionVide()
    p.stats.xpTotal = 250
    p.boutique = adopter(p.boutique, 'licorne', 'Paillette')
    expect(marksDisponibles(p)).toBe(25)
    const b = acheter(p, 'bonnet')!
    expect(b.depenses).toBe(20)
    expect(marksDisponibles({ ...p, boutique: b })).toBe(5)
    expect(acheter({ ...p, boutique: b }, 'magicien')).toBeNull() // pas assez de Marks
  })
  it('un seul accessoire par emplacement', () => {
    let b = adopter(progressionVide().boutique, 'renard', '')
    b = basculerAccessoire(b, 'bonnet')
    b = basculerAccessoire(b, 'casquette')
    b = basculerAccessoire(b, 'noeud')
    expect(b.porte.sort()).toEqual(['casquette', 'noeud'])
    expect(b.nom).toBe('Roux')
  })
})
