// Tests de la synchronisation avec une fausse base Supabase (qui enregistre les appels).
import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fusionner, pousser } from '../src/lib/sync'
import { progressionVide } from '../src/state/progression'
import type { Progression } from '../src/lib/types'

function fauxClient() {
  const appels: { table: string; op: string; donnees?: unknown }[] = []
  const requete = (table: string) => {
    const r = {
      upsert: (donnees: unknown) => {
        appels.push({ table, op: 'upsert', donnees })
        return Promise.resolve({ error: null })
      },
      delete: () => ({
        eq: () => {
          appels.push({ table, op: 'delete' })
          return Promise.resolve({ error: null })
        },
      }),
    }
    return r
  }
  return { client: { from: requete } as unknown as SupabaseClient, appels }
}

const avecReponses = (p: Progression, n: number): Progression => ({
  ...p,
  tentatives: Array.from({ length: n }, (_, i) => ({ itemId: `q${i}`, type: 'qcm' as const, notion: 'types-de-marche' as const, seance: 1 as const, correct: true, le: `2026-10-14T10:00:0${i}.000Z` })),
  stats: { ...p.stats, xpTotal: n * 5 },
})

describe('Synchronisation', () => {
  it("n'envoie que les nouvelles réponses", async () => {
    const { client, appels } = fauxClient()
    const deja = avecReponses(progressionVide(), 2)
    const actuel = avecReponses(progressionVide(), 3)
    await pousser(client, 'u1', deja, actuel)
    const reponses = appels.find((a) => a.table === 'attempts')!.donnees as unknown[]
    expect(reponses).toHaveLength(1)
    expect(appels.some((a) => a.table === 'user_stats')).toBe(true)
    expect(appels.some((a) => a.table === 'profiles')).toBe(false)
  })
  it('efface tout en ligne après une réinitialisation', async () => {
    const { client, appels } = fauxClient()
    await pousser(client, 'u1', avecReponses(progressionVide(), 3), progressionVide())
    expect(appels.filter((a) => a.op === 'delete').map((a) => a.table).sort()).toEqual(['attempts', 'badges', 'card_reviews', 'study_sessions'])
  })
  it('additionne la progression invité et celle du compte', () => {
    const compte = { ...avecReponses(progressionVide(), 2), onboardingFait: true }
    const invite = avecReponses(progressionVide(), 4)
    const f = fusionner(compte, invite)
    expect(f.stats.xpTotal).toBe(30)
    // q0 et q1 existent des deux côtés à la même heure : pas de doublon.
    expect(f.tentatives).toHaveLength(4)
  })
})
