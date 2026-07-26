const fs = require('fs');
const loginPath = 'src/pages/admin/Login.tsx';
let login = fs.readFileSync(loginPath, 'utf8');

if (!login.includes('Acesso de Teste')) {
  login = login.replace(/<div>\s*<label className="block text-sm font-medium text-neutral-400 mb-2">E-mail<\/label>/, `<div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-orange-400 font-medium mb-1">Acesso de Teste (Desenvolvimento):</p>
            <p className="text-xs text-neutral-400">Email: admin@barbearia.com</p>
            <p className="text-xs text-neutral-400">Senha: admin123</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">E-mail</label>`);
            
  fs.writeFileSync(loginPath, login);
}
