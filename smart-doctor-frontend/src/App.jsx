import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './components/Login/LoginPage.jsx'
import HomePage from './components/Home/HomePage.jsx'

// Minimal auth check. Swap this for real token validation once the
// auth API is live — for now it just checks a flag set on login.
function isAuthenticated() {
  return Boolean(localStorage.getItem('sd_auth'))
}

function RequireAuth({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}
