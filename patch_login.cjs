const fs = require('fs');
let code = fs.readFileSync('src/pages/public/MeuEstilo.tsx', 'utf8');

const targetLogic = `  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      window.localStorage.setItem('emailForSignIn', email);
      setEmailSent(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulateClick() {
    setLoading(true);
    try {
      const emailForSignIn = window.localStorage.getItem('emailForSignIn');
      if (emailForSignIn) {
         loginMock(emailForSignIn);
      }
    } catch(e) {
      console.error("Auth error:", e);
    } finally {
      setLoading(false);
    }
  }`;

const replaceLogic = `  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      window.localStorage.setItem('emailForSignIn', email);
      loginMock(email);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }`;

code = code.replace(targetLogic, replaceLogic);

const targetUI = `          {emailSent ? (
            <div className="animate-fade-in">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="font-medium text-lg">Link enviado!</p>
              <p className="text-neutral-400 mt-2 mb-6">Verifique seu email ({email}) e clique no link para acessar.</p>
              <button 
                onClick={handleSimulateClick}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl font-medium transition-colors border border-neutral-700"
              >
                (Simular clique no link)
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Seu Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="exemplo@email.com"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar Meu Estilo'}
              </button>
            </form>
          )}`;

const replaceUI = `            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Seu Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="exemplo@email.com"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar Meu Estilo'}
              </button>
            </form>`;

code = code.replace(targetUI, replaceUI);
fs.writeFileSync('src/pages/public/MeuEstilo.tsx', code);
