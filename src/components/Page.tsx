import type { ReactNode } from 'react'
import { useEffect } from 'react'

// En-tête standard d'une page : titre, sous-titre, et titre de l'onglet du navigateur.
export default function Page({
  titre,
  sousTitre,
  children,
  actions,
}: {
  titre: string
  sousTitre?: ReactNode
  children: ReactNode
  actions?: ReactNode
}) {
  useEffect(() => {
    document.title = `${titre} · Révision Marketing`
  }, [titre])
  return (
    <div className="apparition">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{titre}</h1>
          {sousTitre && <p className="text-muted mt-1">{sousTitre}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}
