import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import RiotCallback from './pages/RiotCallback'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/riot-callback" element={<RiotCallback />} />
      <Route path="/report/:puuid" element={<Report />} />
    </Routes>
  )
}
