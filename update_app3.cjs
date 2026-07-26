const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importsToAdd = `
import { Login } from './pages/admin/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
`;

code = code.replace("import { AuthProvider } from './contexts/AuthContext';", importsToAdd + "import { AuthProvider } from './contexts/AuthContext';");

// Need to update the logout button in AdminLayout to use logout from useAuth
// Search for AdminLayout
code = code.replace(
  'function AdminLayout() {',
  'function AdminLayout() {\n  const { logout } = useAuth();\n  const handleLogout = () => { logout(); };'
);

code = code.replace(
  '<button className="flex items-center gap-3 p-3 w-full rounded-xl text-neutral-500 hover:bg-neutral-900/50 transition-colors">',
  '<button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full rounded-xl text-neutral-500 hover:bg-neutral-900/50 transition-colors">'
);

// Update routes
const oldAdminRoutes = `{/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="estoque" element={<AdminInventory />} />
            <Route path="pacotes" element={<AdminPackages />} />
            <Route path="barbeiros" element={<AdminBarbers />} />
            <Route path="configuracoes" element={<AdminSettings />} />
          </Route>`;

const newAdminRoutes = `{/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="estoque" element={<AdminInventory />} />
              <Route path="pacotes" element={<AdminPackages />} />
              <Route path="barbeiros" element={<AdminBarbers />} />
              <Route path="configuracoes" element={<AdminSettings />} />
            </Route>
          </Route>`;

code = code.replace(oldAdminRoutes, newAdminRoutes);

fs.writeFileSync('src/App.tsx', code);
