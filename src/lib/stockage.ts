// Accès sécurisé au localStorage : en navigation privée ou si le stockage est
// bloqué, les lectures renvoient la valeur par défaut et les écritures sont ignorées.

export function lire<T>(cle: string, defaut: T): T {
  try {
    const brut = localStorage.getItem(cle)
    return brut === null ? defaut : (JSON.parse(brut) as T)
  } catch {
    return defaut
  }
}

export function ecrire(cle: string, valeur: unknown): void {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur))
  } catch {
    // Stockage indisponible : on continue sans sauvegarder.
  }
}

export function effacer(cle: string): void {
  try {
    localStorage.removeItem(cle)
  } catch {
    // rien
  }
}
