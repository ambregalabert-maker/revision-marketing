// Connexion à Supabase, seulement si les clés sont renseignées (fichier .env.local
// ou variables d'environnement Vercel/Netlify). Sinon, le site marche en mode invité.
// La bibliothèque n'est chargée que si elle sert (le site reste léger sur téléphone).
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigure = Boolean(url && cle)

let promesse: Promise<SupabaseClient | null> | null = null

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseConfigure) return Promise.resolve(null)
  if (!promesse) {
    promesse = import('@supabase/supabase-js')
      .then(({ createClient }) => createClient(url!, cle!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }))
      .catch(() => null)
  }
  return promesse
}
