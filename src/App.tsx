import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import Accueil from './pages/Accueil'
import Astuces from './pages/Astuces'
import Reviser from './pages/Reviser'
import Profil from './pages/Profil'
import Classement from './pages/Classement'
import Connexion from './pages/Connexion'
import Introuvable from './pages/Introuvable'

// Toutes les pages du site.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Accueil />} />
          <Route path="astuces" element={<Astuces />} />
          <Route path="reviser" element={<Reviser />} />
          <Route path="profil" element={<Profil />} />
          <Route path="classement" element={<Classement />} />
          <Route path="connexion" element={<Connexion />} />
          <Route path="*" element={<Introuvable />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
