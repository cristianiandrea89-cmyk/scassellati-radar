import { useState } from 'react'

// Barriera semplice con password condivisa: non è vera autenticazione (la password
// resta nel bundle JS, visibile a chi lo ispeziona), serve solo a tenere fuori i
// curiosi occasionali dato che l'app non ha account utente.
const PASSWORD = 'Scassellati2026'
const STORAGE_KEY = 'radar_unlocked'

export default function LoginGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (input === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setUnlocked(true)
    } else {
      setError('Password errata.')
    }
  }

  if (unlocked) return children

  return (
    <div className="min-h-screen flex items-center justify-center bg-dgray px-5">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-xs space-y-4">
        <h1 className="font-heading font-extrabold uppercase text-xl text-center">
          Scassellati Radar
        </h1>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError('')
            }}
            className="w-full border border-gray/40 rounded-sm px-3 py-2 focus:border-bronze outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full bg-bronze text-dgray font-medium rounded-sm py-2 hover:opacity-90 transition-opacity"
        >
          Entra
        </button>
      </form>
    </div>
  )
}
