import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import Accueil from './pages/Accueil'
import Celebrations from './components/Celebrations'
import DialogueImport from './components/DialogueImport'

// Les pages sont chargées seulement quand on les ouvre (site plus rapide sur téléphone).
const Astuces = lazy(() => import('./pages/Astuces'))
const Reviser = lazy(() => import('./pages/Reviser'))
const Flashcards = lazy(() => import('./pages/Flashcards'))
const Qcm = lazy(() => import('./pages/Qcm'))
const Exercices = lazy(() => import('./pages/Exercices'))
const Seance = lazy(() => import('./pages/Seance'))
const Profil = lazy(() => import('./pages/Profil'))
const Classement = lazy(() => import('./pages/Classement'))
const Connexion = lazy(() => import('./pages/Connexion'))
const Introuvable = lazy(() => import('./pages/Introuvable'))

function Chargement() {
  return <p className="text-muted p-4" role="status">Chargement…</p>
}

// Toutes les pages du site.
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Chargement />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Accueil />} />
            <Route path="astuces" element={<Astuces />} />
            <Route path="reviser" element={<Reviser />} />
            <Route path="reviser/flashcards" element={<Flashcards />} />
            <Route path="reviser/qcm" element={<Qcm />} />
            <Route path="reviser/exercices" element={<Exercices />} />
            <Route path="reviser/seance" element={<Seance />} />
            <Route path="profil" element={<Profil />} />
            <Route path="classement" element={<Classement />} />
            <Route path="connexion" element={<Connexion />} />
            <Route path="*" element={<Introuvable />} />
          </Route>
        </Routes>
      </Suspense>
      <Celebrations />
      <DialogueImport />
    </BrowserRouter>
  )
}
