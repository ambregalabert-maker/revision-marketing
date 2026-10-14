// Tests du moteur de progression : répétition espacée, série, joker, XP, niveaux, maîtrise.
import { describe, expect, it } from 'vitest'
import { noter, ordonner } from '../src/lib/leitner'
import { ajouterXpStats, erreursARevoir, maitrise, marquerJourActif, niveauPour, serieAffichee } from '../src/lib/gamification'
import { flashcards } from '../src/lib/contenu'
import type { Stats, Tentative } from '../src/lib/types'

const statsVides: Stats = { xpTotal: 0, serieActuelle: 0, meilleureSerie: 0, jokerSemaine: null, derniereActivite: null, xpSemaine: 0, semaineCle: null }

describe('Répétition espacée (Leitner)', () => {
  it('« Je ne savais pas » renvoie en boîte 1, à revoir le jour même', () => {
    const r = noter({ boite: 3, prochaine: '2026-10-14', derniere: null, nbRevisions: 2, nbEchecs: 0 }, 'non', '2026-10-14')
    expect(r.boite).toBe(1)
    expect(r.prochaine).toBe('2026-10-14')
    expect(r.nbEchecs).toBe(1)
  })
  it('« Je savais » fait monter d\'une boîte avec le bon intervalle', () => {
    expect(noter(undefined, 'oui', '2026-10-14')).toMatchObject({ boite: 2, prochaine: '2026-10-15' })
    expect(noter({ boite: 2, prochaine: '', derniere: null, nbRevisions: 1, nbEchecs: 0 }, 'oui', '2026-10-14')).toMatchObject({ boite: 3, prochaine: '2026-10-17' })
    expect(noter({ boite: 3, prochaine: '', derniere: null, nbRevisions: 1, nbEchecs: 0 }, 'oui', '2026-10-14')).toMatchObject({ boite: 4, prochaine: '2026-10-21' })
    expect(noter({ boite: 4, prochaine: '', derniere: null, nbRevisions: 1, nbEchecs: 0 }, 'oui', '2026-10-14')).toMatchObject({ boite: 5, prochaine: '2026-11-13' })
    expect(noter({ boite: 5, prochaine: '', derniere: null, nbRevisions: 1, nbEchecs: 0 }, 'oui', '2026-10-14').boite).toBe(5)
  })
  it('« Hésitant » garde la carte dans sa boîte', () => {
    expect(noter({ boite: 3, prochaine: '', derniere: null, nbRevisions: 1, nbEchecs: 0 }, 'hesite', '2026-10-14')).toMatchObject({ boite: 3, prochaine: '2026-10-17' })
  })
  it('une carte ratée revient avant une carte réussie', () => {
    const [a, b] = flashcards
    const revisions = {
      [a.id]: noter(undefined, 'oui', '2026-10-13'),
      [b.id]: noter(undefined, 'non', '2026-10-13'),
    }
    // Le lendemain, les deux sont dues, mais la ratée (boîte 1) passe en premier.
    const { dues } = ordonner([a, b], revisions, '2026-10-14')
    expect(dues.map((c) => c.id)).toEqual([b.id, a.id])
    // Le jour même, seule la ratée est due.
    expect(ordonner([a, b], revisions, '2026-10-13').dues.map((c) => c.id)).toEqual([b.id])
  })
})

describe('Série et joker', () => {
  it('compte les jours consécutifs', () => {
    let s = marquerJourActif(statsVides, '2026-10-12')
    s = marquerJourActif(s, '2026-10-13')
    s = marquerJourActif(s, '2026-10-13')
    expect(s.serieActuelle).toBe(2)
  })
  it('le joker sauve un jour manqué, une fois par semaine', () => {
    let s = marquerJourActif(statsVides, '2026-10-12') // lundi
    s = marquerJourActif(s, '2026-10-14') // mercredi (mardi manqué → joker)
    expect(s.serieActuelle).toBe(2)
    expect(s.jokerSemaine).toBe('2026-10-12')
    s = marquerJourActif(s, '2026-10-16') // vendredi (jeudi manqué, joker déjà utilisé)
    expect(s.serieActuelle).toBe(1)
    expect(s.meilleureSerie).toBe(2)
  })
  it('deux jours manqués remettent la série à 1', () => {
    let s = marquerJourActif(statsVides, '2026-10-12')
    s = marquerJourActif(s, '2026-10-15')
    expect(s.serieActuelle).toBe(1)
  })
  it("affiche 0 quand la série est perdue", () => {
    const s = marquerJourActif(statsVides, '2026-10-10')
    expect(serieAffichee(s, '2026-10-11').serie).toBe(1)
    expect(serieAffichee(s, '2026-10-14').serie).toBe(0)
  })
})

describe('XP et niveaux', () => {
  it('remet les XP de la semaine à zéro le lundi', () => {
    let s = ajouterXpStats(statsVides, 50, '2026-10-16') // vendredi
    s = ajouterXpStats(s, 30, '2026-10-19') // lundi suivant
    expect(s.xpTotal).toBe(80)
    expect(s.xpSemaine).toBe(30)
  })
  it('calcule le niveau', () => {
    expect(niveauPour(0).numero).toBe(1)
    expect(niveauPour(100).numero).toBe(2)
    expect(niveauPour(99999).numero).toBe(10)
  })
})

describe('Maîtrise et erreurs', () => {
  const t = (itemId: string, correct: boolean): Tentative => ({ itemId, type: 'qcm', notion: 'types-de-marche', seance: 1, correct, le: '2026-10-14T10:00:00Z' })
  it('utilise les 10 dernières réponses', () => {
    const liste = [...Array(10).fill(t('x', false)), ...Array(10).fill(t('y', true))]
    expect(maitrise(liste, 'types-de-marche')).toMatchObject({ taux: 100, niveau: 'maitrise' })
  })
  it('une erreur corrigée sort de la liste « à revoir »', () => {
    expect(erreursARevoir([t('q1', false), t('q2', false), t('q1', true)]).map((e) => e.itemId)).toEqual(['q2'])
  })
})
