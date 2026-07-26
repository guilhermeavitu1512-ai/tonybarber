const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importsToAdd = `
import { LoadingProvider, useLoading } from './contexts/LoadingContext';
import { useEffect } from 'react';
`;

code = code.replace("import { AuthProvider } from './contexts/AuthContext';", importsToAdd + "import { AuthProvider } from './contexts/AuthContext';");

const appContent = `
function AppContent() {
  const { hideLoading } = useLoading();
  
  useEffect(() => {
    // Add a slight delay for smooth transition and branding presence
    const timer = setTimeout(() => hideLoading(), 800);
    return () => clearTimeout(timer);
  }, [hideLoading]);

  return (
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
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="estoque" element={<AdminInventory />} />
          <Route path="pacotes" element={<AdminPackages />} />
          <Route path="barbeiros" element={<AdminBarbers />} />
          <Route path="configuracoes" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LoadingProvider>
  );
}
`;

// Replace the old App component
code = code.replace(/export default function App\(\) \{[\s\S]*\}\n?/g, appContent);

fs.writeFileSync('src/App.tsx', code);
