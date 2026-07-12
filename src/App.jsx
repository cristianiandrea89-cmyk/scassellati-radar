import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import LoginGate from './components/LoginGate'
import { CurrentUserProvider } from './hooks/useCurrentUser'
import MappaPage from './pages/MappaPage'
import ListaPage from './pages/ListaPage'
import DashboardPage from './pages/DashboardPage'
import NuovaMacchinaPage from './pages/NuovaMacchinaPage'
import ClientePage from './pages/ClientePage'
import MarchiPage from './pages/MarchiPage'
import ClientiVerificaPage from './pages/ClientiVerificaPage'

function App() {
  return (
    <LoginGate>
      <CurrentUserProvider>
        <BrowserRouter>
          <NavBar />
          <main className="mx-auto max-w-5xl px-5 py-8">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/mappa" element={<MappaPage />} />
              <Route path="/lista" element={<ListaPage />} />
              <Route path="/nuova-macchina" element={<NuovaMacchinaPage />} />
              <Route path="/clienti/:id" element={<ClientePage />} />
              <Route path="/marchi" element={<MarchiPage />} />
              <Route path="/clienti-verifica" element={<ClientiVerificaPage />} />
            </Routes>
          </main>
        </BrowserRouter>
      </CurrentUserProvider>
    </LoginGate>
  )
}

export default App
