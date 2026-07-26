const fs = require('fs');
const authContextPath = 'src/contexts/AuthContext.tsx';
let authContext = fs.readFileSync(authContextPath, 'utf8');

if (!authContext.includes('loginMock')) {
  authContext = authContext.replace('user: User | null;', 'user: User | null;\n  loginMock: (email: string) => void;');
  authContext = authContext.replace('user: null,', 'user: null,\n  loginMock: () => {},');
  
  authContext = authContext.replace('const [loading, setLoading] = useState(true);', `const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockEmail = localStorage.getItem('mockUserEmail');
    if (mockEmail) {
       setUser({ uid: 'mock-' + btoa(mockEmail).substring(0, 10), email: mockEmail } as User);
       setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else if (!localStorage.getItem('mockUserEmail')) {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);`);
  
  authContext = authContext.replace('const logout = () => {', `const loginMock = (email: string) => {
    localStorage.setItem('mockUserEmail', email);
    setUser({ uid: 'mock-' + btoa(email).substring(0, 10), email: email } as User);
  };

  const logout = () => {
    localStorage.removeItem('mockUserEmail');`);
    
  authContext = authContext.replace('<AuthContext.Provider value={{ user, loading, logout }}>', '<AuthContext.Provider value={{ user, loading, loginMock, logout }}>');
  
  fs.writeFileSync(authContextPath, authContext);
}

const loginPath = 'src/pages/admin/Login.tsx';
let login = fs.readFileSync(loginPath, 'utf8');

if (!login.includes('loginMock')) {
  login = login.replace('const { logout } = useAuth();', 'const { loginMock } = useAuth();');
  login = login.replace('try {', `// Development bypass
    if (email === 'admin@barbearia.com' && password === 'admin123') {
      loginMock(email);
      navigate('/admin');
      return;
    }

    try {`);
    
  login = login.replace('<div>\\n            <label className="block text-sm font-medium text-neutral-400 mb-2">E-mail</label>', `<div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-orange-400 font-medium mb-1">Acesso de Teste (Desenvolvimento):</p>
            <p className="text-xs text-neutral-400">Email: admin@barbearia.com</p>
            <p className="text-xs text-neutral-400">Senha: admin123</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">E-mail</label>`);
            
  fs.writeFileSync(loginPath, login);
}
