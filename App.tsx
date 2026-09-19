import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedHostRoute } from './components/ProtectedHostRoute'
import { LandingPage } from './pages/LandingPage'
import { HostLoginPage } from './pages/HostLoginPage'
import { HostDashboardPage } from './pages/HostDashboardPage'
import { JoinPage } from './pages/JoinPage'
import { BattleRoomPage } from './pages/BattleRoomPage'

export default function App() { return <BrowserRouter basename={import.meta.env.BASE_URL}><AuthProvider><Layout><Routes><Route path="/" element={<LandingPage/>}/><Route path="/join" element={<JoinPage/>}/><Route path="/battle/:competitionId" element={<BattleRoomPage/>}/><Route path="/host/login" element={<HostLoginPage/>}/><Route element={<ProtectedHostRoute/>}><Route path="/host" element={<HostDashboardPage/>}/></Route><Route path="*" element={<LandingPage/>}/></Routes></Layout></AuthProvider></BrowserRouter> }
