import { BrowserRouter as Router, Routes, Route, Outlet, Link } from 'react-router-dom';

import { Login } from './pages/admin/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthContext';
import { LandingPage } from './pages/public/LandingPage';
import { BookingFlow } from './pages/public/BookingFlow';
import { CancellationPage } from './pages/public/CancellationPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminBarbers } from './pages/admin/AdminBarbers';
import { AdminSettings } from './pages/admin/AdminSettings';
import { LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { Logo } from './components/Logo';
import { MobileBookingCTA } from './components/ui/MobileBookingCTA';

import { MeuEstilo } from './pages/public/MeuEstilo';
import { BarberProfile } from './pages/public/BarberProfile';
import { ManageAppointment } from './pages/public/ManageAppointment';

function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-orange-500/30">
      <Outlet />
      <MobileBookingCTA />
    </div>
  );
}


function AdminLayout() {
  const { logout } = useAuth();
  const handleLogout = () => { logout(); };
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A0A0A] text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0A0A0A] border-r border-neutral-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-orange-500">Admin</span> Panel
          </h2>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <Link to="/admin" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <div className="text-xs font-bold text-neutral-600 uppercase tracking-wider pt-4 pb-2 px-3">Gestão</div>
          <Link to="/admin/barbeiros" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Barbeiros & Portfólio
          </Link>
          <Link to="/admin/estoque" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Produtos & Estoque
          </Link>
          <Link to="/admin/pacotes" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Pacotes
          </Link>
          <div className="text-xs font-bold text-neutral-600 uppercase tracking-wider pt-4 pb-2 px-3">Sistema</div>
          <Link to="/admin/configuracoes" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" /> Configurações
          </Link>
        </nav>
        <div className="p-4 border-t border-neutral-800">
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full rounded-xl text-neutral-500 hover:bg-neutral-900/50 transition-colors">
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}



export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/agendar" element={<BookingFlow />} />
            <Route path="/cancelar/:id" element={<CancellationPage />} />
            <Route path="/meu-estilo" element={<MeuEstilo />} />
            <Route path="/barbeiros/:id" element={<BarberProfile />} />
            <Route path="/agendamento/gerenciar/:token" element={<ManageAppointment />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="estoque" element={<AdminInventory />} />
              <Route path="pacotes" element={<AdminPackages />} />
              <Route path="barbeiros" element={<AdminBarbers />} />
              <Route path="configuracoes" element={<AdminSettings />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
