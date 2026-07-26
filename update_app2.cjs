const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newApp = `
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
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="estoque" element={<AdminInventory />} />
            <Route path="pacotes" element={<AdminPackages />} />
            <Route path="barbeiros" element={<AdminBarbers />} />
            <Route path="configuracoes" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
`;

code = code.replace(/function AppContent\(\) \{[\s\S]*\}export default function App\(\) \{[\s\S]*\}\n?/g, newApp);

fs.writeFileSync('src/App.tsx', code);
